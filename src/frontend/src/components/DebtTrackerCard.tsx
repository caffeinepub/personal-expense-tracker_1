import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Check,
  CreditCard,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { DebtRecord } from "../backend.d";
import { useAppSettings, useDebts, useSaveDebts } from "../hooks/useQueries";
import { formatCurrency } from "../utils/format";

export default function DebtTrackerCard() {
  const { data: debts = [] } = useDebts();
  const saveDebts = useSaveDebts();
  const { data: settings } = useAppSettings();
  const currency = settings?.currency ?? "USD";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [personName, setPersonName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [direction, setDirection] = useState<"owe" | "owed">("owe");
  const [isSaving, setIsSaving] = useState(false);

  const totalIOwe = debts
    .filter((d) => d.direction === "owe" && d.status === "pending")
    .reduce((s, d) => s + Number(d.amount), 0);

  const totalOwedToMe = debts
    .filter((d) => d.direction === "owed" && d.status === "pending")
    .reduce((s, d) => s + Number(d.amount), 0);

  function resetForm() {
    setPersonName("");
    setDescription("");
    setAmount("");
    setDueDate("");
    setDirection("owe");
  }

  async function handleAddDebt() {
    if (!personName.trim()) {
      toast.error("Person name is required");
      return;
    }
    const parsedAmount = Number.parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setIsSaving(true);
    try {
      const newDebt: DebtRecord = {
        id: crypto.randomUUID(),
        personName: personName.trim(),
        description: description.trim(),
        amount: parsedAmount,
        dueDate: dueDate || null,
        direction,
        status: "pending",
        createdAt: BigInt(Date.now() * 1_000_000),
      };
      const updated = [...debts, newDebt];
      await saveDebts.mutateAsync(updated);
      toast.success("Debt added");
      resetForm();
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save debt");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleMarkPaid(id: string) {
    const updated = debts.map((d) =>
      d.id === id ? { ...d, status: "paid" } : d,
    );
    try {
      await saveDebts.mutateAsync(updated);
      toast.success("Marked as paid");
    } catch {
      toast.error("Failed to update debt");
    }
  }

  async function handleDelete(id: string) {
    const updated = debts.filter((d) => d.id !== id);
    try {
      await saveDebts.mutateAsync(updated);
      toast.success("Debt removed");
    } catch {
      toast.error("Failed to delete debt");
    }
  }

  return (
    <>
      <Card
        className="border-border/50 shadow-sm"
        data-ocid="debt_tracker.card"
      >
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <h3 className="font-display text-sm font-semibold uppercase tracking-wide">
                Debt / Loan Tracker
              </h3>
            </div>
            <Button
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
              data-ocid="debt.add.open_modal_button"
            >
              <Plus className="h-3 w-3" /> Add
            </Button>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-red-600 dark:text-red-400 flex items-center gap-1">
                <ArrowUpCircle className="h-3 w-3" /> I Owe
              </p>
              <p className="font-bold text-sm text-red-700 dark:text-red-300">
                {formatCurrency(totalIOwe, currency)}
              </p>
            </div>
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ArrowDownCircle className="h-3 w-3" /> Owes Me
              </p>
              <p className="font-bold text-sm text-emerald-700 dark:text-emerald-300">
                {formatCurrency(totalOwedToMe, currency)}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-3 pt-0">
          {debts.length === 0 ? (
            <p
              className="text-xs text-muted-foreground text-center py-4"
              data-ocid="debt.empty_state"
            >
              No debts tracked yet
            </p>
          ) : (
            <ul className="space-y-2" data-ocid="debt.list">
              {debts.map((debt, i) => (
                <li
                  key={debt.id}
                  className={`rounded-xl px-3 py-2.5 border ${
                    debt.status === "paid"
                      ? "opacity-50 bg-muted/40 border-border/30"
                      : debt.direction === "owe"
                        ? "bg-red-50/60 dark:bg-red-950/20 border-red-100/80 dark:border-red-900/30"
                        : "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-100/80 dark:border-emerald-900/30"
                  }`}
                  data-ocid={`debt.item.${i + 1}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm truncate">
                          {debt.personName}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 h-4 ${
                            debt.direction === "owe"
                              ? "border-red-300 text-red-600 dark:border-red-700 dark:text-red-400"
                              : "border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          {debt.direction === "owe" ? "I Owe" : "Owes Me"}
                        </Badge>
                        {debt.status === "paid" && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-4 border-muted-foreground/30 text-muted-foreground"
                          >
                            Paid
                          </Badge>
                        )}
                      </div>
                      {debt.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {debt.description}
                        </p>
                      )}
                      {debt.dueDate && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Due: {debt.dueDate}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span
                        className={`font-bold text-sm ${
                          debt.direction === "owe"
                            ? "text-red-600 dark:text-red-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {formatCurrency(Number(debt.amount), currency)}
                      </span>
                      {debt.status === "pending" && (
                        <button
                          type="button"
                          className="h-6 w-6 rounded-md flex items-center justify-center text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                          onClick={() => handleMarkPaid(debt.id)}
                          aria-label="Mark as paid"
                          data-ocid={`debt.confirm_button.${i + 1}`}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="h-6 w-6 rounded-md flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => handleDelete(debt.id)}
                        aria-label="Delete debt"
                        data-ocid={`debt.delete_button.${i + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-w-sm mx-auto rounded-2xl"
          data-ocid="debt.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Add Debt / Loan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="debt-person">Person Name *</Label>
              <Input
                id="debt-person"
                placeholder="e.g. John Smith"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className="h-11"
                data-ocid="debt.person.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="debt-desc">Description (optional)</Label>
              <Input
                id="debt-desc"
                placeholder="e.g. Dinner, Rent, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-11"
                data-ocid="debt.description.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="debt-amount">Amount *</Label>
                <Input
                  id="debt-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-11"
                  data-ocid="debt.amount.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="debt-due">Due Date</Label>
                <Input
                  id="debt-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-11"
                  data-ocid="debt.due_date.input"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Direction</Label>
              <Select
                value={direction}
                onValueChange={(v) => setDirection(v as "owe" | "owed")}
              >
                <SelectTrigger
                  className="h-11"
                  data-ocid="debt.direction.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owe">I Owe (I need to pay)</SelectItem>
                  <SelectItem value="owed">
                    Owes Me (they need to pay)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="debt.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddDebt}
              disabled={isSaving}
              data-ocid="debt.submit_button"
            >
              Add Debt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
