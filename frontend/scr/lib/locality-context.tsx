// Locality context: the user's chosen state/district/town/locality, persisted to
// localStorage and shared across the header, feed, map and report flow.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { centroidFor } from "./localities";

export interface LocalitySelection {
  state: string;
  district: string;
  town: string;
  locality?: string;
}

interface LocalityContextValue {
  selection: LocalitySelection | null;
  setSelection: (value: LocalitySelection | null) => void;
  center: [number, number];
}

const STORAGE_KEY = "cc_locality";
const LocalityContext = createContext<LocalityContextValue | null>(null);

function readStored(): LocalitySelection | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalitySelection;
    if (parsed && parsed.state && parsed.district && parsed.town) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function LocalityProvider({ children }: { children: ReactNode }) {
  const [selection, setSelectionState] = useState<LocalitySelection | null>(() => readStored());

  useEffect(() => {
    try {
      if (selection) localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // private mode etc. — selection just won't persist
    }
  }, [selection]);

  const value = useMemo<LocalityContextValue>(
    () => ({
      selection,
      setSelection: setSelectionState,
      center: selection ? centroidFor(selection.town) : [12.9716, 77.5946],
    }),
    [selection],
  );

  return <LocalityContext.Provider value={value}>{children}</LocalityContext.Provider>;
}

export function useLocality(): LocalityContextValue {
  const ctx = useContext(LocalityContext);
  if (!ctx) throw new Error("useLocality must be used inside LocalityProvider");
  return ctx;
}
