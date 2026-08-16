"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Briefcase, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at 50% 0%, hsl(263 80% 20% / 0.3), hsl(222 47% 5%))",
        padding: "24px",
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "linear-gradient(hsl(222 47% 15% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(222 47% 15% / 0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      <div
        className="animate-fade-in-up"
        style={{ width: "100%", maxWidth: "440px", position: "relative" }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              background: "var(--gradient-primary)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 0 40px hsl(263 80% 65% / 0.4)",
            }}
          >
            <Briefcase size={28} color="white" />
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "8px" }}>
            <span className="gradient-text">JobPilot</span>
          </h1>
          <p style={{ color: "hsl(215 20% 55%)", fontSize: "0.9rem" }}>
            Your personal job application command centre
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: "36px" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "24px" }}>
            Sign in
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label
                htmlFor="email"
                style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "8px", color: "hsl(215 20% 70%)" }}
              >
                Email address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "hsl(215 20% 55%)" }} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input-base"
                  style={{ paddingLeft: "40px" }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "8px", color: "hsl(215 20% 70%)" }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "hsl(215 20% 55%)" }} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-base"
                  style={{ paddingLeft: "40px" }}
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  background: "hsl(0 72% 51% / 0.1)",
                  border: "1px solid hsl(0 72% 51% / 0.3)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  color: "hsl(0 72% 70%)",
                  fontSize: "0.85rem",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="gradient-btn"
              style={{
                padding: "12px",
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: "0.95rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "4px",
              }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.8rem", color: "hsl(215 20% 40%)" }}>
          First time? Run <code style={{ background: "hsl(222 47% 12%)", padding: "2px 6px", borderRadius: "4px" }}>npm run seed</code> to create your account.
        </p>
      </div>
    </div>
  );
}
