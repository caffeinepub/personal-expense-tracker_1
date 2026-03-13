import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";
import { LANGUAGES, type Language, translations } from "./translations";

export { LANGUAGES };

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem("pe_tracker_language") as Language) || "en";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("pe_tracker_language", lang);
  }, []);

  const t = useCallback(
    (key: string, replacements?: Record<string, string>): string => {
      let str = translations[language]?.[key] ?? translations.en?.[key] ?? key;
      if (replacements) {
        for (const [k, v] of Object.entries(replacements)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, "g"), v);
        }
      }
      return str;
    },
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
