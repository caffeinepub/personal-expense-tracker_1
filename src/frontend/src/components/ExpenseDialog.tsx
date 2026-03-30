import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Calendar, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Category, Expense, MonthlyIncome } from "../backend.d";
import { useIncomeSources } from "../hooks/useQueries";
import { useLanguage } from "../i18n/LanguageContext";
import { todayISO } from "../utils/format";
import type { IncomeSource } from "../utils/incomeSources";

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
  categories: Category[];
  currency: string;
  onSave: (expense: Expense) => Promise<void>;
  onSaveIncome: (income: MonthlyIncome) => Promise<void>;
  isSaving?: boolean;
  month?: string;
  allExpenses?: Expense[];
  prefill?: {
    amount?: string;
    categoryId?: string;
    paymentMethod?: string;
    note?: string;
  };
}

type EntryType = "expense" | "income";

interface Suggestion {
  note: string;
  amount: number;
  categoryId: string;
  paymentMethod: string;
  categoryName: string;
}

export default function ExpenseDialog({
  open,
  onOpenChange,
  expense,
  categories,
  currency,
  onSave,
  onSaveIncome,
  isSaving = false,
  month,
  allExpenses = [],
  prefill,
}: ExpenseDialogProps) {
  const isEditing = !!expense;
  const { t } = useLanguage();

  const [entryType, setEntryType] = useState<EntryType>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [recurring, setRecurring] = useState(true);
  const [recurringFrequency, setRecurringFrequency] = useState("Monthly");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [incomeSourceId, setIncomeSourceId] = useState("");
  const { data: backendIncomeSources = [] } = useIncomeSources();
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [noteDropdownOpen, setNoteDropdownOpen] = useState(false);

  const dateInputRef = useRef<HTMLInputElement>(null);
  const prefillAppliedRef = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: backendIncomeSources handled intentionally
  useEffect(() => {
    if (open) {
      try {
        const stored = localStorage.getItem("pe_payment_methods");
        const parsed = stored ? JSON.parse(stored) : null;
        setPaymentMethods(
          Array.isArray(parsed) && parsed.length > 0
            ? parsed
            : ["Cash", "Credit Card", "Debit Card", "Bank Transfer"],
        );
      } catch {
        setPaymentMethods([
          "Cash",
          "Credit Card",
          "Debit Card",
          "Bank Transfer",
        ]);
      }
      prefillAppliedRef.current = false;
      setIncomeSources(
        backendIncomeSources.length > 0
          ? backendIncomeSources
          : ((): IncomeSource[] => {
              try {
                const s = localStorage.getItem("pe_income_sources");
                return s ? JSON.parse(s) : [];
              } catch {
                return [];
              }
            })(),
      );
      setIncomeSourceId("");
      setNoteDropdownOpen(false);
      if (expense) {
        setEntryType("expense");
        setAmount(expense.amount.toString());
        setCategoryId(expense.categoryId);
        setDate(expense.date);
        setNote(expense.note ?? "");
        setPaymentMethod(expense.paymentMethod ?? "Cash");
        setRecurring(
          (expense as typeof expense & { recurring?: boolean }).recurring ??
            false,
        );
        setRecurringFrequency(
          (expense as typeof expense & { recurringFrequency?: string })
            .recurringFrequency ?? "Monthly",
        );
      } else if (prefill && !prefillAppliedRef.current) {
        prefillAppliedRef.current = true;
        setEntryType("expense");
        setAmount(prefill.amount ?? "");
        setCategoryId(prefill.categoryId ?? categories[0]?.id ?? "");
        setNote(prefill.note ?? "");
        setPaymentMethod(prefill.paymentMethod ?? "Cash");
        const currentMonthISO = new Date().toISOString().substring(0, 7);
        if (month && month !== currentMonthISO) {
          setDate(`${month}-01`);
        } else {
          setDate(todayISO());
        }
        setRecurring(false);
        setRecurringFrequency("Monthly");
      } else {
        setEntryType("expense");
        setAmount("");
        setCategoryId(categories[0]?.id ?? "");
        const currentMonthISO = new Date().toISOString().substring(0, 7);
        if (month && month !== currentMonthISO) {
          setDate(`${month}-01`);
        } else {
          setDate(todayISO());
        }
        setNote("");
        setPaymentMethod("Cash");
        setRecurring(false);
        setRecurringFrequency("Monthly");
      }
      setErrors({});
    }
  }, [open, expense, categories, month, prefill]);

  // Sync category budget to amount when category changes (new expense only)
  useEffect(() => {
    if (expense || entryType !== "expense") return;
    if (prefill?.amount) return;
    const cat = categories.find((c) => c.id === categoryId);
    if (cat?.budget && cat.budget > 0) {
      setAmount(cat.budget.toString());
    }
  }, [categoryId, categories, expense, entryType, prefill]);

  // Build full suggestions list from all expenses (up to 20 unique notes)
  const allNoteSuggestions = useMemo(() => {
    const seen = new Set<string>();
    const results: Suggestion[] = [];
    const sorted = [...allExpenses].sort(
      (a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0),
    );
    for (const exp of sorted) {
      if (!exp.note) continue;
      const key = exp.note.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const cat = categories.find((c) => c.id === exp.categoryId);
      results.push({
        note: exp.note,
        amount: exp.amount,
        categoryId: exp.categoryId,
        paymentMethod:
          (exp as Expense & { paymentMethod?: string }).paymentMethod ?? "Cash",
        categoryName: cat?.name ?? "Unknown",
      });
      if (results.length >= 20) break;
    }
    return results;
  }, [allExpenses, categories]);

  function applySuggestion(s: Suggestion) {
    setNote(s.note);
    setAmount(s.amount.toString());
    setCategoryId(s.categoryId);
    setPaymentMethod(s.paymentMethod);
    setNoteDropdownOpen(false);
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    const parsedAmount = Number.parseFloat(amount);
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = t("amount_error");
    }
    if (entryType === "expense" && !categoryId) {
      newErrors.category = t("category_error");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    const parsedAmount = Number.parseFloat(amount);

    if (entryType === "income") {
      const incomeMonth = date.substring(0, 7);
      await onSaveIncome({ month: incomeMonth, amount: parsedAmount });
      setAmount("");
      setErrors({});
      return;
    }

    const id = expense?.id ?? crypto.randomUUID();
    const createdAt = expense?.createdAt ?? BigInt(Date.now());
    await onSave({
      id,
      amount: parsedAmount,
      categoryId,
      date,
      note: note.trim(),
      paymentMethod,
      createdAt,
      recurring: !expense
        ? recurring
        : (expense as Expense & { recurring?: boolean }).recurring,
      recurringFrequency:
        !expense && recurring
          ? recurringFrequency
          : (expense as Expense & { recurringFrequency?: string })
              .recurringFrequency,
    } as Expense & { recurring?: boolean; recurringFrequency?: string });

    if (!expense) {
      setAmount("");
      setNote("");
      setErrors({});
    }
  }

  const getCurrencyPrefix = () => {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      INR: "₹",
      JPY: "¥",
      CAD: "C$",
      AUD: "A$",
    };
    return symbols[currency] ?? currency;
  };

  function handleIncomeSourceSelect(id: string) {
    setIncomeSourceId(id);
    if (id === "__total__") {
      const total = incomeSources.reduce((s, src) => s + src.monthlyBudget, 0);
      setAmount(total.toString());
    } else {
      const src = incomeSources.find((s) => s.id === id);
      if (src) setAmount(src.monthlyBudget.toString());
    }
  }

  function incrementAmount() {
    const current = Number.parseFloat(amount) || 0;
    setAmount((current + 1).toFixed(2));
  }

  function decrementAmount() {
    const current = Number.parseFloat(amount) || 0;
    const next = Math.max(0, current - 1);
    setAmount(next.toFixed(2));
  }

  function openDatePicker() {
    try {
      dateInputRef.current?.showPicker();
    } catch {
      dateInputRef.current?.focus();
    }
  }

  const isIncome = entryType === "income";

  const dialogTitle = isEditing
    ? t("edit_expense")
    : isIncome
      ? t("add_income")
      : t("add_expense");
  const saveLabel = isEditing
    ? t("update")
    : isIncome
      ? t("add_income")
      : t("add_expense");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md mx-auto rounded-2xl"
        data-ocid="add_expense.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">
            {dialogTitle}
          </DialogTitle>
        </DialogHeader>

        {/* Expense / Income toggle */}
        {!isEditing && (
          <div
            className="flex rounded-xl bg-muted p-1 gap-1"
            data-ocid="entry_type.toggle"
          >
            <button
              type="button"
              data-ocid="entry_type.expense.button"
              onClick={() => setEntryType("expense")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                !isIncome
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("expense")}
            </button>
            <button
              type="button"
              data-ocid="entry_type.income.button"
              onClick={() => setEntryType("income")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isIncome
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("income")}
            </button>
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* Row 1: Amount + Date */}
          <div className="grid grid-cols-2 gap-2 items-start">
            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-sm font-medium">
                {t("amount_label")} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold z-10 pointer-events-none select-none">
                  {getCurrencyPrefix()}
                </span>
                <Input
                  id="amount"
                  data-ocid="expense.amount.input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={t("amount_placeholder")}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={[
                    "pl-8 pr-10 text-xl font-bold font-display h-11",
                    "[appearance:textfield]",
                    "[&::-webkit-inner-spin-button]:appearance-none",
                    "[&::-webkit-outer-spin-button]:appearance-none",
                  ].join(" ")}
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-0">
                  <button
                    type="button"
                    aria-label={t("increase_amount")}
                    onClick={incrementAmount}
                    className="flex items-center justify-center h-5 w-7 rounded-t text-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    aria-label={t("decrease_amount")}
                    onClick={decrementAmount}
                    className="flex items-center justify-center h-5 w-7 rounded-b text-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
              {errors.amount && (
                <p
                  className="text-destructive text-xs"
                  data-ocid="expense.amount.error_state"
                >
                  {errors.amount}
                </p>
              )}
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <Label htmlFor="date" className="text-sm font-medium">
                {isIncome ? t("month_label") : t("date_label")}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="relative w-full">
                <Input
                  ref={dateInputRef}
                  id="date"
                  data-ocid="expense.date.input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={[
                    "h-11 w-full pr-9",
                    "[&::-webkit-calendar-picker-indicator]:hidden",
                    "[&::-webkit-calendar-picker-indicator]:appearance-none",
                  ].join(" ")}
                />
                <button
                  type="button"
                  aria-label={t("open_date_picker")}
                  onClick={openDatePicker}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-foreground hover:text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  <Calendar className="h-4 w-4" />
                </button>
              </div>
              {isIncome && (
                <p className="text-xs text-muted-foreground">
                  {t("income_month_hint")}
                </p>
              )}
            </div>
          </div>

          {/* Income Source — income mode only */}
          {entryType === "income" && (
            <div>
              <Label className="text-xs font-medium mb-1 block">
                Income Source
              </Label>
              <Select
                value={incomeSourceId}
                onValueChange={handleIncomeSourceSelect}
              >
                <SelectTrigger
                  className="h-9"
                  data-ocid="expense.income_source.select"
                >
                  <SelectValue
                    placeholder={`Total Income: ${getCurrencyPrefix()}${incomeSources.reduce((s, src) => s + src.monthlyBudget, 0).toLocaleString()}`}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__total__">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Total Income ({getCurrencyPrefix()}
                      {incomeSources
                        .reduce((s, src) => s + src.monthlyBudget, 0)
                        .toLocaleString()}
                      )
                    </div>
                  </SelectItem>
                  {incomeSources.map((src) => (
                    <SelectItem key={src.id} value={src.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: src.color }}
                        />
                        {src.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Row 2: Category + Payment — expense only */}
          {!isIncome && (
            <div className="grid grid-cols-2 gap-2 items-start">
              {/* Category */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {t("category_label")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger
                    data-ocid="expense.category.select"
                    className="h-11 w-full text-xs px-2"
                  >
                    <SelectValue placeholder={t("category_label")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="whitespace-normal break-words">
                            {cat.name}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p
                    className="text-destructive text-xs"
                    data-ocid="expense.category.error_state"
                  >
                    {errors.category}
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {t("payment_label")}
                </Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger
                    data-ocid="expense.payment.select"
                    className="h-11 w-full text-xs px-2"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Note — expense only, with dropdown for suggestions */}
          {!isIncome && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                {t("note_label")}{" "}
                <span className="text-muted-foreground text-xs">
                  {t("optional")}
                </span>
              </Label>
              <Popover
                open={noteDropdownOpen}
                onOpenChange={setNoteDropdownOpen}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    data-ocid="expense.note.input"
                    className="flex items-center justify-between w-full h-11 px-3 border border-input rounded-lg bg-background text-sm hover:bg-accent/5 transition-colors"
                  >
                    <span
                      className={
                        note ? "text-foreground" : "text-muted-foreground"
                      }
                    >
                      {note || t("note_placeholder")}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                >
                  <div className="p-2 border-b border-border">
                    <Input
                      autoFocus
                      placeholder={t("note_placeholder")}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setNoteDropdownOpen(false);
                      }}
                      className="h-9 text-sm"
                    />
                  </div>
                  {allNoteSuggestions.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto py-1">
                      {allNoteSuggestions.map((s, idx) => (
                        <button
                          key={`${s.note}-${idx}`}
                          type="button"
                          onClick={() => applySuggestion(s)}
                          className="flex items-center justify-between w-full px-3 py-2 hover:bg-accent cursor-pointer text-sm text-left"
                        >
                          <span className="truncate flex-1 mr-2">{s.note}</span>
                          <span className="text-muted-foreground text-xs whitespace-nowrap flex-shrink-0">
                            {getCurrencyPrefix()}
                            {s.amount.toFixed(2)} · {s.categoryName}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      No suggestions yet
                    </p>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Recurring — new expenses only, not income, not editing */}
          {!isIncome && !isEditing && (
            <div className="space-y-2">
              <button
                type="button"
                data-ocid="expense.recurring.toggle"
                onClick={() => setRecurring((r) => !r)}
                className="flex items-center gap-2 w-full py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <span
                  className={`flex items-center justify-center w-4 h-4 rounded border transition-colors ${recurring ? "bg-primary border-primary" : "border-border bg-background"}`}
                >
                  {recurring && (
                    <svg
                      viewBox="0 0 10 10"
                      className="w-2.5 h-2.5 text-primary-foreground"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                      role="presentation"
                    >
                      <polyline points="2,5 4.5,7.5 8,3" />
                    </svg>
                  )}
                </span>
                <span>Recurring expense</span>
              </button>
              {recurring && (
                <div
                  className="flex gap-1.5"
                  data-ocid="expense.recurring.panel"
                >
                  {["Daily", "Weekly", "Monthly", "Yearly"].map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      data-ocid="expense.recurring.button"
                      onClick={() => setRecurringFrequency(freq)}
                      className={`flex-1 py-1.5 rounded-full text-xs font-medium border transition-colors ${recurringFrequency === freq ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-muted/80"}`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            className="flex-1 bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
            style={{ backgroundColor: undefined }}
            onClick={() => onOpenChange(false)}
            data-ocid="expense.cancel.button"
            disabled={isSaving}
          >
            {t("cancel")}
          </Button>
          <Button
            className={`flex-1 ${
              isIncome ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
            }`}
            onClick={handleSave}
            disabled={isSaving}
            data-ocid="expense.save.button"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("saving")}
              </>
            ) : (
              saveLabel
            )}
          </Button>
        </div>

        {/* Required fields footnote */}
        <p className="text-xs text-muted-foreground pt-1">
          <span className="text-destructive font-semibold">*</span>{" "}
          {t("required_fields")}
        </p>
      </DialogContent>
    </Dialog>
  );
}
