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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Category, Expense, MonthlyIncome } from "../backend.d";
import { useLanguage } from "../i18n/LanguageContext";
import { todayISO } from "../utils/format";

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
}

type EntryType = "expense" | "income";

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
}: ExpenseDialogProps) {
  const isEditing = !!expense;
  const { t } = useLanguage();

  const [entryType, setEntryType] = useState<EntryType>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethods] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("pe_payment_methods");
      return stored
        ? JSON.parse(stored)
        : ["Cash", "Card", "Bank Transfer", "Other"];
    } catch {
      return ["Cash", "Card", "Bank Transfer", "Other"];
    }
  });

  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (expense) {
        setEntryType("expense");
        setAmount(expense.amount.toString());
        setCategoryId(expense.categoryId);
        setDate(expense.date);
        setNote(expense.note ?? "");
        setPaymentMethod(expense.paymentMethod ?? "Cash");
      } else {
        setEntryType("expense");
        setAmount("");
        setCategoryId(categories[0]?.id ?? "");
        // Sync to selected dashboard month if it differs from today
        const currentMonthISO = new Date().toISOString().substring(0, 7);
        if (month && month !== currentMonthISO) {
          setDate(`${month}-01`);
        } else {
          setDate(todayISO());
        }
        setNote("");
        setPaymentMethod("Cash");
      }
      setErrors({});
    }
  }, [open, expense, categories, month]);

  // Sync category budget to amount when category changes (new expense only)
  useEffect(() => {
    if (expense || entryType !== "expense") return;
    const cat = categories.find((c) => c.id === categoryId);
    if (cat?.budget && cat.budget > 0) {
      setAmount(cat.budget.toString());
    }
  }, [categoryId, categories, expense, entryType]);

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
      const month = date.substring(0, 7);
      await onSaveIncome({ month, amount: parsedAmount });
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
    });
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
                          <span className="truncate max-w-[80px]">
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

          {/* Note — expense only */}
          {!isIncome && (
            <div className="space-y-1.5">
              <Label htmlFor="note" className="text-sm font-medium">
                {t("note_label")}{" "}
                <span className="text-muted-foreground text-xs">
                  {t("optional")}
                </span>
              </Label>
              <Input
                id="note"
                data-ocid="expense.note.input"
                placeholder={t("note_placeholder")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-11"
              />
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
