import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/mongoose";
import { Profile } from "@/lib/db/models";

// GET
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const profile = await Profile.findOne({ userId: session.user.id }).lean();
  return NextResponse.json(profile ?? {});
}

// PUT — upsert full profile
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  delete body.userId;
  await connectDB();
  const profile = await Profile.findOneAndUpdate(
    { userId: session.user.id },
    { $set: { ...body, userId: session.user.id } },
    { upsert: true, new: true }
  );
  return NextResponse.json(profile);
}
