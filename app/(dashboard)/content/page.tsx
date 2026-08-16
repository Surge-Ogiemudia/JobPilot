"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ClipboardCopy, Check, CheckCircle2, X, Zap, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface ContentPost {
  _id: string; draftText: string; source: string; status: "suggested" | "posted" | "skipped";
  dateSuggested: string; postedAt?: string;
}

const SOURCE_LABELS: Record<string, string> = {
  general: "General",
  portfolio_project: "Portfolio",
  milestone: "Milestone",
};

export default function ContentPage() {
  const qc = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [genSource, setGenSource] = useState("general");
  const [copied, setCopied] = useState<string | null>(null);

  const { data: posts = [] } = useQuery<ContentPost[]>({
    queryKey: ["content"],
    queryFn: () => fetch("/api/content").then(r => r.json()),
  });

  async function generate() {
    setGenerating(true);
    await fetch("/api/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: genSource }) });
    qc.invalidateQueries({ queryKey: ["content"] });
    setGenerating(false);
    toast.success("New post draft generated");
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/content/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    qc.invalidateQueries({ queryKey: ["content"] });
  }

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied to clipboard");
  }

  const suggested = posts.filter(p => p.status === "suggested");
  const history = posts.filter(p => p.status !== "suggested");

  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "4px" }}>Content Calendar</h1>
          <p style={{ color: "hsl(215 20% 55%)", fontSize: "0.875rem" }}>LinkedIn post drafts — copy, post manually, mark as done</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <select value={genSource} onChange={e => setGenSource(e.target.value)} className="input-base" style={{ width: "auto", padding: "8px 12px" }}>
            <option value="general">General</option>
            <option value="portfolio_project">Portfolio Project</option>
            <option value="milestone">Cert Milestone</option>
          </select>
          <button onClick={generate} disabled={generating} className="gradient-btn" style={{ padding: "10px 18px", borderRadius: "10px", fontWeight: 600, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
            <Zap size={15} /> {generating ? "Generating..." : "Generate Post"}
          </button>
        </div>
      </div>

      {/* Suggested posts */}
      <h2 style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "12px", color: "hsl(215 20% 65%)" }}>
        Ready to Post ({suggested.length})
      </h2>
      {suggested.length === 0 ? (
        <div className="glass-card" style={{ padding: "40px", textAlign: "center", marginBottom: "24px" }}>
          <Calendar size={32} style={{ color: "hsl(215 20% 35%)", margin: "0 auto 12px" }} />
          <p style={{ color: "hsl(215 20% 45%)", fontSize: "0.85rem", marginBottom: "12px" }}>No post drafts queued. Generate one above or wait for the daily auto-generate.</p>
        </div>
      ) : (
        suggested.map(post => (
          <div key={post._id} className="glass-card" style={{ padding: "20px", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "999px", background: "hsl(263 80% 65% / 0.15)", color: "hsl(263 80% 75%)" }}>{SOURCE_LABELS[post.source] ?? post.source}</span>
                <span style={{ fontSize: "0.75rem", color: "hsl(215 20% 45%)" }}>{formatDate(post.dateSuggested)}</span>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={() => copyText(post.draftText, post._id)} style={{ padding: "5px 10px", borderRadius: "6px", background: "hsl(222 47% 13%)", border: "1px solid hsl(222 47% 20%)", color: "hsl(215 20% 65%)", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem" }}>
                  {copied === post._id ? <Check size={13} color="hsl(142 76% 55%)" /> : <ClipboardCopy size={13} />}
                  {copied === post._id ? "Copied!" : "Copy"}
                </button>
                <button onClick={() => updateStatus(post._id, "posted")} style={{ padding: "5px 10px", borderRadius: "6px", background: "hsl(142 76% 36% / 0.15)", border: "1px solid hsl(142 76% 36% / 0.3)", color: "hsl(142 76% 55%)", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem" }}>
                  <CheckCircle2 size={13} /> Posted
                </button>
                <button onClick={() => updateStatus(post._id, "skipped")} style={{ padding: "5px 10px", borderRadius: "6px", background: "none", border: "1px solid hsl(222 47% 18%)", color: "hsl(215 20% 45%)", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem" }}>
                  <X size={13} /> Skip
                </button>
              </div>
            </div>
            <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "hsl(215 20% 75%)", whiteSpace: "pre-wrap" }}>{post.draftText}</p>
          </div>
        ))
      )}

      {/* History */}
      {history.length > 0 && (
        <>
          <h2 style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "12px", marginTop: "24px", color: "hsl(215 20% 45%)" }}>History</h2>
          {history.map(post => (
            <div key={post._id} style={{ padding: "12px 16px", borderRadius: "10px", background: "hsl(222 47% 8%)", border: "1px solid hsl(222 47% 12%)", marginBottom: "8px", opacity: 0.7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: "0.8rem", color: "hsl(215 20% 55%)" }}>{post.draftText.slice(0, 120)}...</p>
                <span style={{ fontSize: "0.7rem", marginLeft: "16px", padding: "2px 8px", borderRadius: "999px", background: post.status === "posted" ? "hsl(142 76% 36% / 0.15)" : "hsl(215 20% 20%)", color: post.status === "posted" ? "hsl(142 76% 55%)" : "hsl(215 20% 45%)", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {post.status}
                </span>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
