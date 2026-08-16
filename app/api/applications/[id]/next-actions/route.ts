import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/mongoose";
import { Application, Skill, PortfolioItem, NetworkContact } from "@/lib/db/models";
import { computeNextActions } from "@/lib/strategy-engine";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const [app, contacts] = await Promise.all([
    Application.findOne({ _id: id, userId: session.user.id }).lean(),
    NetworkContact.find({ applicationId: id, userId: session.user.id }).lean(),
  ]);

  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [skills, portfolio] = await Promise.all([
    Skill.find({ userId: session.user.id }).lean(),
    PortfolioItem.find({ userId: session.user.id }).lean(),
  ]);

  const result = computeNextActions({
    application: app as never,
    skills: skills as never[],
    portfolio: portfolio as never[],
    contacts: contacts as never[],
  });

  return NextResponse.json(result);
}
