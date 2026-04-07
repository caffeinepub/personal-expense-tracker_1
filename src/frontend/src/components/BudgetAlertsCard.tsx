import { Bell, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Category, Expense } from "../types";
import { formatCurrency } from "../utils/format";

interface BudgetAlertsCardProps {
  categories: Category[];
  expenses: Expense[];
  currency: string;
}

interface CategoryAlert {
  category: Category;
  spent: number;
  budget: number;
  pct: number;
  isOver: boolean;
}

export default function BudgetAlertsCard({
  categories,
  expenses,
  currency,
}: BudgetAlertsCardProps) {
  const [dismissed, setDismissed] = useState(false);

  const alerts = useMemo((): CategoryAlert[] => {
    const spendMap = new Map<string, number>();
    for (const e of expenses) {
      const curr = spendMap.get(e.categoryId) ?? 0;
      spendMap.set(e.categoryId, curr + Number(e.amount));
    }

    const result: CategoryAlert[] = [];
    for (const cat of categories) {
      if (!cat.budget || cat.budget <= 0) continue;
      const spent = spendMap.get(cat.id) ?? 0;
      const categoryPct = (spent / cat.budget) * 100;
      if (categoryPct < 80) continue;
      result.push({
        category: cat,
        spent,
        budget: cat.budget,
        pct: categoryPct,
        isOver: categoryPct > 100,
      });
    }

    // Sort: over-budget first, then by pct descending
    return result.sort((a, b) => {
      if (a.isOver && !b.isOver) return -1;
      if (!a.isOver && b.isOver) return 1;
      return b.pct - a.pct;
    });
  }, [categories, expenses]);

  if (dismissed || alerts.length === 0) return null;

  const hasOverBudget = alerts.some((a) => a.isOver);

  return (
    <div
      className={`rounded-xl border shadow-sm overflow-hidden ${
        hasOverBudget
          ? "border-red-300 dark:border-red-800/60 bg-red-50 dark:bg-red-950/40"
          : "border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40"
      }`}
      data-ocid="budget_alerts.card"
    >
      {/* Card Header */}
      <div
        className={`flex items-center justify-between px-4 py-2.5 border-b ${
          hasOverBudget
            ? "bg-red-100/60 dark:bg-red-900/30 border-red-200 dark:border-red-800/50"
            : "bg-amber-100/60 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50"
        }`}
      >
        <div className="flex items-center gap-2">
          <Bell
            className={`h-4 w-4 ${
              hasOverBudget
                ? "text-red-500 dark:text-red-400"
                : "text-amber-500 dark:text-amber-400"
            }`}
          />
          <span className="text-sm font-semibold text-foreground">
            Budget Alerts
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              hasOverBudget
                ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
            }`}
          >
            {hasOverBudget ? "Over budget" : "Near limit"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Dismiss alerts"
          data-ocid="budget_alerts.close_button"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Alert Rows */}
      <div className="px-4 py-2 space-y-2.5">
        {alerts.map((alert, idx) => {
          const progressPct = Math.min(alert.pct, 100);
          const barColor = alert.isOver ? "rgb(239 68 68)" : "rgb(245 158 11)";
          return (
            <div
              key={alert.category.id}
              className="space-y-1"
              data-ocid={`budget_alerts.item.${idx + 1}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: alert.category.color }}
                  />
                  <span className="text-sm font-medium truncate">
                    {alert.category.name}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold flex-shrink-0 ${
                    alert.isOver
                      ? "text-red-600 dark:text-red-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {Math.round(alert.pct)}%
                </span>
              </div>

              {/* Custom progress bar */}
              <div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPct}%`,
                    backgroundColor: barColor,
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(alert.spent, currency)} /{" "}
                  {formatCurrency(alert.budget, currency)}
                </span>
                {alert.isOver && (
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">
                    +{formatCurrency(alert.spent - alert.budget, currency)} over
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
