"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  AlertTriangle, Clock, Award, FolderGit2, Calendar,
  Mail, TrendingUp, Briefcase, ArrowRight, CheckCircle2, Zap
} from "lucide-react";
import { formatDate, daysAgo, stageLabelMap, stageColor } from "@/lib/utils";

interface DashboardData {
  staleApplications: Array<{ _id: string; companyName: string; roleTitle: string; currentStage: string; updatedAt: string }>;
  pendingCerts: Array<{ _id: string; name: string; status: string }>;
  pendingPortfolio: Array<{ _id: string; title: string; status: string }>;
  todaysContent: { _id: string; draftText: string } | null;
  recentGmailSuggestions: Array<{ _id: string; companyName: string; systemSuggestedStatus: string }>;
  stats: { total: number; active: number; submitted: number };
}

export default function HomePage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => fetch("/api/dashboard").then((r) => r.json()),
  });

  if (isLoading) return <LoadingSkeleton />;

  const d = data!;

  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "6px" }}>
          Command Centre
        </h1>
        <p style={{ color: "hsl(215 20% 55%)", fontSize: "0.9rem" }}>
          Everything that needs your attention, right now.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Total Applications", value: d.stats.total, icon: Briefcase, color: "hsl(263 80% 65%)" },
          { label: "Active", value: d.stats.active, icon: Zap, color: "hsl(142 76% 36%)" },
          { label: "Submitted", value: d.stats.submitted, icon: CheckCircle2, color: "hsl(217 91% 60%)" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{value}</div>
              <div style={{ fontSize: "0.75rem", color: "hsl(215 20% 55%)" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Stale applications */}
        <Section icon={Clock} color="hsl(38 92% 50%)" title="Needs Attention" count={d.staleApplications.length}>
          {d.staleApplications.length === 0 ? (
            <EmptyState message="All applications are up to date 🎉" />
          ) : (
            d.staleApplications.map((app) => (
              <Link key={app._id} href={`/applications/${app._id}`} style={{ textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: "8px", background: "hsl(222 47% 10%)", marginBottom: "8px", cursor: "pointer", transition: "background 0.15s" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{app.companyName}</div>
                    <div style={{ fontSize: "0.75rem", color: "hsl(215 20% 55%)" }}>{app.roleTitle}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className={`stage-badge ${stageColor(app.currentStage)} text-white`} style={{ marginBottom: "4px" }}>
                      {stageLabelMap(app.currentStage)}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "hsl(38 92% 50%)" }}>{daysAgo(app.updatedAt)}d ago</div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </Section>

        {/* Gmail suggestions */}
        <Section icon={Mail} color="hsl(217 91% 60%)" title="Gmail Suggestions" count={d.recentGmailSuggestions.length}>
          {d.recentGmailSuggestions.length === 0 ? (
            <EmptyState message="No unconfirmed status updates" />
          ) : (
            d.recentGmailSuggestions.map((app) => (
              <Link key={app._id} href={`/applications/${app._id}`} style={{ textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: "8px", background: "hsl(217 91% 60% / 0.08)", border: "1px solid hsl(217 91% 60% / 0.2)", marginBottom: "8px" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{app.companyName}</div>
                    <div style={{ fontSize: "0.75rem", color: "hsl(215 20% 55%)" }}>Confirm or correct status</div>
                  </div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "hsl(217 91% 60%)", textTransform: "capitalize" }}>
                    {app.systemSuggestedStatus}
                  </div>
                </div>
              </Link>
            ))
          )}
        </Section>

        {/* Pending certs */}
        <Section icon={Award} color="hsl(263 80% 65%)" title="Pending Certifications" count={d.pendingCerts.length}>
          {d.pendingCerts.length === 0 ? (
            <EmptyState message="No pending certifications" />
          ) : (
            d.pendingCerts.slice(0, 5).map((cert) => (
              <Link key={cert._id} href="/skills" style={{ textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "8px", background: "hsl(222 47% 10%)", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.875rem" }}>{cert.name}</span>
                  <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "999px", background: cert.status === "in_progress" ? "hsl(142 76% 36% / 0.2)" : "hsl(0 72% 51% / 0.2)", color: cert.status === "in_progress" ? "hsl(142 76% 55%)" : "hsl(0 72% 65%)" }}>
                    {cert.status === "in_progress" ? "In Progress" : "Needed"}
                  </span>
                </div>
              </Link>
            ))
          )}
          {d.pendingCerts.length > 5 && (
            <Link href="/skills" style={{ fontSize: "0.8rem", color: "hsl(263 80% 65%)", textDecoration: "none" }}>
              +{d.pendingCerts.length - 5} more →
            </Link>
          )}
        </Section>

        {/* Portfolio pending */}
        <Section icon={FolderGit2} color="hsl(142 76% 36%)" title="Portfolio Projects" count={d.pendingPortfolio.length}>
          {d.pendingPortfolio.length === 0 ? (
            <EmptyState message="No pending portfolio items" />
          ) : (
            d.pendingPortfolio.map((item) => (
              <Link key={item._id} href="/portfolio" style={{ textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "8px", background: "hsl(222 47% 10%)", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.875rem" }}>{item.title}</span>
                  <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "999px", background: "hsl(38 92% 50% / 0.2)", color: "hsl(38 92% 60%)" }}>
                    {item.status === "suggested" ? "Suggested" : "In Progress"}
                  </span>
                </div>
              </Link>
            ))
          )}
        </Section>
      </div>

      {/* Today's content */}
      {d.todaysContent && (
        <div style={{ marginTop: "20px" }} className="glass-card">
          <div style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Calendar size={18} color="hsl(263 80% 65%)" />
              <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Today's LinkedIn Post Draft</span>
            </div>
            <p style={{ fontSize: "0.875rem", color: "hsl(215 20% 70%)", lineHeight: 1.6, marginBottom: "16px" }}>
              {d.todaysContent.draftText.slice(0, 300)}{d.todaysContent.draftText.length > 300 ? "..." : ""}
            </p>
            <Link href="/content" style={{ fontSize: "0.8rem", color: "hsl(263 80% 65%)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
              View full post & mark as posted <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ icon: Icon, color, title, count, children }: {
  icon: React.ElementType; color: string; title: string; count: number; children: React.ReactNode;
}) {
  return (
    <div className="glass-card" style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Icon size={17} color={color} />
          <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{title}</span>
        </div>
        {count > 0 && (
          <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px", background: `${color}22`, color }}>
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ textAlign: "center", padding: "20px", color: "hsl(215 20% 45%)", fontSize: "0.8rem" }}>
      {message}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ maxWidth: "1100px" }}>
      <div style={{ height: "32px", width: "200px", background: "hsl(222 47% 12%)", borderRadius: "8px", marginBottom: "32px" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "28px" }}>
        {[1, 2, 3].map((i) => <div key={i} style={{ height: "88px", background: "hsl(222 47% 10%)", borderRadius: "12px" }} />)}
      </div>
    </div>
  );
}
