import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import AppHeader from "../components/AppHeader";
import ThemePickerDialog from "../components/ThemePickerDialog";
import { useCardTheme } from "../hooks/useCardTheme";
import {
  useAppSettings,
  useCategories,
  useExpensesByMonth,
  useMonthlySummary,
} from "../hooks/useQueries";
import { getCategoryById } from "../utils/categories";
import {
  nextMonth as _nextMonth,
  prevMonth as _prevMonth,
  currentMonth,
  formatCurrency,
  formatDateShort,
  formatMonthYear,
  pct,
} from "../utils/format";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface DashboardTabProps {
  onEditExpense: (expense: Expense) => void;
}

export default function DashboardTab({ onEditExpense }: DashboardTabProps) {
  const [month, setMonth] = useState(currentMonth);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [chartView, setChartView] = useState<"donut" | "bar">("donut");

  const { data: expenses = [], isLoading: loadingExpenses } =
    useExpensesByMonth(month);
  const { data: summary, isLoading: loadingSummary } = useMonthlySummary(month);
  const { data: categories = [] } = useCategories();
  const { data: settings } = useAppSettings();
  const currency = settings?.currency ?? "USD";

  const { theme, themeId, setThemeId } = useCardTheme();
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

  // Month picker helpers
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

  // Chart data
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

  return (
    <div className="space-y-5 pb-24">
      <AppHeader />

      <div className="px-4 space-y-5">
        {/* Sub-header: Monthly Overview with month picker */}
        <div>
          <div className="flex items-baseline gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Monthly Overview
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
                  {MONTH_NAMES.map((name, idx) => {
                    const isSelected =
                      idx === selectedMonthIdx && pickerYear === selectedYear;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => selectMonth(idx)}
                        className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
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
            {/* ── Total Spent card ─────────────────────────────── */}
            <motion.div variants={itemVariants}>
              <Card
                className="relative overflow-hidden border-0 shadow-xl rounded-2xl"
                style={{ background: theme.gradient }}
              >
                {/* Decorative glowing orb */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-8 -right-8 w-48 h-48 rounded-full opacity-25"
                  style={{
                    background: `radial-gradient(circle, ${theme.orb} 0%, transparent 70%)`,
                    filter: "blur(18px)",
                  }}
                />
                {/* Subtle top-edge highlight stripe */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-40"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${theme.highlight}, transparent)`,
                  }}
                />

                <CardContent className="relative pt-4 pb-5 px-5">
                  {/* ── Row 1: pill label  +  three-dots ── */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest bg-white/15 text-white/90 border border-white/20 backdrop-blur-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/70 inline-block" />
                      Total Spent
                    </span>

                    <button
                      type="button"
                      data-ocid="total_spent.open_modal_button"
                      onClick={() => setThemeDialogOpen(true)}
                      className="p-1.5 rounded-full bg-white/15 border border-white/20 text-white/80 hover:bg-white/25 transition-colors"
                      aria-label="Change card theme"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>

                  {/* ── Row 2: hero amount  +  wallet icon ── */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-5xl font-bold tracking-tight leading-none text-white">
                        {formatCurrency(totalSpent, currency)}
                      </p>
                      {totalIncome > 0 && (
                        <p className="text-white/60 text-xs mt-2 font-medium">
                          of {formatCurrency(totalIncome, currency)} income
                        </p>
                      )}
                    </div>

                    {/* Wallet icon – frosted glow circle */}
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

                  {/* ── Row 3: progress bar (always visible) ── */}
                  <div className="mt-5">
                    <div className="relative h-2 bg-white/15 rounded-full overflow-hidden">
                      {/* Filled portion – always white so it's visible on every theme */}
                      <div
                        className="absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${spentPct > 0 ? spentPct : 3}%`,
                          background: "rgba(255,255,255,0.85)",
                        }}
                      />
                      {/* Shimmer overlay – always running */}
                      <div
                        aria-hidden="true"
                        className="absolute top-0 left-0 h-full w-1/4 animate-shimmer"
                        style={{
                          background:
                            "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
                        }}
                      />
                    </div>

                    {/* ── Row 4: bottom chips (always visible) ── */}
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
                              {balance < 0 ? "over" : "left"}
                            </span>
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-white/12 border border-white/15 text-white/90">
                            {pct(totalSpent, totalIncome)}%
                          </span>
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/12 text-white/55">
                          No budget set
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
                {/* Income */}
                <div className="rounded-xl border border-border bg-card p-3 shadow-sm flex flex-col gap-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Income
                  </p>
                  <p className="font-display font-bold text-base leading-tight text-foreground truncate">
                    {formatCurrency(totalIncome, currency)}
                  </p>
                </div>
                {/* Expenses */}
                <div className="rounded-xl border border-border bg-card p-3 shadow-sm flex flex-col gap-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Expenses
                  </p>
                  <p className="font-display font-bold text-base leading-tight text-foreground truncate">
                    {formatCurrency(totalSpent, currency)}
                  </p>
                </div>
                {/* Balance */}
                <div className="rounded-xl border border-border bg-card p-3 shadow-sm flex flex-col gap-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Balance
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
            {chartData.length > 0 && (
              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-0 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-display text-base font-semibold">
                        By Category
                      </CardTitle>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">
                          Amount
                        </span>
                        <button
                          type="button"
                          data-ocid="dashboard.chart_toggle.toggle"
                          onClick={() =>
                            setChartView((v) =>
                              v === "donut" ? "bar" : "donut",
                            )
                          }
                          className="h-8 w-8 flex items-center justify-center rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                          aria-label={`Switch to ${
                            chartView === "donut" ? "bar" : "donut"
                          } chart`}
                        >
                          {chartView === "donut" ? (
                            <BarChart2 className="h-4 w-4" />
                          ) : (
                            <PieChartIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="px-4 pb-4 pt-4 space-y-5">
                    {/* ── Donut Chart ── */}
                    {chartView === "donut" && (
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
                                color: "var(--card-foreground)",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* ── Horizontal Bar Chart ── */}
                    {chartView === "bar" && (
                      <div
                        data-ocid="dashboard.bar_chart.canvas_target"
                        style={{
                          height: Math.max(chartData.length * 44, 100),
                        }}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                          >
                            <XAxis
                              type="number"
                              tick={{ fontSize: 10 }}
                              tickFormatter={(v) => formatCurrency(v, currency)}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              type="category"
                              dataKey="name"
                              width={72}
                              tick={{ fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
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
                                color: "var(--card-foreground)",
                              }}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
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
                    )}

                    <Separator />

                    {/* ── Category list with progress bars ── */}
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
                    <CardTitle className="font-display text-base font-semibold">
                      Recent Transactions
                    </CardTitle>
                    <span className="text-xs font-medium text-muted-foreground">
                      Amount
                    </span>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="px-0 pb-2 pt-0">
                  {recentExpenses.length === 0 ? (
                    <p
                      className="text-muted-foreground text-sm text-center py-6 px-4"
                      data-ocid="expense.empty_state"
                    >
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
