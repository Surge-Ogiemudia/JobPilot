import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/mongoose";
import { Application, Skill, PortfolioItem, NetworkContact } from "@/lib/db/models";
import { getStaleApplicationIds } from "@/lib/strategy-engine";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const userId = session.user.id;

  const [applications, skills, portfolio, contentPosts] = await Promise.all([
    Application.find({ userId }).sort({ updatedAt: -1 }).lean(),
    Skill.find({ userId }).lean(),
    PortfolioItem.find({ userId }).lean(),
    import("@/lib/db/models").then((m) =>
      m.ContentPost.find({ userId, status: "suggested" }).sort({ createdAt: -1 }).limit(1).lean()
    ),
  ]);

  const staleIds = getStaleApplicationIds(applications as never[]);

  const pendingCerts = skills.filter((s) => s.status === "needed" || s.status === "in_progress");
  const pendingPortfolio = portfolio.filter(
    (p) => p.status === "suggested" || p.status === "in_progress"
  );
  const gmailSuggestions = applications.filter(
    (a) => a.systemSuggestedStatus && !a.userConfirmedStatus
  );

  return NextResponse.json({
    staleApplications: applications.filter((a) => staleIds.includes(a._id?.toString() ?? "")),
    pendingCerts,
    pendingPortfolio,
    todaysContent: contentPosts[0] ?? null,
    recentGmailSuggestions: gmailSuggestions,
    stats: {
      total: applications.length,
      active: applications.filter((a) => !["CLOSED"].includes(a.currentStage)).length,
      submitted: applications.filter((a) =>
        ["SUBMITTED", "ACK_RECEIVED", "HM_OUTREACH_SENT", "IN_PROGRESS"].includes(a.currentStage)
      ).length,
    },
  });
}
