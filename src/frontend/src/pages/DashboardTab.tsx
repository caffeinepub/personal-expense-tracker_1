import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlignLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Minus,
  MoreVertical,
  Pencil,
  PieChart as PieChartIcon,
  Scale,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Expense } from "../backend.d";

import BillReminders from "../components/BillReminders";
import ThemePickerDialog from "../components/ThemePickerDialog";
import type { CardThemeId } from "../hooks/useCardTheme";
import {
  useAppSettings,
  useCategories,
  useExpensesByMonth,
  useIncomeSources,
  useMonthlySummary,
} from "../hooks/useQueries";
import { useLanguage } from "../i18n/LanguageContext";
import { getCategoryById } from "../utils/categories";
import {
  nextMonth as _nextMonth,
  prevMonth as _prevMonth,
  formatCurrency,
  formatDateShort,
  formatMonthYear,
  pct,
} from "../utils/format";
import type { IncomeSource } from "../utils/incomeSources";

const MONTH_KEYS = [
  "month_jan",
  "month_feb",
  "month_mar",
  "month_apr",
  "month_may",
  "month_jun",
  "month_jul",
  "month_aug",
  "month_sep",
  "month_oct",
  "month_nov",
  "month_dec",
];

interface DashboardTabProps {
  onEditExpense: (expense: Expense) => void;
  onViewAll: () => void;
  month: string;
  setMonth: (m: string) => void;
  theme: {
    gradient: string;
    orb: string;
    highlight: string;
    id: string;
    name: string;
  };
  themeId: CardThemeId;
  setThemeId: (id: CardThemeId) => void;
  onQuickAddBill?: (data: {
    amount: string;
    categoryId: string;
    paymentMethod: string;
    note: string;
  }) => void;
}

