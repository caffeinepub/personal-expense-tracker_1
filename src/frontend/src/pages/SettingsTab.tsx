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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  Fingerprint,
  Loader2,
  Lock,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Category } from "../backend.d";
import AppHeader from "../components/AppHeader";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAppSettings,
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useExportExpenses,
  useResetUserData,
  useSetAppSettings,
  useUpdateCategory,
} from "../hooks/useQueries";
import { PRESET_COLORS } from "../utils/categories";
import { exportToCSV, exportToJSON } from "../utils/export";

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
];

export default function SettingsTab() {
  const { identity, login, isInitializing, isLoggingIn } =
    useInternetIdentity();
  const { data: settings } = useAppSettings();
  const { data: categories = [] } = useCategories();
  const setSettings = useSetAppSettings();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const resetData = useResetUserData();
  // Two separate mutation instances so CSV and JSON exports have independent pending states
  const exportForCSV = useExportExpenses();
  const exportForJSON = useExportExpenses();

  const [currency, setCurrency] = useState(settings?.currency ?? "USD");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  // Category form state
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState(PRESET_COLORS[0]);
  const [catBudget, setCatBudget] = useState("");

  useEffect(() => {
    if (settings?.currency) setCurrency(settings.currency);
  }, [settings?.currency]);

  async function handleSaveCurrency(val: string) {
    setCurrency(val);
    try {
      await setSettings.mutateAsync({
        currency: val,
        updatedAt: BigInt(Date.now()),
      });
      toast.success("Currency updated");
    } catch {
      toast.error("Failed to update currency");
    }
  }

  function openAddCategory() {
    setEditingCategory(null);
    setCatName("");
    setCatColor(PRESET_COLORS[0]);
    setCatBudget("");
    setShowCategoryDialog(true);
  }

  function openEditCategory(cat: Category) {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatColor(cat.color);
    setCatBudget(cat.budget > 0 ? cat.budget.toString() : "");
    setShowCategoryDialog(true);
  }

  async function handleSaveCategory() {
    if (!catName.trim()) {
      toast.error("Category name is required");
      return;
    }
    const budget = catBudget ? Number.parseFloat(catBudget) : 0;
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          ...editingCategory,
          name: catName.trim(),
          color: catColor,
          budget: Number.isNaN(budget) ? 0 : budget,
        });
        toast.success("Category updated");
      } else {
        await createCategory.mutateAsync({
          id: crypto.randomUUID(),
          name: catName.trim(),
          color: catColor,
          budget: Number.isNaN(budget) ? 0 : budget,
        });
        toast.success("Category added");
      }
      setShowCategoryDialog(false);
    } catch {
      toast.error("Failed to save category");
    }
  }

  async function handleDeleteCategory(id: string) {
    try {
      await deleteCategory.mutateAsync(id);
      toast.success("Category deleted");
    } catch {
      toast.error("Failed to delete category");
    }
    setDeleteCategoryId(null);
  }

  async function handleResetData() {
    try {
      await resetData.mutateAsync();
      toast.success("All data has been reset");
    } catch {
      toast.error("Failed to reset data");
    }
    setShowResetDialog(false);
  }

  async function handleExportCSV() {
    try {
      const expenses = await exportForCSV.mutateAsync();
      exportToCSV(expenses, categories);
      toast.success("CSV exported");
    } catch {
      toast.error("Export failed");
    }
  }

  async function handleExportJSON() {
    try {
      const expenses = await exportForJSON.mutateAsync();
      exportToJSON(expenses, categories);
      toast.success("JSON exported");
    } catch {
      toast.error("Export failed");
    }
  }

  const isSavingCategory = createCategory.isPending || updateCategory.isPending;

  // ── Auth loading state ──────────────────────────────────────────────────────
  if (isInitializing) {
    return (
      <div className="space-y-5 pb-24" data-ocid="settings.loading_state">
        <AppHeader />
        <div className="px-4 space-y-5">
          <div>
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // ── Auth gate ───────────────────────────────────────────────────────────────
  if (!identity) {
    return (
      <div className="space-y-5 pb-24">
        <AppHeader />

        <div className="px-4 space-y-5">
          <Card className="border-0 shadow-sm overflow-hidden">
            {/* Top accent strip */}
            <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

            <CardContent className="px-6 py-8 flex flex-col items-center text-center gap-6">
              {/* Lock icon with layered glow */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl scale-150" />
                <div className="relative w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                  <Lock className="h-7 w-7 text-primary" />
                </div>
              </div>

              {/* Heading */}
              <div className="space-y-1.5">
                <h2 className="font-display font-bold text-xl tracking-tight">
                  Sign in to continue
                </h2>
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                  Use your device passkey, Face ID, or Touch ID — no password
                  needed.
                </p>
              </div>

              {/* Internet Identity sign-in button */}
              <Button
                onClick={login}
                disabled={isLoggingIn}
                className="w-full gap-2.5 h-12 text-base font-semibold shadow-md shadow-primary/20"
                data-ocid="settings.login.button"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <Fingerprint className="h-5 w-5" />
                    Sign In with Internet Identity
                  </>
                )}
              </Button>

              {/* Feature bullets */}
              <div className="w-full space-y-3 pt-1">
                <div className="flex items-start gap-3 text-left rounded-xl bg-muted/50 px-4 py-3">
                  <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Fingerprint className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-snug">
                      No passwords
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Use your device passkey, Face ID, or Touch ID to
                      authenticate instantly.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-left rounded-xl bg-muted/50 px-4 py-3">
                  <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-snug">
                      Privacy-preserving
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      No email address, no tracking, no third-party accounts
                      required.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-left rounded-xl bg-muted/50 px-4 py-3">
                  <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Smartphone className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-snug">
                      Works across your devices
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Use a hardware security key or authenticator app across
                      all your devices.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      <AppHeader />

      <div className="px-4 space-y-5">
        {/* Section label */}
        <div>
          <div className="flex items-baseline gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Settings
            </p>
            <span className="text-xs text-muted-foreground/50">|</span>
            <h2 className="font-display text-xl font-bold tracking-tight">
              Preferences &amp; Data
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your currency, categories, and app data.
          </p>
        </div>

        {/* Currency */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="font-display text-base font-semibold">
              Currency
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Select value={currency} onValueChange={handleSaveCurrency}>
              <SelectTrigger
                data-ocid="settings.currency.select"
                className="h-11"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="font-medium">{c.symbol}</span>
                    <span className="ml-2 text-muted-foreground">
                      {c.name} ({c.code})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-base font-semibold">
                Categories
              </CardTitle>
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={openAddCategory}
                data-ocid="settings.add_category.button"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            {categories.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6 px-4">
                No categories yet
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {categories.map((cat, i) => (
                  <li
                    key={cat.id}
                    className="flex items-center gap-3 px-4 py-3"
                    data-ocid={`category.item.${i + 1}`}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-border"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{cat.name}</p>
                      {cat.budget > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Budget: {cat.budget}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEditCategory(cat)}
                        data-ocid={`category.edit_button.${i + 1}`}
                        aria-label={`Edit ${cat.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteCategoryId(cat.id)}
                        data-ocid={`category.delete_button.${i + 1}`}
                        aria-label={`Delete ${cat.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Export */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="font-display text-base font-semibold">
              Export Data
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            <Button
              variant="outline"
              className="w-full gap-2 h-11"
              onClick={handleExportCSV}
              disabled={exportForCSV.isPending}
              data-ocid="settings.export_csv.button"
            >
              {exportForCSV.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export as CSV
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2 h-11"
              onClick={handleExportJSON}
              disabled={exportForJSON.isPending}
              data-ocid="settings.export_json.button"
            >
              {exportForJSON.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export as JSON
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border border-destructive/20 shadow-sm">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="font-display text-base font-semibold text-destructive">
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Button
              variant="destructive"
              className="w-full gap-2 h-11"
              onClick={() => setShowResetDialog(true)}
              data-ocid="settings.reset.button"
            >
              <RotateCcw className="h-4 w-4" />
              Reset All Data
            </Button>
          </CardContent>
        </Card>

        {/* Category Dialog */}
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogContent className="max-w-sm mx-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingCategory ? "Edit Category" : "New Category"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="cat-name">Name</Label>
                <Input
                  id="cat-name"
                  placeholder="Category name"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                        catColor === color
                          ? "ring-2 ring-ring ring-offset-2 scale-110"
                          : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setCatColor(color)}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cat-budget">
                  Monthly Budget{" "}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="cat-budget"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00 (no budget)"
                  value={catBudget}
                  onChange={(e) => setCatBudget(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowCategoryDialog(false)}
                data-ocid="expense.cancel.button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCategory}
                disabled={isSavingCategory}
                data-ocid="expense.save.button"
              >
                {isSavingCategory ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingCategory ? (
                  "Update"
                ) : (
                  "Add Category"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete category confirm */}
        <AlertDialog
          open={!!deleteCategoryId}
          onOpenChange={() => setDeleteCategoryId(null)}
        >
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display">
                Delete this category?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Expenses with this category will not be deleted, but they will
                show as unknown category.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  deleteCategoryId && handleDeleteCategory(deleteCategoryId)
                }
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reset confirm */}
        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display text-destructive">
                Reset all data?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your expenses, categories, and
                settings. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-ocid="reset.cancel.button">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleResetData}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={resetData.isPending}
                data-ocid="reset.confirm.button"
              >
                {resetData.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Yes, Reset Everything"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
