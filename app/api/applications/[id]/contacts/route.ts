import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/mongoose";
import { NetworkContact, Application } from "@/lib/db/models";
import { getLLM } from "@/lib/llm";

// GET contacts for application
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await connectDB();
  const contacts = await NetworkContact.find({ applicationId: id, userId: session.user.id }).lean();
  return NextResponse.json(contacts);
}

// POST add contact (paste profile text)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { pastedProfileText, category } = body;

  if (!pastedProfileText || !category) {
    return NextResponse.json({ error: "pastedProfileText and category required" }, { status: 400 });
  }

  await connectDB();

  // Parse contact profile via Gemini
  let parsedSummary = {};
  try {
    const llm = getLLM();
    parsedSummary = await llm.completeJSON(
      `Parse this LinkedIn profile text and extract structured data:

${pastedProfileText.slice(0, 2000)}

Return JSON with fields: title (current job title), company (current company), tenure (how long at current role, e.g. "2 years"), notableSkills (array of up to 6 skills)`,
      '{"title": "string", "company": "string", "tenure": "string", "notableSkills": ["string"]}'
    );
  } catch (e) {
    console.error("Contact parse failed:", e);
  }

  const contact = await NetworkContact.create({
    userId: session.user.id,
    applicationId: id,
    category,
    pastedProfileText,
    parsedSummary,
  });

  // Draft outreach message
  try {
    const llm = getLLM();
    const app = await Application.findOne({ _id: id, userId: session.user.id }).lean();
    if (app) {
      const outreach = await llm.complete(
        `Write a concise, personalised LinkedIn connection request message (max 300 characters — LinkedIn limit).

The sender is applying for: ${app.roleTitle} at ${app.companyName}
The recipient is: ${(parsedSummary as { title?: string }).title ?? "a professional"} at ${(parsedSummary as { company?: string }).company ?? "a company"}
Their category: ${category.replace(/_/g, " ")}

Rules:
- Reference something specific about their role or company
- Do NOT mention the job application directly — this is a network-building message
- Sound human and warm, not template-like
- Strictly under 300 characters including spaces`,
        "You are a professional career coach helping a UK job seeker with authentic networking outreach."
      );
      contact.outreachMessageDrafted = outreach.trim();
      await contact.save();
    }
  } catch (e) {
    console.error("Outreach draft failed:", e);
  }

  // Check if we now have enough contacts to advance to NETWORK_MAPPED
  const totalContacts = await NetworkContact.countDocuments({ applicationId: id, userId: session.user.id });
  if (totalContacts >= 1) {
    await Application.findOneAndUpdate(
      { _id: id, userId: session.user.id, currentStage: "RESEARCHED" },
      {
        currentStage: "NETWORK_MAPPED",
        $push: { stageHistory: { stage: "NETWORK_MAPPED", enteredAt: new Date(), wasSoftLockOverridden: false } },
      }
    );
  }

  return NextResponse.json(contact, { status: 201 });
}
