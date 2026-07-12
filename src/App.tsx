import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Ledger from "./pages/Ledger";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import PanelLanding from "./pages/PanelLanding";
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Sessions from "./pages/admin/Sessions";
import Blocks from "./pages/admin/Blocks";
import Stats from "./pages/admin/Stats";
import Telegram from "./pages/admin/Telegram";
import Panels from "./pages/admin/Panels";
import Domains from "./pages/admin/Domains";
import AntiBotGuard from "./components/AntiBotGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PanelLanding host={window.location.host} />} />
          <Route path="/ledger" element={<AntiBotGuard><Ledger /></AntiBotGuard>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="blocks" element={<Blocks />} />
            <Route path="stats" element={<Stats />} />
            <Route path="telegram" element={<Telegram />} />
            <Route path="panels" element={<Panels />} />
            <Route path="domains" element={<Domains />} />
          </Route>
          <Route path="/:panelSlug" element={<PanelLanding />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
