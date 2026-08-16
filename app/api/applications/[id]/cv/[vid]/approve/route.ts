import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/mongoose";
import { Application } from "@/lib/db/models";

// PUT /api/applications/[id]/cv/[vid]/approve
export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; vid: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, vid } = await params;
  await connectDB();

  // Un-approve all previous versions, approve this one
  const app = await Application.findOne({ _id: id, userId: session.user.id });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  for (const v of app.cvVersions) {
    v.isApproved = v._id.toString() === vid;
  }
  for (const v of app.coverLetterVersions) {
    v.isApproved = false; // reset; user approves CL separately
  }

  // Advance stage to CV_REVIEWED
  if (app.currentStage === "CV_DRAFTED") {
    app.currentStage = "CV_REVIEWED";
    app.stageHistory.push({
      stage: "CV_REVIEWED",
      enteredAt: new Date(),
      wasSoftLockOverridden: false,
    });
  }

  await app.save();
  return NextResponse.json({ ok: true });
}
