import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/mongoose";
import { Application, Profile, Skill, PortfolioItem, NetworkContact, ContentPost } from "@/lib/db/models";

// GET /api/export — full data dump
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const userId = session.user.id;

  const [profile, skills, portfolio, applications, contacts, content] = await Promise.all([
    Profile.findOne({ userId }).lean(),
    Skill.find({ userId }).lean(),
    PortfolioItem.find({ userId }).lean(),
    Application.find({ userId }).lean(),
    NetworkContact.find({ userId }).lean(),
    ContentPost.find({ userId }).lean(),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    userId,
    profile,
    skills,
    portfolio,
    applications,
    contacts,
    content,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="jobpilot-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
