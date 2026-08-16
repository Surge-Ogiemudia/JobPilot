import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/mongoose";
import { Application, PortfolioItem, Profile } from "@/lib/db/models";
import { getLLM } from "@/lib/llm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const [app, existingPortfolio, profile] = await Promise.all([
    Application.findOne({ _id: id, userId: session.user.id }).lean(),
    PortfolioItem.find({ userId: session.user.id }).lean(),
    Profile.findOne({ userId: session.user.id }).lean(),
  ]);

  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const llm = getLLM();

  interface PortfolioSuggestion {
    suggestions: Array<{
      title: string;
      description: string;
      problem: string;
      scope: string;
      suggestedStack: string;
      timeEstimate: string;
      whatItDemonstrates: string;
      existingPortfolioMatch?: string;
    }>;
  }

  const result = await llm.completeJSON<PortfolioSuggestion>(
    `You are a portfolio strategist helping a UK developer/professional with their job application.

Job Description:
${(app as { jdText: string }).jdText.slice(0, 2500)}

Existing Portfolio Projects:
${existingPortfolio.map((p) => `- ${p.title}: ${p.description}`).join("\n") || "None yet"}

Profile summary: ${(profile as { summary?: string })?.summary ?? "Not provided"}

Suggest up to 2 small, demonstrable portfolio projects that:
1. Close a clear gap between the JD requirements and existing portfolio
2. Can be completed in 1-3 days
3. Are specific, not generic ("Build a REST API with auth" not just "build something")

For each suggestion return JSON with: title, description, problem, scope, suggestedStack, timeEstimate, whatItDemonstrates
If an existing portfolio project already covers a JD requirement, return existingPortfolioMatch with the project title instead.`,
    '{"suggestions": [{"title": "string", "description": "string", "problem": "string", "scope": "string", "suggestedStack": "string", "timeEstimate": "string", "whatItDemonstrates": "string", "existingPortfolioMatch": "string | null"}]}'
  );

  const suggestions = result.suggestions ?? [];
  let firstSuggestionId: string | undefined;

  for (const s of suggestions.slice(0, 2)) {
    if (s.existingPortfolioMatch) continue; // existing project covers it
    const prd = `# ${s.title}\n\n## Problem\n${s.problem}\n\n## Scope\n${s.scope}\n\n## Suggested Stack\n${s.suggestedStack}\n\n## Time Estimate\n${s.timeEstimate}\n\n## What It Demonstrates\n${s.whatItDemonstrates}`;
    const item = await PortfolioItem.create({
      userId: session.user.id,
      title: s.title,
      description: s.description,
      status: "suggested",
      prdText: prd,
      sourceApplicationId: id,
    });
    if (!firstSuggestionId) firstSuggestionId = item._id.toString();
  }

  // Advance stage
  const nextStage = firstSuggestionId ? "PORTFOLIO_PENDING" : "OUTREACH_DRAFTED";
  await Application.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    {
      portfolioSuggestionId: firstSuggestionId,
      currentStage: nextStage,
      $push: {
        stageHistory: [
          { stage: "PORTFOLIO_CHECK_DONE", enteredAt: new Date(), exitedAt: new Date(), wasSoftLockOverridden: false },
          { stage: nextStage, enteredAt: new Date(), wasSoftLockOverridden: false },
        ],
      },
    }
  );

  return NextResponse.json({ suggestions, nextStage });
}
