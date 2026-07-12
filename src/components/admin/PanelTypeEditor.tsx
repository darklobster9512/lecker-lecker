import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export type PanelType = "ledger";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: PanelType;
  typeLabel: string;
  onSaved?: () => void;
};

export default function PanelTypeEditor({
  open,
  onOpenChange,
  type,
  typeLabel,
  onSaved,
}: Props) {
  const [faviconUrl, setFaviconUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from("panel_type_settings")
        .select("favicon_url")
        .eq("type", type)
        .maybeSingle();
      setFaviconUrl((data?.favicon_url as string | null) ?? "");
    })();
  }, [open, type]);

  async function save() {
    setSaving(true);
    const value = faviconUrl.trim() || null;
    const { data: existing } = await supabase
      .from("panel_type_settings")
      .select("id")
      .eq("type", type)
      .maybeSingle();
    const { error } = existing
      ? await supabase
          .from("panel_type_settings")
          .update({ favicon_url: value })
          .eq("id", existing.id)
      : await supabase
          .from("panel_type_settings")
          .insert({ type, favicon_url: value, config: {} });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Favicon gespeichert");
    onSaved?.();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{typeLabel} — Favicon</DialogTitle>
          <DialogDescription>
            Wird auf allen Landing-Pages dieses Panel-Typs verwendet. Leer lassen, um das Standard-Favicon zu nutzen.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Favicon-URL</Label>
            <Input
              value={faviconUrl}
              onChange={(e) => setFaviconUrl(e.target.value)}
              placeholder="https://…/favicon.png"
            />
          </div>
          {faviconUrl && (
            <div className="flex items-center gap-3 rounded border p-3 bg-muted/30">
              <img
                src={faviconUrl}
                alt=""
                className="h-10 w-10 rounded border bg-background object-contain"
              />
              <span className="text-xs text-muted-foreground">Vorschau</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={save} disabled={saving}>
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
