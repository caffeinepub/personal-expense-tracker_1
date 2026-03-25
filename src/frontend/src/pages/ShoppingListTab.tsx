import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { format, parseISO } from "date-fns";
import {
  CalendarIcon,
  MoreVertical,
  Plus,
  ShoppingCart,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Expense } from "../backend.d";
import {
  useAppSettings,
  useCategories,
  useCreateExpense,
} from "../hooks/useQueries";
import { useShoppingList } from "../hooks/useShoppingList";
import { useLanguage } from "../i18n/LanguageContext";

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function ShoppingListTab() {
  const { t } = useLanguage();
  const { items, addItem, toggleBought, deleteItem, clearBought } =
    useShoppingList();
  const { data: categories = [] } = useCategories();
  const { data: settings } = useAppSettings();
  const createExpense = useCreateExpense();
  const currency = settings?.currency ?? "USD";

  // Add item dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [nameError, setNameError] = useState(false);
  const [newDate, setNewDate] = useState(() =>
    new Date().toISOString().substring(0, 10),
  );

  // Log as expense dialog
  const [logDialogItem, setLogDialogItem] = useState<string | null>(null);
  const [logAmount, setLogAmount] = useState("");

  const hasBought = items.some((i) => i.bought);
  const estimatedTotal = items
    .filter((i) => !i.bought)
    .reduce((sum, i) => sum + (i.estimatedPrice ?? 0), 0);

  function openAddDialog() {
    setNewName("");
    setNewCategory(categories[0]?.id ?? "");
    setNewPrice("");
    setNewDate(new Date().toISOString().substring(0, 10));
    setNameError(false);
    setAddOpen(true);
  }

  function handleAddItem() {
    if (!newName.trim()) {
      setNameError(true);
      return;
    }
    const price = newPrice ? Number.parseFloat(newPrice) : undefined;
    addItem(
      newName.trim(),
      newCategory,
      price && !Number.isNaN(price) ? price : undefined,
      newDate || undefined,
    );
    setNewName("");
    setNewPrice("");
    setNameError(false);
    setAddOpen(false);
    toast.success(t("add_item"));
  }

  function handleToggle(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    if (!item.bought) {
      // marking as bought — ask to log
      toggleBought(id);
      toast.success(t("item_bought"));
      const price = item.estimatedPrice;
      setLogAmount(price ? String(price) : "");
      setLogDialogItem(id);
    } else {
      toggleBought(id);
    }
  }

  async function handleLogExpense() {
    const item = items.find((i) => i.id === logDialogItem);
    if (!item) {
      setLogDialogItem(null);
      return;
    }
    const amount = Number.parseFloat(logAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const catId = item.category || categories[0]?.id || "other";
    const expense: Expense = {
      id: crypto.randomUUID(),
      categoryId: catId,
      amount,
      date: new Date().toISOString().substring(0, 10),
      paymentMethod: "Cash",
      note: item.name,
      createdAt: BigInt(Date.now()),
    };
    try {
      await createExpense.mutateAsync(expense);
      toast.success(t("expense_added") ?? "Expense logged");
    } catch {
      toast.error("Failed to log expense");
    }
    setLogDialogItem(null);
  }

  const _getCategoryName = (catId: string) => {
    return categories.find((c) => c.id === catId)?.name ?? catId;
  };

  return (
    <div className="px-4 pt-4 pb-24">
      {/* Section header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              SHOPPING
            </span>
            <span className="text-muted-foreground/40">|</span>
            <span className="text-sm font-semibold text-foreground">
              {t("shopping_list")}
            </span>
          </div>
          {hasBought && (
            <Button
              variant="ghost"
              size="sm"
              data-ocid="shopping.secondary_button"
              onClick={clearBought}
              className="text-xs text-muted-foreground hover:text-destructive h-7 px-2"
            >
              <X className="h-3 w-3 mr-1" />
              {t("clear_bought")}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("shopping_list_desc")}
        </p>
      </div>

      {/* Estimated total banner */}
      <div
        className="rounded-xl p-3 mb-4 flex items-center justify-between"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.52 0.15 160 / 0.15) 0%, oklch(0.38 0.14 162 / 0.10) 100%)",
          border: "1px solid oklch(0.52 0.15 160 / 0.25)",
        }}
      >
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {t("estimated_total")}
          </span>
        </div>
        <span className="text-base font-bold text-primary">
          {formatCurrency(estimatedTotal, currency)}
        </span>
      </div>

      {/* Item list */}
      <div className="space-y-2" data-ocid="shopping.list">
        <AnimatePresence initial={false}>
          {items.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              data-ocid="shopping.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                {t("no_items_yet")}
              </p>
            </motion.div>
          ) : (
            items.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                transition={{ duration: 0.2 }}
                data-ocid={`shopping.item.${idx + 1}`}
                className="flex items-center gap-3 rounded-xl p-3 bg-card border border-border/50 hover:border-border transition-colors"
              >
                <Checkbox
                  id={`item-${item.id}`}
                  data-ocid={`shopping.checkbox.${idx + 1}`}
                  checked={item.bought}
                  onCheckedChange={() => handleToggle(item.id)}
                  className="flex-shrink-0"
                />
                <span
                  className={`flex-1 min-w-0 truncate text-sm font-medium transition-all ${
                    item.bought
                      ? "line-through text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  {item.name}
                </span>
                {item.estimatedPrice !== undefined && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatCurrency(item.estimatedPrice, currency)}
                  </span>
                )}
                <button
                  type="button"
                  data-ocid={`shopping.delete_button.${idx + 1}`}
                  onClick={() => deleteItem(item.id)}
                  className="flex-shrink-0 p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Delete item"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* FAB */}
      <div className="fixed bottom-[4.5rem] left-1/2 -translate-x-1/2 z-50">
        <motion.button
          type="button"
          data-ocid="shopping.open_modal_button"
          onClick={openAddDialog}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:shadow-xl active:scale-95 transition-shadow"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          aria-label={t("add_item")}
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm" data-ocid="shopping.dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              {t("add_item")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Item name */}
            <div className="space-y-1.5">
              <Label htmlFor="item-name">
                {t("item_name")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="item-name"
                data-ocid="shopping.input"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (nameError) setNameError(false);
                }}
                placeholder={t("item_name")}
                className={nameError ? "border-destructive" : ""}
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                autoFocus
              />
              {nameError && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="shopping.error_state"
                >
                  {t("item_name")} is required
                </p>
              )}
            </div>

            {/* Category + Date row */}
            <div className="flex gap-2">
              <div className="space-y-1.5 flex-1">
                <Label>{t("category")}</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger data-ocid="shopping.select" className="h-11">
                    <SelectValue placeholder={t("select_category")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 flex-1">
                <Label>{t("date")}</Label>
                <div className="relative h-11">
                  <div className="flex items-center h-11 rounded-md border border-input bg-background px-3 text-sm cursor-pointer select-none">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
                    <span className="flex-1 truncate">
                      {newDate ? format(parseISO(newDate), "dd.MM.yyyy") : ""}
                    </span>
                  </div>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    style={{ WebkitAppearance: "none" }}
                  />
                </div>
              </div>
            </div>

            {/* Estimated price */}
            <div className="space-y-1.5">
              <Label htmlFor="est-price">
                {t("estimated_price")}{" "}
                <span className="text-muted-foreground text-xs">
                  ({t("optional") ?? "optional"})
                </span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {currency}
                </span>
                <Input
                  id="est-price"
                  data-ocid="shopping.input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="0.00"
                  className="pl-12"
                  onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              data-ocid="shopping.cancel_button"
              onClick={() => setAddOpen(false)}
              className="bg-muted/60"
            >
              {t("cancel")}
            </Button>
            <Button
              data-ocid="shopping.submit_button"
              onClick={handleAddItem}
              className="bg-primary text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-1" />
              {t("add_item")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log as Expense Dialog */}
      <Dialog
        open={!!logDialogItem}
        onOpenChange={(open) => !open && setLogDialogItem(null)}
      >
        <DialogContent className="sm:max-w-xs" data-ocid="shopping.modal">
          <DialogHeader>
            <DialogTitle>{t("log_as_expense")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {items.find((i) => i.id === logDialogItem)?.name}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="log-amount">{t("amount")}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {currency}
                </span>
                <Input
                  id="log-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={logAmount}
                  onChange={(e) => setLogAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-12"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleLogExpense()}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              data-ocid="shopping.cancel_button"
              onClick={() => setLogDialogItem(null)}
              className="bg-muted/60"
            >
              {t("no") ?? "No"}
            </Button>
            <Button
              data-ocid="shopping.confirm_button"
              onClick={handleLogExpense}
              disabled={createExpense.isPending}
              className="bg-primary text-primary-foreground"
            >
              {t("yes") ?? "Yes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
