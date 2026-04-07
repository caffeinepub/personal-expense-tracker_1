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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { format, parseISO } from "date-fns";
import {
  CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Receipt,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAppSettings,
  useCategories,
  useCreateExpense,
} from "../hooks/useQueries";
import {
  useClearBoughtShoppingItems,
  useCreateShoppingItem,
  useDeleteShoppingItem,
  useShoppingItems,
  useToggleShoppingItemBought,
  useUpdateShoppingItem,
} from "../hooks/useQueries";
import { useLanguage } from "../i18n/LanguageContext";
import type { ShoppingItem } from "../types";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function groupItemsByDate(
  items: ShoppingItem[],
): { dateKey: string; label: string; items: ShoppingItem[] }[] {
  const groups: Record<string, ShoppingItem[]> = {};

  for (const item of items) {
    const key = item.date ?? "__nodate__";
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }

  const sorted = Object.entries(groups).sort(([a], [b]) => {
    if (a === "__nodate__") return 1;
    if (b === "__nodate__") return -1;
    return b.localeCompare(a);
  });

  return sorted.map(([key, groupItems]) => ({
    dateKey: key,
    label:
      key === "__nodate__"
        ? "No Date"
        : format(parseISO(key), "EEEE, MMM d, yyyy"),
    items: groupItems,
  }));
}

interface ShoppingListTabProps {
  month?: string;
  setMonth?: (m: string) => void;
}

