import { LogOut, Moon, Pencil, Sun } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSaveUserProfile, useUserProfile } from "../hooks/useQueries";
import { useLanguage } from "../i18n/LanguageContext";

interface AppHeaderProps {
  showTitle?: boolean;
  style?: React.CSSProperties;
}

export default function AppHeader({ showTitle = true, style }: AppHeaderProps) {
  const { clear } = useInternetIdentity();
  const { t } = useLanguage();
  const { data: userProfile } = useUserProfile();
  const saveUserProfile = useSaveUserProfile();

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("pe_dark_mode");
    if (saved !== null) return saved === "true";
    return document.documentElement.classList.contains("dark");
  });

  // Username: backend is source of truth; fall back to localStorage, then default
  const [username, setUsername] = useState(
    () => localStorage.getItem("pe_username") || "Alex Rivera",
  );
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(username);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync username from backend when loaded
  useEffect(() => {
    if (userProfile?.name) {
      setUsername(userProfile.name);
      localStorage.setItem("pe_username", userProfile.name);
    }
  }, [userProfile?.name]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("pe_dark_mode", String(isDark));
  }, [isDark]);

  useEffect(() => {
    if (editingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingName]);

  function saveName() {
    const trimmed = nameInput.trim() || "Alex Rivera";
    setUsername(trimmed);
    localStorage.setItem("pe_username", trimmed);
    // Save to backend for cross-device sync
    saveUserProfile.mutate({ name: trimmed });
    setEditingName(false);
  }

  return (
    <div className="sticky top-0 z-50 shadow-sm" style={style ?? undefined}>
      <div
        className={`${
          isDark
            ? "bg-background/95 backdrop-blur-sm"
            : "bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9]"
        }`}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          {/* Left: App title + subtitle */}
          {showTitle && (
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl font-bold tracking-tight leading-tight text-[#1E2937] dark:text-foreground">
                PE Tracker
              </h1>
              <p className="text-xs font-medium text-[#64748B] dark:text-muted-foreground mt-0.5">
                Personal Expense Tracker
              </p>
            </div>
          )}

          {/* Right: Username + edit + theme + logout */}
          <div className="flex items-center gap-1.5 ml-2 shrink-0">
            {/* Username display / edit */}
            {editingName ? (
              <input
                ref={inputRef}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveName();
                  if (e.key === "Escape") setEditingName(false);
                }}
                className="text-sm font-medium border border-emerald-300 rounded-md px-2 py-0.5 w-24 text-[#334155] dark:text-foreground bg-background focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            ) : (
              <span className="text-sm font-medium text-[#334155] dark:text-foreground truncate max-w-[80px]">
                {username}
              </span>
            )}

            {/* Edit pencil */}
            <button
              type="button"
              onClick={() => {
                setNameInput(username);
                setEditingName(true);
              }}
              className="h-7 w-7 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
              aria-label="Edit username"
              data-ocid="app.username.edit_button"
            >
              <Pencil className="h-3.5 w-3.5 text-[#10B981]" />
            </button>

            {/* Theme toggle */}
            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              className="h-8 w-8 rounded-xl border border-border/60 bg-background/80 dark:bg-muted/60 flex items-center justify-center hover:bg-muted/60 transition-colors"
              aria-label={
                isDark ? t("switch_light_mode") : t("switch_dark_mode")
              }
              data-ocid="app.theme.toggle"
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-foreground" />
              ) : (
                <Moon className="h-4 w-4 text-[#334155]" />
              )}
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={() => clear()}
              className="h-8 w-8 rounded-xl border border-border/60 bg-background/80 dark:bg-muted/60 flex items-center justify-center hover:bg-muted/60 transition-colors"
              aria-label={t("logout")}
              data-ocid="app.logout.button"
            >
              <LogOut className="h-4 w-4 text-[#334155] dark:text-foreground" />
            </button>
          </div>
        </div>
        {/* Subtle bottom border */}
        <div className="h-px bg-border/50" />
      </div>
    </div>
  );
}
