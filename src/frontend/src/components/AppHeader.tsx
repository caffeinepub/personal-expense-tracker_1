import { Button } from "@/components/ui/button";
import { LogOut, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface AppHeaderProps {
  showTitle?: boolean;
}

export default function AppHeader({ showTitle = true }: AppHeaderProps) {
  const { clear } = useInternetIdentity();

  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <div>
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        {/* Left: App title + subtitle (hidden on tabs that don't need it) */}
        <div>
          {showTitle && (
            <>
              <h1 className="font-display text-2xl font-bold tracking-tight leading-tight">
                PE Tracker
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Personal Expense Tracker
              </p>
            </>
          )}
        </div>

        {/* Right: Theme toggle + Logout */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
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
            aria-label="Logout"
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
