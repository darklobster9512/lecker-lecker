import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import {
  Wallet, RefreshCw, Search, ShoppingCart, Check, X, Loader2, Settings2,
} from "lucide-react";

const TLDS = [".com", ".net", ".cc", ".co"] as const;
const DEFAULT_IP = "";
const PAGE_SIZE = 10;

type SearchResult = {
  status: { domain: string; available: boolean; premium: boolean };
  tld: string;
  actualPrice: number;
  prices?: Record<string, number>;
  isContactless?: boolean;
};

type Domain = {
  id: string;
  domain: string;
  status: string;
  createdAt: string;
  ns?: string[];
  records?: Array<{ _id?: string; name: string; type: string; value: string }>;
};

const invoke = async <T,>(action: string, payload?: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke("luxuryhost-proxy", {
    body: { action, payload },
  });
  if (error) throw new Error(error.message);
  const res = data as { status: number; data: T; error?: string };
  if (res.error) throw new Error(res.error);
  if (res.status && res.status >= 400) {
    const msg = (res.data as { message?: string; error?: string })?.message
      ?? (res.data as { error?: string })?.error
      ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return res.data;
};

const formatUSD = (cents: number | null | undefined) =>
  typeof cents === "number"
    ? (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })
    : "–";

const statusBadgeClass = (status: string) => {
  const s = status.toLowerCase();
  if (s === "active") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  if (s === "pending" || s === "processing") return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  if (s === "failed" || s === "error") return "bg-destructive/10 text-destructive border-destructive/20";
  return "bg-muted text-muted-foreground border-border";
};

