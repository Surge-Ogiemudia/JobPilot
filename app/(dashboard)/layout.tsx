import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import QueryProvider from "@/components/QueryProvider";
import { Toaster } from "sonner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <QueryProvider>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar user={session.user} />
        <main
          style={{
            flex: 1,
            marginLeft: "var(--sidebar-width)",
            padding: "32px",
            maxWidth: "calc(100vw - var(--sidebar-width))",
            overflowX: "hidden",
          }}
        >
          {children}
        </main>
      </div>
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "hsl(222 47% 10%)",
            border: "1px solid hsl(222 47% 18%)",
            color: "hsl(210 40% 98%)",
          },
        }}
      />
    </QueryProvider>
  );
}
