import { Button } from "@/components/ui/button";
import type { RangeKey } from "@/lib/stats";

const OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Heute" },
  { key: "7d", label: "7 Tage" },
  { key: "30d", label: "30 Tage" },
  { key: "90d", label: "90 Tage" },
];

export function RangePicker({ value, onChange }: { value: RangeKey; onChange: (k: RangeKey) => void }) {
  return (
    <div className="inline-flex rounded-md border bg-card p-0.5">
      {OPTIONS.map((o) => (
        <Button
          key={o.key}
          size="sm"
          variant={value === o.key ? "default" : "ghost"}
          onClick={() => onChange(o.key)}
          className="h-8"
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}
