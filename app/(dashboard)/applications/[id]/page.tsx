"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft, Zap, AlertTriangle, CheckCircle2, ExternalLink,
  Users, FileText, Download, ChevronRight, Mail, GitBranch,
  ClipboardCopy, Check
} from "lucide-react";
import Link from "next/link";
import { formatDate, stageLabelMap, stageColor, cn } from "@/lib/utils";
import type { StrategyOutput } from "@/lib/strategy-engine";

const STAGE_ORDER = [
  "JD_PASTED", "RESEARCHED", "NETWORK_MAPPED", "GAP_CHECK_DONE", "CERT_PENDING",
  "PORTFOLIO_CHECK_DONE", "PORTFOLIO_PENDING", "OUTREACH_DRAFTED", "OUTREACH_SENT",
  "CV_DRAFTED", "CV_REVIEWED", "SUBMITTED", "ACK_RECEIVED", "HM_OUTREACH_SENT",
  "IN_PROGRESS", "CLOSED"
];

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "research" | "contacts" | "cv" | "history">("overview");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const { data: app, isLoading } = useQuery({
    queryKey: ["application", id],
    queryFn: () => fetch(`/api/applications/${id}`).then((r) => r.json()),
  });

  const { data: nextActionsData } = useQuery<StrategyOutput>({
    queryKey: ["next-actions", id],
    queryFn: () => fetch(`/api/applications/${id}/next-actions`).then((r) => r.json()),
    enabled: !!app,
    refetchInterval: 10000, // Re-check every 10s for async operations (research)
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts", id],
    queryFn: () => fetch(`/api/applications/${id}/contacts`).then((r) => r.json()),
  });

  async function runAction(action: StrategyOutput["nextActions"][0]) {
    setActionLoading(action.id);
    try {
      if (action.actionType === "api_call" && action.targetStage) {
        if (action.id === "run-gap-check") {
          await fetch(`/api/applications/${id}/gap-check`, { method: "POST" });
        } else if (action.id === "draft-outreach" || action.id === "advance-outreach") {
          await fetch(`/api/applications/${id}/stage`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetStage: "OUTREACH_DRAFTED" }),
          });
        } else if (action.id === "generate-cv") {
          await fetch(`/api/applications/${id}/cv`, { method: "POST" });
        } else if (action.id === "trigger-research") {
          // Research is auto-triggered — just poll
        } else if (action.targetStage) {
          await fetch(`/api/applications/${id}/stage`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetStage: action.targetStage }),
          });
        }
      } else if (action.actionType === "confirm" && action.targetStage) {
        await fetch(`/api/applications/${id}/stage`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetStage: action.targetStage }),
        });
      } else if (action.actionType === "manual" && action.targetStage) {
        await fetch(`/api/applications/${id}/stage`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetStage: action.targetStage, overrideReason }),
        });
      }
      qc.invalidateQueries({ queryKey: ["application", id] });
      qc.invalidateQueries({ queryKey: ["next-actions", id] });
      qc.invalidateQueries({ queryKey: ["applications"] });
    } catch (e) {
      console.error(e);
    }
    setActionLoading(null);
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  if (isLoading) return <div style={{ color: "hsl(215 20% 55%)" }}>Loading...</div>;
  if (!app || app.error) return <div>Application not found</div>;

  const stageIdx = STAGE_ORDER.indexOf(app.currentStage);
  const progress = nextActionsData?.progress ?? Math.round((stageIdx / (STAGE_ORDER.length - 1)) * 100);

  return (
    <div style={{ maxWidth: "900px" }}>
      {/* Back + header */}
      <div style={{ marginBottom: "24px" }}>
        <Link href="/applications" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "hsl(215 20% 50%)", textDecoration: "none", fontSize: "0.85rem", marginBottom: "12px" }}>
          <ArrowLeft size={15} /> All Applications
        </Link>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "4px" }}>{app.companyName}</h1>
            <p style={{ color: "hsl(215 20% 55%)", fontSize: "0.9rem" }}>{app.roleTitle}</p>
            {app.jobPostingUrl && (
              <a href={app.jobPostingUrl} target="_blank" rel="noopener" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "hsl(263 80% 65%)", textDecoration: "none", marginTop: "4px" }}>
                <ExternalLink size={12} /> View Job Posting
              </a>
            )}
          </div>
          <div className={`stage-badge ${stageColor(app.currentStage)} text-white`} style={{ fontSize: "0.75rem" }}>
            {stageLabelMap(app.currentStage)}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "hsl(215 20% 45%)", marginBottom: "6px" }}>
            <span>Progress</span><span>{progress}%</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Warnings */}
      {nextActionsData?.warnings?.map((w, i) => (
        <div key={i} className="soft-lock-banner" style={{ marginBottom: "12px" }}>
          <AlertTriangle size={16} color="hsl(38 92% 50%)" style={{ flexShrink: 0, marginTop: "1px" }} />
          <span style={{ fontSize: "0.85rem", color: "hsl(38 92% 65%)" }}>{w}</span>
        </div>
      ))}

      {/* Next actions */}
      {nextActionsData?.nextActions?.map((action) => (
        <div key={action.id} className="action-card" style={{ marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <Zap size={15} color="hsl(263 80% 65%)" />
                <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{action.label}</span>
              </div>
              <p style={{ fontSize: "0.825rem", color: "hsl(215 20% 60%)", lineHeight: 1.5 }}>{action.description}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
              {action.href ? (
                <Link href={action.href} className="gradient-btn" style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none", display: "inline-block" }}>
                  {action.cta}
                </Link>
              ) : (
                <button
                  onClick={() => runAction(action)}
                  disabled={actionLoading === action.id}
                  className="gradient-btn"
                  style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 600 }}
                >
                  {actionLoading === action.id ? "Working..." : action.cta}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", marginTop: "24px", borderBottom: "1px solid hsl(222 47% 13%)", paddingBottom: "0" }}>
        {(["overview", "research", "contacts", "cv", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 16px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${activeTab === tab ? "hsl(263 80% 65%)" : "transparent"}`,
              color: activeTab === tab ? "hsl(263 80% 65%)" : "hsl(215 20% 50%)",
              fontWeight: 600,
              fontSize: "0.825rem",
              cursor: "pointer",
              textTransform: "capitalize",
              transition: "color 0.15s",
              marginBottom: "-1px",
            }}
          >
            {tab === "cv" ? "CV / Cover Letter" : tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="glass-card" style={{ padding: "24px" }}>
          <h3 style={{ fontWeight: 700, marginBottom: "16px", fontSize: "0.9rem" }}>Gap Check Results</h3>
          {app.gapCheckResult ? (
            <>
              {app.gapCheckResult.missing?.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <p style={{ fontSize: "0.8rem", color: "hsl(215 20% 55%)", marginBottom: "8px" }}>Missing skills:</p>
                  {app.gapCheckResult.missing.map((m: { name: string; rationale: string }) => (
                    <div key={m.name} style={{ padding: "8px 12px", background: "hsl(0 72% 51% / 0.08)", borderRadius: "6px", marginBottom: "6px", border: "1px solid hsl(0 72% 51% / 0.2)" }}>
                      <strong style={{ fontSize: "0.85rem" }}>{m.name}</strong>
                      <p style={{ fontSize: "0.75rem", color: "hsl(215 20% 55%)", marginTop: "2px" }}>{m.rationale}</p>
                    </div>
                  ))}
                </div>
              )}
              {app.gapCheckResult.matched?.length > 0 && (
                <div>
                  <p style={{ fontSize: "0.8rem", color: "hsl(215 20% 55%)", marginBottom: "8px" }}>Skills matched:</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {app.gapCheckResult.matched.map((s: string) => (
                      <span key={s} style={{ padding: "3px 10px", background: "hsl(142 76% 36% / 0.15)", borderRadius: "999px", fontSize: "0.75rem", color: "hsl(142 76% 55%)" }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p style={{ color: "hsl(215 20% 45%)", fontSize: "0.85rem" }}>Gap check not yet run.</p>
          )}
        </div>
      )}

      {activeTab === "research" && (
        <div className="glass-card" style={{ padding: "24px" }}>
          <h3 style={{ fontWeight: 700, marginBottom: "16px", fontSize: "0.9rem" }}>Company & Role Research</h3>
          {app.researchSummary ? (
            <div style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "hsl(215 20% 75%)" }}>
              <ReactMarkdown>{app.researchSummary}</ReactMarkdown>
            </div>
          ) : (
            <p style={{ color: "hsl(215 20% 45%)", fontSize: "0.85rem" }}>Research is being generated... refresh in a moment.</p>
          )}
        </div>
      )}

      {activeTab === "contacts" && (
        <ContactsTab appId={id} contacts={contacts} qc={qc} app={app} copyText={copyText} copied={copied} />
      )}

      {activeTab === "cv" && (
        <CVTab app={app} id={id} qc={qc} />
      )}

      {activeTab === "history" && (
        <div className="glass-card" style={{ padding: "24px" }}>
          <h3 style={{ fontWeight: 700, marginBottom: "16px", fontSize: "0.9rem" }}>Stage History</h3>
          {app.stageHistory?.map((h: { stage: string; enteredAt: string; exitedAt?: string; wasSoftLockOverridden: boolean; overrideReason?: string }, i: number) => (
            <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: h.wasSoftLockOverridden ? "hsl(38 92% 50%)" : "hsl(263 80% 65%)", flexShrink: 0 }} />
                {i < app.stageHistory.length - 1 && <div style={{ width: "1px", flex: 1, background: "hsl(222 47% 18%)", marginTop: "4px" }} />}
              </div>
              <div style={{ paddingBottom: "12px", flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{stageLabelMap(h.stage)}</div>
                <div style={{ fontSize: "0.75rem", color: "hsl(215 20% 50%)" }}>{formatDate(h.enteredAt)}</div>
                {h.wasSoftLockOverridden && <div style={{ fontSize: "0.75rem", color: "hsl(38 92% 60%)", marginTop: "2px" }}>Overridden {h.overrideReason ? `— ${h.overrideReason}` : ""}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContactsTab({ appId, contacts, qc, app, copyText, copied }: {
  appId: string; contacts: Array<{ _id: string; category: string; parsedSummary?: { title?: string; company?: string; notableSkills?: string[] }; outreachMessageDrafted?: string; outreachSent: boolean }>;
  qc: ReturnType<typeof useQueryClient>; app: { companyName: string; roleTitle: string }; copyText: (t: string, k: string) => void; copied: string | null;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ pastedProfileText: "", category: "same_title_same_company" });
  const [saving, setSaving] = useState(false);

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/applications/${appId}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ pastedProfileText: "", category: "same_title_same_company" });
    setShowForm(false);
    setSaving(false);
    qc.invalidateQueries({ queryKey: ["contacts", appId] });
    qc.invalidateQueries({ queryKey: ["next-actions", appId] });
  }

  const categories = [
    { value: "same_title_same_company", label: `Same role @ ${app.companyName}` },
    { value: "different_title_same_company", label: `Different role @ ${app.companyName}` },
    { value: "same_title_different_company", label: "Same role, different company" },
    { value: "hiring_manager", label: "Hiring Manager" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
        <h3 style={{ fontWeight: 700, fontSize: "0.9rem" }}>Network Contacts ({contacts.length}/3 recommended)</h3>
        <button onClick={() => setShowForm(true)} className="gradient-btn" style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 600 }}>
          + Add Contact
        </button>
      </div>

      {showForm && (
        <div className="glass-card" style={{ padding: "20px", marginBottom: "16px" }}>
          <form onSubmit={addContact} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "6px", color: "hsl(215 20% 65%)" }}>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-base">
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "6px", color: "hsl(215 20% 65%)" }}>Paste LinkedIn Profile Text</label>
              <textarea
                required
                value={form.pastedProfileText}
                onChange={e => setForm(f => ({ ...f, pastedProfileText: e.target.value }))}
                placeholder="Copy the person's LinkedIn profile text and paste it here..."
                className="input-base"
                style={{ minHeight: "120px", resize: "vertical", fontFamily: "inherit" }}
              />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="submit" disabled={saving} className="gradient-btn" style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 600 }}>
                {saving ? "Parsing & Drafting..." : "Add Contact"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: "8px 16px", borderRadius: "8px", background: "hsl(222 47% 12%)", color: "hsl(215 20% 70%)", border: "1px solid hsl(222 47% 18%)", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {contacts.map((contact) => (
        <div key={contact._id} className="glass-card" style={{ padding: "16px 20px", marginBottom: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>{contact.parsedSummary?.title ?? "Unknown"}</span>
              <span style={{ color: "hsl(215 20% 50%)", fontSize: "0.8rem" }}> @ {contact.parsedSummary?.company ?? "Unknown"}</span>
            </div>
            <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "999px", background: "hsl(263 80% 65% / 0.15)", color: "hsl(263 80% 75%)" }}>
              {contact.category.replace(/_/g, " ")}
            </span>
          </div>
          {contact.parsedSummary?.notableSkills && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "10px" }}>
              {contact.parsedSummary.notableSkills.map((s) => (
                <span key={s} style={{ fontSize: "0.7rem", padding: "2px 8px", background: "hsl(222 47% 13%)", borderRadius: "999px" }}>{s}</span>
              ))}
            </div>
          )}
          {contact.outreachMessageDrafted && (
            <div style={{ background: "hsl(222 47% 10%)", borderRadius: "8px", padding: "12px", position: "relative" }}>
              <p style={{ fontSize: "0.8rem", color: "hsl(215 20% 70%)", lineHeight: 1.5, marginRight: "32px" }}>{contact.outreachMessageDrafted}</p>
              <button
                onClick={() => copyText(contact.outreachMessageDrafted!, contact._id)}
                style={{ position: "absolute", top: "10px", right: "10px", background: "none", border: "none", cursor: "pointer", color: "hsl(215 20% 50%)" }}
              >
                {copied === contact._id ? <Check size={15} color="hsl(142 76% 55%)" /> : <ClipboardCopy size={15} />}
              </button>
            </div>
          )}
        </div>
      ))}

      {contacts.length === 0 && <div style={{ textAlign: "center", padding: "30px", color: "hsl(215 20% 45%)", fontSize: "0.85rem" }}>No contacts yet. Add LinkedIn profiles above.</div>}
    </div>
  );
}

function CVTab({ app, id, qc }: { app: { cvVersions: Array<{ _id: string; generatedAt: string; isApproved: boolean; reviewResult?: { passed: boolean; issues: string[] }; content: string }>; coverLetterVersions: Array<{ _id: string; content: string; isApproved: boolean }> }; id: string; qc: ReturnType<typeof useQueryClient> }) {
  const [generating, setGenerating] = useState(false);
  const [activeVersion, setActiveVersion] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cv" | "cl">("cv");

  async function generateCV() {
    setGenerating(true);
    const res = await fetch(`/api/applications/${id}/cv`, { method: "POST" });
    const data = await res.json();
    if (data.cvVersionId) setActiveVersion(data.cvVersionId);
    setGenerating(false);
    qc.invalidateQueries({ queryKey: ["application", id] });
    qc.invalidateQueries({ queryKey: ["next-actions", id] });
  }

  async function approveVersion(vid: string) {
    await fetch(`/api/applications/${id}/cv/${vid}/approve`, { method: "PUT" });
    qc.invalidateQueries({ queryKey: ["application", id] });
    qc.invalidateQueries({ queryKey: ["next-actions", id] });
  }

  const versions = app.cvVersions ?? [];
  const clVersions = app.coverLetterVersions ?? [];
  const selectedCV = versions.find(v => v._id === activeVersion) ?? versions[versions.length - 1];
  const selectedCL = clVersions[clVersions.length - 1];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ fontWeight: 700, fontSize: "0.9rem" }}>CV & Cover Letter ({versions.length} version{versions.length !== 1 ? "s" : ""})</h3>
        <button onClick={generateCV} disabled={generating} className="gradient-btn" style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 600 }}>
          {generating ? "Generating..." : versions.length === 0 ? "Generate CV" : "Regenerate"}
        </button>
      </div>

      {versions.length === 0 ? (
        <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
          <FileText size={36} style={{ color: "hsl(215 20% 35%)", margin: "0 auto 12px" }} />
          <p style={{ color: "hsl(215 20% 45%)", fontSize: "0.85rem" }}>No CV generated yet. Click "Generate CV" to start.</p>
        </div>
      ) : selectedCV && (
        <>
          {/* Version selector */}
          {versions.length > 1 && (
            <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
              {versions.map((v, i) => (
                <button key={v._id} onClick={() => setActiveVersion(v._id)}
                  style={{ padding: "4px 12px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", border: "1px solid", borderColor: activeVersion === v._id || (!activeVersion && i === versions.length - 1) ? "hsl(263 80% 65%)" : "hsl(222 47% 18%)", background: "none", color: "hsl(215 20% 70%)" }}>
                  v{i + 1} {v.isApproved && "✓"}
                </button>
              ))}
            </div>
          )}

          {/* Review result */}
          {selectedCV.reviewResult && (
            <div style={{ marginBottom: "12px", padding: "12px 16px", borderRadius: "10px", background: selectedCV.reviewResult.passed ? "hsl(142 76% 36% / 0.1)" : "hsl(38 92% 50% / 0.1)", border: `1px solid ${selectedCV.reviewResult.passed ? "hsl(142 76% 36% / 0.3)" : "hsl(38 92% 50% / 0.3)"}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: selectedCV.reviewResult.issues.length > 0 ? "8px" : 0 }}>
                {selectedCV.reviewResult.passed ? <CheckCircle2 size={15} color="hsl(142 76% 55%)" /> : <AlertTriangle size={15} color="hsl(38 92% 55%)" />}
                <span style={{ fontWeight: 600, fontSize: "0.825rem" }}>Authenticity Review: {selectedCV.reviewResult.passed ? "Passed" : "Issues Found"}</span>
              </div>
              {selectedCV.reviewResult.issues.map((issue, i) => (
                <p key={i} style={{ fontSize: "0.8rem", color: "hsl(38 92% 65%)", marginLeft: "23px" }}>• {issue}</p>
              ))}
            </div>
          )}

          {/* Toggle CV / Cover Letter */}
          <div style={{ display: "flex", gap: "4px", marginBottom: "12px" }}>
            {(["cv", "cl"] as const).map((m) => (
              <button key={m} onClick={() => setViewMode(m)} style={{ padding: "6px 14px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", border: "1px solid", borderColor: viewMode === m ? "hsl(263 80% 65%)" : "hsl(222 47% 18%)", background: viewMode === m ? "hsl(263 80% 65% / 0.15)" : "none", color: viewMode === m ? "hsl(263 80% 75%)" : "hsl(215 20% 55%)" }}>
                {m === "cv" ? "CV" : "Cover Letter"}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="glass-card" style={{ padding: "24px", marginBottom: "12px" }}>
            <div style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "hsl(215 20% 80%)" }}>
              <ReactMarkdown>{viewMode === "cv" ? selectedCV.content : (selectedCL?.content ?? "No cover letter generated yet.")}</ReactMarkdown>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "8px" }}>
            {!selectedCV.isApproved && (
              <button onClick={() => approveVersion(selectedCV._id)} className="gradient-btn" style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 600 }}>
                ✓ Approve & Advance Stage
              </button>
            )}
            <a href={`/api/applications/${id}/cv/${selectedCV._id}/export-docx`} style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 600, background: "hsl(222 47% 14%)", border: "1px solid hsl(222 47% 22%)", color: "hsl(215 20% 80%)", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
              <Download size={14} /> Download DOCX
            </a>
          </div>
        </>
      )}
    </div>
  );
}
