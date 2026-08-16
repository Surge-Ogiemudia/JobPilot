import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/mongoose";
import { ContentPost } from "@/lib/db/models";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { status } = await req.json();
  await connectDB();
  const post = await ContentPost.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    { $set: { status, ...(status === "posted" ? { postedAt: new Date() } : {}) } },
    { new: true }
  );
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}
