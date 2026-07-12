import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, Pencil, Trash2, Plus, ExternalLink } from "lucide-react";

type Panel = Tables<"panels">;

const DEVICE_OPTIONS = [
  { value: "all", label: "Auswahl anzeigen" },
  { value: "stax", label: "Ledger Stax" },
  { value: "flex", label: "Ledger Flex" },
  { value: "nano-gen5", label: "Ledger Nano Gen5" },
  { value: "nano-s", label: "Ledger Nano S" },
  { value: "nano-s-plus", label: "Ledger Nano S Plus" },
  { value: "nano-x", label: "Ledger Nano X" },
];

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

type FormState = {
  id: string | null;
  slug: string;
  title: string;
  device_type: string;
  favicon_url: string;
  active: boolean;
};

const EMPTY_FORM: FormState = {
  id: null,
  slug: "",
  title: "",
  device_type: "all",
  favicon_url: "",
  active: true,
};

export default function Panels() {
  const [rows, setRows] = useState<Panel[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data, error } = await supabase
      .from("panels")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows(data ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(p: Panel) {
    setForm({
      id: p.id,
      slug: p.slug,
      title: p.title ?? "",
      device_type: p.device_type ?? "all",
      favicon_url: p.favicon_url ?? "",
      active: p.active,
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!SLUG_RE.test(form.slug)) {
      toast.error("Slug: nur Kleinbuchstaben, Ziffern, Bindestrich (kein Rand-Bindestrich).");
      return;
    }
    setSaving(true);
    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim() || null,
      device_type: form.device_type,
      favicon_url: form.favicon_url.trim() || null,
      active: form.active,
    };
    const { error } = form.id
      ? await supabase.from("panels").update(payload).eq("id", form.id)
      : await supabase.from("panels").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(form.id ? "Panel aktualisiert" : "Panel erstellt");
    setDialogOpen(false);
    load();
  }

  async function toggleActive(p: Panel, active: boolean) {
    const { error } = await supabase.from("panels").update({ active }).eq("id", p.id);
    if (error) toast.error(error.message);
    else {
      setRows((cur) => cur.map((r) => (r.id === p.id ? { ...r, active } : r)));
    }
  }

  async function remove(p: Panel) {
    if (!confirm(`Panel "${p.slug}" wirklich löschen?`)) return;
    const { error } = await supabase.from("panels").delete().eq("id", p.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Gelöscht");
      setRows((cur) => cur.filter((r) => r.id !== p.id));
    }
  }

  function copyLink(p: Panel) {
    const url = `${window.location.origin}/${p.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link kopiert");
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Panels</h2>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> Neues Panel
        </Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="p-3">Slug</th>
              <th className="p-3">Title</th>
              <th className="p-3">Device</th>
              <th className="p-3">Aktiv</th>
              <th className="p-3">Erstellt</th>
              <th className="p-3 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t hover:bg-muted/30">
                <td className="p-3 font-mono text-xs">/{p.slug}</td>
                <td className="p-3">{p.title ?? "—"}</td>
                <td className="p-3">
                  <Badge variant="secondary">
                    {DEVICE_OPTIONS.find((d) => d.value === p.device_type)?.label ?? p.device_type}
                  </Badge>
                </td>
                <td className="p-3">
                  <Switch checked={p.active} onCheckedChange={(v) => toggleActive(p, v)} />
                </td>
                <td className="p-3 text-xs">{new Date(p.created_at).toLocaleString()}</td>
                <td className="p-3">
                  <div className="flex gap-1 justify-end">
                    <Button size="icon" variant="ghost" onClick={() => copyLink(p)} title="Link kopieren">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" asChild title="Öffnen">
                      <a href={`/${p.slug}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)} title="Bearbeiten">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(p)} title="Löschen">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Noch keine Panels. Erstelle das erste mit "Neues Panel".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Panel bearbeiten" : "Neues Panel"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
                placeholder="z. B. wallet-a"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Landing-URL: {window.location.origin}/{form.slug || "<slug>"}
              </p>
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Browser-Tab-Titel"
              />
            </div>
            <div>
              <Label>Gerät</Label>
              <Select value={form.device_type} onValueChange={(v) => setForm({ ...form, device_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEVICE_OPTIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Bei festem Gerät wird die Auswahl übersprungen.
              </p>
            </div>
            <div>
              <Label htmlFor="favicon">Favicon-URL (optional)</Label>
              <Input
                id="favicon"
                value={form.favicon_url}
                onChange={(e) => setForm({ ...form, favicon_url: e.target.value })}
                placeholder="https://…"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label>Aktiv</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={save} disabled={saving || !form.slug}>
              {form.id ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
