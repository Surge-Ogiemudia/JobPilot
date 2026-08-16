"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Briefcase,
  User,
  Award,
  FolderGit2,
  Calendar,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: Briefcase },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/skills", label: "Skills & Certs", icon: Award },
  { href: "/portfolio", label: "Portfolio", icon: FolderGit2 },
  { href: "/content", label: "Content Calendar", icon: Calendar },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  user: { name?: string | null; email?: string | null };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        background: "hsl(222 47% 7%)",
        borderRight: "1px solid hsl(222 47% 13%)",
        display: "flex",
        flexDirection: "column",
        padding: "20px 12px",
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "8px 8px 24px", borderBottom: "1px solid hsl(222 47% 13%)", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              background: "var(--gradient-primary)",
              borderRadius: "9px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Briefcase size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.02em" }}>
              <span className="gradient-text">JobPilot</span>
            </div>
            <div style={{ fontSize: "0.65rem", color: "hsl(215 20% 45%)", lineHeight: 1 }}>
              Application OS
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={17} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {isActive && <ChevronRight size={14} style={{ opacity: 0.5 }} />}
            </Link>
          );
        })}
      </nav>

      {/* User + Sign Out */}
      <div
        style={{
          borderTop: "1px solid hsl(222 47% 13%)",
          paddingTop: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 10px",
            borderRadius: "10px",
            background: "hsl(222 47% 10%)",
          }}
        >
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background: "var(--gradient-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "white",
              flexShrink: 0,
            }}
          >
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.name ?? "User"}
            </div>
            <div style={{ fontSize: "0.7rem", color: "hsl(215 20% 45%)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.email}
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="nav-item"
          style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
        >
          <LogOut size={17} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
