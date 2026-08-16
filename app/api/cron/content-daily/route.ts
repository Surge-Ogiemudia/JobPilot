import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongoose";
import { ContentPost, User } from "@/lib/db/models";
import { getLLM } from "@/lib/llm";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  // Find all users (for now just first user — single-user app)
  const users = await User.find({}).lean();

  for (const user of users) {
    // Only generate if no "suggested" post exists today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await ContentPost.findOne({
      userId: user._id,
      status: "suggested",
      createdAt: { $gte: today },
    });
    if (existing) continue;

    try {
      const llm = getLLM();
      const draftText = await llm.complete(
        `Write a thoughtful LinkedIn post (150-200 words) for a UK tech professional.
Pick a specific, valuable topic: technical insight, career lesson, or industry observation.
Sound authentic and conversational. No generic motivational content.`,
        "You are a LinkedIn ghostwriter for UK tech professionals."
      );
      await ContentPost.create({
        userId: user._id,
        draftText: draftText.trim(),
        source: "general",
        status: "suggested",
      });
    } catch (e) {
      console.error("Daily content generation failed:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