export default function DashboardTab({
  onEditExpense,
  onViewAll,
  month,
  setMonth,
  theme,
  themeId,
  setThemeId,
  onQuickAddBill,
}: DashboardTabProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [chartView, setChartView] = useState<"donut" | "bar">("donut");
  const [chartViewIncome, setChartViewIncome] = useState<
    "donut" | "vertical" | "horizontal"
  >("donut");
  const [chartTab, setChartTab] = useState<"expense" | "income">("expense");
  const [dashTab, setDashTab] = useState<"category" | "recent">("category");

  // Reset income chart view when switching back to expense tab
  useEffect(() => {
    if (chartTab === "expense") {
      setChartViewIncome("donut");
    }
  }, [chartTab]);
  const { t } = useLanguage();

  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  const { data: expenses = [], isLoading: loadingExpenses } =
    useExpensesByMonth(month);
  const { data: summary, isLoading: loadingSummary } = useMonthlySummary(month);
  const prevMonthStr = _prevMonth(month);
  const { data: prevSummary } = useMonthlySummary(prevMonthStr);
  const { data: categories = [] } = useCategories();
  const { data: settings } = useAppSettings();
  const currency = settings?.currency ?? "USD";

  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [savingsGoal, setSavingsGoal] = useState<number>(() => {
    const v = localStorage.getItem("pe_savings_goal");
    return v ? Number(v) : 0;
  });
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const { data: incomeSourcesData } = useIncomeSources();
  const incomeSources = incomeSourcesData ?? [];

  const recentExpenses = useMemo(
    () =>
      [...expenses].sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime() ||
          Number(b.createdAt) - Number(a.createdAt),
      ),
    [expenses],
  );

  const totalSpent = summary?.totalExpenses ?? 0;
  const totalIncome = summary?.totalIncome ?? 0;
  const balance = totalIncome - totalSpent;
  const spentPct =
    totalIncome > 0 ? Math.min(pct(totalSpent, totalIncome), 100) : 0;

  const isLoading = loadingExpenses || loadingSummary;

  function selectMonth(m: number) {
    const mm = String(m + 1).padStart(2, "0");
    setMonth(`${pickerYear}-${mm}`);
    setPickerOpen(false);
  }

  const selectedYear = Number.parseInt(month.split("-")[0], 10);
  const selectedMonthIdx = Number.parseInt(month.split("-")[1], 10) - 1;

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

  const chartData = useMemo(() => {
    return (
      summary?.categoryBreakdown
        ?.sort((a, b) => b.total - a.total)
        .map((item) => {
          const cat = getCategoryById(categories, item.categoryId);
          return {
            name: item.categoryName,
            value: item.total,
            color: cat?.color ?? "#B0B0B0",
          };
        }) ?? []
    );
  }, [summary, categories]);

  const chartDataIncome = useMemo(() => {
    if (incomeSources.length > 0) {
      return incomeSources
        .filter((src) => src.monthlyBudget > 0)
        .map((src) => ({
          name: src.name,
          value: src.monthlyBudget,
          color: src.color,
        }));
    }
    if (!totalIncome || totalIncome <= 0) return [];
    return [{ name: "Income", value: totalIncome, color: "#10b981" }];
  }, [incomeSources, totalIncome]);

  return (
    <div className="space-y-5 pb-24">
      <div className="px-4 space-y-5">
        {/* Sub-header: Monthly Overview with month picker */}
        <div>
          <div className="flex items-baseline gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("monthly_overview")}
            </p>
            <span className="text-xs text-muted-foreground/50">|</span>

            <span className="font-display text-xl font-bold tracking-tight">
              {formatMonthYear(month)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("monthly_overview_desc")}
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
            {/* ── Month Navigator Row ─────────────────────────── */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between bg-card rounded-xl px-4 py-2.5 shadow-sm border border-border">
                <button
                  type="button"
                  onClick={() => setMonth(_prevMonth(month))}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  aria-label="Previous month"
                  data-ocid="dashboard.month_nav.prev"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      data-ocid="dashboard.month_nav.open_modal_button"
                      className="flex items-center gap-1.5 font-display text-base font-bold tracking-tight hover:text-primary transition-colors"
                    >
                      <CalendarDays className="h-4 w-4" />
                      {formatMonthYear(month)}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-72 p-3 z-50"
                    align="center"
                    data-ocid="dashboard.month_nav.popover"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <button
                        type="button"
                        onClick={() => setPickerYear((y) => y - 1)}
                        className="p-1.5 rounded-md hover:bg-muted transition-colors"
                        aria-label="Previous year"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="font-semibold text-sm">
                        {pickerYear}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPickerYear((y) => y + 1)}
                        className="p-1.5 rounded-md hover:bg-muted transition-colors"
                        aria-label="Next year"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {MONTH_KEYS.map((key, idx) => {
                        const isSelected =
                          idx === selectedMonthIdx &&
                          pickerYear === selectedYear;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => selectMonth(idx)}
                            className={`py-2 rounded-lg text-sm font-medium transition-colors ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"}`}
                          >
                            {t(key)}
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
                <button
                  type="button"
                  onClick={() => setMonth(_nextMonth(month))}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  aria-label="Next month"
                  data-ocid="dashboard.month_nav.next"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>

            {/* ── Total Spent card ─────────────────────────────── */}
            <motion.div variants={itemVariants}>
              <Card
                className="relative overflow-hidden border-0 shadow-xl rounded-2xl"
                style={{ background: theme.gradient }}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-8 -right-8 w-48 h-48 rounded-full opacity-25"
                  style={{
                    background: `radial-gradient(circle, ${theme.orb} 0%, transparent 70%)`,
                    filter: "blur(18px)",
                  }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-40"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${theme.highlight}, transparent)`,
                  }}
                />

                <CardContent className="relative pt-4 pb-5 px-5">
                  {/* Row 1: pill label + three-dots */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-base font-semibold uppercase tracking-widest bg-white/15 text-white/90 border border-white/20 backdrop-blur-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/70 inline-block" />
                      {t("total_spent")}
                    </span>

                    <button
                      type="button"
                      data-ocid="total_spent.open_modal_button"
                      onClick={() => setThemeDialogOpen(true)}
                      className="p-1.5 rounded-full bg-white/15 border border-white/20 text-white/80 hover:bg-white/25 transition-colors"
                      aria-label={t("change_card_theme")}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Row 2: hero amount + wallet icon */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-6xl font-bold tracking-tight leading-none text-white">
                        {formatCurrency(totalSpent, currency)}
                      </p>
                      {totalIncome > 0 && (
                        <p className="text-white/60 text-base mt-2 font-medium">
                          {t("of_income", {
                            amount: formatCurrency(totalIncome, currency),
                          })}
                        </p>
                      )}
                    </div>

                    <div className="relative ml-4 flex-shrink-0">
                      <div
                        className="absolute inset-0 rounded-2xl opacity-40"
                        style={{ filter: "blur(8px)", background: theme.orb }}
                      />
                      <div className="relative p-3.5 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-sm">
                        <Wallet className="h-7 w-7 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: progress bar */}
                  <div className="mt-5">
                    <div className="relative h-2 bg-white/15 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${spentPct > 0 ? spentPct : 3}%`,
                          background: "rgba(255,255,255,0.85)",
                        }}
                      />
                      <div
                        aria-hidden="true"
                        className="absolute top-0 left-0 h-full w-1/4 animate-shimmer"
                        style={{
                          background:
                            "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
                        }}
                      />
                    </div>

                    {/* Row 4: bottom chips */}
                    <div className="flex items-center justify-between mt-3 gap-2">
                      {totalIncome > 0 ? (
                        <>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-base font-semibold bg-white/12 border border-white/15 text-white/90">
                            {balance >= 0 ? (
                              <TrendingUp className="h-3 w-3 text-white/80" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-white/80" />
                            )}
                            {formatCurrency(Math.abs(balance), currency)}
                            <span className="text-white/60 font-normal">
                              {balance < 0 ? t("over") : t("left")}
                            </span>
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-base font-bold bg-white/12 border border-white/15 text-white/90">
                            {pct(totalSpent, totalIncome)}%
                          </span>
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-base font-medium bg-white/10 border border-white/12 text-white/55">
                          {t("no_budget_set")}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── Quick Stats Row ──────────────────────────────── */}
            <motion.div variants={itemVariants}>
              <div
                className="grid grid-cols-3 gap-3"
                data-ocid="dashboard.stats.card"
              >
                <div className="rounded-xl border border-border bg-card p-3 shadow-sm flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <ArrowUpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("income")}
                    </p>
                  </div>
                  <p className="font-display font-bold text-lg leading-tight text-blue-600 dark:text-blue-400 truncate">
                    {formatCurrency(totalIncome, currency)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3 shadow-sm flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <ArrowDownCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("expenses")}
                    </p>
                  </div>
                  <p className="font-display font-bold text-lg leading-tight text-red-600 dark:text-red-400 truncate">
                    {formatCurrency(totalSpent, currency)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3 shadow-sm flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("balance")}
                    </p>
                  </div>
                  <p
                    className={`font-display font-bold text-lg leading-tight truncate ${
                      balance >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-destructive"
                    }`}
                  >
                    {formatCurrency(balance, currency)}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* ── Spending Insights + Savings Goal ──────────── */}
            {(() => {
              const currentSpent = summary?.totalExpenses ?? 0;
              const prevSpent = prevSummary?.totalExpenses ?? 0;
              const actualSavings = totalIncome - totalSpent;
              const hasGoal = savingsGoal > 0;
              const progressPct = hasGoal
                ? Math.min(Math.round((actualSavings / savingsGoal) * 100), 100)
                : 0;
              const savingsColorClass =
                progressPct >= 80
                  ? "text-emerald-500"
                  : progressPct >= 50
                    ? "text-amber-500"
                    : "text-destructive";
              const barColor =
                progressPct >= 80
                  ? "bg-emerald-500"
                  : progressPct >= 50
                    ? "bg-amber-500"
                    : "bg-destructive";

              let insightsNode: React.ReactNode = null;
              if (!(currentSpent === 0 && prevSpent === 0)) {
                let icon: React.ReactNode;
                let message: string;
                let colorClass: string;
                let secondaryText: string;
                if (prevSpent === 0 && currentSpent > 0) {
                  icon = <TrendingUp className="h-4 w-4 text-primary" />;
                  message = "First month tracked! Keep it up.";
                  colorClass = "text-primary";
                  secondaryText = `${formatCurrency(currentSpent, currency)} spent this month`;
                } else {
                  const pctChange = Math.round(
                    ((currentSpent - prevSpent) / prevSpent) * 100,
                  );
                  if (pctChange > 0) {
                    icon = <TrendingUp className="h-4 w-4 text-destructive" />;
                    message = `You spent ${pctChange}% more this month vs last month`;
                    colorClass = "text-destructive";
                  } else if (pctChange < 0) {
                    icon = (
                      <TrendingDown className="h-4 w-4 text-emerald-500" />
                    );
                    message = `You spent ${Math.abs(pctChange)}% less this month vs last month`;
                    colorClass = "text-emerald-600 dark:text-emerald-400";
                  } else {
                    icon = <Minus className="h-4 w-4 text-muted-foreground" />;
                    message = "Same spending as last month";
                    colorClass = "text-muted-foreground";
                  }
                  secondaryText = `${formatCurrency(currentSpent, currency)} this month vs ${formatCurrency(prevSpent, currency)} last month`;
                }
                insightsNode = (
                  <div
                    className="rounded-xl border border-border bg-card shadow-sm px-4 py-3 flex flex-col gap-1 h-full"
                    data-ocid="dashboard.spending_insights.card"
                  >
                    <div className="flex items-center gap-2">
                      {icon}
                      <p className={`text-sm font-semibold ${colorClass}`}>
                        {message}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">
                      {secondaryText}
                    </p>
                  </div>
                );
              }

              return (
                <motion.div variants={itemVariants}>
                  <div className="grid grid-cols-2 gap-3 items-stretch">
                    <div className="flex flex-col">
                      {insightsNode ?? (
                        <div
                          className="rounded-xl border border-border bg-card shadow-sm px-4 py-3 flex flex-col gap-1 h-full"
                          data-ocid="dashboard.spending_insights.card"
                        >
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-semibold text-muted-foreground">
                              No data yet
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground pl-6">
                            Add expenses to see insights
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div
                        className="rounded-xl border border-border bg-card shadow-sm px-4 py-3 space-y-2 h-full"
                        data-ocid="dashboard.savings_goal.card"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            <p className="text-sm font-semibold">
                              Savings Goal
                            </p>
                          </div>
                          <button
                            type="button"
                            data-ocid="dashboard.savings_goal.edit_button"
                            onClick={() => {
                              setGoalInput(
                                savingsGoal > 0 ? savingsGoal.toString() : "",
                              );
                              setEditingGoal((v) => !v);
                            }}
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {editingGoal && (
                          <div className="flex gap-2 items-center">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="Enter savings goal..."
                              value={goalInput}
                              onChange={(e) => setGoalInput(e.target.value)}
                              data-ocid="dashboard.savings_goal.input"
                              className="flex-1 h-8 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <button
                              type="button"
                              data-ocid="dashboard.savings_goal.save_button"
                              onClick={() => {
                                const val = Number(goalInput);
                                setSavingsGoal(val);
                                localStorage.setItem(
                                  "pe_savings_goal",
                                  val.toString(),
                                );
                                setEditingGoal(false);
                              }}
                              className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          </div>
                        )}

                        {!hasGoal && !editingGoal ? (
                          <p className="text-xs text-muted-foreground">
                            Set a savings goal to track your progress
                          </p>
                        ) : hasGoal ? (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                {formatCurrency(
                                  Math.max(actualSavings, 0),
                                  currency,
                                )}{" "}
                                saved
                              </span>
                              <span
                                className={`font-semibold ${savingsColorClass}`}
                              >
                                {progressPct}% of{" "}
                                {formatCurrency(savingsGoal, currency)}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* Bill Reminders */}
            <BillReminders onQuickAdd={onQuickAddBill} />

            {/* DASHBOARD | Income */}
            <motion.div variants={itemVariants} className="px-4 mb-1">
              <div
                className="rounded-xl border border-border/50 overflow-hidden"
                style={{
                  backgroundColor:
                    "color-mix(in oklch, var(--card) 95%, transparent)",
                }}
              >
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  style={{
                    background:
                      "linear-gradient(135deg, #1a4731 0%, #0f3460 50%, #16213e 100%)",
                  }}
                  onClick={() => setIncomeOpen((o) => !o)}
                  data-ocid="dashboard.income.toggle"
                >
                  <h3 className="font-display text-base font-semibold text-white">
                    Income Source
                  </h3>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${incomeOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${incomeOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                  <div className="overflow-hidden">
                    {incomeSources.length === 0 ? (
                      <p className="px-4 pb-4 text-sm text-muted-foreground">
                        No income sources defined. Add them in Settings ›
                        Financial Settings › Income.
                      </p>
                    ) : (
                      <div className="px-4 pb-3 space-y-2">
                        {(() => {
                          const totalBudget = incomeSources.reduce(
                            (sum, s) => sum + s.monthlyBudget,
                            0,
                          );
                          return incomeSources.map((src) => {
                            const pct =
                              totalBudget > 0
                                ? Math.round(
                                    (src.monthlyBudget / totalBudget) * 100,
                                  )
                                : 0;
                            return (
                              <div
                                key={src.id}
                                className="py-1.5 space-y-1"
                                data-ocid="dashboard.income.item"
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: src.color }}
                                  />
                                  <span className="flex-1 text-sm font-medium truncate">
                                    {src.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {pct}%
                                  </span>
                                  <span className="text-sm font-semibold tabular-nums">
                                    {formatCurrency(
                                      src.monthlyBudget,
                                      currency,
                                    )}
                                  </span>
                                </div>
                                <div className="relative h-1.5 bg-muted/60 rounded-full overflow-hidden">
                                  <div
                                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                                    style={{
                                      width: `${pct}%`,
                                      backgroundColor: src.color,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          });
                        })()}
                        <div className="flex items-center justify-between rounded-lg px-3 py-2 mt-1 bg-muted/50">
                          <span className="text-xs font-bold">Total</span>
                          <span className="text-sm font-bold">
                            {formatCurrency(
                              incomeSources.reduce(
                                (s, src) => s + src.monthlyBudget,
                                0,
                              ),
                              currency,
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Category + Recent Transactions (tabbed) */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-0 pt-3 px-4">
                  <div className="flex justify-center border-b border-border">
                    <button
                      type="button"
                      onClick={() => setDashTab("category")}
                      className={`px-4 pb-2 text-sm font-medium transition-all border-b-2 -mb-px ${dashTab === "category" ? "text-primary border-primary" : "text-muted-foreground hover:text-foreground border-transparent"}`}
                      data-ocid="dashboard.category.tab"
                    >
                      {t("by_category")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDashTab("recent")}
                      className={`flex items-center gap-1.5 px-4 pb-2 text-sm font-medium transition-all border-b-2 -mb-px ${dashTab === "recent" ? "text-primary border-primary" : "text-muted-foreground hover:text-foreground border-transparent"}`}
                      data-ocid="dashboard.recent.tab"
                    >
                      {t("recent_transactions")}
                      {recentExpenses.length > 0 && (
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full font-medium">
                          {recentExpenses.length}
                        </span>
                      )}
                    </button>
                    {dashTab === "recent" && recentExpenses.length > 0 && (
                      <button
                        type="button"
                        onClick={onViewAll}
                        data-ocid="dashboard.view_all.button"
                        className="ml-2 pb-2 text-xs font-medium text-primary hover:underline self-end"
                      >
                        View All
                      </button>
                    )}
                  </div>
                </CardHeader>

                {/* By Category Tab */}
                {dashTab === "category" && (
                  <CardContent className="px-4 pb-4 pt-4 space-y-5">
                    {chartData.length === 0 && chartDataIncome.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        {t("no_expenses_this_month")}
                      </p>
                    ) : (
                      <>
                        {/* Expense / Income tabs */}
                        <div
                          className="flex justify-center gap-6 border-b border-border"
                          data-ocid="dashboard.chart.tab"
                        >
                          <button
                            type="button"
                            onClick={() => setChartTab("expense")}
                            className={`px-3 pb-2 text-xs font-medium transition-all border-b-2 ${
                              chartTab === "expense"
                                ? "text-primary border-primary"
                                : "text-muted-foreground hover:text-foreground border-transparent"
                            }`}
                            data-ocid="dashboard.expense.tab"
                          >
                            {t("expenses")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setChartTab("income")}
                            className={`px-3 pb-2 text-xs font-medium transition-all border-b-2 ${
                              chartTab === "income"
                                ? "text-primary border-primary"
                                : "text-muted-foreground hover:text-foreground border-transparent"
                            }`}
                            data-ocid="dashboard.income.tab"
                          >
                            {t("income")}
                          </button>
                        </div>

                        {/* Expense tab charts */}
                        {chartTab === "expense" && (
                          <>
                            {/* Donut Chart */}
                            {chartView === "donut" && (
                              <div className="relative">
                                <button
                                  type="button"
                                  data-ocid="dashboard.chart_toggle.toggle"
                                  onClick={() =>
                                    setChartView((v) =>
                                      v === "donut" ? "bar" : "donut",
                                    )
                                  }
                                  className="absolute top-2 right-2 z-10 h-8 w-8 flex items-center justify-center rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                                  aria-label={t("switch_to_bar_chart")}
                                >
                                  <BarChart2 className="h-4 w-4" />
                                </button>
                                <div
                                  data-ocid="dashboard.donut_chart.canvas_target"
                                  style={{ height: 220 }}
                                >
                                  <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                  >
                                    <PieChart>
                                      <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={58}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        dataKey="value"
                                      >
                                        {chartData.map((entry) => (
                                          <Cell
                                            key={`cell-${entry.name}`}
                                            fill={entry.color}
                                          />
                                        ))}
                                      </Pie>
                                      <Tooltip
                                        formatter={(value: number) =>
                                          formatCurrency(value, currency)
                                        }
                                        contentStyle={{
                                          borderRadius: 8,
                                          fontSize: 12,
                                          border: "1px solid var(--border)",
                                          background: "var(--card)",
                                          color: "var(--foreground)",
                                        }}
                                      />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            )}

                            {/* Vertical Bar Chart - Expense */}
                            {chartView === "bar" && (
                              <div className="relative">
                                <button
                                  type="button"
                                  data-ocid="dashboard.chart_toggle.toggle"
                                  onClick={() =>
                                    setChartView((v) =>
                                      v === "donut" ? "bar" : "donut",
                                    )
                                  }
                                  className="absolute top-2 right-2 z-10 h-8 w-8 flex items-center justify-center rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                                  aria-label={t("switch_to_donut_chart")}
                                >
                                  <PieChartIcon className="h-4 w-4" />
                                </button>
                                <div
                                  data-ocid="dashboard.bar_chart.canvas_target"
                                  style={{
                                    height: Math.max(
                                      chartData.length * 50,
                                      200,
                                    ),
                                  }}
                                >
                                  <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                  >
                                    <BarChart
                                      data={chartData}
                                      margin={{
                                        top: 8,
                                        right: 8,
                                        left: 0,
                                        bottom: 40,
                                      }}
                                    >
                                      <XAxis
                                        dataKey="name"
                                        tick={{
                                          fontSize: 10,
                                          fill: isDark ? "#e2e8f0" : "#334155",
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                        angle={-35}
                                        textAnchor="end"
                                        interval={0}
                                      />
                                      <YAxis
                                        tick={{
                                          fontSize: 10,
                                          fill: isDark ? "#e2e8f0" : "#334155",
                                        }}
                                        tickFormatter={(v) =>
                                          formatCurrency(v, currency)
                                        }
                                        axisLine={false}
                                        tickLine={false}
                                        width={60}
                                      />
                                      <Tooltip
                                        formatter={(value: number) =>
                                          formatCurrency(value, currency)
                                        }
                                        contentStyle={{
                                          borderRadius: 8,
                                          fontSize: 12,
                                          border: "1px solid var(--border)",
                                          background: "var(--card)",
                                          color: "var(--foreground)",
                                        }}
                                      />
                                      <Bar
                                        dataKey="value"
                                        radius={[4, 4, 0, 0]}
                                      >
                                        {chartData.map((entry) => (
                                          <Cell
                                            key={`bar-${entry.name}`}
                                            fill={entry.color}
                                          />
                                        ))}
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {/* Income tab - Donut + Horizontal Bar Chart */}
                        {chartTab === "income" && (
                          <div data-ocid="dashboard.income_chart.canvas_target">
                            {chartDataIncome.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                                <PieChartIcon className="h-8 w-8 opacity-30" />
                                <p className="text-sm">
                                  {t("no_income_recorded")}
                                </p>
                              </div>
                            ) : (
                              <>
                                {/* Donut */}
                                {chartViewIncome === "donut" && (
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setChartViewIncome("vertical");
                                      }}
                                      className="absolute top-2 right-2 z-20 h-8 w-8 flex items-center justify-center rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                                      aria-label="Switch to vertical bar chart"
                                    >
                                      <BarChart2 className="h-4 w-4" />
                                    </button>
                                    <div style={{ height: 220 }}>
                                      <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                      >
                                        <PieChart>
                                          <Pie
                                            data={chartDataIncome}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={58}
                                            outerRadius={90}
                                            paddingAngle={2}
                                            dataKey="value"
                                          >
                                            {chartDataIncome.map((entry) => (
                                              <Cell
                                                key={`income-cell-${entry.name}`}
                                                fill={entry.color}
                                              />
                                            ))}
                                          </Pie>
                                          <Tooltip
                                            formatter={(value: number) =>
                                              formatCurrency(value, currency)
                                            }
                                            contentStyle={{
                                              borderRadius: 8,
                                              fontSize: 12,
                                              border: "1px solid var(--border)",
                                              background: "var(--card)",
                                              color: "var(--foreground)",
                                            }}
                                          />
                                        </PieChart>
                                      </ResponsiveContainer>
                                    </div>
                                  </div>
                                )}

                                {/* Vertical Bar */}
                                {chartViewIncome === "vertical" && (
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setChartViewIncome("horizontal");
                                      }}
                                      className="absolute top-2 right-2 z-20 h-8 w-8 flex items-center justify-center rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                                      aria-label="Switch to horizontal bar chart"
                                    >
                                      <AlignLeft className="h-4 w-4" />
                                    </button>
                                    <div
                                      style={{
                                        height: Math.max(
                                          chartDataIncome.length * 50 + 60,
                                          220,
                                        ),
                                      }}
                                    >
                                      <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                      >
                                        <BarChart
                                          data={chartDataIncome}
                                          margin={{
                                            top: 8,
                                            right: 16,
                                            left: 0,
                                            bottom: 40,
                                          }}
                                        >
                                          <XAxis
                                            dataKey="name"
                                            tick={{
                                              fontSize: 10,
                                              fill: isDark
                                                ? "#e2e8f0"
                                                : "#334155",
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                            interval={0}
                                            angle={-30}
                                            textAnchor="end"
                                          />
                                          <YAxis
                                            tick={{
                                              fontSize: 10,
                                              fill: isDark
                                                ? "#e2e8f0"
                                                : "#334155",
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(v) =>
                                              formatCurrency(v, currency)
                                            }
                                            width={60}
                                          />
                                          <Tooltip
                                            formatter={(value: number) =>
                                              formatCurrency(value, currency)
                                            }
                                            contentStyle={{
                                              borderRadius: 8,
                                              fontSize: 12,
                                              border: "1px solid var(--border)",
                                              background: "var(--card)",
                                              color: "var(--foreground)",
                                            }}
                                          />
                                          <Bar
                                            dataKey="value"
                                            radius={[4, 4, 0, 0]}
                                          >
                                            {chartDataIncome.map((entry) => (
                                              <Cell
                                                key={`income-vbar-${entry.name}`}
                                                fill={entry.color}
                                              />
                                            ))}
                                          </Bar>
                                        </BarChart>
                                      </ResponsiveContainer>
                                    </div>
                                  </div>
                                )}

                                {/* Horizontal Bar */}
                                {chartViewIncome === "horizontal" && (
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setChartViewIncome("donut");
                                      }}
                                      className="absolute top-2 right-2 z-20 h-8 w-8 flex items-center justify-center rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                                      aria-label="Switch to donut chart"
                                    >
                                      <PieChartIcon className="h-4 w-4" />
                                    </button>
                                    <div
                                      style={{
                                        height: Math.max(
                                          chartDataIncome.length * 44,
                                          200,
                                        ),
                                      }}
                                    >
                                      <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                      >
                                        <BarChart
                                          data={chartDataIncome}
                                          layout="vertical"
                                          margin={{
                                            top: 8,
                                            right: 16,
                                            left: 0,
                                            bottom: 8,
                                          }}
                                        >
                                          <XAxis
                                            type="number"
                                            tick={{
                                              fontSize: 10,
                                              fill: isDark
                                                ? "#e2e8f0"
                                                : "#334155",
                                            }}
                                            tickFormatter={(v) =>
                                              formatCurrency(v, currency)
                                            }
                                            axisLine={false}
                                            tickLine={false}
                                            width={60}
                                          />
                                          <YAxis
                                            type="category"
                                            dataKey="name"
                                            tick={{
                                              fontSize: 10,
                                              fill: isDark
                                                ? "#e2e8f0"
                                                : "#334155",
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={80}
                                          />
                                          <Tooltip
                                            formatter={(value: number) =>
                                              formatCurrency(value, currency)
                                            }
                                            contentStyle={{
                                              borderRadius: 8,
                                              fontSize: 12,
                                              border: "1px solid var(--border)",
                                              background: "var(--card)",
                                              color: "var(--foreground)",
                                            }}
                                          />
                                          <Bar
                                            dataKey="value"
                                            radius={[0, 4, 4, 0]}
                                          >
                                            {chartDataIncome.map((entry) => (
                                              <Cell
                                                key={`income-hbar-${entry.name}`}
                                                fill={entry.color}
                                              />
                                            ))}
                                          </Bar>
                                        </BarChart>
                                      </ResponsiveContainer>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        <Separator />

                        {/* Category list with progress bars */}
                        <div className="space-y-3">
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
                                <div
                                  key={item.categoryId}
                                  className="space-y-1.5"
                                >
                                  <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                        style={{
                                          backgroundColor:
                                            cat?.color ?? "#B0B0B0",
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
                                        backgroundColor:
                                          cat?.color ?? "#B0B0B0",
                                      }}
                                    />
                                    {budget > 0 && item.total > budget && (
                                      <div className="absolute right-0 top-0 w-0.5 h-full bg-destructive" />
                                    )}
                                  </div>
                                  {budget > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      {t("budget_of", {
                                        spent: formatCurrency(
                                          item.total,
                                          currency,
                                        ),
                                        budget: formatCurrency(
                                          budget,
                                          currency,
                                        ),
                                      })}
                                      {item.total > budget && (
                                        <span className="text-destructive ml-1 font-medium">
                                          {t("over_budget")}
                                        </span>
                                      )}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </>
                    )}
                  </CardContent>
                )}

                {/* Recent Transactions Tab */}
                {dashTab === "recent" && (
                  <CardContent className="px-0 pb-2 pt-0">
                    {recentExpenses.length === 0 ? (
                      <p
                        className="text-muted-foreground text-sm text-center py-6 px-4"
                        data-ocid="expense.empty_state"
                      >
                        {t("no_expenses_this_month")}
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
                                  <div className="flex items-center gap-1 flex-wrap min-w-0">
                                    <span
                                      className="text-xs font-medium truncate"
                                      style={{ color: cat?.color ?? "#666" }}
                                    >
                                      {cat?.name ?? t("unknown_category")}
                                    </span>
                                    {expense.note && (
                                      <>
                                        <span className="text-xs text-muted-foreground/50">
                                          |
                                        </span>
                                        <span className="text-xs text-muted-foreground truncate">
                                          {expense.note}
                                        </span>
                                      </>
                                    )}
                                  </div>
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
                )}
              </Card>
            </motion.div>
          </motion.div>
        )}
      </div>

      <ThemePickerDialog
        open={themeDialogOpen}
        onOpenChange={setThemeDialogOpen}
        selectedThemeId={themeId}
        onSelect={setThemeId}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5" data-ocid="dashboard.loading_state">
      <Skeleton className="h-36 rounded-2xl w-full" />
      <Skeleton className="h-16 rounded-xl w-full" />
      <Skeleton className="h-72 rounded-2xl w-full" />
      <Skeleton className="h-64 rounded-2xl w-full" />
    </div>
  );
}
