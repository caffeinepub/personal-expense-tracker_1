import { Badge } from "@/components/ui/badge";
import { Bell, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  useAppSettings,
  useCategories,
  useExpenses,
} from "../hooks/useQueries";
import { getCategoryById } from "../utils/categories";
import { formatCurrency } from "../utils/format";

type RecurringExpense = {
  id: string;
  categoryId: string;
  paymentMethod: string;
  amount: number;
  date: string;
  note?: string;
  recurring: boolean;
  recurringFrequency: string;
};

function getNextOccurrence(lastDate: string, frequency: string): Date {
  const base = new Date(lastDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let next = new Date(base);
  // advance until we're >= today
  while (next < now) {
    switch (frequency) {
      case "Daily":
        next.setDate(next.getDate() + 1);
        break;
      case "Weekly":
        next.setDate(next.getDate() + 7);
        break;
      case "Yearly":
        next.setFullYear(next.getFullYear() + 1);
        break;
      default: // Monthly
        next.setMonth(next.getMonth() + 1);
    }
  }
  return next;
}

function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function daysLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

function daysColor(days: number): string {
  if (days === 0) return "bg-red-500/15 text-red-600 dark:text-red-400";
  if (days <= 2) return "bg-orange-500/15 text-orange-600 dark:text-orange-400";
  return "bg-blue-500/15 text-blue-600 dark:text-blue-400";
}

export default function BillReminders() {
  const { data: allExpenses = [] } = useExpenses();
  const { data: categories = [] } = useCategories();
  const { data: settings } = useAppSettings();
  const currency = settings?.currency ?? "USD";

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const reminders = useMemo(() => {
    const recurring = (allExpenses as unknown as RecurringExpense[]).filter(
      (e) => e.recurring === true,
    );

    return recurring
      .map((e) => {
        const nextDate = getNextOccurrence(
          e.date,
          e.recurringFrequency ?? "Monthly",
        );
        const days = daysUntil(nextDate);
        return { expense: e, nextDate, days };
      })
      .filter((r) => r.days >= 0 && r.days <= 7)
      .filter((r) => !dismissed.has(r.expense.id))
      .sort((a, b) => a.days - b.days);
  }, [allExpenses, dismissed]);

  if (reminders.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      data-ocid="dashboard.bill_reminders.card"
    >
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/50 bg-amber-500/5">
          <div className="flex items-baseline gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              DASHBOARD
            </p>
            <span className="text-xs text-muted-foreground/50">|</span>
            <div className="flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-amber-500" />
              <h3 className="font-display text-base font-semibold">
                Upcoming Bills
              </h3>
            </div>
            <Badge
              variant="secondary"
              className="ml-auto text-xs px-2 py-0 bg-amber-500/15 text-amber-600 dark:text-amber-400 border-0"
            >
              {reminders.length}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Recurring bills due in the next 7 days
          </p>
        </div>

        {/* Reminder rows */}
        <AnimatePresence>
          {reminders.map(({ expense, days }, i) => {
            const cat = getCategoryById(categories, expense.categoryId);
            return (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className="flex items-center gap-3 px-4 py-3 border-b border-border/40 last:border-0"
                data-ocid={`bill_reminders.item.${i + 1}`}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat?.color ?? "#B0B0B0" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium truncate">
                      {cat?.name ?? "Unknown"}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 border-0"
                      style={{
                        backgroundColor: `${cat?.color ?? "#B0B0B0"}22`,
                        color: cat?.color ?? "#666",
                      }}
                    >
                      {expense.recurringFrequency ?? "Monthly"}
                    </Badge>
                  </div>
                  {expense.note && (
                    <p className="text-xs text-muted-foreground truncate">
                      {expense.note}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-semibold">
                    {formatCurrency(expense.amount, currency)}
                  </span>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${daysColor(days)}`}
                  >
                    {daysLabel(days)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setDismissed((prev) => new Set([...prev, expense.id]))
                    }
                    className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    data-ocid={`bill_reminders.close_button.${i + 1}`}
                    aria-label="Dismiss reminder"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
