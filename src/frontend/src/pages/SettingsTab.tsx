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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Check,
  ChevronDown,
  CreditCard,
  Download,
  FileText,
  Fingerprint,
  Gauge,
  Globe,
  Hash,
  Info,
  KeyRound,
  Loader2,
  Lock,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Star,
  Timer,
  Trash2,
  Upload,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Category } from "../backend.d";

import CreatePINDialog from "../components/CreatePINDialog";
import { useAutoLock } from "../contexts/AutoLockContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAppSettings,
  useCategories,
  useCreateCategory,
  useCreateExpense,
  useDeleteCategory,
  useExportExpenses,
  useIncomeSources,
  useResetUserData,
  useSaveIncomeSources,
  useSetAppSettings,
  useSetMonthlyIncome,
  useUpdateCategory,
} from "../hooks/useQueries";
import { LANGUAGES, useLanguage } from "../i18n/LanguageContext";
import { PRESET_COLORS } from "../utils/categories";
import {
  exportToCSV,
  exportToJSON,
  exportToPDF,
  parseImportCSV,
  parseImportJSON,
} from "../utils/export";
import { currentMonth, formatCurrency } from "../utils/format";
import type { IncomeSource } from "../utils/incomeSources";

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
  const { identity, login, isLoggingIn, isLoginSuccess, isLoginError } =
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
  const { data: backendIncomeSources } = useIncomeSources();
  const saveIncomeSourcesMutation = useSaveIncomeSources();
  const setMonthlyIncomeMutation = useSetMonthlyIncome();
  const qc = useQueryClient();
  const { t, language, setLanguage } = useLanguage();

  const [currency, setCurrency] = useState(settings?.currency ?? "USD");
  const [multiCurrencyEnabled, setMultiCurrencyEnabled] = useState(
    () => localStorage.getItem("pe_multi_currency_enabled") === "true",
  );
  const [secondaryCurrencies, setSecondaryCurrencies] = useState<
    { code: string; rate: number }[]
  >(() => {
    try {
      const v = localStorage.getItem("pe_secondary_currencies");
      return v ? JSON.parse(v) : [];
    } catch {
      return [];
    }
  });

  // All sections default closed
  const [regionalOpen, setRegionalOpen] = useState(false);
  const [financialOpen, setFinancialOpen] = useState(false);
  const [financialTab, setFinancialTab] = useState("income");
  const [securityOpen, setSecurityOpen] = useState(false);
  const [securityTab, setSecurityTab] = useState("autolock");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportMode, setExportMode] = useState<"month" | "quarter" | "year">(
    "month",
  );
  const [exportQuarter, setExportQuarter] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), q: Math.floor(now.getMonth() / 3) + 1 };
  });
  const [exportMonth, setExportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [exportYear, setExportYear] = useState(() => new Date().getFullYear());
  const [importLoading, setImportLoading] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  const createExpense = useCreateExpense();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [showCreatePINDialog, setShowCreatePINDialog] = useState(false);
  const [pinDialogMode, setPinDialogMode] = useState<"create" | "change">(
    "create",
  );
  const {
    enabled: alEnabled,
    lockAfterMinutes,
    hasPin,
    pinLength,
    setEnabled: setAlEnabled,
    setLockAfterMinutes,
    unlock,
  } = useAutoLock();

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showVerifyReset, setShowVerifyReset] = useState(false);
  const [iiResetPending, setIiResetPending] = useState(false);
  const [verifyResetPin, setVerifyResetPin] = useState("");
  const [verifyResetError, setVerifyResetError] = useState("");
  const [isVerifyingReset, setIsVerifyingReset] = useState(false);
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
  const [catPinned, setCatPinned] = useState(false);
  const [catHexInput, setCatHexInput] = useState(PRESET_COLORS[0]);

  // Spending limits state
  const [dailyLimitInput, setDailyLimitInput] = useState("");
  const [weeklyLimitInput, setWeeklyLimitInput] = useState("");
  const [savingLimits, setSavingLimits] = useState(false);

  // Income sources state
  // Income sources come from React Query (backend is source of truth)
  const incomeSources = backendIncomeSources ?? [];
  const [showIncomeDialog, setShowIncomeDialog] = useState(false);
  const [editingIncomeSource, setEditingIncomeSource] =
    useState<IncomeSource | null>(null);
  const [deleteIncomeSourceId, setDeleteIncomeSourceId] = useState<
    string | null
  >(null);
  const [incName, setIncName] = useState("");
  const [incColor, setIncColor] = useState(PRESET_COLORS[0]);
  const [incBudget, setIncBudget] = useState("");

  useEffect(() => {
    if (settings?.currency) setCurrency(settings.currency);
  }, [settings?.currency]);

  // Sync spending limits from settings
  useEffect(() => {
    if (settings?.dailyLimit != null)
      setDailyLimitInput(String(settings.dailyLimit));
    if (settings?.weeklyLimit != null)
      setWeeklyLimitInput(String(settings.weeklyLimit));
  }, [settings?.dailyLimit, settings?.weeklyLimit]);

  useEffect(() => {
    if (iiResetPending && isLoginSuccess) {
      setIiResetPending(false);
      setShowVerifyReset(false);
      setShowResetDialog(true);
    }
  }, [isLoginSuccess, iiResetPending]);

  useEffect(() => {
    if (iiResetPending && isLoginError) {
      setIiResetPending(false);
    }
  }, [isLoginError, iiResetPending]);

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
    setCatHexInput(PRESET_COLORS[0]);
    setCatBudget("");
    setCatPinned(false);
    setShowCategoryDialog(true);
  }

  function openEditCategory(cat: Category) {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatColor(cat.color);
    setCatHexInput(cat.color);
    setCatBudget(cat.budget > 0 ? cat.budget.toString() : "");
    setCatPinned(cat.pinned ?? false);
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
          pinned: catPinned || null,
        });
        toast.success(t("category_updated"));
      } else {
        await createCategory.mutateAsync({
          id: crypto.randomUUID(),
          name: catName.trim(),
          color: catColor,
          budget: Number.isNaN(budget) ? 0 : budget,
          pinned: catPinned || null,
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

  function openAddIncome() {
    setEditingIncomeSource(null);
    setIncName("");
    setIncColor(PRESET_COLORS[0]);
    setIncBudget("");
    setShowIncomeDialog(true);
  }
  function openEditIncome(src: IncomeSource) {
    setEditingIncomeSource(src);
    setIncName(src.name);
    setIncColor(src.color);
    setIncBudget(src.monthlyBudget > 0 ? src.monthlyBudget.toString() : "");
    setShowIncomeDialog(true);
  }
  async function handleSaveIncome() {
    if (!incName.trim()) {
      toast.error("Income name is required");
      return;
    }
    const budget = incBudget ? Number.parseFloat(incBudget) : 0;
    let updated: IncomeSource[];
    if (editingIncomeSource) {
      updated = incomeSources.map((s) =>
        s.id === editingIncomeSource.id
          ? {
              ...s,
              name: incName.trim(),
              color: incColor,
              monthlyBudget: Number.isNaN(budget) ? 0 : budget,
            }
          : s,
      );
    } else {
      updated = [
        ...incomeSources,
        {
          id: crypto.randomUUID(),
          name: incName.trim(),
          color: incColor,
          monthlyBudget: Number.isNaN(budget) ? 0 : budget,
        },
      ];
    }
    // Optimistically update React Query cache immediately (no race condition)
    qc.setQueryData(["incomeSources"], updated);
    setShowIncomeDialog(false);
    // Sync to backend
    try {
      await saveIncomeSourcesMutation.mutateAsync(updated);
      // Auto-sync total budget to monthly income spent card
      const totalBudget = updated.reduce(
        (sum, s) => sum + (s.monthlyBudget || 0),
        0,
      );
      await setMonthlyIncomeMutation.mutateAsync({
        month: currentMonth(),
        amount: totalBudget,
      });
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["income"] });
    } catch {
      // Revert on failure
      qc.invalidateQueries({ queryKey: ["incomeSources"] });
      toast.error("Failed to save income source. Please try again.");
    }
  }
  async function handleDeleteIncome(id: string) {
    const updated = incomeSources.filter((s) => s.id !== id);
    // Optimistically update React Query cache
    qc.setQueryData(["incomeSources"], updated);
    setDeleteIncomeSourceId(null);
    // Sync to backend
    try {
      await saveIncomeSourcesMutation.mutateAsync(updated);
      const totalBudget = updated.reduce(
        (sum, s) => sum + (s.monthlyBudget || 0),
        0,
      );
      await setMonthlyIncomeMutation.mutateAsync({
        month: currentMonth(),
        amount: totalBudget,
      });
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["income"] });
    } catch {
      // Revert on failure
      qc.invalidateQueries({ queryKey: ["incomeSources"] });
      toast.error("Failed to delete income source. Please try again.");
    }
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

  async function handleImport(file: File) {
    setImportLoading(true);
    try {
      const text = await file.text();
      let expenses: any[] = [];
      if (file.name.endsWith(".json")) {
        expenses = parseImportJSON(text);
      } else if (file.name.endsWith(".csv")) {
        expenses = parseImportCSV(text);
      } else {
        toast.error("Please select a CSV or JSON file");
        return;
      }
      let successCount = 0;
      for (const e of expenses) {
        try {
          const newExpense = {
            ...e,
            id: crypto.randomUUID(),
            createdAt: BigInt(Date.now()),
            note: e.note ?? "",
            paymentMethod: e.paymentMethod ?? "",
            categoryId: e.categoryId ?? "",
          };
          await createExpense.mutateAsync(newExpense);
          successCount++;
        } catch {
          /* skip individual failures */
        }
      }
      toast.success(`Imported ${successCount} of ${expenses.length} records`);
    } catch {
      toast.error("Import failed: invalid file format");
    } finally {
      setImportLoading(false);
    }
  }

  function getExportMonths(): string[] {
    if (exportMode === "month") return [exportMonth];
    if (exportMode === "quarter") {
      const startM = (exportQuarter.q - 1) * 3 + 1;
      return [0, 1, 2].map(
        (i) => `${exportQuarter.year}-${String(startM + i).padStart(2, "0")}`,
      );
    }
    return Array.from(
      { length: 12 },
      (_, i) => `${exportYear}-${String(i + 1).padStart(2, "0")}`,
    );
  }

  async function handleExportCSV() {
    try {
      const allExpenses = await exportForCSV.mutateAsync();
      const months = getExportMonths();
      const expenses = allExpenses.filter((e) =>
        months.some((m) => e.date.startsWith(m)),
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
      const months = getExportMonths();
      const expenses = allExpenses.filter((e) =>
        months.some((m) => e.date.startsWith(m)),
      );
      exportToJSON(expenses, categories);
      toast.success(t("export_success"));
    } catch {
      toast.error(t("failed_export"));
    }
  }

  async function handleExportPDF() {
    try {
      const allExpenses = await exportForCSV.mutateAsync();
      const months = getExportMonths();
      const expenses = allExpenses.filter((e) =>
        months.some((m) => e.date.startsWith(m)),
      );
      const periodLabel =
        exportMode === "month"
          ? new Date(`${exportMonth}-01`).toLocaleDateString("en", {
              month: "long",
              year: "numeric",
            })
          : exportMode === "quarter"
            ? `Q${exportQuarter.q} ${exportQuarter.year}`
            : String(exportYear);
      await exportToPDF(expenses, categories, currency, periodLabel, 0);
      toast.success("PDF exported successfully");
    } catch {
      toast.error("Failed to export PDF");
    }
  }

  async function handleSaveSpendingLimits() {
    const daily =
      dailyLimitInput !== "" ? Number.parseFloat(dailyLimitInput) : null;
    const weekly =
      weeklyLimitInput !== "" ? Number.parseFloat(weeklyLimitInput) : null;
    setSavingLimits(true);
    try {
      await setSettings.mutateAsync({
        currency: settings?.currency ?? currency,
        updatedAt: BigInt(Date.now()),
        dailyLimit: daily,
        weeklyLimit: weekly,
      });
      toast.success("Spending limits saved");
    } catch {
      toast.error("Failed to save limits");
    } finally {
      setSavingLimits(false);
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

  function SectionToggle({ open, label }: { open: boolean; label: string }) {
    return (
      <div
        className={`h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"}`}
        aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
      >
        <ChevronDown className="h-4 w-4" />
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
              <div className="w-full space-y-2 pt-0.5">
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
                    className="flex items-start gap-3 text-left rounded-xl bg-muted/50 px-4 py-2"
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

  async function handleVerifyBeforeReset() {
    if (!verifyResetPin || verifyResetPin.length < pinLength) {
      setVerifyResetError("Enter your full PIN");
      return;
    }
    setIsVerifyingReset(true);
    const ok = await unlock(verifyResetPin);
    setIsVerifyingReset(false);
    if (ok) {
      setShowVerifyReset(false);
      setVerifyResetPin("");
      setVerifyResetError("");
      setShowResetDialog(true);
    } else {
      setVerifyResetError("Incorrect PIN. Try again.");
    }
  }

  return (
    <div className="space-y-5 pb-24">
      <div className="px-4 space-y-2.5">
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

        {/* Regional Settings */}
        <Card className="bg-teal-50/60 dark:bg-teal-950/20 border-teal-100/80 dark:border-teal-900/30 shadow-sm">
          <CardHeader
            className="pb-0 pt-2.5 px-4 cursor-pointer select-none"
            onClick={() => setRegionalOpen((p) => !p)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-teal-500" />
                <CardTitle className="font-display text-base font-semibold">
                  Regional Settings
                </CardTitle>
              </div>
              <SectionToggle open={regionalOpen} label="regional settings" />
            </div>
            <p className="text-xs text-muted-foreground mt-1 pb-1">
              Configure your preferred language and regional formatting options
              for the application.
            </p>
          </CardHeader>
          <div
            className={`grid transition-all duration-300 ease-in-out ${regionalOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          >
            <div className="overflow-hidden">
              <CardContent className="px-4 pb-4 pt-2">
                <Tabs defaultValue="language">
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="language" className="flex-1 text-xs">
                      {t("language")}
                    </TabsTrigger>
                    <TabsTrigger value="currency" className="flex-1 text-xs">
                      {t("currency")}
                    </TabsTrigger>
                    <TabsTrigger value="number-date" className="flex-1 text-xs">
                      {t("number_date_format")}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="language" className="mt-0">
                    <p className="pb-2 text-sm text-muted-foreground">
                      {t("language_desc")}
                    </p>
                    <ul className="divide-y divide-teal-100/60 dark:divide-teal-900/20">
                      {LANGUAGES.map((lang) => (
                        <li key={lang.code}>
                          <button
                            type="button"
                            data-ocid={`settings.language.${lang.code}.toggle`}
                            onClick={() => setLanguage(lang.code)}
                            className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-teal-100/40 dark:hover:bg-teal-900/20 transition-colors rounded"
                          >
                            <span className="text-sm font-medium">
                              {lang.label}
                            </span>
                            {language === lang.code && (
                              <Check className="h-4 w-4 text-teal-500" />
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </TabsContent>

                  <TabsContent value="currency" className="mt-0">
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
                    {/* Multi-currency */}
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Multi-Currency</p>
                          <p className="text-xs text-muted-foreground">
                            Log expenses in other currencies
                          </p>
                        </div>
                        <Switch
                          data-ocid="settings.multi_currency.switch"
                          checked={multiCurrencyEnabled}
                          onCheckedChange={(v) => {
                            setMultiCurrencyEnabled(v);
                            localStorage.setItem(
                              "pe_multi_currency_enabled",
                              v ? "true" : "false",
                            );
                          }}
                        />
                      </div>

                      {multiCurrencyEnabled && (
                        <div className="space-y-2">
                          {secondaryCurrencies.map((sc, idx) => (
                            <div
                              key={`${sc.code}-${idx}`}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="text"
                                maxLength={3}
                                placeholder="USD"
                                value={sc.code}
                                onChange={(e) => {
                                  const updated = [...secondaryCurrencies];
                                  updated[idx] = {
                                    ...updated[idx],
                                    code: e.target.value.toUpperCase(),
                                  };
                                  setSecondaryCurrencies(updated);
                                  localStorage.setItem(
                                    "pe_secondary_currencies",
                                    JSON.stringify(updated),
                                  );
                                }}
                                data-ocid={`settings.secondary_currency.code.${idx + 1}`}
                                className="w-16 h-8 rounded-lg border border-border bg-background px-2 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                              <input
                                type="number"
                                min="0"
                                step="0.0001"
                                placeholder="Rate"
                                value={sc.rate || ""}
                                onChange={(e) => {
                                  const updated = [...secondaryCurrencies];
                                  updated[idx] = {
                                    ...updated[idx],
                                    rate: Number(e.target.value),
                                  };
                                  setSecondaryCurrencies(updated);
                                  localStorage.setItem(
                                    "pe_secondary_currencies",
                                    JSON.stringify(updated),
                                  );
                                }}
                                data-ocid={`settings.secondary_currency.rate.${idx + 1}`}
                                className="flex-1 h-8 rounded-lg border border-border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                              <button
                                type="button"
                                data-ocid={`settings.secondary_currency.delete_button.${idx + 1}`}
                                onClick={() => {
                                  const updated = secondaryCurrencies.filter(
                                    (_, i) => i !== idx,
                                  );
                                  setSecondaryCurrencies(updated);
                                  localStorage.setItem(
                                    "pe_secondary_currencies",
                                    JSON.stringify(updated),
                                  );
                                }}
                                className="h-8 w-8 flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                          {secondaryCurrencies.length < 5 && (
                            <button
                              type="button"
                              data-ocid="settings.add_secondary_currency.button"
                              onClick={() => {
                                const updated = [
                                  ...secondaryCurrencies,
                                  { code: "", rate: 1 },
                                ];
                                setSecondaryCurrencies(updated);
                                localStorage.setItem(
                                  "pe_secondary_currencies",
                                  JSON.stringify(updated),
                                );
                              }}
                              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add Currency
                            </button>
                          )}
                          <p className="text-[10px] text-muted-foreground">
                            Rate = units of secondary per 1 {currency} (e.g. 1
                            EUR = 1.08 USD → rate 1.08)
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="number-date" className="mt-0 space-y-5">
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
                                ? "border-teal-400/60 bg-teal-100/40 dark:bg-teal-900/20"
                                : "border-teal-100/60 dark:border-teal-900/20 bg-teal-50/40 dark:bg-teal-950/10 hover:bg-teal-100/40"
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
                                ? "border-teal-400/60 bg-teal-100/40 dark:bg-teal-900/20"
                                : "border-teal-100/60 dark:border-teal-900/20 bg-teal-50/40 dark:bg-teal-950/10 hover:bg-teal-100/40"
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
                  </TabsContent>
                </Tabs>
              </CardContent>
            </div>
          </div>
        </Card>

        {/* Financial Settings */}
        <Card className="bg-amber-50/60 dark:bg-amber-950/20 border-amber-100/80 dark:border-amber-900/30 shadow-sm">
          <CardHeader
            className="pb-0 pt-2.5 px-4 cursor-pointer select-none"
            onClick={() => setFinancialOpen((p) => !p)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-amber-500" />
                <CardTitle className="font-display text-base font-semibold">
                  Financial Settings
                </CardTitle>
              </div>
              <SectionToggle open={financialOpen} label="financial settings" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 pb-1">
              Manage your categories, budgets, and payment methods.
            </p>
          </CardHeader>
          <div
            className={`grid transition-all duration-300 ease-in-out ${financialOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          >
            <div className="overflow-hidden">
              <CardContent className="px-4 pb-3 pt-1.5">
                <Tabs value={financialTab} onValueChange={setFinancialTab}>
                  <TabsList className="w-full grid grid-cols-5 h-9 mb-3">
                    <TabsTrigger
                      value="income"
                      className="text-xs"
                      data-ocid="settings.financial.income.tab"
                    >
                      Incomes
                    </TabsTrigger>
                    <TabsTrigger
                      value="category"
                      className="text-xs"
                      data-ocid="settings.financial.category.tab"
                    >
                      {t("categories")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="budget"
                      className="text-xs"
                      data-ocid="settings.financial.budget.tab"
                    >
                      Budgets
                    </TabsTrigger>
                    <TabsTrigger
                      value="payment"
                      className="text-xs"
                      data-ocid="settings.financial.payment.tab"
                    >
                      Payments
                    </TabsTrigger>
                    <TabsTrigger
                      value="limits"
                      className="text-xs"
                      data-ocid="settings.financial.limits.tab"
                    >
                      Limits
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="income" className="mt-0">
                    <div className="flex justify-end mb-2">
                      <Button
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={openAddIncome}
                        data-ocid="settings.add_income.button"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add
                      </Button>
                    </div>
                    {incomeSources.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-5 px-4">
                        No income sources yet. Add your first one.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {incomeSources.map((src) => (
                          <div
                            key={src.id}
                            className="flex items-center gap-2 py-2 px-1 rounded-lg hover:bg-muted/40"
                            data-ocid="income.item"
                          >
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: src.color }}
                            />
                            <span className="flex-1 text-sm font-medium truncate">
                              {src.name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {formatCurrency(src.monthlyBudget, currency)}
                            </span>
                            <button
                              type="button"
                              onClick={() => openEditIncome(src)}
                              className="p-1 text-muted-foreground hover:text-foreground"
                              data-ocid="income.edit_button"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteIncomeSourceId(src.id)}
                              className="p-1 text-muted-foreground hover:text-destructive"
                              data-ocid="income.delete_button"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="category" className="mt-0">
                    <div className="flex justify-end mb-2">
                      <Button
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={openAddCategory}
                        data-ocid="settings.add_category.button"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {t("add")}
                      </Button>
                    </div>
                    {categories.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-5 px-4">
                        {t("no_categories_yet")}
                      </p>
                    ) : (
                      <ul className="divide-y divide-amber-100/60 dark:divide-amber-900/20">
                        {[...categories]
                          .sort((a, b) => {
                            const pa = a.pinned ? 1 : 0;
                            const pb = b.pinned ? 1 : 0;
                            if (pb !== pa) return pb - pa;
                            return a.name.localeCompare(b.name);
                          })
                          .map((cat, i) => (
                            <li
                              key={cat.id}
                              className="flex items-center gap-3 px-1 py-1.5"
                              data-ocid={`category.item.${i + 1}`}
                            >
                              <div
                                className="w-5 h-5 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-border"
                                style={{ backgroundColor: cat.color }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">
                                  {cat.name}
                                </p>
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
                                  className={`h-7 w-7 ${cat.pinned ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground hover:text-amber-500"}`}
                                  onClick={async () => {
                                    try {
                                      await updateCategory.mutateAsync({
                                        ...cat,
                                        pinned: !cat.pinned || null,
                                      });
                                    } catch {
                                      toast.error("Failed to update pin");
                                    }
                                  }}
                                  data-ocid={`category.toggle.${i + 1}`}
                                  aria-label={
                                    cat.pinned
                                      ? "Unpin category"
                                      : "Pin category"
                                  }
                                  title={
                                    cat.pinned
                                      ? "Pinned — click to unpin"
                                      : "Click to pin to top"
                                  }
                                >
                                  <Star
                                    className={`h-3.5 w-3.5 ${cat.pinned ? "fill-amber-500" : ""}`}
                                  />
                                </Button>
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
                  </TabsContent>
                  <TabsContent value="budget" className="mt-0">
                    <p className="text-sm text-muted-foreground mb-2">
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
                            className="flex items-center justify-between rounded-xl bg-amber-100/40 dark:bg-amber-900/10 px-3 py-1.5"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: cat.color }}
                              />
                              <span className="text-sm font-medium">
                                {cat.name}
                              </span>
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
                  </TabsContent>
                  <TabsContent value="payment" className="mt-0 space-y-2">
                    <ul className="space-y-1">
                      {paymentMethods.map((method, i) => (
                        <li
                          key={method}
                          className="flex items-center justify-between rounded-xl bg-amber-100/40 dark:bg-amber-900/10 px-3 py-1.5"
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
                        onKeyDown={(e) =>
                          e.key === "Enter" && addPaymentMethod()
                        }
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
                  </TabsContent>
                  <TabsContent value="limits" className="mt-0 space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Set daily and weekly spending caps. An alert appears on
                      the Dashboard when you approach or exceed them.
                    </p>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="daily-limit"
                          className="flex items-center gap-1.5 text-sm font-medium"
                        >
                          <Gauge className="h-3.5 w-3.5 text-amber-500" />
                          Daily Limit ({currency})
                        </Label>
                        <Input
                          id="daily-limit"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="No limit"
                          value={dailyLimitInput}
                          onChange={(e) => setDailyLimitInput(e.target.value)}
                          className="h-11"
                          data-ocid="settings.daily_limit.input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="weekly-limit"
                          className="flex items-center gap-1.5 text-sm font-medium"
                        >
                          <Gauge className="h-3.5 w-3.5 text-blue-500" />
                          Weekly Limit ({currency})
                        </Label>
                        <Input
                          id="weekly-limit"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="No limit"
                          value={weeklyLimitInput}
                          onChange={(e) => setWeeklyLimitInput(e.target.value)}
                          className="h-11"
                          data-ocid="settings.weekly_limit.input"
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full h-11 gap-2"
                      onClick={handleSaveSpendingLimits}
                      disabled={savingLimits}
                      data-ocid="settings.limits.save_button"
                    >
                      {savingLimits ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Save Limits
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </div>
          </div>
        </Card>

        {/* Export */}
        <Card className="bg-sky-50/60 dark:bg-sky-950/20 border-sky-100/80 dark:border-sky-900/30 shadow-sm">
          <CardHeader
            className="pb-0 pt-2.5 px-4 cursor-pointer select-none"
            onClick={() => setExportOpen((p) => !p)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-base font-semibold">
                {t("export_data")}
              </CardTitle>
              <SectionToggle open={exportOpen} label="export data" />
            </div>
            <p className="text-xs text-muted-foreground mt-1 pb-1">
              Select a date range and export or import your expense data.
            </p>
          </CardHeader>
          <div
            className={`grid transition-all duration-300 ease-in-out ${exportOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          >
            <div className="overflow-hidden">
              <CardContent className="px-4 pb-3 pt-1.5 space-y-2">
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
                    data-ocid="settings.export_mode_quarter.toggle"
                    onClick={() => setExportMode("quarter")}
                    className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      exportMode === "quarter"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Quarter
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
                {exportMode === "month" && (
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
                )}
                {exportMode === "quarter" && (
                  <select
                    data-ocid="settings.export_quarter.select"
                    value={`${exportQuarter.year}-Q${exportQuarter.q}`}
                    onChange={(e) => {
                      const [yr, q] = e.target.value.split("-Q");
                      setExportQuarter({ year: Number(yr), q: Number(q) });
                    }}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {Array.from({ length: 8 }, (_, i) => {
                      const now = new Date();
                      const totalQ =
                        Math.floor(now.getMonth() / 3) + now.getFullYear() * 4;
                      const tq = totalQ - i;
                      const yr = Math.floor(tq / 4);
                      const q = (tq % 4) + 1;
                      return (
                        <option key={`${yr}-Q${q}`} value={`${yr}-Q${q}`}>
                          Q{q} {yr}
                        </option>
                      );
                    })}
                  </select>
                )}
                {exportMode === "year" && (
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
                <Button
                  variant="outline"
                  className="w-full gap-2 h-11 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
                  onClick={handleExportPDF}
                  data-ocid="settings.export_pdf.button"
                >
                  <FileText className="h-4 w-4" />
                  Export PDF Report
                </Button>
                {/* Import section */}
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-sm font-semibold mb-1">Import Data</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Restore from a previously exported CSV or JSON file.
                  </p>
                  <input
                    ref={importFileRef}
                    type="file"
                    accept=".csv,.json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImport(file);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    variant="outline"
                    className="w-full gap-2 h-11"
                    onClick={() => importFileRef.current?.click()}
                    disabled={importLoading}
                    data-ocid="settings.import_data.button"
                  >
                    {importLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Import CSV / JSON
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </div>
          </div>
        </Card>

        {/* Security & Privacy Settings */}
        <Card className="bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-100/80 dark:border-indigo-900/30 shadow-sm">
          <CardHeader
            className="pb-0 pt-2.5 px-4 cursor-pointer select-none"
            onClick={() => setSecurityOpen((p) => !p)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-500" />
                <CardTitle className="font-display text-base font-semibold">
                  Security &amp; Privacy Settings
                </CardTitle>
              </div>
              <SectionToggle
                open={securityOpen}
                label="security privacy settings"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 pb-1">
              Manage your Security &amp; Privacy Settings.
            </p>
          </CardHeader>
          <div
            className={`grid transition-all duration-300 ease-in-out ${securityOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          >
            <div className="overflow-hidden">
              <CardContent className="px-4 pb-3 pt-1.5">
                <Tabs value={securityTab} onValueChange={setSecurityTab}>
                  <TabsList className="w-full grid grid-cols-2 h-9 mb-3">
                    <TabsTrigger
                      value="autolock"
                      className="text-xs"
                      data-ocid="settings.security.autolock.tab"
                    >
                      Auto-Lock
                    </TabsTrigger>
                    <TabsTrigger
                      value="dangerzone"
                      className="text-xs"
                      data-ocid="settings.security.dangerzone.tab"
                    >
                      {t("danger_zone")}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="autolock" className="mt-0 space-y-2">
                    {/* Enable toggle */}
                    <div className="flex items-center justify-between py-1.5">
                      <div>
                        <p className="text-sm font-medium">Auto-Lock</p>
                        <p className="text-xs text-muted-foreground">
                          Automatically lock session after inactivity
                        </p>
                      </div>
                      <Switch
                        checked={alEnabled}
                        onCheckedChange={(val) => {
                          if (val && !hasPin) {
                            setPinDialogMode("create");
                            setShowCreatePINDialog(true);
                          } else {
                            setAlEnabled(val);
                          }
                        }}
                        data-ocid="settings.autolock.switch"
                      />
                    </div>
                    {/* Lock After */}
                    {alEnabled && (
                      <div className="flex items-center justify-between py-1.5">
                        <div>
                          <p className="text-sm font-medium">Lock After</p>
                          <p className="text-xs text-muted-foreground">
                            Session locks after this period
                          </p>
                        </div>
                        <Select
                          value={String(lockAfterMinutes)}
                          onValueChange={(v) => setLockAfterMinutes(Number(v))}
                        >
                          <SelectTrigger
                            className="w-28 h-9"
                            data-ocid="settings.autolock.select"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Never</SelectItem>
                            <SelectItem value="1">1 min</SelectItem>
                            <SelectItem value="5">5 min</SelectItem>
                            <SelectItem value="10">10 min</SelectItem>
                            <SelectItem value="15">15 min</SelectItem>
                            <SelectItem value="30">30 min</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {/* Change PIN */}
                    <div className="flex items-center justify-between py-1.5">
                      <div>
                        <p className="text-sm font-medium">Change PIN</p>
                        <p className="text-xs text-muted-foreground">
                          {hasPin ? "Update your unlock PIN" : "No PIN set yet"}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 h-8"
                        onClick={() => {
                          setPinDialogMode(hasPin ? "change" : "create");
                          setShowCreatePINDialog(true);
                        }}
                        data-ocid="settings.pin.button"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        {hasPin ? "Change" : "Set PIN"}
                      </Button>
                    </div>
                    {/* Session Security info */}
                    <div className="rounded-lg bg-indigo-100/40 dark:bg-indigo-900/20 px-3 py-2.5 flex items-start gap-2">
                      <ShieldCheck className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        {alEnabled
                          ? `Auto-Lock: Enabled · Locks after ${lockAfterMinutes === 0 ? "Never" : lockAfterMinutes >= 60 ? "1 hour" : `${lockAfterMinutes} min`} · ${hasPin ? "PIN configured" : "No PIN set"}`
                          : "Auto-Lock: Disabled · Session will not lock automatically"}
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="dangerzone" className="mt-0">
                    <Button
                      variant="destructive"
                      className="w-full gap-2 h-11"
                      onClick={() => {
                        if (hasPin) {
                          setVerifyResetPin("");
                          setVerifyResetError("");
                          setShowVerifyReset(true);
                        } else {
                          setShowResetDialog(true);
                        }
                      }}
                      data-ocid="settings.reset.button"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {t("reset_all_data")}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </div>
          </div>
        </Card>

        {/* About */}
        <Card className="bg-slate-50/60 dark:bg-slate-950/20 border-slate-100/80 dark:border-slate-900/30 shadow-sm">
          <CardHeader
            className="pb-0 pt-2.5 px-4 cursor-pointer select-none"
            onClick={() => setAboutOpen((p) => !p)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-slate-500" />
                <CardTitle className="font-display text-base font-semibold">
                  {t("about")}
                </CardTitle>
              </div>
              <SectionToggle open={aboutOpen} label="about" />
            </div>
            <p className="text-xs text-muted-foreground mt-1 pb-1">
              App information and version details.
            </p>
          </CardHeader>
          <div
            className={`grid transition-all duration-300 ease-in-out ${aboutOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          >
            <div className="overflow-hidden">
              <CardContent className="px-4 pb-3 pt-1.5 space-y-2">
                <div className="flex items-center gap-3 rounded-xl bg-slate-100/60 dark:bg-slate-900/20 px-4 py-2">
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
                      icon: (
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      ),
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
                      className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
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
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="pt-2 pb-4 text-center">
          <p className="text-xs text-muted-foreground/50">
            &copy; {new Date().getFullYear()}. {t("built_with")}
          </p>
        </div>
      </div>

      {/* Create/Change PIN Dialog */}
      <CreatePINDialog
        open={showCreatePINDialog}
        onOpenChange={(open) => {
          setShowCreatePINDialog(open);
          if (!open && pinDialogMode === "create" && !hasPin) {
            setAlEnabled(false);
          }
        }}
        mode={pinDialogMode}
        onSuccess={() => {
          if (pinDialogMode === "create") setAlEnabled(true);
        }}
      />

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingCategory ? t("edit_category") : t("add_category")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2.5 py-1.5">
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
              {/* Hex input + preview */}
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-lg flex-shrink-0 ring-2 ring-offset-2 ring-border"
                  style={{ backgroundColor: catColor }}
                />
                <Input
                  value={catHexInput}
                  maxLength={7}
                  placeholder="#FF6B6B"
                  onChange={(e) => {
                    const val = e.target.value;
                    setCatHexInput(val);
                    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                      setCatColor(val);
                    }
                  }}
                  className="h-10 font-mono text-sm"
                  data-ocid="category.color_hex.input"
                />
              </div>
              {/* Extended preset grid */}
              <div className="grid grid-cols-10 gap-1.5">
                {[
                  "#FF6B6B",
                  "#FF8E53",
                  "#F0C040",
                  "#4CAF50",
                  "#4ECDC4",
                  "#45B7D1",
                  "#6495ED",
                  "#9B59B6",
                  "#DDA0DD",
                  "#FF69B4",
                  "#96CEB4",
                  "#B0B0B0",
                  "#E67E22",
                  "#1ABC9C",
                  "#3498DB",
                  "#2ECC71",
                  "#E74C3C",
                  "#8E44AD",
                  "#F39C12",
                  "#16A085",
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                      catColor === color
                        ? "ring-2 ring-ring ring-offset-2 scale-110"
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setCatColor(color);
                      setCatHexInput(color);
                    }}
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

      {/* Add/Edit Income Source Dialog */}
      <Dialog open={showIncomeDialog} onOpenChange={setShowIncomeDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingIncomeSource ? "Edit Income Source" : "Add Income Source"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-medium mb-1 block">
                Income Name *
              </Label>
              <Input
                value={incName}
                onChange={(e) => setIncName(e.target.value)}
                placeholder="e.g. Salary"
                className="h-9"
                data-ocid="income.name.input"
              />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1 block">Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setIncColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${incColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1 block">
                Monthly Budget
              </Label>
              <Input
                type="number"
                value={incBudget}
                onChange={(e) => setIncBudget(e.target.value)}
                placeholder="0.00"
                className="h-9"
                min="0"
                step="0.01"
                data-ocid="income.budget.input"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowIncomeDialog(false)}
              data-ocid="income.cancel.button"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveIncome}
              data-ocid="income.save.button"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Income Source Confirmation */}
      <AlertDialog
        open={!!deleteIncomeSourceId}
        onOpenChange={(open) => !open && setDeleteIncomeSourceId(null)}
      >
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Income Source?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="income.cancel.button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteIncomeSourceId && handleDeleteIncome(deleteIncomeSourceId)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="income.delete.confirm.button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Verify Identity Before Reset */}
      <Dialog
        open={showVerifyReset}
        onOpenChange={(open) => {
          setShowVerifyReset(open);
          setVerifyResetPin("");
          setVerifyResetError("");
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Lock className="h-5 w-5 text-destructive" />
              Verify Identity
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              To protect your data, please verify your identity before resetting
              all data.
            </p>
            {hasPin && (
              <div className="space-y-2">
                <Label htmlFor="verify-reset-pin">Enter your PIN</Label>
                <div className="flex gap-2 justify-center">
                  {[...Array(pinLength)].map((__, slotIdx) => (
                    <div
                      key={slotIdx.toString()}
                      className={`w-11 h-12 rounded-lg border flex items-center justify-center text-xl font-bold transition-colors ${
                        slotIdx < verifyResetPin.length
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-muted/30"
                      }`}
                    >
                      {slotIdx < verifyResetPin.length ? "*" : ""}
                    </div>
                  ))}
                </div>
                <Input
                  id="verify-reset-pin"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={pinLength}
                  value={verifyResetPin}
                  onChange={(e) => {
                    setVerifyResetPin(
                      e.target.value.replace(/\D/g, "").slice(0, pinLength),
                    );
                    setVerifyResetError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleVerifyBeforeReset();
                  }}
                  placeholder={`Enter ${pinLength}-digit PIN`}
                  className="text-center tracking-widest h-11"
                  data-ocid="verify.reset.pin.input"
                />
                {verifyResetError && (
                  <p className="text-sm text-destructive text-center">
                    {verifyResetError}
                  </p>
                )}
              </div>
            )}
            <div className="flex flex-col gap-2">
              {hasPin && (
                <Button
                  onClick={handleVerifyBeforeReset}
                  disabled={
                    isVerifyingReset || verifyResetPin.length < pinLength
                  }
                  className="w-full"
                  data-ocid="verify.reset.pin.button"
                >
                  {isVerifyingReset ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Verify with PIN
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  // If already authenticated with II, proceed directly.
                  // Calling login() when already authenticated sets isLoginError,
                  // causing a false "Authentication failed" message.
                  if (identity && !identity.getPrincipal().isAnonymous()) {
                    setShowVerifyReset(false);
                    setShowResetDialog(true);
                  } else {
                    setIiResetPending(true);
                    login();
                  }
                }}
                disabled={iiResetPending || isLoggingIn}
                className="w-full gap-2"
                data-ocid="verify.reset.ii.button"
              >
                <Fingerprint className="h-4 w-4" />
                {iiResetPending || isLoggingIn
                  ? "Authenticating..."
                  : "Unlock with Internet Identity"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowVerifyReset(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
