"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* The language switch, lifted out of the hero menu so anything under the root
   layout can read the choice. The switch itself still renders in that menu —
   this only owns the state, the persistence and <html lang>.

   Scope note: the two overlay dialogs (Contact, Apply) are the only surfaces
   translated so far. Everything else stays Korean regardless of the setting,
   so flipping to EN today changes those dialogs and nothing more. */

export const LANGS = [
  { code: "KR", htmlLang: "ko" },
  { code: "EN", htmlLang: "en" },
] as const;

export type LangCode = (typeof LANGS)[number]["code"];

const LANG_KEY = "bay-lang";

function htmlLangOf(code: LangCode): string {
  return LANGS.find((l) => l.code === code)?.htmlLang ?? "ko";
}

const LangContext = createContext<{
  lang: LangCode;
  setLang: (next: LangCode) => void;
}>({ lang: "KR", setLang: () => {} });

export function useLang() {
  return useContext(LangContext);
}

export default function LangProvider({ children }: { children: ReactNode }) {
  /* Always starts at KR: the server has no localStorage, so seeding from it
     during render would hydrate against different markup than was sent. An EN
     reader sees Korean for the first paint — acceptable while the setting only
     reaches two dialogs, and the reason to keep the stored value out of render
     rather than out of an effect. */
  const [lang, setLangState] = useState<LangCode>("KR");

  useEffect(() => {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "KR" || saved === "EN") setLangState(saved);
  }, []);

  /* Mirrors onto <html lang> for a restored choice too, not just a click —
     screen readers pick their voice from the attribute, so it has to follow
     the state rather than the event. */
  useEffect(() => {
    document.documentElement.lang = htmlLangOf(lang);
  }, [lang]);

  const setLang = useCallback((next: LangCode) => {
    setLangState(next);
    localStorage.setItem(LANG_KEY, next);
  }, []);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}
