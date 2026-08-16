/**
 * Strategy Engine — pure stateless function.
 * Given an application + related state, returns the list of next recommended actions.
 * No DB calls, no side effects. Same input → same output always.
 */

import type { IApplication, ISkill, IPortfolioItem, INetworkContact } from "./db/models";

export type ActionType = "navigate" | "paste_form" | "upload" | "api_call" | "manual" | "confirm";

export interface NextAction {
  id: string;
  label: string;
  description: string;
  actionType: ActionType;
  targetStage?: string;
  blocking: boolean;
  cta: string; // Button text
  href?: string; // For navigate actions
}

export interface StrategyOutput {
  nextActions: NextAction[];
  warnings: string[];
  progress: number; // 0–100 percent through stages
}

interface StrategyInput {
  application: IApplication;
  skills: ISkill[];
  portfolio: IPortfolioItem[];
  contacts: INetworkContact[];
}

const STAGE_ORDER = [
  "JD_PASTED",
  "RESEARCHED",
  "NETWORK_MAPPED",
  "GAP_CHECK_DONE",
  "CERT_PENDING",
  "PORTFOLIO_CHECK_DONE",
  "PORTFOLIO_PENDING",
  "OUTREACH_DRAFTED",
  "OUTREACH_SENT",
  "CV_DRAFTED",
  "CV_REVIEWED",
  "SUBMITTED",
  "ACK_RECEIVED",
  "HM_OUTREACH_SENT",
  "IN_PROGRESS",
  "CLOSED",
];

