import { useState } from "react";

export const CARD_THEMES = [
  {
    id: "purple-blue",
    name: "Purple/Blue",
    gradient:
      "linear-gradient(145deg, oklch(0.55 0.22 295) 0%, oklch(0.42 0.20 265) 55%, oklch(0.32 0.18 255) 100%)",
    orb: "oklch(0.78 0.15 280)",
    highlight: "oklch(0.88 0.08 270)",
  },
  {
    id: "sunset",
    name: "Sunset",
    gradient:
      "linear-gradient(145deg, oklch(0.72 0.19 45) 0%, oklch(0.58 0.22 20) 55%, oklch(0.44 0.20 355) 100%)",
    orb: "oklch(0.85 0.15 55)",
    highlight: "oklch(0.92 0.08 40)",
  },
  {
    id: "ocean",
    name: "Ocean",
    gradient:
      "linear-gradient(145deg, oklch(0.60 0.14 200) 0%, oklch(0.46 0.16 210) 55%, oklch(0.34 0.14 220) 100%)",
    orb: "oklch(0.82 0.10 195)",
    highlight: "oklch(0.90 0.06 200)",
  },
  {
    id: "forest",
    name: "Forest",
    gradient:
      "linear-gradient(145deg, oklch(0.52 0.15 160) 0%, oklch(0.38 0.14 162) 55%, oklch(0.30 0.12 165) 100%)",
    orb: "oklch(0.80 0.10 150)",
    highlight: "oklch(0.92 0.05 145)",
  },
  {
    id: "midnight",
    name: "Midnight",
    gradient:
      "linear-gradient(145deg, oklch(0.38 0.14 255) 0%, oklch(0.24 0.12 260) 55%, oklch(0.14 0.08 265) 100%)",
    orb: "oklch(0.60 0.12 255)",
    highlight: "oklch(0.75 0.06 250)",
  },
] as const;

export type CardThemeId = (typeof CARD_THEMES)[number]["id"];

const STORAGE_KEY = "totalSpentCardTheme";

export function useCardTheme() {
  const [themeId, setThemeIdState] = useState<CardThemeId>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const valid = CARD_THEMES.map((t) => t.id as string);
    return (saved && valid.includes(saved) ? saved : "forest") as CardThemeId;
  });

  const theme = CARD_THEMES.find((t) => t.id === themeId) ?? CARD_THEMES[3];

  function setThemeId(id: CardThemeId) {
    localStorage.setItem(STORAGE_KEY, id);
    setThemeIdState(id);
  }

  return { theme, themeId, setThemeId };
}
