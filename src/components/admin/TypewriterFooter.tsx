import { useEffect, useState } from "react";

const BASE = "Hmm... ";
const FULL_LECKER = BASE + "Lecker!";
const FULL_LEDGER = BASE + "Ledger!";
const TYPE_MS = 80;
const DELETE_MS = 45;
const PAUSE_LECKER_MS = 2000;
const HOLD_MS = 10000;

type Phase = "type1" | "pauseLecker" | "delete1" | "type2" | "hold" | "delete2";

export default function TypewriterFooter() {
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("type1");

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;

    if (phase === "type1") {
      if (text.length < FULL_LECKER.length) {
        t = setTimeout(() => setText(FULL_LECKER.slice(0, text.length + 1)), TYPE_MS);
      } else {
        setPhase("pauseLecker");
      }
    } else if (phase === "pauseLecker") {
      t = setTimeout(() => setPhase("delete1"), PAUSE_LECKER_MS);
    } else if (phase === "delete1") {
      if (text.length > BASE.length) {
        t = setTimeout(() => setText(text.slice(0, -1)), DELETE_MS);
      } else {
        setPhase("type2");
      }
    } else if (phase === "type2") {
      if (text.length < FULL_LEDGER.length) {
        t = setTimeout(() => setText(FULL_LEDGER.slice(0, text.length + 1)), TYPE_MS);
      } else {
        setPhase("hold");
      }
    } else if (phase === "hold") {
      t = setTimeout(() => setPhase("delete2"), HOLD_MS);
    } else if (phase === "delete2") {
      if (text.length > 0) {
        t = setTimeout(() => setText(text.slice(0, -1)), DELETE_MS);
      } else {
        setPhase("type1");
      }
    }

    return () => clearTimeout(t);
  }, [text, phase]);

  const showCursor = phase !== "hold" && phase !== "delete2";

  return (
    <div className="px-4 py-5 text-center">
      <span className="font-mono text-base font-medium text-sidebar-primary">
        {text}
        {showCursor && (
          <span className="ml-0.5 inline-block animate-pulse text-sidebar-primary">
            |
          </span>
        )}
      </span>
    </div>
  );
}
