import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import type { Expense } from "../backend.d";
import AppHeader from "../components/AppHeader";
import {
  useAppSettings,
  useCategories,
  useExpensesByMonth,
  useMonthlySummary,
} from "../hooks/useQueries";
import { getCategoryById } from "../utils/categories";
import {
  currentMonth,
  formatCurrency,
  formatDateShort,
  formatMonthYear,
  pct,
} from "../utils/format";

interface DashboardTabProps {
  onEditExpense: (expense: Expense) => void;
}

export default function DashboardTab({ onEditExpense }: DashboardTabProps) {
  const month = currentMonth();
  const { data: expenses = [], isLoading: loadingExpenses } =
    useExpensesByMonth(month);
  const { data: summary, isLoading: loadingSummary } = useMonthlySummary(month);
  const { data: categories = [] } = useCategories();
  const { data: settings } = useAppSettings();
  const currency = settings?.currency ?? "USD";

  const recentExpenses = useMemo(
    () =>
      [...expenses]
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime() ||
            Number(b.createdAt) - Number(a.createdAt),
        )
        .slice(0, 7),
    [expenses],
  );

  const totalSpent = summary?.totalExpenses ?? 0;
  const totalIncome = summary?.totalIncome ?? 0;
  const balance = totalIncome - totalSpent;

  const isLoading = loadingExpenses || loadingSummary;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  } as const;

  return (
    <div className="space-y-5 pb-24">
      <AppHeader />

      <div className="px-4 space-y-5">
        {/* Sub-header: Monthly Overview */}
        <div>
          <div className="flex items-baseline gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Monthly Overview
            </p>
            <span className="text-xs text-muted-foreground/50">|</span>
            <h2 className="font-display text-xl font-bold tracking-tight">
              {formatMonthYear(month)}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your spending summary and recent transactions for this month.
          </p>
        </div>

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <motion.div
            className="space-y-5"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {/* Main spending card */}
            <motion.div variants={itemVariants}>
              <Card
                className="relative overflow-hidden border-0 shadow-xl bg-primary text-primary-foreground rounded-2xl"
                style={{
                  background:
                    "linear-gradient(145deg, oklch(0.52 0.15 160) 0%, oklch(0.38 0.14 162) 55%, oklch(0.30 0.12 165) 100%)",
                }}
              >
                {/* Decorative glowing orb — top-right depth layer */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-8 -right-8 w-48 h-48 rounded-full opacity-25"
                  style={{
                    background:
                      "radial-gradient(circle, oklch(0.80 0.10 150) 0%, transparent 70%)",
                    filter: "blur(18px)",
                  }}
                />
                {/* Subtle top-edge highlight stripe */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-40"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, oklch(0.92 0.05 145), transparent)",
                  }}
                />

                <CardContent className="relative pt-6 pb-6 px-5">
                  <div className="flex items-start justify-between">
                    {/* Left: label + amount + income line */}
                    <div className="flex-1 min-w-0">
                      {/* Pill label */}
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest bg-primary-foreground/15 text-primary-foreground/90 border border-primary-foreground/20 backdrop-blur-sm mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/70 inline-block" />
                        Total Spent
                      </span>

                      {/* Hero amount */}
                      <p className="font-display text-5xl font-bold tracking-tight leading-none">
                        {formatCurrency(totalSpent, currency)}
                      </p>

                      {/* Income reference line */}
                      {totalIncome > 0 && (
                        <p className="text-primary-foreground/60 text-xs mt-2.5 font-medium">
                          of {formatCurrency(totalIncome, currency)} income
                        </p>
                      )}
                    </div>

                    {/* Right: Wallet icon with frosted glow circle */}
                    <div className="relative ml-4 flex-shrink-0">
                      <div
                        className="absolute inset-0 rounded-2xl opacity-40"
                        style={{
                          filter: "blur(8px)",
                          background: "oklch(0.75 0.10 150)",
                        }}
                      />
                      <div className="relative p-3.5 rounded-2xl bg-primary-foreground/15 border border-primary-foreground/20 backdrop-blur-sm">
                        <Wallet className="h-7 w-7 text-primary-foreground" />
                      </div>
                    </div>
                  </div>

                  {/* Progress + balance row */}
                  {totalIncome > 0 && (
                    <div className="mt-5">
                      {/* Animated progress bar */}
                      <div className="relative h-2 bg-primary-foreground/15 rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${Math.min(pct(totalSpent, totalIncome), 100)}%`,
                            background:
                              "linear-gradient(90deg, oklch(0.85 0.08 145), oklch(0.95 0.04 140))",
                          }}
                        />
                        {/* Shimmer overlay */}
                        <div
                          aria-hidden="true"
                          className="absolute top-0 left-0 h-full w-1/4 animate-shimmer"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
                          }}
                        />
                      </div>

                      {/* Balance chips row */}
                      <div className="flex items-center justify-between mt-3 gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-foreground/12 border border-primary-foreground/15 text-primary-foreground/90">
                          {balance >= 0 ? (
                            <TrendingUp className="h-3 w-3 text-primary-foreground/80" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-primary-foreground/80" />
                          )}
                          {formatCurrency(Math.abs(balance), currency)}
                          <span className="text-primary-foreground/60 font-normal">
                            {balance < 0 ? "over" : "left"}
                          </span>
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-primary-foreground/12 border border-primary-foreground/15 text-primary-foreground/90">
                          {pct(totalSpent, totalIncome)}%
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Category breakdown */}
            {(summary?.categoryBreakdown?.length ?? 0) > 0 && (
              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3 pt-4 px-4">
                    <CardTitle className="font-display text-base font-semibold">
                      By Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    {summary!.categoryBreakdown
                      .sort((a, b) => b.total - a.total)
                      .map((item) => {
                        const cat = getCategoryById(
                          categories,
                          item.categoryId,
                        );
                        const percentage = pct(item.total, totalSpent);
                        const budget = cat?.budget ?? 0;
                        return (
                          <div key={item.categoryId} className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                  style={{
                                    backgroundColor: cat?.color ?? "#B0B0B0",
                                  }}
                                />
                                <span className="font-medium truncate max-w-[120px]">
                                  {item.categoryName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-right">
                                <span className="text-muted-foreground text-xs">
                                  {percentage}%
                                </span>
                                <span className="font-semibold text-foreground">
                                  {formatCurrency(item.total, currency)}
                                </span>
                              </div>
                            </div>
                            <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: cat?.color ?? "#B0B0B0",
                                }}
                              />
                              {budget > 0 && item.total > budget && (
                                <div className="absolute right-0 top-0 w-0.5 h-full bg-destructive" />
                              )}
                            </div>
                            {budget > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(item.total, currency)} of{" "}
                                {formatCurrency(budget, currency)} budget
                                {item.total > budget && (
                                  <span className="text-destructive ml-1 font-medium">
                                    (over!)
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                        );
                      })}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Recent transactions */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="font-display text-base font-semibold">
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-2">
                  {recentExpenses.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-6 px-4">
                      No expenses this month yet
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {recentExpenses.map((expense, i) => {
                        const cat = getCategoryById(
                          categories,
                          expense.categoryId,
                        );
                        return (
                          <li key={expense.id}>
                            <button
                              type="button"
                              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 cursor-pointer transition-colors w-full text-left"
                              onClick={() => onEditExpense(expense)}
                              data-ocid={`expense.item.${i + 1}`}
                            >
                              <div
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
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
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                  {expense.note || expense.paymentMethod || "—"}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-semibold text-sm">
                                  {formatCurrency(expense.amount, currency)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDateShort(expense.date)}
                                </p>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
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

function DashboardSkeleton() {
  return (
    <div className="space-y-5" data-ocid="dashboard.loading_state">
      <Skeleton className="h-36 rounded-2xl w-full" />
      <Skeleton className="h-48 rounded-2xl w-full" />
      <Skeleton className="h-64 rounded-2xl w-full" />
    </div>
  );
}
