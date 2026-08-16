import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/mongoose";
import { Application } from "@/lib/db/models";

// GET /api/applications/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const app = await Application.findOne({ _id: id, userId: session.user.id }).lean();
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(app);
}

// PATCH /api/applications/[id] — update fields (except stage)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  await connectDB();

  // Protect immutable fields
  delete body.userId;
  delete body.stageHistory;
  delete body.cvVersions;
  delete body.coverLetterVersions;

  // Guard: never let system overwrite user-confirmed status
  if (body.systemSuggestedStatus && body.userConfirmedStatus) {
    delete body.systemSuggestedStatus;
  }

  const updated = await Application.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { $set: body },
    { new: true }
  );

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

// DELETE /api/applications/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  await Application.deleteOne({ _id: id, userId: session.user.id });
  return NextResponse.json({ ok: true });
}
