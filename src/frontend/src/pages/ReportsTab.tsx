import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  Pencil,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import AppHeader from "../components/AppHeader";
import {
  useAppSettings,
  useCategories,
  useMonthlyIncome,
  useMonthlySummary,
  useSetMonthlyIncome,
} from "../hooks/useQueries";
import { getCategoryById } from "../utils/categories";
import {
  currentMonth,
  formatCurrency,
  formatMonthYear,
  isCurrentMonth,
  nextMonth,
  pct,
  prevMonth,
} from "../utils/format";

export default function ReportsTab() {
  const [month, setMonth] = useState(currentMonth());
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState("");

  const { data: summary, isLoading } = useMonthlySummary(month);
  const { data: incomeData } = useMonthlyIncome(month);
  const { data: categories = [] } = useCategories();
  const { data: settings } = useAppSettings();
  const currency = settings?.currency ?? "USD";

  const setIncome = useSetMonthlyIncome();

  const totalExpenses = summary?.totalExpenses ?? 0;
  const totalIncome = summary?.totalIncome ?? incomeData?.amount ?? 0;
  const balance = totalIncome - totalExpenses;
  const isOver = balance < 0;

  async function handleSaveIncome() {
    const amount = Number.parseFloat(incomeInput);
    if (Number.isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid income amount");
      return;
    }
    try {
      await setIncome.mutateAsync({ month, amount });
      toast.success("Income updated");
      setEditingIncome(false);
    } catch {
      toast.error("Failed to update income");
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  } as const;

  return (
    <div className="space-y-5 pb-24">
      <AppHeader />

      <div className="px-4 space-y-5">
        {/* Section label */}
        <div>
          <div className="flex items-baseline gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Monthly Report
            </p>
            <span className="text-xs text-muted-foreground/50">|</span>
            <h2 className="font-display text-xl font-bold tracking-tight">
              {formatMonthYear(month)}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Income, expenses, and category breakdown.
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
            data-ocid="reports.month.select"
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

        {isLoading ? (
          <ReportsSkeleton />
        ) : (
          <motion.div
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {/* Income card */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-4 pb-4 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        Monthly Income
                      </p>
                      {editingIncome ? (
                        <div className="flex items-center gap-2 mt-1.5">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={incomeInput}
                            onChange={(e) => setIncomeInput(e.target.value)}
                            className="h-9 w-32 text-lg font-bold font-display"
                            data-ocid="reports.income.input"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveIncome();
                              if (e.key === "Escape") setEditingIncome(false);
                            }}
                          />
                          <Button
                            size="icon"
                            className="h-9 w-9"
                            onClick={handleSaveIncome}
                            data-ocid="reports.income.save.button"
                            disabled={setIncome.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9"
                            onClick={() => setEditingIncome(false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <p className="font-display text-2xl font-bold mt-0.5">
                          {totalIncome > 0
                            ? formatCurrency(totalIncome, currency)
                            : "—"}
                        </p>
                      )}
                    </div>
                    {!editingIncome && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs h-8"
                        onClick={() => {
                          setIncomeInput(totalIncome.toString());
                          setEditingIncome(true);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                        {totalIncome > 0 ? "Edit" : "Set Income"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Summary cards */}
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-3 gap-2">
                <SummaryCard
                  label="Income"
                  value={formatCurrency(totalIncome, currency)}
                  icon={<TrendingUp className="h-4 w-4" />}
                  color="text-positive"
                />
                <SummaryCard
                  label="Expenses"
                  value={formatCurrency(totalExpenses, currency)}
                  icon={<TrendingDown className="h-4 w-4" />}
                  color="text-negative"
                />
                <SummaryCard
                  label="Balance"
                  value={formatCurrency(Math.abs(balance), currency)}
                  icon={<Minus className="h-4 w-4" />}
                  color={isOver ? "text-negative" : "text-positive"}
                  prefix={isOver ? "-" : "+"}
                />
              </div>
            </motion.div>

            {/* Category breakdown */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-0 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display text-base font-semibold">
                      Category Breakdown
                    </CardTitle>
                    <span className="text-xs font-medium text-muted-foreground">
                      Amount
                    </span>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="px-4 pb-4 pt-3 space-y-4">
                  {(summary?.categoryBreakdown?.length ?? 0) === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-6">
                      No expenses this month
                    </p>
                  ) : (
                    summary!.categoryBreakdown
                      .sort((a, b) => b.total - a.total)
                      .map((item) => {
                        const cat = getCategoryById(
                          categories,
                          item.categoryId,
                        );
                        const percentage = pct(item.total, totalExpenses);
                        const budget = cat?.budget ?? 0;
                        const budgetPct =
                          budget > 0
                            ? Math.min(pct(item.total, budget), 100)
                            : 0;
                        const overBudget = budget > 0 && item.total > budget;

                        return (
                          <div key={item.categoryId} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{
                                    backgroundColor: cat?.color ?? "#B0B0B0",
                                  }}
                                />
                                <span className="text-sm font-medium">
                                  {item.categoryName}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-semibold">
                                  {formatCurrency(item.total, currency)}
                                </span>
                                <span className="text-xs text-muted-foreground ml-1.5">
                                  {percentage}%
                                </span>
                              </div>
                            </div>

                            {/* Budget progress */}
                            {budget > 0 ? (
                              <div className="space-y-1">
                                <Progress
                                  value={budgetPct}
                                  className="h-2"
                                  style={{
                                    // Override progress bar color via CSS variable trick
                                    ["--progress-color" as string]: overBudget
                                      ? "oklch(var(--destructive))"
                                      : (cat?.color ?? "#B0B0B0"),
                                  }}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>
                                    Budget: {formatCurrency(budget, currency)}
                                  </span>
                                  {overBudget ? (
                                    <span className="text-destructive font-medium">
                                      Over by{" "}
                                      {formatCurrency(
                                        item.total - budget,
                                        currency,
                                      )}
                                    </span>
                                  ) : (
                                    <span>{budgetPct}% used</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: cat?.color ?? "#B0B0B0",
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color,
  prefix = "",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  prefix?: string;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="pt-3 pb-3 px-3">
        <div className={`${color} mb-1`}>{icon}</div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="font-display font-bold text-sm mt-0.5 leading-tight">
          {prefix}
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function ReportsSkeleton() {
  return (
    <div className="space-y-4" data-ocid="reports.loading_state">
      <Skeleton className="h-24 rounded-xl w-full" />
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <Skeleton className="h-48 rounded-xl w-full" />
    </div>
  );
}
