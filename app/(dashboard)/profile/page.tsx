"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Plus, Trash2, User, Briefcase, GraduationCap, Link as LinkIcon, Pencil, Check } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const qc = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetch("/api/profile").then(r => r.json()),
  });

  const [tab, setTab] = useState<"summary" | "experience" | "education" | "links">("summary");
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [editingExpIndices, setEditingExpIndices] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  async function save() {
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Profile saved successfully");
  }

  function updateField(path: string, value: unknown) {
    setForm(prev => {
      const next = { ...prev };
      const parts = path.split(".");
      let obj: Record<string, unknown> = next;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]] as Record<string, unknown>;
      }
      obj[parts[parts.length - 1]] = value;
      return next;
    });
  }

  function toggleEditExp(index: number) {
    setEditingExpIndices(prev => ({ ...prev, [index]: !prev[index] }));
  }

  if (isLoading) return <div style={{ color: "hsl(215 20% 55%)" }}>Loading...</div>;

  const tabs = [
    { id: "summary", label: "Summary", icon: User },
    { id: "experience", label: "Experience", icon: Briefcase },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "links", label: "Links & Contact", icon: LinkIcon },
  ] as const;

  const workExperience = (form.workExperience as unknown[]) ?? [];
  const education = (form.education as unknown[]) ?? [];

  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "4px" }}>Profile</h1>
          <p style={{ color: "hsl(215 20% 55%)", fontSize: "0.875rem" }}>Your single source of truth for CV generation</p>
        </div>
        <button onClick={save} className="gradient-btn" style={{ padding: "10px 18px", borderRadius: "10px", fontWeight: 600, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <Save size={15} /> Save Profile
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid hsl(222 47% 13%)", marginBottom: "24px" }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id as typeof tab)}
            style={{ padding: "10px 16px", background: "none", border: "none", borderBottom: `2px solid ${tab === id ? "hsl(263 80% 65%)" : "transparent"}`, color: tab === id ? "hsl(263 80% 65%)" : "hsl(215 20% 50%)", fontWeight: 600, fontSize: "0.825rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginBottom: "-1px" }}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {tab === "summary" && (
        <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <Field label="Full Name" value={(form.fullName as string) ?? ""} onChange={v => updateField("fullName", v)} />
          <Field label="Headline / Target Role" value={(form.headline as string) ?? ""} onChange={v => updateField("headline", v)} placeholder="e.g. Senior Full-Stack Engineer" />
          <TextareaField label="Professional Summary" value={(form.summary as string) ?? ""} onChange={v => updateField("summary", v)} placeholder="Write in your own voice — this feeds the CV generator's tone matching" rows={6} />
          <Field label="Location" value={((form.contactInfo as Record<string, string>) ?? {}).location ?? ""} onChange={v => updateField("contactInfo.location", v)} placeholder="e.g. London, UK" />
          <Field label="Right to Work" value={((form.contactInfo as Record<string, string>) ?? {}).rightToWork ?? ""} onChange={v => updateField("contactInfo.rightToWork", v)} placeholder="e.g. British Citizen / Settled Status" />
          <Field label="Email" value={((form.contactInfo as Record<string, string>) ?? {}).email ?? ""} onChange={v => updateField("contactInfo.email", v)} type="email" />
          <Field label="Phone" value={((form.contactInfo as Record<string, string>) ?? {}).phone ?? ""} onChange={v => updateField("contactInfo.phone", v)} />
        </div>
      )}

      {tab === "experience" && (
        <div>
          {workExperience.map((exp: unknown, i: number) => {
            const e = exp as Record<string, unknown>;
            const isEditing = editingExpIndices[i] ?? false;
            const achievements = (e.achievements as string[]) ?? [];

            return (
              <div key={i} className="glass-card" style={{ padding: "20px", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <div>
                    <strong style={{ fontSize: "0.95rem" }}>{(e.title as string) || "New Role"}</strong>
                    <span style={{ color: "hsl(263 80% 70%)", fontSize: "0.85rem", fontWeight: 600 }}> @ {(e.company as string) || "Company"}</span>
                    <div style={{ fontSize: "0.75rem", color: "hsl(215 20% 50%)", marginTop: "2px" }}>
                      {(e.startDate as string) || "Start Date"} – {(e.endDate as string) || "Present"}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={() => toggleEditExp(i)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        background: isEditing ? "hsl(142 76% 36% / 0.2)" : "hsl(222 47% 12%)",
                        border: `1px solid ${isEditing ? "hsl(142 76% 36% / 0.4)" : "hsl(222 47% 18%)"}`,
                        color: isEditing ? "hsl(142 76% 55%)" : "hsl(215 20% 70%)",
                        fontSize: "0.775rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {isEditing ? <Check size={14} /> : <Pencil size={14} />}
                      {isEditing ? "Done" : "Edit Role"}
                    </button>
                    <button
                      onClick={() => {
                        const arr = [...workExperience];
                        arr.splice(i, 1);
                        updateField("workExperience", arr);
                      }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(0 72% 55%)", padding: "6px" }}
                      title="Delete experience"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {!isEditing ? (
                  /* Preview Mode */
                  <div style={{ paddingTop: "8px", borderTop: "1px solid hsl(222 47% 13%)" }}>
                    {Boolean(e.description) && (
                      <p style={{ fontSize: "0.85rem", color: "hsl(215 20% 70%)", lineHeight: 1.5, marginBottom: "10px" }}>
                        {String(e.description)}
                      </p>
                    )}
                    {achievements.length > 0 && (
                      <div>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "hsl(215 20% 50%)" }}>Key Achievements:</span>
                        <ul style={{ paddingLeft: "18px", marginTop: "4px", fontSize: "0.8rem", color: "hsl(215 20% 65%)", display: "flex", flexDirection: "column", gap: "4px" }}>
                          {achievements.map((ach, idx) => (
                            <li key={idx}>{ach}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Edit Mode */
                  <div style={{ paddingTop: "12px", borderTop: "1px solid hsl(222 47% 13%)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                      <Field label="Job Title" value={(e.title as string) ?? ""} onChange={v => { const arr = [...workExperience] as Array<Record<string, unknown>>; arr[i] = { ...arr[i], title: v }; updateField("workExperience", arr); }} />
                      <Field label="Company" value={(e.company as string) ?? ""} onChange={v => { const arr = [...workExperience] as Array<Record<string, unknown>>; arr[i] = { ...arr[i], company: v }; updateField("workExperience", arr); }} />
                      <Field label="Start Date" value={(e.startDate as string) ?? ""} onChange={v => { const arr = [...workExperience] as Array<Record<string, unknown>>; arr[i] = { ...arr[i], startDate: v }; updateField("workExperience", arr); }} placeholder="e.g. April 2025" />
                      <Field label="End Date" value={(e.endDate as string) ?? ""} onChange={v => { const arr = [...workExperience] as Array<Record<string, unknown>>; arr[i] = { ...arr[i], endDate: v }; updateField("workExperience", arr); }} placeholder="e.g. Present" />
                    </div>
                    <TextareaField label="Description" value={(e.description as string) ?? ""} onChange={v => { const arr = [...workExperience] as Array<Record<string, unknown>>; arr[i] = { ...arr[i], description: v }; updateField("workExperience", arr); }} rows={3} />
                    <div style={{ marginTop: "12px", marginBottom: "12px" }}>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "6px", color: "hsl(215 20% 65%)" }}>Key Achievements (one per line)</label>
                      <textarea
                        value={achievements.join("\n")}
                        onChange={ev => { const arr = [...workExperience] as Array<Record<string, unknown>>; arr[i] = { ...arr[i], achievements: ev.target.value.split("\n") }; updateField("workExperience", arr); }}
                        className="input-base"
                        rows={4}
                        style={{ fontFamily: "inherit", resize: "vertical" }}
                        placeholder="Replaced network interface cards, performed structured rack cabling..."
                      />
                    </div>
                    <button
                      onClick={() => {
                        toggleEditExp(i);
                        save();
                      }}
                      className="gradient-btn"
                      style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}
                    >
                      <Check size={14} /> Save & Done
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={() => {
              const newArr = [...workExperience, { title: "", company: "", startDate: "", endDate: "Present", description: "", achievements: [], current: true }];
              updateField("workExperience", newArr);
              setEditingExpIndices(prev => ({ ...prev, [newArr.length - 1]: true }));
            }}
            style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "hsl(222 47% 10%)", border: "1px dashed hsl(222 47% 22%)", color: "hsl(215 20% 55%)", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <Plus size={16} /> Add New Experience
          </button>
        </div>
      )}

      {tab === "education" && (
        <div>
          {education.map((edu: unknown, i: number) => {
            const e = edu as Record<string, unknown>;
            return (
              <div key={i} className="glass-card" style={{ padding: "20px", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <strong style={{ fontSize: "0.9rem" }}>{(e.degree as string) || "Degree"}</strong>
                  <button onClick={() => { const arr = [...education]; arr.splice(i, 1); updateField("education", arr); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(0 72% 55%)" }}>
                    <Trash2 size={15} />
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <Field label="Institution" value={(e.institution as string) ?? ""} onChange={v => { const arr = [...education] as Array<Record<string, unknown>>; arr[i] = { ...arr[i], institution: v }; updateField("education", arr); }} />
                  <Field label="Degree" value={(e.degree as string) ?? ""} onChange={v => { const arr = [...education] as Array<Record<string, unknown>>; arr[i] = { ...arr[i], degree: v }; updateField("education", arr); }} />
                  <Field label="Field of Study" value={(e.field as string) ?? ""} onChange={v => { const arr = [...education] as Array<Record<string, unknown>>; arr[i] = { ...arr[i], field: v }; updateField("education", arr); }} />
                  <Field label="Years" value={(e.startDate as string) ?? ""} onChange={v => { const arr = [...education] as Array<Record<string, unknown>>; arr[i] = { ...arr[i], startDate: v }; updateField("education", arr); }} placeholder="2018 – 2021" />
                </div>
              </div>
            );
          })}
          <button onClick={() => updateField("education", [...education, { institution: "", degree: "", field: "", startDate: "" }])}
            style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "hsl(222 47% 10%)", border: "1px dashed hsl(222 47% 22%)", color: "hsl(215 20% 55%)", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <Plus size={16} /> Add Education
          </button>
        </div>
      )}

      {tab === "links" && (
        <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <Field label="LinkedIn URL" value={((form.links as Record<string, string>) ?? {}).linkedin ?? ""} onChange={v => updateField("links.linkedin", v)} placeholder="https://linkedin.com/in/..." />
          <Field label="GitHub URL" value={((form.links as Record<string, string>) ?? {}).github ?? ""} onChange={v => updateField("links.github", v)} placeholder="https://github.com/..." />
          <Field label="Personal Site" value={((form.links as Record<string, string>) ?? {}).personalSite ?? ""} onChange={v => updateField("links.personalSite", v)} placeholder="https://..." />
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "6px", color: "hsl(215 20% 65%)" }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="input-base" />
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "6px", color: "hsl(215 20% 65%)" }}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="input-base" style={{ resize: "vertical", fontFamily: "inherit" }} />
    </div>
  );
}
