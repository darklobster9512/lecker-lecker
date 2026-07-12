import { ReactNode } from "react";
import { useAntiBot } from "@/hooks/use-antibot";
import BlockedPage from "@/components/BlockedPage";

interface Props {
  children: ReactNode;
  panelId?: string | null;
}

const AntiBotGuard = ({ children, panelId }: Props) => {
  const { status } = useAntiBot(panelId);

  if (status === "checking") {
    return <div style={{ minHeight: "100vh", background: "#fff" }} />;
  }
  if (status === "blocked") return <BlockedPage />;
  return <>{children}</>;
};

export default AntiBotGuard;
