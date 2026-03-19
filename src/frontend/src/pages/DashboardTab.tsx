import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  PieChart as PieChartIcon,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
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

import ThemePickerDialog from "../components/ThemePickerDialog";
import type { CardThemeId } from "../hooks/useCardTheme";
import {
  useAppSettings,
  useCategories,
  useExpensesByMonth,
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
}

export default function DashboardTab({
  onEditExpense,
  onViewAll,
  month,
  setMonth,
  theme,
  themeId,
  setThemeId,
}: DashboardTabProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [chartView, setChartView] = useState<"donut" | "bar">("donut");
  const [chartViewIncome, setChartViewIncome] = useState<
    "donut" | "horizontal"
  >("donut");
  const [chartTab, setChartTab] = useState<"expense" | "income">("expense");
  const { t } = useLanguage();

  const { data: expenses = [], isLoading: loadingExpenses } =
    useExpensesByMonth(month);
  const { data: summary, isLoading: loadingSummary } = useMonthlySummary(month);
  const { data: categories = [] } = useCategories();
  const { data: settings } = useAppSettings();
  const currency = settings?.currency ?? "USD";

  const [themeDialogOpen, setThemeDialogOpen] = useState(false);

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
    const incomeExpenses = expenses.filter((e) => (e as any).isIncome === true);
    const map = new Map<
      string,
      { name: string; value: number; color: string }
    >();
    for (const e of incomeExpenses) {
      const cat = getCategoryById(categories, e.categoryId);
      const key = e.categoryId;
      if (map.has(key)) {
        map.get(key)!.value += e.amount;
      } else {
        map.set(key, {
          name: cat?.name ?? "Other",
          value: e.amount,
          color: cat?.color ?? "#10b981",
        });
      }
    }
    return [...map.values()].sort((a, b) => b.value - a.value);
  }, [expenses, categories]);

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

            {/* Tappable month picker trigger */}
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  data-ocid="dashboard.month_picker.open_modal_button"
                  className="flex items-center gap-1 font-display text-xl font-bold tracking-tight hover:text-primary transition-colors group"
                >
                  {formatMonthYear(month)}
                  <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mt-0.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-72 p-3"
                align="start"
                data-ocid="dashboard.month_picker.popover"
              >
                {/* Year navigation */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => setPickerYear((y) => y - 1)}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    aria-label="Previous year"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="font-semibold text-sm">{pickerYear}</span>
                  <button
                    type="button"
                    onClick={() => setPickerYear((y) => y + 1)}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    aria-label="Next year"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                {/* Month grid */}
                <div className="grid grid-cols-3 gap-1.5">
                  {MONTH_KEYS.map((key, idx) => {
                    const isSelected =
                      idx === selectedMonthIdx && pickerYear === selectedYear;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => selectMonth(idx)}
                        className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        {t(key)}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
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
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest bg-white/15 text-white/90 border border-white/20 backdrop-blur-sm">
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
                      <p className="font-display text-5xl font-bold tracking-tight leading-none text-white">
                        {formatCurrency(totalSpent, currency)}
                      </p>
                      {totalIncome > 0 && (
                        <p className="text-white/60 text-xs mt-2 font-medium">
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
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/12 border border-white/15 text-white/90">
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
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-white/12 border border-white/15 text-white/90">
                            {pct(totalSpent, totalIncome)}%
                          </span>
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/12 text-white/55">
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
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("income")}
                  </p>
                  <p className="font-display font-bold text-base leading-tight text-foreground truncate">
                    {formatCurrency(totalIncome, currency)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3 shadow-sm flex flex-col gap-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("expenses")}
                  </p>
                  <p className="font-display font-bold text-base leading-tight text-foreground truncate">
                    {formatCurrency(totalSpent, currency)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3 shadow-sm flex flex-col gap-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("balance")}
                  </p>
                  <p
                    className={`font-display font-bold text-base leading-tight truncate ${
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

            {/* Category breakdown */}
            {(chartData.length > 0 || chartDataIncome.length > 0) && (
              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-0 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2 flex-1">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {t("dashboard_label")}
                        </p>
                        <span className="text-xs text-muted-foreground/50">
                          |
                        </span>
                        <h3 className="font-display text-base font-semibold">
                          {t("by_category")}
                        </h3>
                      </div>
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="px-4 pb-4 pt-4 space-y-5">
                    {/* Expense / Income tabs */}
                    <div
                      className="flex gap-1 p-1 rounded-lg bg-muted"
                      data-ocid="dashboard.chart.tab"
                    >
                      <button
                        type="button"
                        onClick={() => setChartTab("expense")}
                        className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          chartTab === "expense"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        data-ocid="dashboard.expense.tab"
                      >
                        {t("expenses")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartTab("income")}
                        className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          chartTab === "income"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
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
                              <ResponsiveContainer width="100%" height="100%">
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
                                height: Math.max(chartData.length * 50, 200),
                              }}
                            >
                              <ResponsiveContainer width="100%" height="100%">
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
                                      fill: "var(--foreground)",
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
                                      fill: "var(--foreground)",
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
                                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
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
                            <p className="text-sm">{t("no_income_recorded")}</p>
                          </div>
                        ) : (
                          <>
                            {/* Donut */}
                            {chartViewIncome === "donut" && (
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setChartViewIncome("horizontal")
                                  }
                                  className="absolute top-2 right-2 z-10 h-8 w-8 flex items-center justify-center rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                                  aria-label="Switch to bar chart"
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

                            {/* Horizontal Bar */}
                            {chartViewIncome === "horizontal" && (
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setChartViewIncome("donut")}
                                  className="absolute top-2 right-2 z-10 h-8 w-8 flex items-center justify-center rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
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
                                          fill: "var(--foreground)",
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
                                          fill: "var(--foreground)",
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
                                  {t("budget_of", {
                                    spent: formatCurrency(item.total, currency),
                                    budget: formatCurrency(budget, currency),
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
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Recent transactions */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-0 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2 flex-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {t("dashboard_label")}
                      </p>
                      <span className="text-xs text-muted-foreground/50">
                        |
                      </span>
                      <h3 className="font-display text-base font-semibold">
                        {t("recent_transactions")}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {recentExpenses.length > 0 && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-medium">
                          {recentExpenses.length}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={onViewAll}
                        data-ocid="dashboard.view_all.button"
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        View All
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <Separator />
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
                                    {cat?.name ?? t("unknown_category")}
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
