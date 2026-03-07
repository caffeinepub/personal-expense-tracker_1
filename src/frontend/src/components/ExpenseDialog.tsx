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
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm mx-auto rounded-2xl"
        data-ocid="add_expense.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">
            {isEditing ? "Edit Expense" : "Add Expense"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-sm font-medium">
              Amount <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                {getCurrencyPrefix()}
              </span>
              <Input
                id="amount"
                data-ocid="expense.amount.input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 text-2xl font-bold font-display h-14"
              />
            </div>
            {errors.amount && (
              <p className="text-destructive text-xs">{errors.amount}</p>
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
                className="h-11"
              >
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-destructive text-xs">{errors.category}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date" className="text-sm font-medium">
              Date
            </Label>
            <Input
              id="date"
              data-ocid="expense.date.input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11"
            />
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

          {/* Payment Method */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger
                data-ocid="expense.payment.select"
                className="h-11"
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
