import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function daysAgo(date: Date | string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

export function stageLabelMap(stage: string): string {
  const labels: Record<string, string> = {
    JD_PASTED: "JD Added",
    RESEARCHED: "Researched",
    NETWORK_MAPPED: "Network Mapped",
    GAP_CHECK_DONE: "Gap Check Done",
    CERT_PENDING: "Certs Pending",
    PORTFOLIO_CHECK_DONE: "Portfolio Checked",
    PORTFOLIO_PENDING: "Portfolio Pending",
    OUTREACH_DRAFTED: "Outreach Drafted",
    OUTREACH_SENT: "Outreach Sent",
    CV_DRAFTED: "CV Drafted",
    CV_REVIEWED: "CV Reviewed",
    SUBMITTED: "Submitted",
    ACK_RECEIVED: "Acknowledged",
    HM_OUTREACH_SENT: "HM Contacted",
    IN_PROGRESS: "In Progress",
    CLOSED: "Closed",
  };
  return labels[stage] ?? stage;
}

export function stageColor(stage: string): string {
  const colors: Record<string, string> = {
    JD_PASTED: "bg-slate-500",
    RESEARCHED: "bg-blue-500",
    NETWORK_MAPPED: "bg-indigo-500",
    GAP_CHECK_DONE: "bg-violet-500",
    CERT_PENDING: "bg-amber-500",
    PORTFOLIO_CHECK_DONE: "bg-purple-500",
    PORTFOLIO_PENDING: "bg-orange-500",
    OUTREACH_DRAFTED: "bg-cyan-500",
    OUTREACH_SENT: "bg-teal-500",
    CV_DRAFTED: "bg-emerald-500",
    CV_REVIEWED: "bg-green-500",
    SUBMITTED: "bg-lime-600",
    ACK_RECEIVED: "bg-yellow-500",
    HM_OUTREACH_SENT: "bg-sky-500",
    IN_PROGRESS: "bg-blue-600",
    CLOSED: "bg-slate-400",
  };
  return colors[stage] ?? "bg-slate-500";
}

export function parseStartDate(dateStr?: string): number {
  if (!dateStr) return 0;
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) return parsed;
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length >= 2) {
    const year = parseInt(parts[parts.length - 1]);
    const monthStr = parts[0].toLowerCase();
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const monthIdx = months.findIndex((m) => monthStr.startsWith(m));
    if (!isNaN(year) && monthIdx !== -1) {
      return new Date(year, monthIdx, 1).getTime();
    }
    if (!isNaN(year)) {
      return new Date(year, 0, 1).getTime();
    }
  }
  return 0;
}

export function sortExperienceChronological<T extends { startDate?: string }>(experiences: T[]): T[] {
  return [...experiences].sort((a, b) => parseStartDate(b.startDate) - parseStartDate(a.startDate));
}

