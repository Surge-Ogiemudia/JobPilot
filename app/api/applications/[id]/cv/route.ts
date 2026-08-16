import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/mongoose";
import { Application, Profile, Skill, PortfolioItem, NetworkContact } from "@/lib/db/models";
import { getLLM } from "@/lib/llm";
import { Types } from "mongoose";

// GET all CV versions
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await connectDB();
  const app = await Application.findOne({ _id: id, userId: session.user.id })
    .select("cvVersions coverLetterVersions companyName roleTitle")
    .lean();
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(app);
}

// POST generate new CV + cover letter
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const [app, profile, skills, portfolio, contacts] = await Promise.all([
    Application.findOne({ _id: id, userId: session.user.id }).lean(),
    Profile.findOne({ userId: session.user.id }).lean(),
    Skill.find({ userId: session.user.id, status: "have" }).lean(),
    PortfolioItem.find({ userId: session.user.id, status: "complete" }).lean(),
    NetworkContact.find({ applicationId: id, userId: session.user.id }).lean(),
  ]);

  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!profile) return NextResponse.json({ error: "Please complete your profile first" }, { status: 400 });

  const llm = getLLM();
  const a = app as {
    companyName: string; roleTitle: string; jdText: string;
    researchSummary?: string;
    gapCheckResult?: { missing: Array<{ name: string }>; matched: string[] };
  };
  const p = profile as {
    fullName: string; headline: string; summary: string;
    workExperience: Array<{ company: string; title: string; startDate: string; endDate?: string; current: boolean; description: string; achievements: string[] }>;
    education: Array<{ institution: string; degree: string; field: string; startDate: string; endDate?: string }>;
    contactInfo: { email: string; phone?: string; location: string; rightToWork: string };
    links: { linkedin?: string; github?: string; personalSite?: string };
  };

  const profileContext = `
Name: ${p.fullName}
Headline: ${p.headline}
Summary: ${p.summary}
Location: ${p.contactInfo.location} | Right to Work: ${p.contactInfo.rightToWork}
Email: ${p.contactInfo.email} | Phone: ${p.contactInfo.phone ?? ""}
LinkedIn: ${p.links.linkedin ?? ""} | GitHub: ${p.links.github ?? ""}

Work Experience:
${p.workExperience.map((w) => `${w.title} at ${w.company} (${w.startDate} – ${w.current ? "Present" : w.endDate ?? ""})
${w.description}
Achievements: ${w.achievements.join("; ")}`).join("\n\n")}

Education:
${p.education.map((e) => `${e.degree} in ${e.field} — ${e.institution} (${e.startDate}–${e.endDate ?? ""})`).join("\n")}

Skills: ${skills.map((s) => s.name).join(", ")}

Completed Portfolio Projects:
${portfolio.map((p) => `- ${p.title}: ${p.description}${p.githubUrl ? ` (${p.githubUrl})` : ""}`).join("\n")}
`;

  // 1. Generate CV
  const cvContent = await llm.complete(
    `Generate a UK-format CV for the following application. Output clean Markdown only.

CANDIDATE PROFILE:
${profileContext}

TARGET ROLE: ${a.roleTitle} at ${a.companyName}

JOB DESCRIPTION (excerpt):
${a.jdText.slice(0, 2500)}

KEY REQUIREMENTS TO MATCH:
${a.gapCheckResult?.matched.join(", ") ?? "General match to JD"}

RULES:
- UK format: no photo, no date of birth, no marital status
- 2 pages maximum (roughly 700-900 words of content)
- Lead with a strong professional summary tailored to this specific role
- Mirror JD keywords naturally — do not stuff them
- Quantify achievements where data is available from the profile
- Order: Contact → Summary → Experience → Education → Skills → Portfolio
- Do not fabricate any information not present in the profile`,
    "You are an expert UK CV writer. Produce professional, ATS-optimised CVs in clean Markdown format."
  );

  // 2. Generate Cover Letter
  const coverLetterContent = await llm.complete(
    `Write a UK cover letter for this application. Output clean Markdown only.

CANDIDATE: ${p.fullName}
ROLE: ${a.roleTitle} at ${a.companyName}
CANDIDATE PROFILE SUMMARY: ${p.summary}
RESEARCH: ${a.researchSummary?.slice(0, 800) ?? ""}
NETWORK CONTACT INSIGHTS: ${contacts.slice(0, 2).map((c) => `${(c as { parsedSummary?: { title?: string; company?: string } }).parsedSummary?.title ?? ""} at ${(c as { parsedSummary?: { title?: string; company?: string } }).parsedSummary?.company ?? ""}`).join(", ")}

RULES:
- 3 paragraphs max, ~300 words total
- Paragraph 1: why THIS company and role (reference something specific from research)
- Paragraph 2: strongest 2-3 matching experiences from profile, with a quantified example
- Paragraph 3: clear, confident close
- Sound like a real person, not a template
- Do not use phrases like "I am writing to apply", "I believe I would be", or "I am passionate about"`,
    "You are an expert UK cover letter writer. Write in an authentic, direct, professional voice."
  );

  // 3. Authenticity review
  interface ReviewResult { passed: boolean; issues: string[] }
  let reviewResult: ReviewResult = { passed: true, issues: [] };
  try {
    reviewResult = await llm.completeJSON<ReviewResult>(
      `Review this CV for quality and authenticity. Do NOT try to detect AI writing — assess whether it:
1. Sounds like a real person's voice (not generic template language)
2. Has all claims traceable to actual experience (flag any unsupported claims)
3. Avoids filler phrases like "dynamic", "passionate", "results-driven" used without evidence
4. Is appropriately specific to the role

CV:
${cvContent.slice(0, 3000)}

Return JSON: {"passed": boolean, "issues": ["list of specific issues, or empty array if none"]}`,
      '{"passed": true, "issues": ["string"]}'
    );
  } catch (e) {
    console.error("Review failed:", e);
  }

  // 4. Save versions (append-only)
  const cvVersionId = new Types.ObjectId();
  const clVersionId = new Types.ObjectId();

  await Application.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    {
      currentStage: "CV_DRAFTED",
      $push: {
        stageHistory: { stage: "CV_DRAFTED", enteredAt: new Date(), wasSoftLockOverridden: false },
        cvVersions: { _id: cvVersionId, content: cvContent, generatedAt: new Date(), isApproved: false, reviewResult },
        coverLetterVersions: { _id: clVersionId, content: coverLetterContent, generatedAt: new Date(), isApproved: false },
      },
    }
  );

  return NextResponse.json({
    cvVersionId,
    coverLetterVersionId: clVersionId,
    reviewResult,
  });
}