export default function ShoppingListTab({
  month,
  setMonth,
}: ShoppingListTabProps) {
  const { t } = useLanguage();
  const { data: items = [] } = useShoppingItems();
  const createShoppingItem = useCreateShoppingItem();
  const updateShoppingItem = useUpdateShoppingItem();
  const deleteShoppingItem = useDeleteShoppingItem();
  const clearBoughtItems = useClearBoughtShoppingItems();
  const toggleItemBought = useToggleShoppingItemBought();
  const { data: categories = [] } = useCategories();
  const { data: settings } = useAppSettings();
  const currency = settings?.currency ?? "USD";

  // Month filter - synced from Dashboard via props
  const [localMonth, setLocalMonth] = useState(() =>
    new Date().toISOString().substring(0, 7),
  );
  const selectedMonth = month ?? localMonth;
  const setSelectedMonth = (m: string) => {
    setLocalMonth(m);
    setMonth?.(m);
  };
  // Month picker popover state
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());

  // Add item dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [nameError, setNameError] = useState(false);
  const [newDate, setNewDate] = useState(() =>
    new Date().toISOString().substring(0, 10),
  );

  // Edit item dialog
  const [editItem, setEditItem] = useState<ShoppingItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNameError, setEditNameError] = useState(false);

  // Log as expense mini-prompt state
  const [logExpensePrompt, setLogExpensePrompt] = useState<ShoppingItem | null>(
    null,
  );
  const [logExpenseOpen, setLogExpenseOpen] = useState(false);
  const [logExpenseData, setLogExpenseData] = useState<{
    categoryId: string;
    note: string;
    amount: string;
    date: string;
  } | null>(null);
  const createExpense = useCreateExpense();

  // Collapsed groups state: absence of key = collapsed (default)
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});

  const isGroupExpanded = (dateKey: string) =>
    collapsedGroups[dateKey] === true;

  function toggleGroup(dateKey: string) {
    setCollapsedGroups((prev) => ({ ...prev, [dateKey]: !prev[dateKey] }));
  }

  // Filter items by selected month
  const filteredItems = items.filter(
    (item) => item.date?.substring(0, 7) === selectedMonth,
  );

  const hasBought = filteredItems.some((i) => i.bought);
  const estimatedTotal = filteredItems
    .filter((i) => !i.bought)
    .reduce((sum, i) => sum + (i.estimatedPrice ?? 0), 0);

  const grouped = groupItemsByDate(filteredItems);

  // Month navigation helpers
  function prevMonth() {
    const [year, month] = selectedMonth.split("-").map(Number);
    const d = new Date(year, month - 2, 1);
    setSelectedMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
  }

  function nextMonth() {
    const [year, month] = selectedMonth.split("-").map(Number);
    const d = new Date(year, month, 1);
    setSelectedMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
  }

  const selectedMonthLabel = format(
    parseISO(`${selectedMonth}-01`),
    "MMMM yyyy",
  );

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
    createShoppingItem.mutate({
      id: crypto.randomUUID(),
      name: newName.trim(),
      category: newCategory,
      estimatedPrice: price && !Number.isNaN(price) ? price : undefined,
      bought: false,
      createdAt: BigInt(Date.now()),
      date: newDate || undefined,
    });
    setNewName("");
    setNewPrice("");
    setNameError(false);
    setAddOpen(false);
    toast.success(t("add_item"));
  }

  function openEditDialog(item: ShoppingItem) {
    setEditItem(item);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditPrice(
      item.estimatedPrice !== undefined ? String(item.estimatedPrice) : "",
    );
    setEditDate(item.date ?? new Date().toISOString().substring(0, 10));
    setEditNameError(false);
  }

  function handleSaveEdit() {
    if (!editItem) return;
    if (!editName.trim()) {
      setEditNameError(true);
      return;
    }
    const price = editPrice ? Number.parseFloat(editPrice) : undefined;
    updateShoppingItem.mutate({
      ...editItem,
      name: editName.trim(),
      category: editCategory,
      estimatedPrice: price && !Number.isNaN(price) ? price : undefined,
      date: editDate || undefined,
    });
    setEditItem(null);
    toast.success("Item updated");
  }

  function handleToggle(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    if (!item.bought) {
      // Marking as bought → toggle first, then show mini-prompt
      toggleItemBought.mutate({ id, bought: true });
      setLogExpensePrompt(item);
    } else {
      // Unchecking — just toggle back
      toggleItemBought.mutate({ id, bought: false });
    }
  }

  return (
    <div className="px-4 pt-4 pb-24">
      {/* Section header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
              SHOPPING
            </span>
            <span className="text-muted-foreground/40">|</span>
            <span className="text-xs font-bold uppercase tracking-widest text-foreground">
              {t("shopping_list")}
            </span>
          </div>
          {hasBought && (
            <Button
              variant="ghost"
              size="sm"
              data-ocid="shopping.secondary_button"
              onClick={() => clearBoughtItems.mutate()}
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

      {/* Month navigation row with Popover picker */}
      <div className="flex items-center gap-2 mb-3">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          data-ocid="shopping.pagination_prev"
          onClick={prevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Popover
          open={monthPickerOpen}
          onOpenChange={(open) => {
            setMonthPickerOpen(open);
            if (open) setPickerYear(Number(selectedMonth.split("-")[0]));
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 flex-1 h-8 rounded-md border border-input bg-background px-3 text-sm font-medium cursor-pointer hover:bg-muted transition-colors"
              data-ocid="shopping.button"
            >
              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
              {selectedMonthLabel}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="center">
            {/* Year navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setPickerYear((y) => y - 1)}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-semibold text-sm">{pickerYear}</span>
              <button
                type="button"
                onClick={() => setPickerYear((y) => y + 1)}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            {/* Month grid */}
            <div className="grid grid-cols-3 gap-1">
              {MONTH_LABELS.map((m, i) => {
                const val = `${pickerYear}-${String(i + 1).padStart(2, "0")}`;
                const isSelected = val === selectedMonth;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(val);
                      setMonthPickerOpen(false);
                    }}
                    className={`text-xs py-1.5 rounded-md transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          data-ocid="shopping.pagination_next"
          onClick={nextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
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

      {/* Item list grouped by date */}
      <div data-ocid="shopping.list">
        <AnimatePresence initial={false}>
          {filteredItems.length === 0 ? (
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
            grouped.map((group) => {
              const expanded = isGroupExpanded(group.dateKey);
              return (
                <motion.div
                  key={group.dateKey}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-4"
                >
                  {/* Collapsible date group header */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.dateKey)}
                    className="flex items-center gap-2 w-full mb-2 px-3 py-1.5 rounded-lg text-left"
                    style={{
                      background: "oklch(0.30 0.06 162 / 0.35)",
                      border: "1px solid oklch(0.52 0.15 160 / 0.20)",
                    }}
                  >
                    <span className="text-xs font-semibold text-foreground flex-1">
                      {group.label}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4"
                    >
                      {group.items.length}
                    </Badge>
                    {expanded ? (
                      <ChevronUp className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>

                  {/* Items in group (animated) */}
                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.div
                        key="items"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div className="space-y-2 pt-1">
                          {group.items.map((item) => {
                            const globalIdx = items.indexOf(item);
                            // Bug 3 fix: resolve category id -> name
                            const categoryName =
                              categories.find((c) => c.id === item.category)
                                ?.name ?? item.category;
                            return (
                              <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20, height: 0 }}
                                transition={{ duration: 0.2 }}
                                data-ocid={`shopping.item.${globalIdx + 1}`}
                                className="flex items-center gap-3 rounded-xl p-3 bg-card border border-border/50 hover:border-border transition-colors"
                              >
                                <Checkbox
                                  id={`item-${item.id}`}
                                  data-ocid={`shopping.checkbox.${globalIdx + 1}`}
                                  checked={item.bought}
                                  onCheckedChange={() => handleToggle(item.id)}
                                  className="flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <span
                                    className={`block truncate text-sm font-medium transition-all ${
                                      item.bought
                                        ? "line-through text-muted-foreground"
                                        : "text-foreground"
                                    }`}
                                  >
                                    {item.name}
                                  </span>
                                  {categoryName && (
                                    <span className="block text-xs text-muted-foreground">
                                      {categoryName}
                                    </span>
                                  )}
                                </div>
                                {item.estimatedPrice !== undefined && (
                                  <span className="text-xs text-muted-foreground flex-shrink-0">
                                    {formatCurrency(
                                      item.estimatedPrice,
                                      currency,
                                    )}
                                  </span>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      data-ocid={`shopping.delete_button.${globalIdx + 1}`}
                                      className="flex-shrink-0 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                      aria-label="Options"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => openEditDialog(item)}
                                    >
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        deleteShoppingItem.mutate(item.id)
                                      }
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 min-w-0">
                <Label className="text-sm font-semibold text-foreground capitalize">
                  {t("category")}
                </Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger
                    data-ocid="shopping.select"
                    className="h-11 w-full text-sm"
                  >
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
              {/* Date field — reliable on mobile and desktop */}
              <div className="space-y-2 min-w-0 overflow-hidden">
                <Label className="text-sm font-semibold text-foreground capitalize">
                  {t("date")}
                </Label>
                <div className="relative w-full overflow-hidden">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full h-11 rounded-md border border-input bg-background pl-9 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                    style={{ minWidth: 0 }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="est-price" className="text-sm font-medium">
                {t("estimated_price")}{" "}
                <span className="text-muted-foreground text-xs font-normal">
                  (Optional)
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

          <div className="pt-2 space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                data-ocid="shopping.cancel_button"
                onClick={() => setAddOpen(false)}
                className="h-11 w-full bg-muted/60"
              >
                {t("cancel")}
              </Button>
              <Button
                data-ocid="shopping.submit_button"
                onClick={handleAddItem}
                className="h-11 w-full bg-primary text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-1" />
                {t("add_item")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-destructive font-semibold">*</span> Required
              field
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog
        open={!!editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
      >
        <DialogContent className="sm:max-w-sm" data-ocid="shopping.dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              Edit Item
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-item-name">
                {t("item_name")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-item-name"
                data-ocid="shopping.input"
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                  if (editNameError) setEditNameError(false);
                }}
                placeholder={t("item_name")}
                className={editNameError ? "border-destructive" : ""}
                onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                autoFocus
              />
              {editNameError && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="shopping.error_state"
                >
                  {t("item_name")} is required
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 min-w-0">
                <Label className="text-sm font-semibold text-foreground capitalize">
                  {t("category")}
                </Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger
                    data-ocid="shopping.select"
                    className="h-11 w-full text-sm"
                  >
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
              {/* Date field — reliable on mobile and desktop */}
              <div className="space-y-2 min-w-0 overflow-hidden">
                <Label className="text-sm font-semibold text-foreground capitalize">
                  {t("date")}
                </Label>
                <div className="relative w-full overflow-hidden">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full h-11 rounded-md border border-input bg-background pl-9 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                    style={{ minWidth: 0 }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-est-price" className="text-sm font-medium">
                {t("estimated_price")}{" "}
                <span className="text-muted-foreground text-xs font-normal">
                  (Optional)
                </span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {currency}
                </span>
                <Input
                  id="edit-est-price"
                  data-ocid="shopping.input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="0.00"
                  className="pl-12"
                  onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                data-ocid="shopping.cancel_button"
                onClick={() => setEditItem(null)}
                className="h-11 w-full bg-muted/60"
              >
                {t("cancel")}
              </Button>
              <Button
                data-ocid="shopping.save_button"
                onClick={handleSaveEdit}
                className="h-11 w-full bg-primary text-primary-foreground"
              >
                Save Changes
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-destructive font-semibold">*</span> Required
              field
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mini-prompt: "Log as expense now?" */}
      <Dialog
        open={!!logExpensePrompt}
        onOpenChange={(open) => {
          if (!open) setLogExpensePrompt(null);
        }}
      >
        <DialogContent
          className="max-w-xs mx-auto rounded-2xl"
          data-ocid="shopping.log_expense_prompt.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-base">Log as expense?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Add &ldquo;{logExpensePrompt?.name}&rdquo; as an expense now?
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              data-ocid="shopping.log_expense_prompt.cancel_button"
              onClick={() => setLogExpensePrompt(null)}
            >
              Skip
            </Button>
            <Button
              data-ocid="shopping.log_expense_prompt.confirm_button"
              onClick={() => {
                if (!logExpensePrompt) return;
                setLogExpenseData({
                  categoryId:
                    logExpensePrompt.category ?? categories[0]?.id ?? "",
                  note: logExpensePrompt.name,
                  amount:
                    logExpensePrompt.estimatedPrice != null
                      ? String(logExpensePrompt.estimatedPrice)
                      : "",
                  date: new Date().toISOString().substring(0, 10),
                });
                setLogExpensePrompt(null);
                setLogExpenseOpen(true);
              }}
            >
              Yes, log it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Log Expense Dialog */}
      <Dialog open={logExpenseOpen} onOpenChange={setLogExpenseOpen}>
        <DialogContent
          className="max-w-sm mx-auto rounded-2xl"
          data-ocid="shopping.quick_log_expense.dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Quick Log Expense
            </DialogTitle>
          </DialogHeader>
          {logExpenseData && (
            <div className="space-y-3 py-1">
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input
                  data-ocid="shopping.quick_log.amount.input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={logExpenseData.amount}
                  onChange={(e) =>
                    setLogExpenseData((d) =>
                      d ? { ...d, amount: e.target.value } : d,
                    )
                  }
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={logExpenseData.categoryId}
                  onValueChange={(v) =>
                    setLogExpenseData((d) => (d ? { ...d, categoryId: v } : d))
                  }
                >
                  <SelectTrigger
                    data-ocid="shopping.quick_log.category.select"
                    className="h-10"
                  >
                    <SelectValue />
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
              <div className="space-y-1.5">
                <Label>Note</Label>
                <Input
                  data-ocid="shopping.quick_log.note.input"
                  value={logExpenseData.note}
                  onChange={(e) =>
                    setLogExpenseData((d) =>
                      d ? { ...d, note: e.target.value } : d,
                    )
                  }
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <input
                  type="date"
                  value={logExpenseData.date}
                  onChange={(e) =>
                    setLogExpenseData((d) =>
                      d ? { ...d, date: e.target.value } : d,
                    )
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              data-ocid="shopping.quick_log.cancel_button"
              onClick={() => setLogExpenseOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="shopping.quick_log.submit_button"
              disabled={createExpense.isPending}
              onClick={async () => {
                if (!logExpenseData) return;
                const amt = Number.parseFloat(logExpenseData.amount);
                if (Number.isNaN(amt) || amt <= 0) {
                  toast.error("Enter a valid amount");
                  return;
                }
                try {
                  await createExpense.mutateAsync({
                    id: crypto.randomUUID(),
                    categoryId: logExpenseData.categoryId,
                    paymentMethod: "Cash",
                    date: logExpenseData.date,
                    note: logExpenseData.note,
                    amount: amt,
                    createdAt: BigInt(Date.now() * 1_000_000),
                  });
                  toast.success("Expense logged");
                  setLogExpenseOpen(false);
                  setLogExpenseData(null);
                } catch {
                  toast.error("Failed to log expense");
                }
              }}
            >
              {createExpense.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Log Expense"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
