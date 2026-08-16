"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Award, CheckCircle2, Clock, XCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface Skill {
  _id: string; name: string; type: "skill" | "certificate"; status: "have" | "in_progress" | "needed";
  sourceApplicationIds: string[]; dateCompleted?: string; createdAt: string;
}

const STATUS_CONFIG = {
  have: { label: "Have", color: "hsl(142 76% 36%)", icon: CheckCircle2 },
  in_progress: { label: "In Progress", color: "hsl(38 92% 50%)", icon: Clock },
  needed: { label: "Needed", color: "hsl(0 72% 55%)", icon: XCircle },
};

export default function SkillsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "skill" | "certificate">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "have" | "in_progress" | "needed">("all");
  const [form, setForm] = useState({ name: "", type: "skill", status: "have" });

  const { data: skills = [] } = useQuery<Skill[]>({
    queryKey: ["skills"],
    queryFn: () => fetch("/api/skills").then(r => r.json()),
  });

  const filtered = skills.filter(s =>
    (filter === "all" || s.type === filter) &&
    (statusFilter === "all" || s.status === statusFilter)
  );

  async function addSkill(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/skills", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ name: "", type: "skill", status: "have" });
    setShowForm(false);
    qc.invalidateQueries({ queryKey: ["skills"] });
    toast.success("Skill added");
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/skills/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, ...(status === "have" ? { dateCompleted: new Date() } : {}) }) });
    qc.invalidateQueries({ queryKey: ["skills"] });
    toast.success("Status updated");
  }

  async function deleteSkill(id: string) {
    await fetch(`/api/skills/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["skills"] });
  }

  const counts = { have: skills.filter(s => s.status === "have").length, in_progress: skills.filter(s => s.status === "in_progress").length, needed: skills.filter(s => s.status === "needed").length };

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "4px" }}>Skills & Certifications</h1>
          <p style={{ color: "hsl(215 20% 55%)", fontSize: "0.875rem" }}>{skills.length} total · {counts.needed} needed · {counts.in_progress} in progress</p>
        </div>
        <button onClick={() => setShowForm(true)} className="gradient-btn" style={{ padding: "10px 18px", borderRadius: "10px", fontWeight: 600, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <Plus size={16} /> Add Skill
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
        {(Object.entries(STATUS_CONFIG) as [keyof typeof STATUS_CONFIG, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([status, cfg]) => (
          <div key={status} className="glass-card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", borderColor: statusFilter === status ? cfg.color : undefined }} onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}>
            <cfg.icon size={18} color={cfg.color} />
            <div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800 }}>{counts[status]}</div>
              <div style={{ fontSize: "0.7rem", color: "hsl(215 20% 50%)" }}>{cfg.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
        {(["all", "skill", "certificate"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "5px 14px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600, border: "1px solid", borderColor: filter === f ? "hsl(263 80% 65%)" : "hsl(222 47% 18%)", background: filter === f ? "hsl(263 80% 65% / 0.15)" : "none", color: filter === f ? "hsl(263 80% 75%)" : "hsl(215 20% 55%)", cursor: "pointer", textTransform: "capitalize" }}>
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="glass-card" style={{ padding: "20px", marginBottom: "16px" }}>
          <form onSubmit={addSkill} style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "6px", color: "hsl(215 20% 65%)" }}>Skill / Cert Name *</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. AWS Solutions Architect" className="input-base" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "6px", color: "hsl(215 20% 65%)" }}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input-base">
                <option value="skill">Skill</option>
                <option value="certificate">Certificate</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "6px", color: "hsl(215 20% 65%)" }}>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input-base">
                <option value="have">Have</option>
                <option value="in_progress">In Progress</option>
                <option value="needed">Needed</option>
              </select>
            </div>
            <button type="submit" className="gradient-btn" style={{ padding: "10px 16px", borderRadius: "8px", fontWeight: 600 }}>Add</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 16px", borderRadius: "8px", background: "hsl(222 47% 12%)", border: "1px solid hsl(222 47% 18%)", color: "hsl(215 20% 70%)", cursor: "pointer" }}>Cancel</button>
          </form>
        </div>
      )}

      {/* Skills table */}
      <div className="glass-card">
        {filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "hsl(215 20% 45%)" }}>No skills match current filters.</div>
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "0", padding: "10px 16px", borderBottom: "1px solid hsl(222 47% 13%)", fontSize: "0.7rem", fontWeight: 700, color: "hsl(215 20% 45%)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <span>Name</span><span>Type</span><span style={{ textAlign: "center" }}>Status</span><span />
            </div>
            {filtered.map(skill => {
              const cfg = STATUS_CONFIG[skill.status];
              return (
                <div key={skill._id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "0", padding: "12px 16px", borderBottom: "1px solid hsl(222 47% 11%)", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{skill.name}</div>
                    {skill.sourceApplicationIds?.length > 0 && (
                      <div style={{ fontSize: "0.7rem", color: "hsl(215 20% 40%)" }}>Flagged by {skill.sourceApplicationIds.length} application{skill.sourceApplicationIds.length > 1 ? "s" : ""}</div>
                    )}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "hsl(215 20% 50%)", textTransform: "capitalize", marginRight: "16px" }}>{skill.type}</span>
                  <select
                    value={skill.status}
                    onChange={e => updateStatus(skill._id, e.target.value)}
                    style={{ padding: "4px 8px", borderRadius: "6px", background: `${cfg.color}22`, border: `1px solid ${cfg.color}44`, color: cfg.color, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", marginRight: "12px" }}
                  >
                    <option value="have">Have</option>
                    <option value="in_progress">In Progress</option>
                    <option value="needed">Needed</option>
                  </select>
                  <button onClick={() => deleteSkill(skill._id)} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(215 20% 35%)" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
