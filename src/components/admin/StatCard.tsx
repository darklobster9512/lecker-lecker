import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { nf } from "@/lib/stats";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: LucideIcon;
  accent?: string;
}) {
  return (
    <Card className="p-4 bg-card/70 backdrop-blur-sm transition-all hover:border-primary hover:shadow-[0_0_24px_-8px_hsl(var(--primary))]">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold mt-1">
            {typeof value === "number" ? nf.format(value) : value}
          </div>
          {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
        </div>
        {Icon && (
          <div className={cn("p-2 rounded-md bg-primary/15 text-primary", accent)}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </Card>
  );
}
