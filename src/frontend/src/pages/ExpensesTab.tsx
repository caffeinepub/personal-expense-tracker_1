import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Receipt,
  Search,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Expense } from "../backend.d";
import AppHeader from "../components/AppHeader";
import {
  useAppSettings,
  useCategories,
  useDeleteExpense,
  useExpensesByMonth,
} from "../hooks/useQueries";
import { getCategoryById } from "../utils/categories";
import {
  currentMonth,
  formatCurrency,
  formatDate,
  formatMonthYear,
  groupByDate,
  isCurrentMonth,
  nextMonth,
  prevMonth,
} from "../utils/format";

interface ExpensesTabProps {
  onEditExpense: (expense: Expense) => void;
}

export default function ExpensesTab({ onEditExpense }: ExpensesTabProps) {
  const [month, setMonth] = useState(currentMonth());
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: expenses = [], isLoading } = useExpensesByMonth(month);
  const { data: categories = [] } = useCategories();
  const { data: settings } = useAppSettings();
  const currency = settings?.currency ?? "USD";
  const deleteExpense = useDeleteExpense();

  const filtered = useMemo(() => {
    return expenses
      .filter(
        (e) => categoryFilter === "all" || e.categoryId === categoryFilter,
      )
      .filter(
        (e) =>
          !searchQuery ||
          e.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          getCategoryById(categories, e.categoryId)
            ?.name.toLowerCase()
            .includes(searchQuery.toLowerCase()),
      )
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime() ||
          Number(b.createdAt) - Number(a.createdAt),
      );
  }, [expenses, categoryFilter, searchQuery, categories]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  async function handleDelete(id: string) {
    try {
      await deleteExpense.mutateAsync(id);
      toast.success("Expense deleted");
    } catch {
      toast.error("Failed to delete expense");
    }
    setDeleteId(null);
  }

  return (
    <div className="space-y-4 pb-24">
      <AppHeader />

      <div className="px-4 space-y-4">
        {/* Section label */}
        <div>
          <div className="flex items-baseline gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Expenses
            </p>
            <span className="text-xs text-muted-foreground/50">|</span>
            <h2 className="font-display text-xl font-bold tracking-tight">
              Browse &amp; Manage
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Search, filter, and manage your transactions.
          </p>
        </div>

        {/* Month selector */}
        <div className="flex items-center justify-between bg-card border border-border rounded-xl px-3 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setMonth(prevMonth(month))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span
            className="font-display font-semibold text-sm"
            data-ocid="expenses.month.select"
          >
            {formatMonthYear(month)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setMonth(nextMonth(month))}
            disabled={isCurrentMonth(month)}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              data-ocid="expenses.search_input"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger
              data-ocid="expenses.category.select"
              className="h-9 w-32 text-sm"
            >
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Expense list */}
        {isLoading ? (
          <ExpenseListSkeleton />
        ) : filtered.length === 0 ? (
          <div
            className="text-center py-16 px-4"
            data-ocid="expenses.empty_state"
          >
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Receipt className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold text-base mb-1">
              No expenses found
            </h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery || categoryFilter !== "all"
                ? "Try adjusting your filters"
                : "Add your first expense using the + button"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map((date) => (
              <div key={date}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {formatDate(date)}
                </p>
                <Card className="border-0 shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    <AnimatePresence>
                      {grouped[date].map((expense, i) => {
                        const globalIndex = filtered.indexOf(expense) + 1;
                        const cat = getCategoryById(
                          categories,
                          expense.categoryId,
                        );
                        return (
                          <motion.div
                            key={expense.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, delay: i * 0.04 }}
                            className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 group"
                            data-ocid={`expense.item.${globalIndex}`}
                          >
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: cat?.color ?? "#B0B0B0",
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant="secondary"
                                  className="text-xs px-1.5 py-0 font-medium rounded-md"
                                  style={{
                                    backgroundColor: `${cat?.color ?? "#B0B0B0"}22`,
                                    color: cat?.color ?? "#666",
                                    border: "none",
                                  }}
                                >
                                  {cat?.name ?? "Unknown"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {expense.paymentMethod}
                                </span>
                              </div>
                              {expense.note && (
                                <p className="text-sm text-foreground/80 mt-0.5 truncate">
                                  {expense.note}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-sm">
                                {formatCurrency(expense.amount, currency)}
                              </span>
                              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => onEditExpense(expense)}
                                  data-ocid={`expense.edit_button.${globalIndex}`}
                                  aria-label="Edit expense"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteId(expense.id)}
                                  data-ocid={`expense.delete_button.${globalIndex}`}
                                  aria-label="Delete expense"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Delete confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display">
                Delete this expense?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-ocid="reset.cancel.button">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && handleDelete(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-ocid="reset.confirm.button"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function ExpenseListSkeleton() {
  return (
    <div className="space-y-3" data-ocid="expenses.loading_state">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-16 rounded-xl w-full" />
      ))}
    </div>
  );
}
