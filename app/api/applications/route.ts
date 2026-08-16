import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/mongoose";
import { Application, APPLICATION_STAGES } from "@/lib/db/models";
import { getLLM } from "@/lib/llm";

// GET /api/applications — list all
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const apps = await Application.find({ userId: session.user.id })
    .select("-jdText -cvVersions -coverLetterVersions -outreachMessages") // lean list
    .sort({ updatedAt: -1 })
    .lean();

  return NextResponse.json(apps);
}

// POST /api/applications — create new
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { companyName, roleTitle, jobPostingUrl, jdText } = body;

  if (!companyName || !roleTitle || !jdText) {
    return NextResponse.json({ error: "companyName, roleTitle and jdText are required" }, { status: 400 });
  }

  await connectDB();

  const app = await Application.create({
    userId: session.user.id,
    companyName,
    roleTitle,
    jobPostingUrl,
    jdText,
    currentStage: "JD_PASTED",
    stageHistory: [{ stage: "JD_PASTED", enteredAt: new Date(), wasSoftLockOverridden: false }],
  });

  // Auto-trigger research in background (non-blocking)
  triggerResearch(app._id.toString(), jdText, companyName, roleTitle, session.user.id).catch(console.error);

  return NextResponse.json(app, { status: 201 });
}

// Background: auto-generate research after JD is pasted
async function triggerResearch(appId: string, jdText: string, company: string, role: string, userId: string) {
  try {
    const llm = getLLM();
    const summary = await llm.complete(
      `You are a career research assistant. The user is applying to ${company} for the role of ${role}.

Job Description:
${jdText.slice(0, 3000)}

Write a structured research summary (max 400 words) covering:
1. Company overview and culture signals from the JD
2. What this specific role is likely responsible for day-to-day
3. Key technical and soft skills explicitly mentioned
4. 2-3 talking points the applicant should weave into outreach and their cover letter
5. Any red flags or unusual requirements to be aware of

Be specific and actionable. Do not pad with generic advice.`,
      "You are a professional career strategist helping a UK job seeker."
    );

    await Application.findOneAndUpdate(
      { _id: appId, userId },
      {
        researchSummary: summary,
        currentStage: "RESEARCHED",
        $push: {
          stageHistory: { stage: "RESEARCHED", enteredAt: new Date(), wasSoftLockOverridden: false },
        },
      }
    );
  } catch (err) {
    console.error("Research generation failed:", err);
  }
}
