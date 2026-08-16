import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/mongoose";
import { PortfolioItem } from "@/lib/db/models";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  delete body.userId;
  // Auto-set dates based on status change
  if (body.status === "in_progress" && !body.dateStarted) body.dateStarted = new Date();
  if (body.status === "complete" && !body.dateCompleted) body.dateCompleted = new Date();
  await connectDB();
  const item = await PortfolioItem.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { $set: body },
    { new: true }
  );
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await connectDB();
  await PortfolioItem.deleteOne({ _id: id, userId: session.user.id });
  return NextResponse.json({ ok: true });
}
