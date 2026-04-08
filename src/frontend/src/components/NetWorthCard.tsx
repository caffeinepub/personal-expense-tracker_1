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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronDown,
  Landmark,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { NetWorthItem } from "../backend.d";
import { useNetWorthItems, useSaveNetWorthItems } from "../hooks/useQueries";
import { formatCurrency } from "../utils/format";

interface NetWorthCardProps {
  currency?: string;
}

const EMPTY_FORM = {
  name: "",
  amount: "",
  itemType: "Asset" as "Asset" | "Liability",
};

export default function NetWorthCard({ currency = "USD" }: NetWorthCardProps) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<NetWorthItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: items = [], isLoading } = useNetWorthItems();
  const saveItems = useSaveNetWorthItems();

  const totalAssets = items
    .filter((i) => i.itemType === "Asset")
    .reduce((s, i) => s + i.amount, 0);
  const totalLiabilities = items
    .filter((i) => i.itemType === "Liability")
    .reduce((s, i) => s + i.amount, 0);
  const netWorth = totalAssets - totalLiabilities;

  function openAdd() {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(item: NetWorthItem) {
    setEditingItem(item);
    setForm({
      name: item.name,
      amount: String(item.amount),
      itemType: item.itemType as "Asset" | "Liability",
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingItem(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    const amount = Number.parseFloat(form.amount);
    if (!form.amount || Number.isNaN(amount) || amount < 0) {
      toast.error("Enter a valid amount");
      return;
    }

    let updated: NetWorthItem[];
    if (editingItem) {
      updated = items.map((i) =>
        i.id === editingItem.id
          ? { ...i, name: form.name.trim(), amount, itemType: form.itemType }
          : i,
      );
    } else {
      const newItem: NetWorthItem = {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        amount,
        itemType: form.itemType,
        createdAt: BigInt(Date.now()),
      };
      updated = [...items, newItem];
    }

    try {
      await saveItems.mutateAsync(updated);
      toast.success(editingItem ? "Item updated" : "Item added");
      cancelForm();
    } catch {
      toast.error("Failed to save net worth item");
    }
  }

  async function handleDelete(id: string) {
    const updated = items.filter((i) => i.id !== id);
    try {
      await saveItems.mutateAsync(updated);
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete item");
    }
    setDeleteId(null);
  }

  return (
    <>
      <div
        className="border border-border/50 rounded-xl overflow-hidden"
        data-ocid="dashboard.net_worth.card"
      >
        {/* Header */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 transition-colors"
          style={{
            background:
              "linear-gradient(135deg, #0f4c3a 0%, #065f46 50%, #047857 100%)",
          }}
          data-ocid="dashboard.net_worth.toggle"
        >
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-emerald-300" />
            <span className="text-sm font-semibold text-white">
              Net Worth Tracker
            </span>
            {items.length > 0 && (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${netWorth >= 0 ? "bg-emerald-500/30 text-emerald-200" : "bg-red-500/30 text-red-200"}`}
              >
                {formatCurrency(netWorth, currency)}
              </span>
            )}
          </div>
          <ChevronDown
            className={`h-4 w-4 text-emerald-200 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="net-worth-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: "hidden" }}
            >
              <div className="p-4 space-y-4">
                {/* Summary row */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30 px-3 py-2">
                    <div className="flex items-center gap-1 mb-0.5">
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Assets
                      </p>
                    </div>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(totalAssets, currency)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-red-50/60 dark:bg-red-950/30 border border-red-200/50 dark:border-red-800/30 px-3 py-2">
                    <div className="flex items-center gap-1 mb-0.5">
                      <TrendingDown className="h-3 w-3 text-red-500" />
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Liabilities
                      </p>
                    </div>
                    <p className="text-sm font-bold text-red-600 dark:text-red-400 tabular-nums">
                      {formatCurrency(totalLiabilities, currency)}
                    </p>
                  </div>
                  <div
                    className={`rounded-lg px-3 py-2 border ${netWorth >= 0 ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-800/30" : "bg-red-50/60 dark:bg-red-950/30 border-red-200/50 dark:border-red-800/30"}`}
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      <Landmark className="h-3 w-3 text-muted-foreground" />
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Net Worth
                      </p>
                    </div>
                    <p
                      className={`text-sm font-bold tabular-nums ${netWorth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {formatCurrency(netWorth, currency)}
                    </p>
                  </div>
                </div>

                {/* Add Item Form */}
                <AnimatePresence>
                  {showForm && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-xl border border-border bg-muted/30 p-3 space-y-3"
                      data-ocid="dashboard.net_worth.form"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">
                          {editingItem ? "Edit Item" : "Add Item"}
                        </p>
                        <button
                          type="button"
                          onClick={cancelForm}
                          className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs font-medium mb-1 block">
                            Name *
                          </Label>
                          <Input
                            value={form.name}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, name: e.target.value }))
                            }
                            placeholder="e.g. Savings Account"
                            className="h-9"
                            data-ocid="net_worth.name.input"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium mb-1 block">
                            Amount *
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.amount}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, amount: e.target.value }))
                            }
                            placeholder="0.00"
                            className="h-9"
                            data-ocid="net_worth.amount.input"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium mb-1 block">
                            Type
                          </Label>
                          <div className="flex gap-2">
                            {(["Asset", "Liability"] as const).map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() =>
                                  setForm((f) => ({ ...f, itemType: type }))
                                }
                                className={`flex-1 h-9 rounded-lg text-sm font-medium border transition-colors ${form.itemType === type ? (type === "Asset" ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300" : "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300") : "bg-background border-border text-muted-foreground hover:text-foreground"}`}
                                data-ocid={`net_worth.type.${type.toLowerCase()}`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-9"
                          onClick={cancelForm}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 h-9"
                          onClick={handleSave}
                          disabled={saveItems.isPending}
                          data-ocid="net_worth.save.button"
                        >
                          {saveItems.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          ) : null}
                          {editingItem ? "Update" : "Add"}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Items list */}
                {isLoading ? (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Loading...
                  </p>
                ) : items.length === 0 ? (
                  <div
                    className="text-center py-4 space-y-2"
                    data-ocid="net_worth.empty_state"
                  >
                    <Landmark className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      No items yet. Add your assets and liabilities.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {/* Assets */}
                    {items.filter((i) => i.itemType === "Asset").length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                          Assets
                        </p>
                        <div className="space-y-1">
                          {items
                            .filter((i) => i.itemType === "Asset")
                            .map((item) => (
                              <ItemRow
                                key={item.id}
                                item={item}
                                currency={currency}
                                onEdit={openEdit}
                                onDelete={() => setDeleteId(item.id)}
                              />
                            ))}
                        </div>
                      </div>
                    )}
                    {/* Liabilities */}
                    {items.filter((i) => i.itemType === "Liability").length >
                      0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 mb-1 mt-2">
                          Liabilities
                        </p>
                        <div className="space-y-1">
                          {items
                            .filter((i) => i.itemType === "Liability")
                            .map((item) => (
                              <ItemRow
                                key={item.id}
                                item={item}
                                currency={currency}
                                onEdit={openEdit}
                                onDelete={() => setDeleteId(item.id)}
                              />
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!showForm && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 gap-1.5 text-xs"
                    onClick={openAdd}
                    data-ocid="net_worth.add_item.button"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Item
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="net_worth.delete.confirm"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ItemRow({
  item,
  currency,
  onEdit,
  onDelete,
}: {
  item: NetWorthItem;
  currency: string;
  onEdit: (item: NetWorthItem) => void;
  onDelete: () => void;
}) {
  const isAsset = item.itemType === "Asset";
  return (
    <div
      className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-1.5 hover:bg-muted/50 transition-colors"
      data-ocid="net_worth.item"
    >
      <Badge
        variant="outline"
        className={`text-[10px] px-1.5 py-0 h-4 flex-shrink-0 font-medium ${isAsset ? "border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400" : "border-red-300 dark:border-red-700 text-red-600 dark:text-red-400"}`}
      >
        {item.itemType}
      </Badge>
      <span className="flex-1 text-xs font-medium truncate">{item.name}</span>
      <span
        className={`text-xs font-semibold tabular-nums flex-shrink-0 ${isAsset ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
      >
        {formatCurrency(item.amount, currency)}
      </span>
      <button
        type="button"
        onClick={() => onEdit(item)}
        className="p-1 text-muted-foreground hover:text-foreground flex-shrink-0"
        data-ocid="net_worth.edit_button"
        aria-label="Edit item"
      >
        <Pencil className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="p-1 text-muted-foreground hover:text-destructive flex-shrink-0"
        data-ocid="net_worth.delete_button"
        aria-label="Delete item"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
