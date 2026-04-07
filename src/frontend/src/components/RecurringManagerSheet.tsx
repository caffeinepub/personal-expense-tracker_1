import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  format,
  parseISO,
} from "date-fns";
import { Repeat, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useAppSettings,
  useCategories,
  useDeleteExpense,
  useExpenses,
} from "../hooks/useQueries";
import type { Expense } from "../types";
import { getCategoryById } from "../utils/categories";
import { formatCurrency } from "../utils/format";

interface RecurringManagerSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

interface RecurringTemplate {
  key: string;
  template: Expense;
  allIds: string[];
  categoryName: string;
  categoryColor: string;
  frequency: string;
  nextDate: string;
}

function computeNextDate(dateStr: string, frequency: string): string {
  try {
    const d = parseISO(dateStr);
    let next: Date;
    switch (frequency.toLowerCase()) {
      case "daily":
        next = addDays(d, 1);
        break;
      case "weekly":
        next = addWeeks(d, 1);
        break;
      case "yearly":
        next = addYears(d, 1);
        break;
      default:
        next = addMonths(d, 1);
    }
    return format(next, "MMM d, yyyy");
  } catch {
    return "\u2014";
  }
}

function frequencyColor(freq: string): string {
  switch (freq.toLowerCase()) {
    case "daily":
      return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
    case "weekly":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    case "yearly":
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
    default:
      return "bg-primary/10 text-primary border-primary/20";
  }
}

export default function RecurringManagerSheet({
  open,
  onOpenChange,
}: RecurringManagerSheetProps) {
  const { data: allExpenses = [] } = useExpenses();
  const { data: categories = [] } = useCategories();
  const { data: settings } = useAppSettings();
  const currency = settings?.currency ?? "USD";
  const deleteExpense = useDeleteExpense();
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const recurringTemplates = useMemo((): RecurringTemplate[] => {
    const recurring = allExpenses.filter((e: Expense) => e.recurring === true);

    // Group by categoryId + paymentMethod + recurringFrequency
    const groups = new Map<string, Expense[]>();
    for (const e of recurring) {
      const freq = e.recurringFrequency ?? "Monthly";
      const key = `${e.categoryId}||${e.paymentMethod}||${freq}`;
      const existing = groups.get(key) ?? [];
      groups.set(key, [...existing, e]);
    }

    const templates: RecurringTemplate[] = [];
    for (const [key, expenses] of groups.entries()) {
      // Keep the one with earliest date as template
      const sorted = [...expenses].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      const template = sorted[0];
      const cat = getCategoryById(categories, template.categoryId);
      const freq = template.recurringFrequency ?? "Monthly";

      templates.push({
        key,
        template,
        allIds: expenses.map((e) => e.id),
        categoryName: cat?.name ?? "Unknown",
        categoryColor: cat?.color ?? "#B0B0B0",
        frequency: freq,
        nextDate: computeNextDate(template.date, freq),
      });
    }

    return templates.sort((a, b) =>
      a.categoryName.localeCompare(b.categoryName),
    );
  }, [allExpenses, categories]);

  async function handleDeleteAll(tmpl: RecurringTemplate) {
    setDeletingKey(tmpl.key);
    try {
      await Promise.all(tmpl.allIds.map((id) => deleteExpense.mutateAsync(id)));
      toast.success(
        `Deleted ${tmpl.allIds.length} recurring expense${
          tmpl.allIds.length > 1 ? "s" : ""
        }`,
      );
    } catch {
      toast.error("Failed to delete recurring expenses");
    } finally {
      setDeletingKey(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md w-full max-h-[80vh] flex flex-col p-0 gap-0 rounded-2xl"
        data-ocid="recurring_manager.dialog"
      >
        <DialogHeader className="px-4 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-primary" />
              <DialogTitle className="text-base font-semibold">
                Recurring Expenses
              </DialogTitle>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
              aria-label="Close"
              data-ocid="recurring_manager.close_button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {recurringTemplates.length} recurring template
            {recurringTemplates.length !== 1 ? "s" : ""} found
          </p>
        </DialogHeader>

        <div
          className="flex-1 overflow-y-auto px-4 pb-6"
          data-ocid="recurring_manager.list"
        >
          {recurringTemplates.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-48 gap-3"
              data-ocid="recurring_manager.empty_state"
            >
              <Repeat className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground text-center">
                No recurring expenses found.
                <br />
                Create a recurring expense to manage it here.
              </p>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              {recurringTemplates.map((tmpl, idx) => (
                <div
                  key={tmpl.key}
                  data-ocid={`recurring_manager.item.${idx + 1}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card shadow-sm"
                >
                  {/* Category color swatch */}
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tmpl.categoryColor }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {tmpl.categoryName}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${frequencyColor(tmpl.frequency)}`}
                      >
                        {tmpl.frequency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-sm font-bold text-foreground">
                        {formatCurrency(Number(tmpl.template.amount), currency)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Next: {tmpl.nextDate}
                      </span>
                    </div>
                    {tmpl.template.note && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {tmpl.template.note}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      {tmpl.allIds.length} occurrence
                      {tmpl.allIds.length !== 1 ? "s" : ""} total
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteAll(tmpl)}
                    disabled={deletingKey === tmpl.key}
                    aria-label="Delete all occurrences"
                    data-ocid={`recurring_manager.delete_button.${idx + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
