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
  Loader2,
  Lock,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Category } from "../backend.d";
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
      <div
        className="px-4 py-5 space-y-5 pb-24"
        data-ocid="settings.loading_state"
      >
        <div>
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  // ── Auth gate ───────────────────────────────────────────────────────────────
  if (!identity) {
    return (
      <div className="px-4 py-5 space-y-5 pb-24">
        {/* Header */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Preferences
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight mt-0.5">
            Settings
          </h1>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="px-4 py-8 flex flex-col items-center text-center gap-5">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-display font-semibold text-lg">
                Sign in to continue
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                Choose a login method to manage your settings, categories,
                currency, and data.
              </p>
            </div>

            {/* Primary: Internet Identity */}
            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="w-full gap-2 h-11"
              data-ocid="settings.login.button"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  {/* Internet Identity logo */}
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 32 32"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="16"
                      cy="16"
                      r="16"
                      fill="white"
                      fillOpacity="0.2"
                    />
                    <path
                      d="M16 6C10.477 6 6 10.477 6 16s4.477 10 10 10 10-4.477 10-10S21.523 6 16 6zm0 2a8 8 0 110 16A8 8 0 0116 8zm0 3a5 5 0 100 10A5 5 0 0016 11z"
                      fill="currentColor"
                    />
                  </svg>
                  Sign In with Internet Identity
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">
                or continue with
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Social login buttons */}
            <div className="flex gap-3 w-full">
              {/* Google */}
              <button
                type="button"
                onClick={login}
                disabled={isLoggingIn}
                data-ocid="settings.google.button"
                aria-label="Sign in with Google"
                className="flex-1 flex items-center justify-center gap-2 h-11 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50"
              >
                <svg
                  className="h-4 w-4 flex-shrink-0"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </button>

              {/* Apple */}
              <button
                type="button"
                onClick={login}
                disabled={isLoggingIn}
                data-ocid="settings.apple.button"
                aria-label="Sign in with Apple"
                className="flex-1 flex items-center justify-center gap-2 h-11 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50"
              >
                <svg
                  className="h-4 w-4 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                Apple
              </button>

              {/* Microsoft */}
              <button
                type="button"
                onClick={login}
                disabled={isLoggingIn}
                data-ocid="settings.microsoft.button"
                aria-label="Sign in with Microsoft"
                className="flex-1 flex items-center justify-center gap-2 h-11 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50"
              >
                <svg
                  className="h-4 w-4 flex-shrink-0"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                  <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
                  <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
                  <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
                </svg>
                Microsoft
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 space-y-5 pb-24">
      {/* Header */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Preferences
        </p>
        <h1 className="font-display text-2xl font-bold tracking-tight mt-0.5">
          Settings
        </h1>
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
  );
}
