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
import type { Category, Expense } from "../backend.d";
import { todayISO } from "../utils/format";

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
  categories: Category[];
  currency: string;
  onSave: (expense: Expense) => Promise<void>;
  isSaving?: boolean;
}

const PAYMENT_METHODS = ["Cash", "Card", "UPI", "Bank Transfer", "Other"];

export default function ExpenseDialog({
  open,
  onOpenChange,
  expense,
  categories,
  currency,
  onSave,
  isSaving = false,
}: ExpenseDialogProps) {
  const isEditing = !!expense;

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Ref for programmatic date picker open
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Populate form when editing
  useEffect(() => {
    if (open) {
      if (expense) {
        setAmount(expense.amount.toString());
        setCategoryId(expense.categoryId);
        setDate(expense.date);
        setNote(expense.note ?? "");
        setPaymentMethod(expense.paymentMethod ?? "Cash");
      } else {
        setAmount("");
        setCategoryId(categories[0]?.id ?? "");
        setDate(todayISO());
        setNote("");
        setPaymentMethod("Cash");
      }
      setErrors({});
    }
  }, [open, expense, categories]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    const parsedAmount = Number.parseFloat(amount);
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }
    if (!categoryId) {
      newErrors.category = "Please select a category";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    const id = expense?.id ?? crypto.randomUUID();
    const createdAt = expense?.createdAt ?? BigInt(Date.now());

    await onSave({
      id,
      amount: Number.parseFloat(amount),
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

  // Increment / decrement amount by 1
  function incrementAmount() {
    const current = Number.parseFloat(amount) || 0;
    setAmount((current + 1).toFixed(2));
  }

  function decrementAmount() {
    const current = Number.parseFloat(amount) || 0;
    const next = Math.max(0, current - 1);
    setAmount(next.toFixed(2));
  }

  // Open the native date picker via the custom calendar icon
  function openDatePicker() {
    try {
      dateInputRef.current?.showPicker();
    } catch {
      // Fallback: focus the input so the user can open it via keyboard
      dateInputRef.current?.focus();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md mx-auto rounded-2xl"
        data-ocid="add_expense.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">
            {isEditing ? "Edit Expense" : "Add Expense"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Row: Amount + Category + Payment Method */}
          <div className="grid grid-cols-[2fr_1.5fr_1.5fr] gap-2 items-start">
            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-sm font-medium">
                Amount <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                {/* Currency prefix */}
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold z-10 pointer-events-none select-none">
                  {getCurrencyPrefix()}
                </span>

                {/* Number input – native spinners hidden */}
                <Input
                  id="amount"
                  data-ocid="expense.amount.input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={[
                    "pl-8 pr-10 text-xl font-bold font-display h-12",
                    "[appearance:textfield]",
                    "[&::-webkit-inner-spin-button]:appearance-none",
                    "[&::-webkit-outer-spin-button]:appearance-none",
                  ].join(" ")}
                />

                {/* Custom up / down stepper */}
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-0">
                  <button
                    type="button"
                    aria-label="Increase amount"
                    onClick={incrementAmount}
                    className="flex items-center justify-center h-5 w-7 rounded-t text-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    aria-label="Decrease amount"
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

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger
                  data-ocid="expense.category.select"
                  className="h-12 text-xs px-2"
                >
                  <SelectValue placeholder="Category" />
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
              <Label className="text-sm font-medium">Payment</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger
                  data-ocid="expense.payment.select"
                  className="h-12 text-xs px-2"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date" className="text-sm font-medium">
              Date
            </Label>
            <div className="relative">
              {/* Native date input with browser icon hidden */}
              <Input
                ref={dateInputRef}
                id="date"
                data-ocid="expense.date.input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={[
                  "h-11 pr-10",
                  "[&::-webkit-calendar-picker-indicator]:hidden",
                  "[&::-webkit-calendar-picker-indicator]:appearance-none",
                ].join(" ")}
              />

              {/* Custom calendar icon – clickable, visible in both modes */}
              <button
                type="button"
                aria-label="Open date picker"
                onClick={openDatePicker}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-foreground hover:text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                <Calendar className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="note" className="text-sm font-medium">
              Note{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="note"
              data-ocid="expense.note.input"
              placeholder="What was this for?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-11"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            data-ocid="expense.cancel.button"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={isSaving}
            data-ocid="expense.save.button"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Update"
            ) : (
              "Add Expense"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