export default function Domains() {

  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [buyingDomain, setBuyingDomain] = useState<string | null>(null);
  const [confirmBuy, setConfirmBuy] = useState<SearchResult | null>(null);

  const [domains, setDomains] = useState<Domain[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [dnsDomain, setDnsDomain] = useState<Domain | null>(null);
  const [dnsIp, setDnsIp] = useState(DEFAULT_IP);
  const [dnsSaving, setDnsSaving] = useState(false);

  const loadBalance = async () => {
    setBalanceLoading(true);
    try {
      const me = await invoke<{ balance: number }>("getBalance");
      setBalance(me.balance);
    } catch (err) {
      toast.error("Guthaben-Fehler", { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setBalanceLoading(false);
    }
  };

  const loadDomains = async () => {
    try {
      const res = await invoke<{ domains: Domain[] }>("list");
      setDomains(res.domains ?? []);
    } catch (err) {
      toast.error("Domains laden fehlgeschlagen", { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setDomainsLoading(false);
    }
  };

  useEffect(() => {
    loadBalance();
    loadDomains();
  }, []);

  const pollingRef = useRef<number | null>(null);
  useEffect(() => {
    const hasPending = domains.some((d) => d.status.toLowerCase() !== "active");
    if (!hasPending) {
      if (pollingRef.current) { window.clearInterval(pollingRef.current); pollingRef.current = null; }
      return;
    }
    if (pollingRef.current) return;
    pollingRef.current = window.setInterval(() => loadDomains(), 5000);
    return () => {
      if (pollingRef.current) { window.clearInterval(pollingRef.current); pollingRef.current = null; }
    };
  }, [domains]);

  const handleSearch = async () => {
    const base = query.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/\.[a-z]+$/, "");
    if (!base) return;
    setSearching(true);
    setResults([]);
    try {
      const list = TLDS.map((t) => `${base}${t}`);
      const data = await invoke<SearchResult[]>("bulkSearch", { domains: list });
      const ordered = TLDS
        .map((t) => data.find((r) => r.tld === t.slice(1)))
        .filter(Boolean) as SearchResult[];
      setResults(ordered);
    } catch (err) {
      toast.error("Suche fehlgeschlagen", { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setSearching(false);
    }
  };

  const handleBuy = async (r: SearchResult) => {
    setBuyingDomain(r.status.domain);
    try {
      await invoke("purchase", { domain: r.status.domain });
      toast.success("Domain gekauft", { description: r.status.domain });
      setConfirmBuy(null);
      setResults((prev) => prev.map((x) => x.status.domain === r.status.domain ? { ...x, status: { ...x.status, available: false } } : x));
      loadBalance();
      loadDomains();
    } catch (err) {
      toast.error("Kauf fehlgeschlagen", { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setBuyingDomain(null);
    }
  };

  const openDns = (d: Domain) => {
    const existing = d.records?.find((r) => r.type === "A" && (r.name === "@" || r.name === d.domain));
    setDnsIp(existing?.value ?? DEFAULT_IP);
    setDnsDomain(d);
  };

  const handleDnsSave = async () => {
    if (!dnsDomain) return;
    setDnsSaving(true);
    try {
      await invoke("addRecord", { id: dnsDomain.id, domain: "@", ip: dnsIp.trim() });
      toast.success("DNS gesetzt", { description: `A @ → ${dnsIp}` });
      setDnsDomain(null);
      loadDomains();
    } catch (err) {
      toast.error("DNS-Fehler", { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setDnsSaving(false);
    }
  };

  const sortedDomains = useMemo(
    () => [...domains].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")),
    [domains]
  );
  const totalPages = Math.max(1, Math.ceil(sortedDomains.length / PAGE_SIZE));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);
  const pagedDomains = sortedDomains.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pageNumbers = useMemo(() => {
    const nums: (number | "…")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) nums.push(i);
    } else {
      nums.push(1);
      if (page > 3) nums.push("…");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) nums.push(i);
      if (page < totalPages - 2) nums.push("…");
      nums.push(totalPages);
    }
    return nums;
  }, [totalPages, page]);

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Domains</h1>
            <p className="text-sm text-muted-foreground">LuxuryHost – Guthaben, Suche, Kauf und DNS-Konfiguration.</p>
          </div>
        </div>

        {/* Balance */}
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Aktuelles Guthaben</div>
              <div className="mt-1 text-3xl font-semibold">
                {balanceLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : formatUSD(balance)}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={loadBalance} disabled={balanceLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${balanceLoading ? "animate-spin" : ""}`} />
              Aktualisieren
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Domain suchen &amp; kaufen</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="z.B. onlinesign"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={searching || !query.trim()}>
              {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Prüfen ({TLDS.join(" ")})
            </Button>
          </div>

          {results.length > 0 && (
            <div className="mt-4 divide-y rounded-md border">
              {results.map((r) => {
                const available = r.status.available;
                return (
                  <div key={r.status.domain} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-3">
                      {available ? (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <X className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <span className="font-medium">{r.status.domain}</span>
                      {r.status.premium && (
                        <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600">Premium</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm ${available ? "font-medium" : "text-muted-foreground"}`}>
                        {available ? `${formatUSD(r.actualPrice)} / Jahr` : "vergeben"}
                      </span>
                      {available && (
                        <Button size="sm" onClick={() => setConfirmBuy(r)} disabled={buyingDomain === r.status.domain}>
                          {buyingDomain === r.status.domain ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <><ShoppingCart className="mr-1 h-4 w-4" />Kaufen</>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Domains list */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b p-5">
            <h2 className="text-sm font-semibold">Meine Domains</h2>
            <Button variant="ghost" size="sm" onClick={loadDomains}>
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> Neu laden
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-40">Gekauft</TableHead>
                <TableHead className="w-56 text-right">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {domainsLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">Laden…</TableCell>
                </TableRow>
              )}
              {!domainsLoading && sortedDomains.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">Noch keine Domains gekauft.</TableCell>
                </TableRow>
              )}
              {pagedDomains.map((d) => {
                const isActive = d.status.toLowerCase() === "active";
                const hasA = d.records?.some((r) => r.type === "A" && (r.name === "@" || r.name === d.domain));
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">
                      {d.domain}
                      {hasA && (
                        <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">A gesetzt</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass(d.status)}`}>
                        {!isActive && <Loader2 className="h-3 w-3 animate-spin" />}
                        {d.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {d.createdAt ? new Date(d.createdAt).toLocaleDateString("de-DE") : "–"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" disabled={!isActive} onClick={() => openDns(d)}>
                        <Settings2 className="mr-1 h-3.5 w-3.5" /> DNS konfigurieren
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="border-t p-3">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1); }}
                      className={page === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {pageNumbers.map((n, i) =>
                    n === "…" ? (
                      <PaginationItem key={`e${i}`}><PaginationEllipsis /></PaginationItem>
                    ) : (
                      <PaginationItem key={n}>
                        <PaginationLink
                          href="#"
                          isActive={n === page}
                          onClick={(e) => { e.preventDefault(); setPage(n as number); }}
                        >
                          {n}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage(page + 1); }}
                      className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>

      {/* Confirm buy */}
      <Dialog open={!!confirmBuy} onOpenChange={(o) => !o && setConfirmBuy(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Domain kaufen</DialogTitle>
            <DialogDescription>
              {confirmBuy && (
                <>Möchtest du <span className="font-semibold text-foreground">{confirmBuy.status.domain}</span> für{" "}
                <span className="font-semibold text-foreground">{formatUSD(confirmBuy.actualPrice)}</span> registrieren?</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmBuy(null)}>Abbrechen</Button>
            <Button onClick={() => confirmBuy && handleBuy(confirmBuy)} disabled={!!buyingDomain}>
              {buyingDomain ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
              Kostenpflichtig kaufen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DNS config */}
      <Dialog open={!!dnsDomain} onOpenChange={(o) => !o && setDnsDomain(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>DNS konfigurieren</DialogTitle>
            <DialogDescription>
              {dnsDomain && (<>Setzt einen <strong>A-Record</strong> auf <strong>@</strong> für <strong>{dnsDomain.domain}</strong>.</>)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">IP-Adresse</label>
            <Input value={dnsIp} onChange={(e) => setDnsIp(e.target.value)} placeholder="z.B. 91.215.85.163" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDnsDomain(null)} disabled={dnsSaving}>Abbrechen</Button>
            <Button onClick={handleDnsSave} disabled={dnsSaving || !dnsIp.trim()}>
              {dnsSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Bestätigen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
