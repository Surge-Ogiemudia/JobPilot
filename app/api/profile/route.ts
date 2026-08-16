import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/mongoose";
import { Profile } from "@/lib/db/models";

import { sortExperienceChronological } from "@/lib/utils";

// GET
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const profile = await Profile.findOne({ userId: session.user.id }).lean();
  if (profile && Array.isArray(profile.workExperience)) {
    profile.workExperience = sortExperienceChronological(profile.workExperience);
  }
  return NextResponse.json(profile ?? {});
}

// PUT — upsert full profile
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  delete body.userId;
  if (Array.isArray(body.workExperience)) {
    body.workExperience = sortExperienceChronological(body.workExperience);
  }
  await connectDB();
  const profile = await Profile.findOneAndUpdate(
    { userId: session.user.id },
    { $set: { ...body, userId: session.user.id } },
    { upsert: true, new: true }
  );
  return NextResponse.json(profile);
}
