import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LogOut,
  Moon,
  Sun,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import type { Expense } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
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
  const { clear } = useInternetIdentity();

  // Dark/light mode toggle — reads Tailwind "dark" class on <html>
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
    <div className="px-4 py-5 space-y-5 pb-24">
      {/* Top header row */}
      <div className="flex items-center justify-between">
        {/* Left: App title + subtitle */}
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight leading-tight">
            PE Tracker
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Personal Expense Tracker
          </p>
        </div>

        {/* Right: Theme toggle + Logout */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            data-ocid="dashboard.theme.toggle"
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
            data-ocid="dashboard.logout.button"
            onClick={() => clear()}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Sub-header: Monthly Overview */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Monthly Overview
        </p>
        <h2 className="font-display text-xl font-bold tracking-tight mt-0.5">
          {formatMonthYear(month)}
        </h2>
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
            <Card className="overflow-hidden border-0 shadow-md bg-primary text-primary-foreground">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-primary-foreground/70 text-sm font-medium">
                      Total Spent
                    </p>
                    <p className="font-display text-4xl font-bold mt-1 tracking-tight">
                      {formatCurrency(totalSpent, currency)}
                    </p>
                    {totalIncome > 0 && (
                      <p className="text-primary-foreground/70 text-xs mt-2">
                        of {formatCurrency(totalIncome, currency)} income
                      </p>
                    )}
                  </div>
                  <div className="p-3 rounded-xl bg-primary-foreground/10">
                    <Wallet className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>

                {totalIncome > 0 && (
                  <div className="mt-4">
                    <Progress
                      value={Math.min(pct(totalSpent, totalIncome), 100)}
                      className="h-1.5 bg-primary-foreground/20 [&>div]:bg-primary-foreground"
                    />
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-primary-foreground/70 flex items-center gap-1">
                        {balance >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        Balance: {formatCurrency(Math.abs(balance), currency)}
                        {balance < 0 ? " over" : " left"}
                      </span>
                      <span className="text-xs text-primary-foreground/70">
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
                      const cat = getCategoryById(categories, item.categoryId);
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
