import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/mongoose";
import { ContentPost, PortfolioItem, Skill } from "@/lib/db/models";
import { getLLM } from "@/lib/llm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const posts = await ContentPost.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean();
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const sourceType = body.source ?? "general";

  await connectDB();

  // Get recent post themes to avoid repetition
  const recentPosts = await ContentPost.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const recentThemes = recentPosts.map((p) => p.draftText.slice(0, 100)).join("\n---\n");

  const llm = getLLM();
  let prompt = "";
  let sourcePortfolioItemId: string | undefined;

  if (sourceType === "portfolio_project") {
    const recentProject = await PortfolioItem.findOne({
      userId: session.user.id,
      status: { $in: ["in_progress", "complete"] },
    }).sort({ updatedAt: -1 }).lean();
    if (recentProject) {
      sourcePortfolioItemId = recentProject._id.toString();
      prompt = `Write a LinkedIn post (150-200 words) about building this project:
Title: ${recentProject.title}
Description: ${recentProject.description}
GitHub: ${recentProject.githubUrl ?? "coming soon"}

Make it educational and specific — share a technical insight or challenge you solved.
Sound like a developer sharing a learning, not marketing.`;
    }
  } else if (sourceType === "milestone") {
    const recentCert = await Skill.findOne({
      userId: session.user.id,
      status: "have",
      type: "certificate",
    }).sort({ dateCompleted: -1 }).lean();
    if (recentCert) {
      prompt = `Write a LinkedIn post (100-150 words) celebrating completing: ${recentCert.name}
Share one specific thing you learned or will apply.
Sound genuine, not braggy.`;
    }
  }

  if (!prompt) {
    prompt = `Write a thoughtful LinkedIn post (150-200 words) on one of these themes for a UK tech professional:
- A specific technical insight or best practice
- A lesson learned from a project or experience
- An observation about the industry or job market

Recent post themes to AVOID repeating:
${recentThemes || "None yet"}

Make it specific, actionable, and conversational. No generic motivational content.`;
  }

  const draftText = await llm.complete(prompt, "You are a LinkedIn ghostwriter for UK tech professionals. Write authentic, specific, valuable content.");

  const post = await ContentPost.create({
    userId: session.user.id,
    draftText: draftText.trim(),
    source: sourceType,
    sourcePortfolioItemId,
    status: "suggested",
  });

  return NextResponse.json(post, { status: 201 });
}
