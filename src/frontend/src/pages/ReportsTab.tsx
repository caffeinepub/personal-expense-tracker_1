import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Minus,
  Pencil,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

import {
  useAppSettings,
  useCategories,
  useMonthlyIncome,
  useMonthlySummary,
  useSetMonthlyIncome,
} from "../hooks/useQueries";
import { useLanguage } from "../i18n/LanguageContext";
import { getCategoryById } from "../utils/categories";
import {
  formatCurrency,
  formatMonthYear,
  isCurrentMonth,
  nextMonth,
  pct,
  prevMonth,
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

export default function ReportsTab({
  month,
  setMonth,
  onBack,
}: { month: string; setMonth: (m: string) => void; onBack: () => void }) {
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const { t } = useLanguage();

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

  const savingsRate =
    totalIncome > 0
      ? (((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1)
      : null;

  const selectedYear = Number.parseInt(month.split("-")[0], 10);
  const selectedMonthIdx = Number.parseInt(month.split("-")[1], 10) - 1;

  function selectMonth(m: number) {
    const mm = String(m + 1).padStart(2, "0");
    setMonth(`${pickerYear}-${mm}`);
    setPickerOpen(false);
  }

  async function handleSaveIncome() {
    const amount = Number.parseFloat(incomeInput);
    if (Number.isNaN(amount) || amount < 0) {
      toast.error(t("please_enter_valid_income"));
      return;
    }
    try {
      await setIncome.mutateAsync({ month, amount });
      toast.success(t("income_updated"));
      setEditingIncome(false);
    } catch {
      toast.error(t("failed_update_income"));
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
    <div className="space-y-5 pb-28">
      <div className="px-4 space-y-5">
        {/* Section label */}
        <div>
          <div className="flex items-baseline gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("monthly_report")}
            </p>
            <span className="text-xs text-muted-foreground/50">|</span>
            <h2 className="font-display text-xl font-bold tracking-tight">
              {formatMonthYear(month)}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("monthly_report_desc")}
          </p>
        </div>

        {/* Back + Month selector row */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="flex items-center gap-1 h-9 px-3 flex-shrink-0 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg border border-border"
            onClick={onBack}
            data-ocid="reports.back.button"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs font-medium">{t("back")}</span>
          </Button>
          <div className="flex items-center justify-between bg-card border border-border rounded-xl px-3 py-2 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMonth(prevMonth(month))}
              aria-label={t("prev_month")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  data-ocid="reports.month.select"
                  className="flex items-center gap-1 font-display font-semibold text-sm hover:text-primary transition-colors group"
                >
                  {formatMonthYear(month)}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-72 p-3"
                align="center"
                data-ocid="reports.month_picker.popover"
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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMonth(nextMonth(month))}
              disabled={isCurrentMonth(month)}
              aria-label={t("next_month")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
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
                        {t("monthly_income")}
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
                        {totalIncome > 0 ? t("edit") : t("set_income")}
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
                  label={t("income")}
                  value={formatCurrency(totalIncome, currency)}
                  icon={<TrendingUp className="h-4 w-4" />}
                  color="text-positive"
                />
                <SummaryCard
                  label={t("expenses")}
                  value={formatCurrency(totalExpenses, currency)}
                  icon={<TrendingDown className="h-4 w-4" />}
                  color="text-negative"
                />
                <SummaryCard
                  label={t("balance")}
                  value={formatCurrency(Math.abs(balance), currency)}
                  icon={<Minus className="h-4 w-4" />}
                  color={isOver ? "text-negative" : "text-positive"}
                  prefix={isOver ? "-" : "+"}
                />
              </div>
            </motion.div>

            {/* Savings rate chip */}
            <motion.div variants={itemVariants}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                  savingsRate === null
                    ? "bg-muted/40 border-border"
                    : Number(savingsRate) >= 0
                      ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40"
                      : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800/40"
                }`}
                data-ocid="reports.savings.card"
              >
                <div
                  className={`p-2 rounded-lg ${
                    savingsRate === null
                      ? "bg-muted"
                      : Number(savingsRate) >= 0
                        ? "bg-emerald-100 dark:bg-emerald-900/40"
                        : "bg-red-100 dark:bg-red-900/40"
                  }`}
                >
                  <PiggyBank
                    className={`h-4 w-4 ${
                      savingsRate === null
                        ? "text-muted-foreground"
                        : Number(savingsRate) >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {t("savings_rate")}
                  </p>
                  {savingsRate === null ? (
                    <p className="text-sm font-medium text-muted-foreground mt-0.5">
                      {t("set_income_to_see")}
                    </p>
                  ) : Number(savingsRate) >= 0 ? (
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mt-0.5">
                      {t("saved_pct", { pct: savingsRate })}
                    </p>
                  ) : (
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400 mt-0.5">
                      {t("over_budget_by_pct", {
                        pct: Math.abs(Number(savingsRate)).toFixed(1),
                      })}
                    </p>
                  )}
                </div>
                {savingsRate !== null && (
                  <span
                    className={`text-lg font-bold font-display ${
                      Number(savingsRate) >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {savingsRate}%
                  </span>
                )}
              </div>
            </motion.div>

            {/* Category breakdown */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-0 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2 flex-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {t("reports_label")}
                      </p>
                      <span className="text-xs text-muted-foreground/50">
                        |
                      </span>
                      <h3 className="font-display text-base font-semibold">
                        {t("category_breakdown")}
                      </h3>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {t("amount")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-3 space-y-4">
                  {(summary?.categoryBreakdown?.length ?? 0) === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-6">
                      {t("no_expenses_month")}
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
                                    ["--progress-color" as string]: overBudget
                                      ? "oklch(var(--destructive))"
                                      : (cat?.color ?? "#B0B0B0"),
                                  }}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>
                                    {t("budget_colon", {
                                      amount: formatCurrency(budget, currency),
                                    })}
                                  </span>
                                  {overBudget ? (
                                    <span className="text-destructive font-medium">
                                      {t("over_by", {
                                        amount: formatCurrency(
                                          item.total - budget,
                                          currency,
                                        ),
                                      })}
                                    </span>
                                  ) : (
                                    <span>
                                      {t("pct_used", {
                                        pct: String(budgetPct),
                                      })}
                                    </span>
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

            {/* End-of-report footer */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-border" />
                <p className="text-xs text-muted-foreground/60 font-medium whitespace-nowrap">
                  {t("end_of_report", { month: formatMonthYear(month) })}
                </p>
                <div className="flex-1 h-px bg-border" />
              </div>
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
      <Skeleton className="h-12 rounded-xl w-full" />
      <Skeleton className="h-48 rounded-xl w-full" />
    </div>
  );
}
