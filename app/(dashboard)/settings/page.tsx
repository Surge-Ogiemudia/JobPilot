"use client";

import { Download, ExternalLink, Shield } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  return (
    <div style={{ maxWidth: "700px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "4px" }}>Settings</h1>
        <p style={{ color: "hsl(215 20% 55%)", fontSize: "0.875rem" }}>Configuration and data management</p>
      </div>

      {/* Data export */}
      <div className="glass-card" style={{ padding: "24px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Download size={17} color="hsl(263 80% 65%)" /> Export All Data
            </h2>
            <p style={{ fontSize: "0.85rem", color: "hsl(215 20% 55%)", lineHeight: 1.5 }}>
              Download a complete JSON export of all your profile data, applications, CVs, skills, portfolio, and content. Your data is always yours.
            </p>
          </div>
          <a href="/api/export" download style={{ padding: "10px 18px", borderRadius: "10px", fontWeight: 600, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", flexShrink: 0, marginLeft: "20px" }} className="gradient-btn">
            <Download size={15} /> Download
          </a>
        </div>
      </div>

      {/* Gmail */}
      <div className="glass-card" style={{ padding: "24px", marginBottom: "16px" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Shield size={17} color="hsl(217 91% 60%)" /> Gmail Integration
        </h2>
        <p style={{ fontSize: "0.85rem", color: "hsl(215 20% 55%)", lineHeight: 1.5, marginBottom: "16px" }}>
          Connect Gmail to automatically detect application acknowledgements, rejections, and next-stage emails. Read-only access only — the app never sends emails on your behalf.
        </p>
        <div style={{ background: "hsl(222 47% 10%)", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
          <p style={{ fontSize: "0.825rem", fontWeight: 700, marginBottom: "8px" }}>Setup steps:</p>
          <ol style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {[
              "Go to Google Cloud Console → Create a new project",
              'Enable the Gmail API for your project',
              'Create OAuth 2.0 credentials (type: Web Application)',
              'Set authorised redirect URI to: http://localhost:3000/api/auth/callback/google (dev) or your Vercel URL',
              'Copy Client ID and Client Secret to GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local',
              'Redeploy — a "Connect Gmail" button will appear here'
            ].map((step, i) => (
              <li key={i} style={{ fontSize: "0.8rem", color: "hsl(215 20% 60%)" }}>{step}</li>
            ))}
          </ol>
        </div>
        <a href="https://console.cloud.google.com" target="_blank" rel="noopener" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.825rem", color: "hsl(217 91% 60%)", textDecoration: "none" }}>
          <ExternalLink size={13} /> Open Google Cloud Console
        </a>
      </div>

      {/* Environment info */}
      <div className="glass-card" style={{ padding: "24px" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "12px" }}>Environment Variables</h2>
        <p style={{ fontSize: "0.8rem", color: "hsl(215 20% 50%)", marginBottom: "12px", lineHeight: 1.5 }}>
          API keys and credentials are stored securely as environment variables, not in the database. Update them in <code style={{ background: "hsl(222 47% 13%)", padding: "1px 6px", borderRadius: "4px" }}>.env.local</code> locally, or in your Vercel project settings for production.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {[
            { key: "MONGODB_URI", desc: "MongoDB connection string" },
            { key: "GEMINI_API_KEY", desc: "Google Gemini API key" },
            { key: "NEXTAUTH_SECRET", desc: "Session encryption secret" },
            { key: "GOOGLE_CLIENT_ID / SECRET", desc: "Gmail OAuth (optional)" },
            { key: "CRON_SECRET", desc: "Secures Vercel cron endpoints" },
          ].map(({ key, desc }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "hsl(222 47% 10%)", borderRadius: "6px" }}>
              <code style={{ fontSize: "0.8rem", color: "hsl(263 80% 70%)" }}>{key}</code>
              <span style={{ fontSize: "0.75rem", color: "hsl(215 20% 45%)" }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
