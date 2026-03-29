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
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  useAppSettings,
  useCategories,
  useExpenses,
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

type PeriodType = "monthly" | "quarterly" | "yearly";

const GREEN_GRADIENT =
  "linear-gradient(135deg, oklch(0.52 0.17 145), oklch(0.42 0.15 145))";

export default function ReportsTab({
  month,
  setMonth,
  onBack,
}: { month: string; setMonth: (m: string) => void; onBack: () => void }) {
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [quarterPickerOpen, setQuarterPickerOpen] = useState(false);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [periodType, setPeriodType] = useState<PeriodType>("monthly");
  const { t } = useLanguage();

  const { data: summary, isLoading } = useMonthlySummary(month);
  const { data: incomeData } = useMonthlyIncome(month);
  const { data: categories = [] } = useCategories();
  const { data: settings } = useAppSettings();
  const currency = settings?.currency ?? "USD";

  const setIncome = useSetMonthlyIncome();
  const { data: allExpenses = [] } = useExpenses();

  const selectedYear = Number.parseInt(month.split("-")[0], 10);
  const selectedMonthIdx = Number.parseInt(month.split("-")[1], 10) - 1;
  const currentQ = Math.floor(selectedMonthIdx / 3) + 1;

  // Compute which months are in the selected period
  const periodMonths = useMemo(() => {
    if (periodType === "quarterly") {
      const startM = (currentQ - 1) * 3 + 1;
      return [0, 1, 2].map(
        (i) => `${selectedYear}-${String(startM + i).padStart(2, "0")}`,
      );
    }
    if (periodType === "yearly") {
      return Array.from(
        { length: 12 },
        (_, i) => `${selectedYear}-${String(i + 1).padStart(2, "0")}`,
      );
    }
    return [month];
  }, [periodType, currentQ, selectedYear, month]);

  // Period-aggregated category breakdown (for quarterly/yearly)
  const periodCategoryBreakdown = useMemo(() => {
    if (periodType === "monthly") return null;
    const filtered = allExpenses.filter((e) =>
      periodMonths.includes(e.date.substring(0, 7)),
    );
    const map = new Map<string, { total: number; categoryName: string }>();
    for (const e of filtered) {
      const existing = map.get(e.categoryId);
      const cat = categories.find((c) => c.id === e.categoryId);
      const name = cat?.name ?? e.categoryId;
      if (existing) {
        existing.total += Number(e.amount);
      } else {
        map.set(e.categoryId, { total: Number(e.amount), categoryName: name });
      }
    }
    return Array.from(map.entries()).map(([categoryId, v]) => ({
      categoryId,
      total: v.total,
      categoryName: v.categoryName,
    }));
  }, [periodType, periodMonths, allExpenses, categories]);

  const periodTotalExpenses = useMemo(() => {
    if (periodType === "monthly") return summary?.totalExpenses ?? 0;
    return (periodCategoryBreakdown ?? []).reduce((s, i) => s + i.total, 0);
  }, [periodType, periodCategoryBreakdown, summary]);

  const totalExpenses = periodTotalExpenses;
  const totalIncome = summary?.totalIncome ?? incomeData?.amount ?? 0;
  const balance = totalIncome - totalExpenses;
  const isOver = balance < 0;

  const savingsRate =
    totalIncome > 0 && periodType === "monthly"
      ? (((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1)
      : null;

  // Use period breakdown for quarterly/yearly, otherwise use summary breakdown
  const displayBreakdown =
    periodType !== "monthly"
      ? (periodCategoryBreakdown ?? [])
      : (summary?.categoryBreakdown ?? []);

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

  // Period nav styles
  function getNavStyle(type: PeriodType) {
    return periodType === type ? { background: GREEN_GRADIENT } : {};
  }
  function getNavBorderClass(type: PeriodType) {
    return periodType === type ? "border-transparent" : "border-border";
  }
  function getLabelClass(type: PeriodType) {
    return periodType === type ? "text-white" : "text-muted-foreground";
  }
  // Period label for header
  const periodLabel =
    periodType === "quarterly"
      ? `Q${currentQ} ${selectedYear}`
      : periodType === "yearly"
        ? `${selectedYear}`
        : formatMonthYear(month);

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
              {periodLabel}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("monthly_report_desc")}
          </p>
        </div>

        {/* Back + Monthly / Quarterly / Yearly navigator row */}
        <div className="flex items-center gap-2 flex-nowrap overflow-x-auto pb-1">
          <Button
            size="icon"
            className="h-8 w-8 flex-shrink-0 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg border border-border"
            onClick={onBack}
            data-ocid="reports.back.button"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {/* Monthly */}
          <div className="flex flex-col items-center flex-1 min-w-[110px]">
            <span
              className={`text-[10px] font-medium mb-0.5 uppercase tracking-wide ${getLabelClass("monthly")}`}
            >
              Monthly
            </span>
            <div
              className={`flex items-center w-full justify-between rounded-lg px-1.5 py-1.5 h-9 border ${getNavBorderClass("monthly")}`}
              style={getNavStyle("monthly")}
            >
              <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 flex-shrink-0 ${periodType === "monthly" ? "text-white hover:text-white hover:bg-white/20" : ""}`}
                onClick={() => {
                  setPeriodType("monthly");
                  setMonth(prevMonth(month));
                }}
                aria-label={t("prev_month")}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    data-ocid="reports.month.select"
                    onClick={() => setPeriodType("monthly")}
                    className={`flex items-center gap-0.5 font-semibold text-xs hover:opacity-80 transition-colors flex-1 justify-center ${periodType === "monthly" ? "text-white" : "hover:text-primary"}`}
                  >
                    {formatMonthYear(month)}
                    <ChevronDown className="h-3 w-3 opacity-70" />
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
                className={`h-6 w-6 flex-shrink-0 ${periodType === "monthly" ? "text-white hover:text-white hover:bg-white/20" : ""}`}
                onClick={() => {
                  setPeriodType("monthly");
                  setMonth(nextMonth(month));
                }}
                disabled={isCurrentMonth(month)}
                aria-label={t("next_month")}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Quarterly */}
          {(() => {
            const nowYear = new Date().getFullYear();
            const nowQ = Math.floor(new Date().getMonth() / 3) + 1;
            const isLastQ = selectedYear === nowYear && currentQ === nowQ;
            function goToQuarter(year: number, q: number) {
              const startMonth = String((q - 1) * 3 + 1).padStart(2, "0");
              setMonth(`${year}-${startMonth}`);
            }
            function prevQ() {
              setPeriodType("quarterly");
              if (currentQ === 1) goToQuarter(selectedYear - 1, 4);
              else goToQuarter(selectedYear, currentQ - 1);
            }
            function nextQ() {
              setPeriodType("quarterly");
              if (currentQ === 4) goToQuarter(selectedYear + 1, 1);
              else goToQuarter(selectedYear, currentQ + 1);
            }
            return (
              <div className="flex flex-col items-center flex-1 min-w-[110px]">
                <span
                  className={`text-[10px] font-medium mb-0.5 uppercase tracking-wide ${getLabelClass("quarterly")}`}
                >
                  Quarterly
                </span>
                <div
                  className={`flex items-center w-full justify-between rounded-lg px-1.5 py-1.5 h-9 border ${getNavBorderClass("quarterly")}`}
                  style={getNavStyle("quarterly")}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 flex-shrink-0 ${periodType === "quarterly" ? "text-white hover:text-white hover:bg-white/20" : ""}`}
                    onClick={prevQ}
                    aria-label="Previous quarter"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Popover
                    open={quarterPickerOpen}
                    onOpenChange={setQuarterPickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        data-ocid="reports.quarter.select"
                        onClick={() => setPeriodType("quarterly")}
                        className={`flex items-center gap-0.5 font-semibold text-xs hover:opacity-80 transition-colors flex-1 justify-center ${periodType === "quarterly" ? "text-white" : "hover:text-primary"}`}
                      >
                        Q{currentQ} {selectedYear}
                        <ChevronDown className="h-3 w-3 opacity-70" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-44 p-2"
                      align="center"
                      data-ocid="reports.quarter_picker.popover"
                    >
                      <div className="grid grid-cols-2 gap-1.5">
                        {[1, 2, 3, 4].map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => {
                              goToQuarter(selectedYear, q);
                              setQuarterPickerOpen(false);
                              setPeriodType("quarterly");
                            }}
                            className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                              q === currentQ
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted text-foreground"
                            }`}
                          >
                            Q{q} {selectedYear}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 flex-shrink-0 ${periodType === "quarterly" ? "text-white hover:text-white hover:bg-white/20" : ""}`}
                    onClick={nextQ}
                    disabled={isLastQ}
                    aria-label="Next quarter"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })()}

          {/* Yearly */}
          {(() => {
            const nowYear = new Date().getFullYear();
            const years = Array.from(
              { length: nowYear - 2019 },
              (_, i) => 2020 + i,
            ).concat([nowYear + 1]);
            return (
              <div className="flex flex-col items-center flex-1 min-w-[110px]">
                <span
                  className={`text-[10px] font-medium mb-0.5 uppercase tracking-wide ${getLabelClass("yearly")}`}
                >
                  Yearly
                </span>
                <div
                  className={`flex items-center w-full justify-between rounded-lg px-1.5 py-1.5 h-9 border ${getNavBorderClass("yearly")}`}
                  style={getNavStyle("yearly")}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 flex-shrink-0 ${periodType === "yearly" ? "text-white hover:text-white hover:bg-white/20" : ""}`}
                    onClick={() => {
                      setPeriodType("yearly");
                      setMonth(`${selectedYear - 1}-01`);
                    }}
                    aria-label="Previous year"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Popover
                    open={yearPickerOpen}
                    onOpenChange={setYearPickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        data-ocid="reports.year.select"
                        onClick={() => setPeriodType("yearly")}
                        className={`flex items-center gap-0.5 font-semibold text-xs hover:opacity-80 transition-colors flex-1 justify-center ${periodType === "yearly" ? "text-white" : "hover:text-primary"}`}
                      >
                        {selectedYear}
                        <ChevronDown className="h-3 w-3 opacity-70" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-36 p-2"
                      align="center"
                      data-ocid="reports.year_picker.popover"
                    >
                      <div className="flex flex-col gap-1">
                        {years.map((yr) => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => {
                              setMonth(`${yr}-01`);
                              setYearPickerOpen(false);
                              setPeriodType("yearly");
                            }}
                            className={`py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              yr === selectedYear
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted text-foreground"
                            }`}
                          >
                            {yr}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 flex-shrink-0 ${periodType === "yearly" ? "text-white hover:text-white hover:bg-white/20" : ""}`}
                    onClick={() => {
                      setPeriodType("yearly");
                      setMonth(`${selectedYear + 1}-01`);
                    }}
                    disabled={selectedYear >= nowYear}
                    aria-label="Next year"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })()}
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
                  {displayBreakdown.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-6">
                      {t("no_expenses_month")}
                    </p>
                  ) : (
                    displayBreakdown
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
                  {t("end_of_report", { month: periodLabel })}
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
