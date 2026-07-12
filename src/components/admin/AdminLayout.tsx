import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Activity, Ban, BarChart3, Send, Layers, Globe, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import TypewriterFooter from "@/components/admin/TypewriterFooter";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/sessions", label: "Sessions", icon: Activity },
  { to: "/admin/blocks", label: "Blocks", icon: Ban },
  { to: "/admin/stats", label: "Statistiken", icon: BarChart3 },
  { to: "/admin/telegram", label: "Telegram", icon: Send },
  { to: "/admin/panels", label: "Panels", icon: Layers },
  { to: "/admin/domains", label: "Domains", icon: Globe },
];

export default function AdminLayout() {
  const { loading, user, isAdmin } = useAdminUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/auth", { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) return;
    const original = link.href;
    link.href = "/favicon-admin.png";
    return () => {
      link.href = original;
    };
  }, []);


  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Lade…</div>;
  }
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-lg">Kein Admin-Zugriff.</p>
        <Button onClick={() => supabase.auth.signOut().then(() => navigate("/auth"))}>Abmelden</Button>
      </div>
    );
  }

  return (
    <div className="admin-theme dark min-h-screen flex bg-background text-foreground relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(60% 40% at 20% 0%, oklch(0.35 0.15 300 / 0.35), transparent 70%), radial-gradient(50% 40% at 100% 100%, oklch(0.3 0.12 320 / 0.25), transparent 70%)",
        }}
      />
      <aside className="w-60 border-r border-sidebar-border bg-sidebar flex flex-col relative z-10">
        <div className="p-4 border-b border-sidebar-border">
          <h1 className="font-semibold text-sidebar-foreground tracking-tight flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]" />
            Ledger Admin
          </h1>
          <p className="text-xs text-muted-foreground truncate mt-1">{user.email}</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_oklch(0.65_0.22_300/0.4)]"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <TypewriterFooter />
        <div className="p-2 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
            onClick={() => supabase.auth.signOut().then(() => navigate("/auth"))}
          >
            <LogOut className="h-4 w-4 mr-2" /> Abmelden
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
