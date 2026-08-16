"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, GitBranch, BookOpen, CheckCircle2, Clock, Lightbulb, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface PortfolioItem {
  _id: string; title: string; description: string;
  status: "suggested" | "in_progress" | "complete";
  prdText?: string; githubUrl?: string; sourceApplicationId?: string;
  createdAt: string;
}

const STATUS_CONFIG = {
  suggested: { label: "Suggested", color: "hsl(38 92% 50%)", icon: Lightbulb },
  in_progress: { label: "In Progress", color: "hsl(217 91% 60%)", icon: Clock },
  complete: { label: "Complete", color: "hsl(142 76% 36%)", icon: CheckCircle2 },
};

export default function PortfolioPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedPRD, setSelectedPRD] = useState<PortfolioItem | null>(null);
  const [form, setForm] = useState({ title: "", description: "", status: "in_progress", githubUrl: "" });

  const { data: items = [] } = useQuery<PortfolioItem[]>({
    queryKey: ["portfolio"],
    queryFn: () => fetch("/api/portfolio").then(r => r.json()),
  });

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/portfolio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ title: "", description: "", status: "in_progress", githubUrl: "" });
    setShowForm(false);
    qc.invalidateQueries({ queryKey: ["portfolio"] });
    toast.success("Project added");
  }

  async function updateItem(id: string, updates: Partial<PortfolioItem>) {
    await fetch(`/api/portfolio/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
    qc.invalidateQueries({ queryKey: ["portfolio"] });
    toast.success("Project updated");
  }

  const byStatus = {
    suggested: items.filter(i => i.status === "suggested"),
    in_progress: items.filter(i => i.status === "in_progress"),
    complete: items.filter(i => i.status === "complete"),
  };

  return (
    <div style={{ maxWidth: "1000px" }}>
      {/* PRD Modal */}
      {selectedPRD && (
        <div style={{ position: "fixed", inset: 0, background: "hsl(222 47% 3% / 0.85)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }} onClick={() => setSelectedPRD(null)}>
          <div className="glass-card" style={{ maxWidth: "700px", width: "100%", maxHeight: "80vh", overflow: "auto", padding: "32px" }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "20px" }}>{selectedPRD.title}</h2>
            <div style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "hsl(215 20% 75%)" }}>
              <ReactMarkdown>{selectedPRD.prdText ?? "No PRD available."}</ReactMarkdown>
            </div>
            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button onClick={() => { updateItem(selectedPRD._id, { status: "in_progress" }); setSelectedPRD(null); }} className="gradient-btn" style={{ padding: "8px 16px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}>
                Start Project
              </button>
              <button onClick={() => setSelectedPRD(null)} style={{ padding: "8px 16px", borderRadius: "8px", background: "hsl(222 47% 12%)", border: "1px solid hsl(222 47% 18%)", color: "hsl(215 20% 70%)", cursor: "pointer" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "4px" }}>Portfolio</h1>
          <p style={{ color: "hsl(215 20% 55%)", fontSize: "0.875rem" }}>{items.length} projects · {byStatus.complete.length} complete</p>
        </div>
        <button onClick={() => setShowForm(true)} className="gradient-btn" style={{ padding: "10px 18px", borderRadius: "10px", fontWeight: 600, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <Plus size={16} /> Add Project
        </button>
      </div>

      {showForm && (
        <div className="glass-card" style={{ padding: "20px", marginBottom: "20px" }}>
          <form onSubmit={addItem} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "6px", color: "hsl(215 20% 65%)" }}>Project Title *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-base" placeholder="e.g. REST API with Auth" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "6px", color: "hsl(215 20% 65%)" }}>GitHub URL</label>
                <input value={form.githubUrl} onChange={e => setForm(f => ({ ...f, githubUrl: e.target.value }))} className="input-base" placeholder="https://github.com/..." />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "6px", color: "hsl(215 20% 65%)" }}>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-base" rows={2} style={{ fontFamily: "inherit" }} />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="submit" className="gradient-btn" style={{ padding: "8px 16px", borderRadius: "8px", fontWeight: 600 }}>Add Project</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: "8px 16px", borderRadius: "8px", background: "hsl(222 47% 12%)", border: "1px solid hsl(222 47% 18%)", color: "hsl(215 20% 70%)", cursor: "pointer" }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban-style columns */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        {(["suggested", "in_progress", "complete"] as const).map(status => {
          const cfg = STATUS_CONFIG[status];
          return (
            <div key={status}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <cfg.icon size={15} color={cfg.color} />
                <span style={{ fontWeight: 700, fontSize: "0.85rem", color: cfg.color }}>{cfg.label}</span>
                <span style={{ fontSize: "0.75rem", color: "hsl(215 20% 45%)" }}>({byStatus[status].length})</span>
              </div>
              {byStatus[status].map(item => (
                <div key={item._id} className="glass-card" style={{ padding: "16px", marginBottom: "10px" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "6px" }}>{item.title}</div>
                  <p style={{ fontSize: "0.775rem", color: "hsl(215 20% 55%)", marginBottom: "12px", lineHeight: 1.4 }}>{item.description}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {item.prdText && (
                      <button onClick={() => setSelectedPRD(item)} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "hsl(263 80% 65%)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        <BookOpen size={13} /> View PRD
                      </button>
                    )}
                    {item.githubUrl ? (
                      <a href={item.githubUrl} target="_blank" rel="noopener" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "hsl(215 20% 55%)", textDecoration: "none" }}>
                        <GitBranch size={13} /> View on GitHub
                      </a>
                    ) : (
                      <div>
                        <input
                          placeholder="Add GitHub URL"
                          onBlur={e => { if (e.target.value) updateItem(item._id, { githubUrl: e.target.value }); }}
                          className="input-base"
                          style={{ fontSize: "0.75rem", padding: "5px 10px" }}
                        />
                      </div>
                    )}
                    {status === "suggested" && (
                      <button onClick={() => updateItem(item._id, { status: "in_progress" })} className="gradient-btn" style={{ padding: "5px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600, marginTop: "4px" }}>
                        Start Project
                      </button>
                    )}
                    {status === "in_progress" && (
                      <button onClick={() => updateItem(item._id, { status: "complete" })} style={{ padding: "5px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600, background: "hsl(142 76% 36% / 0.15)", border: "1px solid hsl(142 76% 36% / 0.4)", color: "hsl(142 76% 55%)", cursor: "pointer" }}>
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {byStatus[status].length === 0 && (
                <div style={{ padding: "20px", textAlign: "center", color: "hsl(215 20% 35%)", fontSize: "0.8rem", borderRadius: "10px", border: "1px dashed hsl(222 47% 18%)" }}>
                  None yet
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