export function computeNextActions(input: StrategyInput): StrategyOutput {
  const { application, skills, portfolio, contacts } = input;
  const stage = application.currentStage;
  const actions: NextAction[] = [];
  const warnings: string[] = [];

  const stageIndex = STAGE_ORDER.indexOf(stage);
  const progress = Math.round((stageIndex / (STAGE_ORDER.length - 1)) * 100);

  // ── JD_PASTED → auto-research triggered via API, nudge user to confirm
  if (stage === "JD_PASTED") {
    actions.push({
      id: "trigger-research",
      label: "Generate Company Research",
      description: "Use AI to research the company and role. This takes about 30 seconds.",
      actionType: "api_call",
      targetStage: "RESEARCHED",
      blocking: true,
      cta: "Generate Research",
    });
  }

  // ── RESEARCHED → need contacts
  if (stage === "RESEARCHED") {
    actions.push({
      id: "add-contacts",
      label: "Map Your Network",
      description: `Find and paste 2-3 LinkedIn profiles: one person with the same title at ${application.companyName}, one with a different title at ${application.companyName}, and one with the same title at a different company.`,
      actionType: "paste_form",
      targetStage: "NETWORK_MAPPED",
      blocking: true,
      cta: "Add LinkedIn Profiles",
    });
  }

  // ── NETWORK_MAPPED → run gap check
  if (stage === "NETWORK_MAPPED") {
    actions.push({
      id: "run-gap-check",
      label: "Run Skill Gap Check",
      description: "Compare the JD requirements against your skills profile.",
      actionType: "api_call",
      targetStage: "GAP_CHECK_DONE",
      blocking: true,
      cta: "Run Gap Check",
    });
  }

  // ── GAP_CHECK_DONE → check if certs pending
  if (stage === "GAP_CHECK_DONE") {
    const missingCount = application.gapCheckResult?.missing?.length ?? 0;
    if (missingCount > 0) {
      actions.push({
        id: "cert-pending",
        label: `Address ${missingCount} Skill Gap${missingCount > 1 ? "s" : ""}`,
        description: "Upload evidence for missing skills or mark them as obtained.",
        actionType: "navigate",
        targetStage: "CERT_PENDING",
        blocking: false,
        cta: "Review Skill Gaps",
        href: "/skills",
      });
    } else {
      actions.push({
        id: "advance-portfolio-check",
        label: "Analyse Portfolio Fit",
        description: "Check if your portfolio matches the JD requirements.",
        actionType: "api_call",
        targetStage: "PORTFOLIO_CHECK_DONE",
        blocking: true,
        cta: "Analyse Portfolio",
      });
    }
  }

  // ── CERT_PENDING → upload evidence or proceed
  if (stage === "CERT_PENDING") {
    const neededSkills = skills.filter(
      (s) =>
        s.status === "needed" &&
        application.gapCheckResult?.missing.some((m) => m.name === s.name)
    );
    if (neededSkills.length > 0) {
      warnings.push(
        `${neededSkills.length} skill gap${neededSkills.length > 1 ? "s" : ""} still pending — completing these strengthens your application.`
      );
      actions.push({
        id: "upload-cert-evidence",
        label: "Upload Certification Evidence",
        description: `Still needed: ${neededSkills.map((s) => s.name).join(", ")}`,
        actionType: "upload",
        blocking: false,
        cta: "Upload Evidence",
        href: "/skills",
      });
    }
    actions.push({
      id: "advance-to-portfolio",
      label: "Proceed to Portfolio Check",
      description: neededSkills.length > 0 ? "Proceed anyway (gaps will be logged)" : "Move to portfolio analysis.",
      actionType: "api_call",
      targetStage: "PORTFOLIO_CHECK_DONE",
      blocking: false,
      cta: neededSkills.length > 0 ? "Proceed Anyway" : "Continue",
    });
  }

  // ── PORTFOLIO_CHECK_DONE → check if portfolio pending
  if (stage === "PORTFOLIO_CHECK_DONE") {
    if (application.portfolioSuggestionId) {
      const suggested = portfolio.find(
        (p) => p._id?.toString() === application.portfolioSuggestionId?.toString()
      );
      if (suggested && suggested.status !== "complete") {
        warnings.push("A portfolio project was suggested — completing it will significantly strengthen your application.");
        actions.push({
          id: "start-portfolio-project",
          label: `Start Project: ${suggested.title}`,
          description: "A new project demonstrating required skills has been designed for you.",
          actionType: "navigate",
          targetStage: "PORTFOLIO_PENDING",
          blocking: false,
          cta: "View Project PRD",
          href: "/portfolio",
        });
      }
    }
    actions.push({
      id: "draft-outreach",
      label: "Draft Outreach Messages",
      description: "Generate personalised outreach messages for your network contacts.",
      actionType: "api_call",
      targetStage: "OUTREACH_DRAFTED",
      blocking: true,
      cta: "Draft Messages",
    });
  }

  // ── PORTFOLIO_PENDING → complete project or proceed
  if (stage === "PORTFOLIO_PENDING") {
    const suggested = application.portfolioSuggestionId
      ? portfolio.find((p) => p._id?.toString() === application.portfolioSuggestionId?.toString())
      : null;
    if (suggested && suggested.status !== "complete") {
      warnings.push("Portfolio project is not yet complete — finishing it will make your application stronger.");
      actions.push({
        id: "view-portfolio-prd",
        label: "View Project PRD",
        description: suggested.prdText ? "Your project brief is ready." : "Review your project.",
        actionType: "navigate",
        blocking: false,
        cta: "View PRD",
        href: "/portfolio",
      });
    }
    actions.push({
      id: "advance-outreach",
      label: "Proceed to Outreach",
      description: "Draft outreach messages for your network contacts.",
      actionType: "api_call",
      targetStage: "OUTREACH_DRAFTED",
      blocking: false,
      cta: "Draft Outreach",
    });
  }

  // ── OUTREACH_DRAFTED → send messages
  if (stage === "OUTREACH_DRAFTED") {
    const unsentContacts = contacts.filter((c) => !c.outreachSent);
    actions.push({
      id: "send-outreach",
      label: `Send Outreach (${unsentContacts.length} pending)`,
      description: "Copy your drafted messages and send them on LinkedIn. Then mark as sent here.",
      actionType: "manual",
      targetStage: "OUTREACH_SENT",
      blocking: true,
      cta: "Mark Messages Sent",
    });
  }

  // ── OUTREACH_SENT → generate CV
  if (stage === "OUTREACH_SENT") {
    actions.push({
      id: "generate-cv",
      label: "Generate Tailored CV & Cover Letter",
      description: "AI will draft a CV and cover letter tailored to this role using your profile and research.",
      actionType: "api_call",
      targetStage: "CV_DRAFTED",
      blocking: true,
      cta: "Generate CV",
    });
  }

  // ── CV_DRAFTED → review
  if (stage === "CV_DRAFTED") {
    actions.push({
      id: "review-cv",
      label: "Review & Approve CV",
      description: "Review the AI-generated CV for accuracy, voice authenticity, and completeness. Approve when ready.",
      actionType: "navigate",
      targetStage: "CV_REVIEWED",
      blocking: true,
      cta: "Review CV Draft",
    });
  }

  // ── CV_REVIEWED → submit
  if (stage === "CV_REVIEWED") {
    actions.push({
      id: "submit-application",
      label: "Submit Application",
      description: "Submit your application on the company's website or job board, then mark it as submitted here.",
      actionType: "manual",
      targetStage: "SUBMITTED",
      blocking: true,
      cta: "Mark as Submitted",
    });
  }

  // ── SUBMITTED → wait for ACK
  if (stage === "SUBMITTED") {
    const submittedAt = application.submittedAt;
    const daysSinceSubmit = submittedAt
      ? Math.floor((Date.now() - new Date(submittedAt).getTime()) / 86400000)
      : 0;
    if (daysSinceSubmit >= 5 && !application.systemSuggestedStatus) {
      warnings.push("No acknowledgement detected after 5+ business days — worth checking your spam folder.");
      actions.push({
        id: "confirm-submission",
        label: "Confirm Application Was Received",
        description: "Check your inbox and confirm whether you received an acknowledgement.",
        actionType: "confirm",
        targetStage: "ACK_RECEIVED",
        blocking: false,
        cta: "Mark as Acknowledged",
      });
    } else {
      actions.push({
        id: "await-ack",
        label: "Awaiting Acknowledgement",
        description: "Gmail Watcher is monitoring for a response. You can also manually confirm.",
        actionType: "confirm",
        targetStage: "ACK_RECEIVED",
        blocking: false,
        cta: "Manually Confirm ACK",
      });
    }
  }

  // ── ACK_RECEIVED → HM outreach
  if (stage === "ACK_RECEIVED") {
    const hmContact = contacts.find((c) => c.category === "hiring_manager");
    actions.push({
      id: "hm-outreach",
      label: "Reach Out to Hiring Manager",
      description: hmContact
        ? "Your drafted hiring manager message is ready. Send it on LinkedIn and log it here."
        : "Find the hiring manager on LinkedIn and add them as a contact first.",
      actionType: hmContact ? "manual" : "paste_form",
      targetStage: "HM_OUTREACH_SENT",
      blocking: true,
      cta: hmContact ? "Mark HM Message Sent" : "Add Hiring Manager",
    });
  }

  // ── HM_OUTREACH_SENT → in progress
  if (stage === "HM_OUTREACH_SENT") {
    if (application.systemSuggestedStatus && !application.userConfirmedStatus) {
      actions.push({
        id: "confirm-status",
        label: `Confirm Status: ${application.systemSuggestedStatus}`,
        description: "Gmail detected a potential status update. Please confirm or correct it.",
        actionType: "confirm",
        blocking: false,
        cta: "Confirm Status",
      });
    } else {
      actions.push({
        id: "awaiting-response",
        label: "Awaiting Next Stage",
        description: "Gmail Watcher is monitoring for interview invites or rejections.",
        actionType: "manual",
        blocking: false,
        cta: "Update Status Manually",
      });
    }
  }

  // ── IN_PROGRESS → manual handling
  if (stage === "IN_PROGRESS") {
    actions.push({
      id: "update-outcome",
      label: "Update Outcome",
      description: "Log the final outcome: offer, rejection, or withdrawal.",
      actionType: "manual",
      targetStage: "CLOSED",
      blocking: false,
      cta: "Log Outcome",
    });
  }

  // ── Unconfirmed Gmail suggestion (any stage)
  if (application.systemSuggestedStatus && !application.userConfirmedStatus && stage !== "HM_OUTREACH_SENT") {
    warnings.push(
      `Gmail suggests status: "${application.systemSuggestedStatus}" (confidence: ${Math.round((application.systemSuggestedConfidence ?? 0) * 100)}%) — please confirm or correct.`
    );
  }

  return { nextActions: actions, warnings, progress };
}

// ── Cross-application dashboard summary ────────────────────────────────────

export function getStaleApplicationIds(
  applications: IApplication[],
  staleDays = 7
): string[] {
  const cutoff = Date.now() - staleDays * 86400000;
  return applications
    .filter((a) => a.currentStage !== "CLOSED" && new Date(a.updatedAt).getTime() < cutoff)
    .map((a) => a._id?.toString() ?? "");
}
