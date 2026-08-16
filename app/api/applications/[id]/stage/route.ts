import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/mongoose";
import { Application, APPLICATION_STAGES } from "@/lib/db/models";

// PUT /api/applications/[id]/stage
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { targetStage, overrideReason } = body;

  if (!targetStage || !APPLICATION_STAGES.includes(targetStage)) {
    return NextResponse.json({ error: "Invalid targetStage" }, { status: 400 });
  }

  await connectDB();
  const app = await Application.findOne({ _id: id, userId: session.user.id });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  const currentIdx = APPLICATION_STAGES.indexOf(app.currentStage);
  const targetIdx = APPLICATION_STAGES.indexOf(targetStage);
  const isOverride = targetIdx !== currentIdx + 1; // skipping stages = override

  // Close current stage history entry
  const lastHistory = app.stageHistory[app.stageHistory.length - 1];
  if (lastHistory && !lastHistory.exitedAt) {
    lastHistory.exitedAt = now;
  }

  // Append new stage
  app.stageHistory.push({
    stage: targetStage,
    enteredAt: now,
    wasSoftLockOverridden: isOverride || !!overrideReason,
    overrideReason: overrideReason ?? undefined,
  });

  app.currentStage = targetStage;
  await app.save();

  return NextResponse.json(app);
}
