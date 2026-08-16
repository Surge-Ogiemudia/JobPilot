import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/mongoose";
import { Application, Skill } from "@/lib/db/models";
import { getLLM } from "@/lib/llm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const [app, existingSkills] = await Promise.all([
    Application.findOne({ _id: id, userId: session.user.id }).lean(),
    Skill.find({ userId: session.user.id }).lean(),
  ]);

  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const llm = getLLM();

  interface GapResult {
    missing: Array<{ name: string; rationale: string; suggestedCert?: string }>;
    matched: string[];
  }

  const result = await llm.completeJSON<GapResult>(
    `You are a career skills analyst. Compare the job description requirements against the candidate's current skills.

Job Description:
${(app as { jdText: string }).jdText.slice(0, 3000)}

Candidate's current skills:
${existingSkills.map((s) => `- ${s.name} (${s.status})`).join("\n")}

Return JSON with:
- missing: array of { name, rationale, suggestedCert } — skills/tools the JD requires that the candidate doesn't have or has as "needed"
- matched: array of skill names the candidate already has that the JD explicitly requires

Be specific and technical. Only flag genuine gaps, not nice-to-haves.`,
    '{"missing": [{"name": "string", "rationale": "string", "suggestedCert": "string"}], "matched": ["string"]}'
  );

  // Upsert missing skills into the Skill registry
  for (const gap of result.missing) {
    const existing = await Skill.findOne({ userId: session.user.id, name: gap.name });
    if (existing) {
      if (!existing.sourceApplicationIds.includes(id as never)) {
        existing.sourceApplicationIds.push(id as never);
        await existing.save();
      }
    } else {
      await Skill.create({
        userId: session.user.id,
        name: gap.name,
        type: "skill",
        status: "needed",
        sourceApplicationIds: [id],
      });
    }
  }

  // Save gap check result and advance stage
  const nextStage = result.missing.length > 0 ? "CERT_PENDING" : "PORTFOLIO_CHECK_DONE";
  await Application.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    {
      gapCheckResult: result,
      currentStage: nextStage,
      $push: {
        stageHistory: { stage: nextStage, enteredAt: new Date(), wasSoftLockOverridden: false },
      },
    }
  );

  // Also advance through GAP_CHECK_DONE in history
  await Application.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    {
      $push: {
        stageHistory: { stage: "GAP_CHECK_DONE", enteredAt: new Date(), exitedAt: new Date(), wasSoftLockOverridden: false },
      },
    }
  );

  return NextResponse.json({ result, nextStage });
}
