import { createFileRoute } from "@tanstack/react-router";
import ledgerLogo from "../assets/ledger-logo.svg";

export const Route = createFileRoute("/ledger")({
  head: () => ({
    meta: [
      { title: "Wähle dein Ledger-Gerät" },
      { name: "description", content: "Wähle das Gerät, das du besitzt, um dich sicher zu verbinden und fortzufahren." },
      { property: "og:title", content: "Wähle dein Ledger-Gerät" },
      { property: "og:description", content: "Wähle das Gerät, das du besitzt, um dich sicher zu verbinden und fortzufahren." },
    ],
  }),
  component: LedgerPage,
});

const devices = [
  { name: "Ledger Stax", svg: StaxIcon },
  { name: "Ledger Flex", svg: FlexIcon },
  { name: "Ledger Nano Gen5", svg: NanoGen5Icon },
  { name: "Ledger Nano S", svg: NanoSIcon },
  { name: "Ledger Nano S Plus", svg: NanoSPlusIcon },
  { name: "Ledger Nano X", svg: NanoXIcon },
];

function LedgerPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0b0b10] px-4 py-16">
      <div className="flex w-full max-w-5xl flex-col items-center text-center">
        <img
          src={ledgerLogo}
          alt="Ledger"
          className="mb-10 h-10 w-auto invert"
        />

        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Wähle dein Ledger-Gerät
        </h1>
        <p className="mt-4 max-w-xl text-lg text-gray-400">
          Wähle das Gerät, das du besitzt, um dich sicher zu verbinden und fortzufahren.
        </p>

        <div className="mt-14 grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map(({ name, svg: Icon }) => (
            <button
              key={name}
              type="button"
              className="group flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#13131a] p-8 transition-all hover:border-[#a78bfa] hover:bg-[#1a1a24]"
            >
              <div className="mb-5 flex h-32 items-center justify-center">
                <div className="rounded-full p-4 shadow-[0_0_40px_-12px_#a78bfa]/30">
                  <Icon />
                </div>
              </div>
              <span className="text-base font-medium text-white">{name}</span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

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
