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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  MoreVertical,
  Paperclip,
  Pencil,
  Receipt,
  Repeat,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Expense } from "../backend.d";

import GlobalSearchSheet from "../components/GlobalSearchSheet";
import RecurringManagerSheet from "../components/RecurringManagerSheet";
import {
  useAppSettings,
  useCategories,
  useDeleteExpense,
  useExpenseMetaList,
  useExpensesByMonth,
} from "../hooks/useQueries";
import { useLanguage } from "../i18n/LanguageContext";
import { getCategoryById } from "../utils/categories";
import {
  formatCurrency,
  formatDate,
  formatMonthYear,
  groupByDate,
  isCurrentMonth,
  nextMonth,
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

interface ExpensesTabProps {
  onEditExpense: (expense: Expense) => void;
  month: string;
  setMonth: (m: string) => void;
}

// Hook to load all 12 months for a given year (always called, never conditional)
function useYearExpenses(year: number) {
  const m1 = useExpensesByMonth(`${year}-01`);
  const m2 = useExpensesByMonth(`${year}-02`);
  const m3 = useExpensesByMonth(`${year}-03`);
  const m4 = useExpensesByMonth(`${year}-04`);
  const m5 = useExpensesByMonth(`${year}-05`);
  const m6 = useExpensesByMonth(`${year}-06`);
  const m7 = useExpensesByMonth(`${year}-07`);
  const m8 = useExpensesByMonth(`${year}-08`);
  const m9 = useExpensesByMonth(`${year}-09`);
  const m10 = useExpensesByMonth(`${year}-10`);
  const m11 = useExpensesByMonth(`${year}-11`);
  const m12 = useExpensesByMonth(`${year}-12`);
  return [m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12];
}

export default function ExpensesTab({
  onEditExpense,
  month,
  setMonth,
}: ExpensesTabProps) {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [receiptViewerUrl, setReceiptViewerUrl] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [recurringManagerOpen, setRecurringManagerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const [quarterPickerOpen, setQuarterPickerOpen] = useState(false);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [periodType, setPeriodType] = useState<PeriodType>("monthly");
  const { t } = useLanguage();

  const { data: expenses = [], isLoading } = useExpensesByMonth(month);
  const { data: categories = [] } = useCategories();
  const { data: settings } = useAppSettings();
  const currency = settings?.currency ?? "USD";
  const { data: expenseMetaList = [] } = useExpenseMetaList();
  const metaByExpenseId = useMemo(() => {
    const map = new Map<string, { tags?: string; receiptUrl?: string }>();
    for (const [id, meta] of expenseMetaList) {
      map.set(id, {
        tags: meta.tags ?? undefined,
        receiptUrl: meta.receiptUrl ?? undefined,
      });
    }
    return map;
  }, [expenseMetaList]);

  const selectedYear = Number.parseInt(month.split("-")[0], 10);
  const selectedMonthIdx = Number.parseInt(month.split("-")[1], 10) - 1;

  // Always load all 12 months for the selected year (hooks must not be conditional)
  const allMonthQueries = useYearExpenses(selectedYear);

  const paymentMethods = useMemo(() => {
    const methods = [
      ...new Set(expenses.map((e) => e.paymentMethod).filter(Boolean)),
    ];
    return methods;
  }, [expenses]);

  const activeAdvancedFilterCount = [
    paymentFilter !== "all",
    minAmount !== "",
    maxAmount !== "",
    filterDateFrom !== "",
    filterDateTo !== "",
  ].filter(Boolean).length;
  const deleteExpense = useDeleteExpense();

  const filtered = useMemo(() => {
    const minAmt = minAmount !== "" ? Number.parseFloat(minAmount) : null;
    const maxAmt = maxAmount !== "" ? Number.parseFloat(maxAmount) : null;
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
      .filter(
        (e) => paymentFilter === "all" || e.paymentMethod === paymentFilter,
      )
      .filter((e) => minAmt === null || Number(e.amount) >= minAmt)
      .filter((e) => maxAmt === null || Number(e.amount) <= maxAmt)
      .filter((e) => !filterDateFrom || e.date >= filterDateFrom)
      .filter((e) => !filterDateTo || e.date <= filterDateTo)
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime() ||
          Number(b.createdAt) - Number(a.createdAt),
      );
  }, [
    expenses,
    categoryFilter,
    searchQuery,
    categories,
    paymentFilter,
    minAmount,
    maxAmount,
    filterDateFrom,
    filterDateTo,
  ]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  const totalAmount = useMemo(
    () => filtered.reduce((sum, e) => sum + Number(e.amount), 0),
    [filtered],
  );

  // Quarterly aggregation
  const currentQ = Math.floor(selectedMonthIdx / 3) + 1;
  const quarterMonthIndices = [
    (currentQ - 1) * 3,
    (currentQ - 1) * 3 + 1,
    (currentQ - 1) * 3 + 2,
  ];
  const quarterExpenses = useMemo(() => {
    const qIdxs = [
      (currentQ - 1) * 3,
      (currentQ - 1) * 3 + 1,
      (currentQ - 1) * 3 + 2,
    ];
    return qIdxs.flatMap((idx) => allMonthQueries[idx]?.data ?? []);
    // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  }, [allMonthQueries, currentQ]);

  // Yearly aggregation
  const yearExpenses = useMemo(() => {
    return allMonthQueries.flatMap((q) => q?.data ?? []);
  }, [allMonthQueries]);

  const isQuarterLoading = quarterMonthIndices.some(
    (idx) => allMonthQueries[idx]?.isLoading,
  );
  const isYearLoading = allMonthQueries.some((q) => q?.isLoading);

  // Build category summary for a set of expenses
  function buildCategorySummary(exps: Expense[]) {
    const map = new Map<string, { total: number; count: number }>();
    for (const e of exps) {
      const existing = map.get(e.categoryId) ?? { total: 0, count: 0 };
      map.set(e.categoryId, {
        total: existing.total + Number(e.amount),
        count: existing.count + 1,
      });
    }
    return Array.from(map.entries())
      .map(([categoryId, { total, count }]) => ({
        categoryId,
        total,
        count,
        category: getCategoryById(categories, categoryId),
      }))
      .sort((a, b) => b.total - a.total);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: buildCategorySummary uses categories from outer scope
  const quarterSummary = useMemo(
    () => buildCategorySummary(quarterExpenses),
    [quarterExpenses, categories],
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: buildCategorySummary uses categories from outer scope
  const yearSummary = useMemo(
    () => buildCategorySummary(yearExpenses),
    [yearExpenses, categories],
  );

  const quarterTotal = useMemo(
    () => quarterExpenses.reduce((s, e) => s + Number(e.amount), 0),
    [quarterExpenses],
  );
  const yearTotal = useMemo(
    () => yearExpenses.reduce((s, e) => s + Number(e.amount), 0),
    [yearExpenses],
  );

  function selectMonth(m: number) {
    const mm = String(m + 1).padStart(2, "0");
    setMonth(`${pickerYear}-${mm}`);
    setPickerOpen(false);
  }

  async function handleDelete(id: string) {
    try {
      await deleteExpense.mutateAsync(id);
      toast.success(t("expense_deleted"));
    } catch {
      toast.error(t("failed_delete_expense"));
    }
    setDeleteId(null);
  }

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
  return (
    <div className="space-y-4 pb-24">
      <div className="px-4 space-y-4">
        {/* Section label */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("expenses_label")}
              </p>
              <span className="text-xs text-muted-foreground/50">|</span>
              <h2 className="font-display text-xl font-bold tracking-tight">
                {periodType === "quarterly"
                  ? `Q${currentQ} ${selectedYear}`
                  : periodType === "yearly"
                    ? `${selectedYear}`
                    : formatMonthYear(month)}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("browse_manage_desc")}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
            <button
              type="button"
              className="h-8 px-2.5 gap-1.5 text-xs inline-flex items-center rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors font-medium"
              onClick={() => setRecurringManagerOpen(true)}
              data-ocid="expenses.recurring.button"
            >
              <Repeat className="h-3.5 w-3.5" />
              Recurring
            </button>
            <button
              type="button"
              className="h-8 px-2.5 gap-1.5 text-xs inline-flex items-center rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors font-medium"
              onClick={() => setGlobalSearchOpen(true)}
              data-ocid="expenses.global_search.button"
            >
              <Globe className="h-3.5 w-3.5" />
              Search all
            </button>
          </div>
        </div>

        {/* Back + Monthly / Quarterly / Yearly navigator row */}
        <div className="flex items-center gap-2 flex-nowrap overflow-x-auto pb-1">
          {/* Monthly */}
          <div className="flex flex-col items-center flex-1 min-w-[110px]">
            <span
              className={`text-[10px] font-medium mb-0.5 uppercase tracking-wide ${getLabelClass("monthly")}`}
            >
              Month
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
                    data-ocid="expenses.month.select"
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
                  data-ocid="expenses.month_picker.popover"
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
                  Quarter
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
                        data-ocid="expenses.quarter.select"
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
                      data-ocid="expenses.quarter_picker.popover"
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
                  Year
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
                        data-ocid="expenses.year.select"
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
                      data-ocid="expenses.year_picker.popover"
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

        {/* ── QUARTERLY SUMMARY VIEW ── */}
        {periodType === "quarterly" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold">
                Q{currentQ} {selectedYear} Summary
              </h3>
              {!isQuarterLoading && (
                <span className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/70">
                    {quarterExpenses.length}
                  </span>{" "}
                  {t("transactions")} · {formatCurrency(quarterTotal, currency)}
                </span>
              )}
            </div>
            {isQuarterLoading ? (
              <ExpenseListSkeleton />
            ) : quarterSummary.length === 0 ? (
              <div
                className="text-center py-12 px-4"
                data-ocid="expenses.empty_state"
              >
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Receipt className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="font-display font-semibold text-base mb-1">
                  {t("no_expenses_found")}
                </h3>
                <p className="text-muted-foreground text-sm">
                  No expenses in Q{currentQ} {selectedYear}
                </p>
              </div>
            ) : (
              <Card className="border-0 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  {quarterSummary.map((item, i) => (
                    <div
                      key={item.categoryId}
                      className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
                      data-ocid={`expense.item.${i + 1}`}
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: item.category?.color ?? "#B0B0B0",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.category?.name ?? t("unknown_category")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.count}{" "}
                          {item.count !== 1
                            ? t("transactions")
                            : t("transaction")}
                        </p>
                      </div>
                      <span className="font-semibold text-sm">
                        {formatCurrency(item.total, currency)}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── YEARLY SUMMARY VIEW ── */}
        {periodType === "yearly" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold">{selectedYear} Summary</h3>
              {!isYearLoading && (
                <span className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/70">
                    {yearExpenses.length}
                  </span>{" "}
                  {t("transactions")} · {formatCurrency(yearTotal, currency)}
                </span>
              )}
            </div>
            {isYearLoading ? (
              <ExpenseListSkeleton />
            ) : yearSummary.length === 0 ? (
              <div
                className="text-center py-12 px-4"
                data-ocid="expenses.empty_state"
              >
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Receipt className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="font-display font-semibold text-base mb-1">
                  {t("no_expenses_found")}
                </h3>
                <p className="text-muted-foreground text-sm">
                  No expenses in {selectedYear}
                </p>
              </div>
            ) : (
              <Card className="border-0 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  {yearSummary.map((item, i) => (
                    <div
                      key={item.categoryId}
                      className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
                      data-ocid={`expense.item.${i + 1}`}
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: item.category?.color ?? "#B0B0B0",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.category?.name ?? t("unknown_category")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.count}{" "}
                          {item.count !== 1
                            ? t("transactions")
                            : t("transaction")}
                        </p>
                      </div>
                      <span className="font-semibold text-sm">
                        {formatCurrency(item.total, currency)}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── MONTHLY VIEW (normal) ── */}
        {periodType === "monthly" && (
          <>
            {/* Filters */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    data-ocid="expenses.search_input"
                    placeholder={t("search_expenses")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger
                    data-ocid="expenses.category.select"
                    className="h-9 w-32 text-sm"
                  >
                    <SelectValue placeholder={t("all_categories")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all_categories")}</SelectItem>
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
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters((v) => !v)}
                  data-ocid="expenses.filter.toggle"
                  className={`relative flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm font-medium transition-colors flex-shrink-0 ${
                    showAdvancedFilters || activeAdvancedFilterCount > 0
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  aria-label="Toggle advanced filters"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Filters</span>
                  {activeAdvancedFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                      {activeAdvancedFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Advanced filter panel */}
              <AnimatePresence>
                {showAdvancedFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: "hidden" }}
                    data-ocid="expenses.filter.panel"
                  >
                    <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Advanced Filters
                        </p>
                        {activeAdvancedFilterCount > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentFilter("all");
                              setMinAmount("");
                              setMaxAmount("");
                              setFilterDateFrom("");
                              setFilterDateTo("");
                            }}
                            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                            data-ocid="expenses.filter.clear_button"
                          >
                            <X className="h-3 w-3" />
                            Clear filters
                          </button>
                        )}
                      </div>

                      {/* Payment method filter */}
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          Payment Method
                        </p>
                        <Select
                          value={paymentFilter}
                          onValueChange={setPaymentFilter}
                        >
                          <SelectTrigger
                            data-ocid="expenses.payment_filter.select"
                            className="h-8 text-sm bg-background"
                          >
                            <SelectValue placeholder="All methods" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All methods</SelectItem>
                            {paymentMethods.map((method) => (
                              <SelectItem key={method} value={method}>
                                {method}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Amount range */}
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          Amount Range
                        </p>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={minAmount}
                            onChange={(e) => setMinAmount(e.target.value)}
                            className="h-8 text-sm bg-background"
                            data-ocid="expenses.min_amount.input"
                            min="0"
                          />
                          <Input
                            type="number"
                            placeholder="Max"
                            value={maxAmount}
                            onChange={(e) => setMaxAmount(e.target.value)}
                            className="h-8 text-sm bg-background"
                            data-ocid="expenses.max_amount.input"
                            min="0"
                          />
                        </div>
                      </div>

                      {/* Date range filter */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-muted-foreground">
                            Date Range
                          </p>
                          {(filterDateFrom || filterDateTo) && (
                            <button
                              type="button"
                              onClick={() => {
                                setFilterDateFrom("");
                                setFilterDateTo("");
                              }}
                              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                              data-ocid="expenses.date_filter.clear_button"
                            >
                              <X className="h-3 w-3" />
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-0.5">
                            <label
                              htmlFor="filter-date-from"
                              className="text-[10px] text-muted-foreground"
                            >
                              From
                            </label>
                            <input
                              id="filter-date-from"
                              type="date"
                              value={filterDateFrom}
                              onChange={(e) =>
                                setFilterDateFrom(e.target.value)
                              }
                              data-ocid="expenses.date_from.input"
                              className="w-full h-8 rounded-lg border border-border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <label
                              htmlFor="filter-date-to"
                              className="text-[10px] text-muted-foreground"
                            >
                              To
                            </label>
                            <input
                              id="filter-date-to"
                              type="date"
                              value={filterDateTo}
                              onChange={(e) => setFilterDateTo(e.target.value)}
                              data-ocid="expenses.date_to.input"
                              className="w-full h-8 rounded-lg border border-border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Monthly summary pill */}
            {!isLoading && filtered.length > 0 && (
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/70">
                    {filtered.length}
                  </span>{" "}
                  {filtered.length !== 1 ? t("transactions") : t("transaction")}
                </span>
                <span className="text-xs font-semibold text-foreground/80">
                  {formatCurrency(totalAmount, currency)} {t("total")}
                </span>
              </div>
            )}

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
                  {t("no_expenses_found")}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {searchQuery || categoryFilter !== "all"
                    ? t("try_adjusting_filters")
                    : t("add_first_expense")}
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
                                className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
                                data-ocid={`expense.item.${globalIndex}`}
                              >
                                <div
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{
                                    backgroundColor: cat?.color ?? "#B0B0B0",
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 flex-wrap min-w-0 mt-0.5">
                                    <span
                                      className="text-xs font-medium"
                                      style={{ color: cat?.color ?? "#666" }}
                                    >
                                      {cat?.name ?? t("unknown_category")}
                                    </span>
                                    {expense.paymentMethod && (
                                      <>
                                        <span className="text-xs text-muted-foreground/50">
                                          |
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {expense.paymentMethod}
                                        </span>
                                      </>
                                    )}
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
                                  {expense.recurring && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary mt-0.5">
                                      ↻{" "}
                                      {expense.recurringFrequency ?? "Monthly"}
                                    </span>
                                  )}
                                  {/* Tags chips */}
                                  {metaByExpenseId.get(expense.id)?.tags && (
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                      {(
                                        metaByExpenseId.get(expense.id)?.tags ??
                                        ""
                                      )
                                        .split(",")
                                        .map((tag) => tag.trim())
                                        .filter(Boolean)
                                        .map((tag) => (
                                          <Badge
                                            key={tag}
                                            variant="secondary"
                                            className="text-[9px] px-1.5 py-0 h-4 font-medium"
                                          >
                                            #{tag}
                                          </Badge>
                                        ))}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  {metaByExpenseId.get(expense.id)
                                    ?.receiptUrl && (
                                    <button
                                      type="button"
                                      className="text-muted-foreground hover:text-primary transition-colors"
                                      aria-label="View receipt"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setReceiptViewerUrl(
                                          metaByExpenseId.get(expense.id)!
                                            .receiptUrl!,
                                        );
                                      }}
                                      data-ocid="expense.receipt.button"
                                    >
                                      <Paperclip className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  <div className="text-right">
                                    <span className="font-semibold text-sm block">
                                      {formatCurrency(expense.amount, currency)}
                                    </span>
                                    {(() => {
                                      const match = expense.note?.match(
                                        /\[([A-Z]{2,4})\s+([\d.]+)\]$/,
                                      );
                                      if (!match) return null;
                                      return (
                                        <span className="text-[10px] text-muted-foreground">
                                          ≈ {match[2]} {match[1]}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                        data-ocid={`expense.dropdown_menu.${globalIndex}`}
                                        aria-label={t("more_options")}
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="w-36"
                                    >
                                      <DropdownMenuItem
                                        onClick={() => onEditExpense(expense)}
                                        data-ocid={`expense.edit_button.${globalIndex}`}
                                        className="gap-2"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                        {t("edit")}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => setDeleteId(expense.id)}
                                        data-ocid={`expense.delete_button.${globalIndex}`}
                                        className="gap-2 text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        {t("delete")}
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </div>
                ))}

                {/* End of list indicator */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center gap-1.5 py-6"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
                    <span className="h-px w-8 bg-border" />
                    <Receipt className="h-3.5 w-3.5" />
                    <span>
                      {filtered.length}{" "}
                      {filtered.length !== 1
                        ? t("transactions")
                        : t("transaction")}{" "}
                      &middot; {formatCurrency(totalAmount, currency)}
                    </span>
                    <span className="h-px w-8 bg-border" />
                  </div>
                  <p className="text-xs text-muted-foreground/40">
                    {formatMonthYear(month)}
                  </p>
                </motion.div>
              </div>
            )}
          </>
        )}

        {/* Delete confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display">
                {t("delete_expense_title")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("delete_expense_desc")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-ocid="reset.cancel.button">
                {t("cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && handleDelete(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-ocid="reset.confirm.button"
              >
                {t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Receipt Viewer Dialog */}
        <Dialog
          open={!!receiptViewerUrl}
          onOpenChange={() => setReceiptViewerUrl(null)}
        >
          <DialogContent className="max-w-sm p-2" data-ocid="receipt.dialog">
            <DialogHeader>
              <DialogTitle>Receipt</DialogTitle>
            </DialogHeader>
            <img
              src={receiptViewerUrl!}
              alt="Receipt"
              className="w-full rounded-lg object-contain max-h-[70vh]"
            />
          </DialogContent>
        </Dialog>

        {/* Global Transaction Search */}
        <GlobalSearchSheet
          open={globalSearchOpen}
          onOpenChange={setGlobalSearchOpen}
          onNavigateToMonth={(m) => {
            setMonth(m);
            setPeriodType("monthly");
          }}
        />

        {/* Recurring Expense Manager */}
        <RecurringManagerSheet
          open={recurringManagerOpen}
          onOpenChange={setRecurringManagerOpen}
        />
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
