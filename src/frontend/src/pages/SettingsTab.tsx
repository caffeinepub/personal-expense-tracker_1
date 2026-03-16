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
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Download,
  Fingerprint,
  Globe,
  Hash,
  Info,
  Loader2,
  Lock,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Trash2,
  Wallet,
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
import { LANGUAGES, useLanguage } from "../i18n/LanguageContext";
import { PRESET_COLORS } from "../utils/categories";
import { exportToCSV, exportToJSON } from "../utils/export";

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "\u20ac", name: "Euro" },
  { code: "GBP", symbol: "\u00a3", name: "British Pound" },
  { code: "INR", symbol: "\u20b9", name: "Indian Rupee" },
  { code: "JPY", symbol: "\u00a5", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "CNY", symbol: "\u00a5", name: "Chinese Yuan" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "DKK", symbol: "kr", name: "Danish Krone" },
  { code: "PLN", symbol: "z\u0142", name: "Polish Zloty" },
  { code: "CZK", symbol: "K\u010d", name: "Czech Koruna" },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "$", name: "Mexican Peso" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "KRW", symbol: "\u20a9", name: "South Korean Won" },
];

const DEFAULT_PAYMENT_METHODS = [
  "Cash",
  "Credit Card",
  "Debit Card",
  "Bank Transfer",
  "PayPal",
  "Apple Pay",
  "Google Pay",
];

const NUMBER_FORMATS = [
  {
    id: "en-US",
    label: "1,234.56",
    description: "US / UK (comma thousands, dot decimal)",
  },
  {
    id: "de-DE",
    label: "1.234,56",
    description: "Europe (dot thousands, comma decimal)",
  },
  {
    id: "fr-FR",
    label: "1 234,56",
    description: "French (space thousands, comma decimal)",
  },
  { id: "en-IN", label: "1,23,456", description: "Indian numbering system" },
];

const DATE_FORMATS = [
  { id: "DD.MM.YYYY", label: "DD.MM.YYYY", example: "14.03.2026" },
  { id: "MM/DD/YYYY", label: "MM/DD/YYYY", example: "03/14/2026" },
  { id: "YYYY-MM-DD", label: "YYYY-MM-DD", example: "2026-03-14" },
  { id: "DD/MM/YYYY", label: "DD/MM/YYYY", example: "14/03/2026" },
];

