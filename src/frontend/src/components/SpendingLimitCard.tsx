import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Shield } from "lucide-react";
import { useAppSettings } from "../hooks/useQueries";
import type { Expense } from "../types";
import { formatCurrency } from "../utils/format";

interface SpendingLimitCardProps {
  allExpenses: Expense[];
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function SpendingLimitCard({
  allExpenses,
}: SpendingLimitCardProps) {
  const { data: settings } = useAppSettings();
  const currency = settings?.currency ?? "USD";

  const dailyLimit = settings?.dailyLimit ?? null;
  const weeklyLimit = settings?.weeklyLimit ?? null;

  // Only render if at least one limit is set
  if (!dailyLimit && !weeklyLimit) return null;

  const todayISO = new Date().toISOString().slice(0, 10);
  const weekStart = getWeekStart(new Date());

  const todayTotal = allExpenses
    .filter((e) => e.date === todayISO)
    .reduce((s, e) => s + Number(e.amount), 0);

  const weekTotal = allExpenses
    .filter((e) => {
      const d = new Date(`${e.date}T00:00:00`);
      return d >= weekStart && d <= new Date();
    })
    .reduce((s, e) => s + Number(e.amount), 0);

  function getBarColor(pct: number): string {
    if (pct >= 100) return "#ef4444";
    if (pct >= 70) return "#f59e0b";
    return "#10b981";
  }

  function getStatusIcon(pct: number) {
    if (pct >= 100)
      return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />;
    if (pct >= 70)
      return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
    return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
  }

  return (
    <Card
      className="border-border/50 shadow-sm"
      data-ocid="spending_limits.card"
    >
      <CardContent className="px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide">
            Spending Limits
          </h3>
        </div>

        <div className="space-y-3">
          {/* Daily limit */}
          {dailyLimit != null && dailyLimit > 0 && (
            <div data-ocid="spending_limits.daily.row">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {getStatusIcon(
                    Math.min(Math.round((todayTotal / dailyLimit) * 100), 100),
                  )}
                  Today
                </div>
                <span className="text-xs font-semibold">
                  {formatCurrency(todayTotal, currency)}{" "}
                  <span className="font-normal text-muted-foreground">
                    / {formatCurrency(dailyLimit, currency)}
                  </span>
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(Math.round((todayTotal / dailyLimit) * 100), 100)}%`,
                    backgroundColor: getBarColor(
                      Math.round((todayTotal / dailyLimit) * 100),
                    ),
                  }}
                />
              </div>
              {todayTotal >= dailyLimit && (
                <p
                  className="text-xs text-red-500 font-medium mt-0.5"
                  data-ocid="spending_limits.daily.error_state"
                >
                  Daily limit reached!
                </p>
              )}
            </div>
          )}

          {/* Weekly limit */}
          {weeklyLimit != null && weeklyLimit > 0 && (
            <div data-ocid="spending_limits.weekly.row">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {getStatusIcon(
                    Math.min(Math.round((weekTotal / weeklyLimit) * 100), 100),
                  )}
                  This Week
                </div>
                <span className="text-xs font-semibold">
                  {formatCurrency(weekTotal, currency)}{" "}
                  <span className="font-normal text-muted-foreground">
                    / {formatCurrency(weeklyLimit, currency)}
                  </span>
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(Math.round((weekTotal / weeklyLimit) * 100), 100)}%`,
                    backgroundColor: getBarColor(
                      Math.round((weekTotal / weeklyLimit) * 100),
                    ),
                  }}
                />
              </div>
              {weekTotal >= weeklyLimit && (
                <p
                  className="text-xs text-red-500 font-medium mt-0.5"
                  data-ocid="spending_limits.weekly.error_state"
                >
                  Weekly limit reached!
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
