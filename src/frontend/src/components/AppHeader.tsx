import { Button } from "@/components/ui/button";
import { LogOut, Moon, Sun } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useLanguage } from "../i18n/LanguageContext";

interface AppHeaderProps {
  showTitle?: boolean;
  style?: React.CSSProperties;
}

export default function AppHeader({ showTitle = true, style }: AppHeaderProps) {
  const { clear } = useInternetIdentity();
  const { t } = useLanguage();

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("pe_dark_mode");
    if (saved !== null) return saved === "true";
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("pe_dark_mode", String(isDark));
  }, [isDark]);

  return (
    <div
      className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm"
      style={
        style ?? {
          backgroundColor:
            "color-mix(in oklch, var(--theme-tint, transparent) 10%, oklch(var(--background) / 0.95))",
        }
      }
    >
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        {/* Left: App title + subtitle */}
        <div>
          {showTitle && (
            <>
              <h1 className="font-display text-2xl font-bold tracking-tight leading-tight">
                {t("app_title")}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("app_subtitle")}
              </p>
            </>
          )}
        </div>

        {/* Right: Theme toggle + Logout */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={isDark ? t("switch_light_mode") : t("switch_dark_mode")}
            data-ocid="app.theme.toggle"
            onClick={() => setIsDark((prev) => !prev)}
          >
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("logout")}
            data-ocid="app.logout.button"
            onClick={() => clear()}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border mx-4" />
    </div>
  );
}