const APP_VERSION = "1.0.0";

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
  const exportForCSV = useExportExpenses();
  const exportForJSON = useExportExpenses();
  const { t, language, setLanguage } = useLanguage();

  const [currency, setCurrency] = useState(settings?.currency ?? "USD");

  // All sections default closed
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportMode, setExportMode] = useState<"month" | "year">("month");
  const [exportMonth, setExportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [exportYear, setExportYear] = useState(() => new Date().getFullYear());
  const [dangerOpen, setDangerOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [paymentMethodsOpen, setPaymentMethodsOpen] = useState(false);
  const [formatsOpen, setFormatsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  const [paymentMethods, setPaymentMethods] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("pe_payment_methods");
      return stored ? JSON.parse(stored) : DEFAULT_PAYMENT_METHODS;
    } catch {
      return DEFAULT_PAYMENT_METHODS;
    }
  });
  const [newPaymentMethod, setNewPaymentMethod] = useState("");

  const [numberFormat, setNumberFormat] = useState(
    () => localStorage.getItem("pe_number_format") ?? "en-US",
  );
  const [dateFormat, setDateFormat] = useState(
    () => localStorage.getItem("pe_date_format") ?? "DD.MM.YYYY",
  );

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
      toast.success(t("currency_updated"));
    } catch {
      toast.error(t("failed_update_currency"));
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
      toast.error(`${t("category_name")} is required`);
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
        toast.success(t("category_updated"));
      } else {
        await createCategory.mutateAsync({
          id: crypto.randomUUID(),
          name: catName.trim(),
          color: catColor,
          budget: Number.isNaN(budget) ? 0 : budget,
        });
        toast.success(t("category_added"));
      }
      setShowCategoryDialog(false);
    } catch {
      toast.error(t("failed_save_category"));
    }
  }

  async function handleDeleteCategory(id: string) {
    try {
      await deleteCategory.mutateAsync(id);
      toast.success(t("category_deleted"));
    } catch {
      toast.error(t("failed_delete_category"));
    }
    setDeleteCategoryId(null);
  }

  async function handleResetData() {
    try {
      await resetData.mutateAsync();
      toast.success(t("data_reset"));
    } catch {
      toast.error(t("failed_reset"));
    }
    setShowResetDialog(false);
  }

  async function handleExportCSV() {
    try {
      const allExpenses = await exportForCSV.mutateAsync();
      const expenses = allExpenses.filter((e) =>
        exportMode === "month"
          ? e.date.startsWith(exportMonth)
          : e.date.startsWith(String(exportYear)),
      );
      exportToCSV(expenses, categories);
      toast.success(t("export_success"));
    } catch {
      toast.error(t("failed_export"));
    }
  }

  async function handleExportJSON() {
    try {
      const allExpenses = await exportForJSON.mutateAsync();
      const expenses = allExpenses.filter((e) =>
        exportMode === "month"
          ? e.date.startsWith(exportMonth)
          : e.date.startsWith(String(exportYear)),
      );
      exportToJSON(expenses, categories);
      toast.success(t("export_success"));
    } catch {
      toast.error(t("failed_export"));
    }
  }

  function addPaymentMethod() {
    const name = newPaymentMethod.trim();
    if (!name) return;
    if (paymentMethods.includes(name)) return;
    const updated = [...paymentMethods, name];
    setPaymentMethods(updated);
    localStorage.setItem("pe_payment_methods", JSON.stringify(updated));
    setNewPaymentMethod("");
  }

  function removePaymentMethod(method: string) {
    const updated = paymentMethods.filter((m) => m !== method);
    setPaymentMethods(updated);
    localStorage.setItem("pe_payment_methods", JSON.stringify(updated));
  }

  function handleNumberFormatChange(val: string) {
    setNumberFormat(val);
    localStorage.setItem("pe_number_format", val);
  }

  function handleDateFormatChange(val: string) {
    setDateFormat(val);
    localStorage.setItem("pe_date_format", val);
  }

  const isSavingCategory = createCategory.isPending || updateCategory.isPending;

  function SectionToggle({
    open,
    onToggle,
    label,
  }: { open: boolean; onToggle: () => void; label: string }) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={onToggle}
        aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
      >
        {open ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>
    );
  }

  if (isInitializing) {
    return (
      <div className="space-y-5 pb-24" data-ocid="settings.loading_state">
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

  if (!identity) {
    return (
      <div className="space-y-5 pb-24">
        <div className="px-4 space-y-5">
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
            <CardContent className="px-6 py-8 flex flex-col items-center text-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl scale-150" />
                <div className="relative w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                  <Lock className="h-7 w-7 text-primary" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h2 className="font-display font-bold text-xl tracking-tight">
                  {t("auth_title")}
                </h2>
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                  {t("auth_desc")}
                </p>
              </div>
              <Button
                onClick={login}
                disabled={isLoggingIn}
                className="w-full gap-2.5 h-12 text-base font-semibold shadow-md shadow-primary/20"
                data-ocid="settings.login.button"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("connecting")}
                  </>
                ) : (
                  <>
                    <Fingerprint className="h-5 w-5" />
                    {t("connect_identity")}
                  </>
                )}
              </Button>
              <div className="w-full space-y-3 pt-1">
                {[
                  {
                    icon: <Fingerprint className="h-3.5 w-3.5 text-primary" />,
                    titleKey: "auth_no_passwords",
                    descKey: "auth_no_passwords_desc",
                  },
                  {
                    icon: <ShieldCheck className="h-3.5 w-3.5 text-primary" />,
                    titleKey: "auth_privacy",
                    descKey: "auth_privacy_desc",
                  },
                  {
                    icon: <Smartphone className="h-3.5 w-3.5 text-primary" />,
                    titleKey: "auth_cross_device",
                    descKey: "auth_cross_device_desc",
                  },
                ].map(({ icon, titleKey, descKey }) => (
                  <div
                    key={titleKey}
                    className="flex items-start gap-3 text-left rounded-xl bg-muted/50 px-4 py-3"
                  >
                    <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      {icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-snug">
                        {t(titleKey)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {t(descKey)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      <div className="px-4 space-y-3">
        {/* Section label */}
        <div>
          <div className="flex items-baseline gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("settings_label")}
            </p>
            <span className="text-xs text-muted-foreground/50">|</span>
            <h2 className="font-display text-xl font-bold tracking-tight">
              {t("preferences_data")}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("preferences_data_desc")}
          </p>
        </div>

        {/* Language */}
        <Card className="bg-blue-50/60 dark:bg-blue-950/20 border-blue-100/80 dark:border-blue-900/30 shadow-sm">
          <CardHeader className="pb-0 pt-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                <CardTitle className="font-display text-base font-semibold">
                  {t("language")}
                </CardTitle>
              </div>
              <SectionToggle
                open={languageOpen}
                onToggle={() => setLanguageOpen((p) => !p)}
                label="language"
              />
            </div>
          </CardHeader>
          {languageOpen && (
            <CardContent className="px-0 pb-2 pt-0">
              <p className="px-4 pt-2 pb-2 text-sm text-muted-foreground">
                {t("language_desc")}
              </p>
              <ul className="divide-y divide-blue-100/60 dark:divide-blue-900/20">
                {LANGUAGES.map((lang) => (
                  <li key={lang.code}>
                    <button
                      type="button"
                      data-ocid={`settings.language.${lang.code}.toggle`}
                      onClick={() => setLanguage(lang.code)}
                      className="w-full flex items-center justify-between px-4 py-2 hover:bg-blue-100/40 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <span className="text-sm font-medium">{lang.label}</span>
                      {language === lang.code && (
                        <Check className="h-4 w-4 text-blue-500" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          )}
        </Card>

        {/* Currency */}
        <Card className="bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-100/80 dark:border-emerald-900/30 shadow-sm">
          <CardHeader className="pb-0 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-base font-semibold">
                {t("currency")}
              </CardTitle>
              <SectionToggle
                open={currencyOpen}
                onToggle={() => setCurrencyOpen((p) => !p)}
                label="currency"
              />
            </div>
          </CardHeader>
          {currencyOpen && (
            <CardContent className="px-4 pb-4 pt-2">
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
          )}
        </Card>

        {/* Categories */}
        <Card className="bg-violet-50/60 dark:bg-violet-950/20 border-violet-100/80 dark:border-violet-900/30 shadow-sm">
          <CardHeader className="pb-0 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-base font-semibold">
                {t("categories")}
              </CardTitle>
              <div className="flex items-center gap-1">
                {categoriesOpen && (
                  <Button
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={openAddCategory}
                    data-ocid="settings.add_category.button"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t("add")}
                  </Button>
                )}
                <SectionToggle
                  open={categoriesOpen}
                  onToggle={() => setCategoriesOpen((p) => !p)}
                  label="categories"
                />
              </div>
            </div>
          </CardHeader>
          {categoriesOpen && (
            <CardContent className="px-0 pb-2 pt-0">
              {categories.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-5 px-4">
                  {t("no_categories_yet")}
                </p>
              ) : (
                <ul className="divide-y divide-violet-100/60 dark:divide-violet-900/20">
                  {categories.map((cat, i) => (
                    <li
                      key={cat.id}
                      className="flex items-center gap-3 px-4 py-2"
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
                            {t("budget_colon_short", {
                              amount: String(cat.budget),
                            })}
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
                          aria-label={`${t("edit")} ${cat.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteCategoryId(cat.id)}
                          data-ocid={`category.delete_button.${i + 1}`}
                          aria-label={`${t("delete")} ${cat.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          )}
        </Card>

        {/* Budget Settings */}
        <Card className="bg-amber-50/60 dark:bg-amber-950/20 border-amber-100/80 dark:border-amber-900/30 shadow-sm">
          <CardHeader className="pb-0 pt-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-amber-500" />
                <CardTitle className="font-display text-base font-semibold">
                  {t("budget_settings")}
                </CardTitle>
              </div>
              <SectionToggle
                open={budgetOpen}
                onToggle={() => setBudgetOpen((p) => !p)}
                label="budget settings"
              />
            </div>
          </CardHeader>
          {budgetOpen && (
            <CardContent className="px-4 pb-4 pt-2 space-y-3">
              <p className="text-sm text-muted-foreground">
                {t("budget_settings_desc")}
              </p>
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  {t("no_categories_configured")}
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {categories.map((cat) => (
                    <li
                      key={cat.id}
                      className="flex items-center justify-between rounded-xl bg-amber-100/40 dark:bg-amber-900/10 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-sm font-medium">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {cat.budget > 0 ? (
                          <span className="text-xs text-muted-foreground font-mono">
                            {cat.budget}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">
                            —
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditCategory(cat)}
                          aria-label={`${t("edit")} ${cat.name} budget`}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          )}
        </Card>

        {/* Payment Methods */}
        <Card className="bg-teal-50/60 dark:bg-teal-950/20 border-teal-100/80 dark:border-teal-900/30 shadow-sm">
          <CardHeader className="pb-0 pt-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-teal-500" />
                <CardTitle className="font-display text-base font-semibold">
                  {t("payment_methods")}
                </CardTitle>
              </div>
              <SectionToggle
                open={paymentMethodsOpen}
                onToggle={() => setPaymentMethodsOpen((p) => !p)}
                label="payment methods"
              />
            </div>
          </CardHeader>
          {paymentMethodsOpen && (
            <CardContent className="px-4 pb-4 pt-2 space-y-3">
              <ul className="space-y-1">
                {paymentMethods.map((method, i) => (
                  <li
                    key={method}
                    className="flex items-center justify-between rounded-xl bg-teal-100/40 dark:bg-teal-900/10 px-3 py-1.5"
                    data-ocid={`payment.item.${i + 1}`}
                  >
                    <span className="text-sm font-medium">{method}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => removePaymentMethod(method)}
                      data-ocid={`payment.delete_button.${i + 1}`}
                      aria-label={`Remove ${method}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 pt-1">
                <Input
                  placeholder={t("new_payment_method_placeholder")}
                  value={newPaymentMethod}
                  onChange={(e) => setNewPaymentMethod(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPaymentMethod()}
                  className="h-10"
                  data-ocid="settings.payment_method.input"
                />
                <Button
                  size="sm"
                  className="h-10 px-3 gap-1"
                  onClick={addPaymentMethod}
                  data-ocid="settings.payment_method.button"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("add")}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Number & Date Format */}
        <Card className="bg-rose-50/60 dark:bg-rose-950/20 border-rose-100/80 dark:border-rose-900/30 shadow-sm">
          <CardHeader className="pb-0 pt-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-rose-500" />
                <CardTitle className="font-display text-base font-semibold">
                  {t("number_date_format")}
                </CardTitle>
              </div>
              <SectionToggle
                open={formatsOpen}
                onToggle={() => setFormatsOpen((p) => !p)}
                label="formats"
              />
            </div>
          </CardHeader>
          {formatsOpen && (
            <CardContent className="px-4 pb-4 pt-2 space-y-5">
              {/* Number format */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label className="text-sm font-medium">
                    {t("number_format")}
                  </Label>
                </div>
                <div className="space-y-1.5">
                  {NUMBER_FORMATS.map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => handleNumberFormatChange(fmt.id)}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left transition-colors border ${
                        numberFormat === fmt.id
                          ? "border-rose-400/60 bg-rose-100/40 dark:bg-rose-900/20"
                          : "border-rose-100/60 dark:border-rose-900/20 bg-rose-50/40 dark:bg-rose-950/10 hover:bg-rose-100/40"
                      }`}
                      data-ocid={`settings.number_format.${fmt.id.toLowerCase().replace("-", "_")}.toggle`}
                    >
                      <span className="text-sm font-mono font-semibold">
                        {fmt.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {fmt.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date format */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label className="text-sm font-medium">
                    {t("date_format")}
                  </Label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DATE_FORMATS.map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => handleDateFormatChange(fmt.id)}
                      className={`flex flex-col items-start rounded-xl px-3 py-2 text-left transition-colors border ${
                        dateFormat === fmt.id
                          ? "border-rose-400/60 bg-rose-100/40 dark:bg-rose-900/20"
                          : "border-rose-100/60 dark:border-rose-900/20 bg-rose-50/40 dark:bg-rose-950/10 hover:bg-rose-100/40"
                      }`}
                      data-ocid={`settings.date_format.${fmt.id.toLowerCase().replace(/\//g, "_").replace(/\./g, "_")}.toggle`}
                    >
                      <span className="text-xs font-mono font-semibold">
                        {fmt.label}
                      </span>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        {fmt.example}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Export */}
        <Card className="bg-sky-50/60 dark:bg-sky-950/20 border-sky-100/80 dark:border-sky-900/30 shadow-sm">
          <CardHeader className="pb-0 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-base font-semibold">
                {t("export_data")}
              </CardTitle>
              <SectionToggle
                open={exportOpen}
                onToggle={() => setExportOpen((p) => !p)}
                label="export data"
              />
            </div>
          </CardHeader>
          {exportOpen && (
            <CardContent className="px-4 pb-4 pt-2 space-y-3">
              {/* Range mode toggle */}
              <div className="flex gap-1.5 p-1 bg-muted rounded-lg">
                <button
                  type="button"
                  data-ocid="settings.export_mode_month.toggle"
                  onClick={() => setExportMode("month")}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    exportMode === "month"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("month")}
                </button>
                <button
                  type="button"
                  data-ocid="settings.export_mode_year.toggle"
                  onClick={() => setExportMode("year")}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    exportMode === "year"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("year")}
                </button>
              </div>

              {/* Range selector */}
              {exportMode === "month" ? (
                <select
                  data-ocid="settings.export_month.select"
                  value={exportMonth}
                  onChange={(e) => setExportMonth(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {Array.from({ length: 24 }, (_, i) => {
                    const d = new Date();
                    d.setDate(1);
                    d.setMonth(d.getMonth() - i);
                    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                    const label = d.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    });
                    return (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <select
                  data-ocid="settings.export_year.select"
                  value={exportYear}
                  onChange={(e) => setExportYear(Number(e.target.value))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const y = new Date().getFullYear() - i;
                    return (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    );
                  })}
                </select>
              )}

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
                {t("export_csv")}
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
                {t("export_json")}
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Danger Zone */}
        <Card className="bg-red-50/60 dark:bg-red-950/20 border border-destructive/20 shadow-sm">
          <CardHeader className="pb-0 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-base font-semibold text-destructive">
                {t("danger_zone")}
              </CardTitle>
              <SectionToggle
                open={dangerOpen}
                onToggle={() => setDangerOpen((p) => !p)}
                label="danger zone"
              />
            </div>
          </CardHeader>
          {dangerOpen && (
            <CardContent className="px-4 pb-4 pt-2">
              <Button
                variant="destructive"
                className="w-full gap-2 h-11"
                onClick={() => setShowResetDialog(true)}
                data-ocid="settings.reset.button"
              >
                <RotateCcw className="h-4 w-4" />
                {t("reset_all_data")}
              </Button>
            </CardContent>
          )}
        </Card>

        {/* About */}
        <Card className="bg-slate-50/60 dark:bg-slate-950/20 border-slate-100/80 dark:border-slate-900/30 shadow-sm">
          <CardHeader className="pb-0 pt-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-slate-500" />
                <CardTitle className="font-display text-base font-semibold">
                  {t("about")}
                </CardTitle>
              </div>
              <SectionToggle
                open={aboutOpen}
                onToggle={() => setAboutOpen((p) => !p)}
                label="about"
              />
            </div>
          </CardHeader>
          {aboutOpen && (
            <CardContent className="px-4 pb-4 pt-2 space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-slate-100/60 dark:bg-slate-900/20 px-4 py-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{t("app_title")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("app_subtitle")}
                  </p>
                </div>
                <div className="ml-auto">
                  <span className="text-xs bg-primary/10 text-primary font-mono px-2 py-1 rounded-full">
                    v{APP_VERSION}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  {
                    icon: <ShieldCheck className="h-3.5 w-3.5 text-primary" />,
                    label: "Authentication",
                    value: "Internet Identity",
                  },
                  {
                    icon: <Lock className="h-3.5 w-3.5 text-primary" />,
                    label: "Storage",
                    value: "Private \u00b7 On-chain",
                  },
                  {
                    icon: <Smartphone className="h-3.5 w-3.5 text-primary" />,
                    label: "Platform",
                    value: "Internet Computer (ICP)",
                  },
                ].map(({ icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                        {icon}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {label}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground text-center pt-1">
                Your data is private and stored only in your personal canister
                on the Internet Computer.
              </p>
            </CardContent>
          )}
        </Card>

        {/* Footer */}
        <div className="pt-2 pb-4 text-center">
          <p className="text-xs text-muted-foreground/50">
            &copy; {new Date().getFullYear()}. {t("built_with")}
          </p>
        </div>
      </div>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingCategory ? t("edit_category") : t("add_category")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">{t("category_name")}</Label>
              <Input
                id="cat-name"
                placeholder={t("category_name_placeholder")}
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="h-11"
                data-ocid="category.name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("color")}</Label>
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
              <Label htmlFor="cat-budget">{t("monthly_budget_optional")}</Label>
              <Input
                id="cat-budget"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={catBudget}
                onChange={(e) => setCatBudget(e.target.value)}
                className="h-11"
                data-ocid="category.budget.input"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCategoryDialog(false)}
              data-ocid="category.cancel.button"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSaveCategory}
              disabled={isSavingCategory}
              data-ocid="category.save.button"
            >
              {isSavingCategory ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <AlertDialog
        open={!!deleteCategoryId}
        onOpenChange={() => setDeleteCategoryId(null)}
      >
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              {t("delete_category_title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete_category_desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="category.cancel.button">
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteCategoryId && handleDeleteCategory(deleteCategoryId)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="category.delete.confirm.button"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Confirmation */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              {t("reset_confirm_title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("reset_confirm_desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="reset.cancel.button">
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetData}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="reset.confirm.button"
            >
              {resetData.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t("reset")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
