import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAdminUser } from "@/hooks/useAdminUser";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Activity, Ban, BarChart3, Send, Layers, Globe, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="min-h-screen flex bg-background">
      <aside className="w-60 border-r bg-sidebar flex flex-col">
        <div className="p-4 border-b">
          <h1 className="font-semibold text-sidebar-foreground">Ledger Admin</h1>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => supabase.auth.signOut().then(() => navigate("/auth"))}
          >
            <LogOut className="h-4 w-4 mr-2" /> Abmelden
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
