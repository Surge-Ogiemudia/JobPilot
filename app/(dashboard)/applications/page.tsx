"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Search, Briefcase, Building2, Calendar, ChevronRight } from "lucide-react";
import { formatDate, stageLabelMap, stageColor } from "@/lib/utils";

interface Application {
  _id: string;
  companyName: string;
  roleTitle: string;
  currentStage: string;
  jobPostingUrl?: string;
  createdAt: string;
  updatedAt: string;
  userConfirmedStatus?: string;
  systemSuggestedStatus?: string;
}

export default function ApplicationsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ companyName: "", roleTitle: "", jobPostingUrl: "", jdText: "" });
  const [creating, setCreating] = useState(false);

  const { data: apps = [], isLoading } = useQuery<Application[]>({
    queryKey: ["applications"],
    queryFn: () => fetch("/api/applications").then((r) => r.json()),
  });

  const filtered = apps.filter(
    (a) =>
      a.companyName.toLowerCase().includes(search.toLowerCase()) ||
      a.roleTitle.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ companyName: "", roleTitle: "", jobPostingUrl: "", jdText: "" });
    setShowForm(false);
    setCreating(false);
    qc.invalidateQueries({ queryKey: ["applications"] });
  }

  return (
    <div style={{ maxWidth: "1000px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "4px" }}>Applications</h1>
          <p style={{ color: "hsl(215 20% 55%)", fontSize: "0.875rem" }}>{apps.length} total · {apps.filter(a => !["CLOSED"].includes(a.currentStage)).length} active</p>
        </div>
        <button onClick={() => setShowForm(true)} className="gradient-btn" style={{ padding: "10px 18px", borderRadius: "10px", fontWeight: 600, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <Plus size={16} /> Add Application
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "20px" }}>
        <Search size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "hsl(215 20% 45%)" }} />
        <input
          type="text"
          placeholder="Search by company or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base"
          style={{ paddingLeft: "40px" }}
        />
      </div>

      {/* Create form */}
      {showForm && (
        <div className="glass-card" style={{ padding: "24px", marginBottom: "24px" }}>
          <h2 style={{ fontWeight: 700, marginBottom: "20px", fontSize: "1rem" }}>New Application</h2>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "6px", color: "hsl(215 20% 65%)" }}>Company *</label>
                <input required value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} placeholder="Acme Ltd" className="input-base" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "6px", color: "hsl(215 20% 65%)" }}>Role Title *</label>
                <input required value={form.roleTitle} onChange={e => setForm(f => ({ ...f, roleTitle: e.target.value }))} placeholder="Senior Engineer" className="input-base" />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "6px", color: "hsl(215 20% 65%)" }}>Job Posting URL</label>
              <input value={form.jobPostingUrl} onChange={e => setForm(f => ({ ...f, jobPostingUrl: e.target.value }))} placeholder="https://..." className="input-base" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "6px", color: "hsl(215 20% 65%)" }}>Paste Full Job Description *</label>
              <textarea
                required
                value={form.jdText}
                onChange={e => setForm(f => ({ ...f, jdText: e.target.value }))}
                placeholder="Paste the complete job description here..."
                className="input-base"
                style={{ minHeight: "160px", resize: "vertical", fontFamily: "inherit" }}
              />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" disabled={creating} className="gradient-btn" style={{ padding: "10px 20px", borderRadius: "8px", fontWeight: 600 }}>
                {creating ? "Creating & Researching..." : "Create Application"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 20px", borderRadius: "8px", background: "hsl(222 47% 12%)", color: "hsl(215 20% 70%)", border: "1px solid hsl(222 47% 18%)", cursor: "pointer", fontWeight: 600 }}>
                Cancel
              </button>
            </div>
            {creating && <p style={{ fontSize: "0.8rem", color: "hsl(215 20% 55%)" }}>⚡ AI is researching the company and role. You can close this form — it happens in the background.</p>}
          </form>
        </div>
      )}

      {/* Applications list */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: "72px", background: "hsl(222 47% 10%)", borderRadius: "12px" }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: "60px", textAlign: "center" }}>
          <Briefcase size={40} style={{ color: "hsl(215 20% 35%)", margin: "0 auto 16px" }} />
          <p style={{ color: "hsl(215 20% 45%)", fontSize: "0.9rem" }}>
            {search ? "No applications match your search" : "No applications yet. Add your first one!"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map((app) => (
            <Link key={app._id} href={`/applications/${app._id}`} style={{ textDecoration: "none" }}>
              <div className="glass-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "hsl(222 47% 13%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Building2 size={18} color="hsl(263 80% 65%)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{app.companyName}</div>
                    <div style={{ fontSize: "0.8rem", color: "hsl(215 20% 55%)" }}>{app.roleTitle}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ textAlign: "right" }}>
                    <div className={`stage-badge ${stageColor(app.currentStage)} bg-opacity-20 text-white`} style={{ marginBottom: "4px" }}>
                      {stageLabelMap(app.currentStage)}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "hsl(215 20% 45%)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Calendar size={11} /> {formatDate(app.updatedAt)}
                    </div>
                  </div>
                  <ChevronRight size={16} color="hsl(215 20% 40%)" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
