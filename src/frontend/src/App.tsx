import { Toaster } from "@/components/ui/sonner";
import {
  BarChart3,
  LayoutDashboard,
  List,
  Plus,
  Settings,
  ShoppingCart,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Expense, MonthlyIncome } from "./backend.d";
import AppHeader from "./components/AppHeader";
import ExpenseDialog from "./components/ExpenseDialog";
import LockScreen from "./components/LockScreen";
import { useActor } from "./hooks/useActor";
import { useCardTheme } from "./hooks/useCardTheme";
import {
  useAppSettings,
  useCategories,
  useCreateCategory,
  useCreateExpense,
  useExpenses,
  useSetAppSettings,
  useSetMonthlyIncome,
  useUpdateExpense,
} from "./hooks/useQueries";
import { useLanguage } from "./i18n/LanguageContext";
import DashboardTab from "./pages/DashboardTab";
import ExpensesTab from "./pages/ExpensesTab";
import ReportsTab from "./pages/ReportsTab";
import SettingsTab from "./pages/SettingsTab";
import ShoppingListTab from "./pages/ShoppingListTab";
import { DEFAULT_CATEGORIES } from "./utils/categories";
import { currentMonth } from "./utils/format";

type Tab = "dashboard" | "expenses" | "reports" | "shopping" | "settings";

const TAB_IDS: Tab[] = [
  "dashboard",
  "expenses",
  "reports",
  "shopping",
  "settings",
];
const TAB_ICONS = [LayoutDashboard, List, BarChart3, ShoppingCart, Settings];
const TAB_OCIDS = [
  "dashboard.tab",
  "expenses.tab",
  "reports.tab",
  "shopping.tab",
  "settings.tab",
];
const TAB_KEYS = [
  "tab_dashboard",
  "tab_expenses",
  "tab_reports",
  "tab_shopping",
  "tab_settings",
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [month, setMonth] = useState(currentMonth);
  const { theme, themeId, setThemeId } = useCardTheme();
  const { t } = useLanguage();

  const { actor, isFetching: actorLoading } = useActor();
  const { data: categories = [], isLoading: loadingCats } = useCategories();
  const { data: settings } = useAppSettings();
  const createCategory = useCreateCategory();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const setMonthlyIncome = useSetMonthlyIncome();
  const setAppSettings = useSetAppSettings();
  const { data: allExpenses = [] } = useExpenses();

  // Auto-generate missing recurring occurrences
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally runs when expenses load
  useEffect(() => {
    if (!actor || actorLoading || allExpenses.length === 0) return;

    type RecurringExpense = Expense & {
      recurring?: boolean;
      recurringFrequency?: string;
    };

    const recurringExpenses = (allExpenses as RecurringExpense[]).filter(
      (e) => e.recurring,
    );
    if (recurringExpenses.length === 0) return;

    const existingKeys = new Set(
      (allExpenses as RecurringExpense[]).map((e) =>
        [e.categoryId, e.amount, e.paymentMethod, e.date].join("|"),
      ),
    );

    const today = new Date();
    const toMonthStr = (d: Date) => d.toISOString().substring(0, 7);
    const currentMonthStr = toMonthStr(today);

    const generate = async () => {
      for (const src of recurringExpenses) {
        try {
          const freq = src.recurringFrequency ?? "Monthly";
          const srcDate = new Date(src.date);
          let cursor = new Date(srcDate);

          if (freq === "Daily") cursor.setDate(cursor.getDate() + 1);
          else if (freq === "Weekly") cursor.setDate(cursor.getDate() + 7);
          else if (freq === "Monthly") cursor.setMonth(cursor.getMonth() + 1);
          else if (freq === "Yearly")
            cursor.setFullYear(cursor.getFullYear() + 1);

          while (toMonthStr(cursor) <= currentMonthStr) {
            const dateStr = cursor.toISOString().substring(0, 10);
            const key = [
              src.categoryId,
              src.amount,
              src.paymentMethod,
              dateStr,
            ].join("|");
            if (!existingKeys.has(key)) {
              existingKeys.add(key);
              const newExpense: RecurringExpense = {
                ...src,
                id: crypto.randomUUID(),
                date: dateStr,
                createdAt: BigInt(Date.now()),
                recurring: true,
                recurringFrequency: freq,
              };
              await actor.createExpense(newExpense as Expense).catch(() => {});
            }
            if (freq === "Daily") cursor.setDate(cursor.getDate() + 1);
            else if (freq === "Weekly") cursor.setDate(cursor.getDate() + 7);
            else if (freq === "Monthly") cursor.setMonth(cursor.getMonth() + 1);
            else if (freq === "Yearly")
              cursor.setFullYear(cursor.getFullYear() + 1);
          }
        } catch {
          // Safe: do not let one failure affect others
        }
      }
    };

    generate();
  }, [actor, actorLoading, allExpenses.length]);

  const currency = settings?.currency ?? "USD";

  // Seed default categories when first loaded
  // biome-ignore lint/correctness/useExhaustiveDependencies: mutations are stable references
  useEffect(() => {
    if (!actor || actorLoading || loadingCats) return;
    if (categories.length > 0) return;

    const seedDefaults = async () => {
      for (const cat of DEFAULT_CATEGORIES) {
        await createCategory.mutateAsync(cat).catch(() => {});
      }
      if (!settings) {
        await setAppSettings
          .mutateAsync({
            currency: "USD",
            updatedAt: BigInt(Date.now()),
          })
          .catch(() => {});
      }
    };

    seedDefaults();
  }, [actor, actorLoading, loadingCats, categories.length, settings]);

  function openAddExpense() {
    setEditingExpense(null);
    setExpenseDialogOpen(true);
  }

  function openEditExpense(expense: Expense) {
    setEditingExpense(expense);
    setExpenseDialogOpen(true);
  }

  async function handleSaveExpense(expense: Expense) {
    try {
      if (editingExpense) {
        await updateExpense.mutateAsync(expense);
        toast.success(t("expense_updated"));
        setExpenseDialogOpen(false);
        setEditingExpense(null);
      } else {
        await createExpense.mutateAsync(expense);
        toast.success(t("expense_added"));
      }
    } catch {
      toast.error(t("failed_save_expense"));
    }
  }

  async function handleSaveIncome(income: MonthlyIncome) {
    try {
      await setMonthlyIncome.mutateAsync(income);
      toast.success(t("income_updated"));
    } catch {
      toast.error(t("failed_update_income"));
    }
  }

  const isSaving =
    createExpense.isPending ||
    updateExpense.isPending ||
    setMonthlyIncome.isPending;

  const tabVariants = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
  };

  return (
    // Responsive outer shell: full-screen on mobile, centered app-card on tablet/desktop
    <div
      className="min-h-screen bg-background flex flex-col items-center
        md:bg-muted/20 md:justify-center md:p-6
        lg:p-8"
    >
      {/* Desktop background decoration */}
      <div
        className="hidden md:block fixed inset-0 -z-10 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% -10%, ${theme.orb}22 0%, transparent 70%)`,
        }}
      />

      {/* App card — full screen on mobile, framed card on tablet/desktop */}
      <div
        className="
          w-full max-w-[480px] flex flex-col relative
          bg-background
          min-h-screen
          md:min-h-0 md:max-h-[92vh] md:rounded-3xl md:shadow-2xl md:overflow-hidden md:border md:border-border/50
          lg:max-w-[520px]
        "
        style={{ "--theme-tint": theme.orb } as React.CSSProperties}
      >
        <AppHeader />
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pb-16
            md:pb-20"
        >
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                variants={tabVariants}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <DashboardTab
                  onEditExpense={openEditExpense}
                  onViewAll={() => setActiveTab("expenses")}
                  month={month}
                  setMonth={setMonth}
                  theme={theme}
                  themeId={themeId}
                  setThemeId={setThemeId}
                />
              </motion.div>
            )}
            {activeTab === "expenses" && (
              <motion.div
                key="expenses"
                variants={tabVariants}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <ExpensesTab
                  onEditExpense={openEditExpense}
                  month={month}
                  setMonth={setMonth}
                  onBack={() => setActiveTab("dashboard")}
                />
              </motion.div>
            )}
            {activeTab === "reports" && (
              <motion.div
                key="reports"
                variants={tabVariants}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <ReportsTab
                  month={month}
                  setMonth={setMonth}
                  onBack={() => setActiveTab("dashboard")}
                />
              </motion.div>
            )}
            {activeTab === "shopping" && (
              <motion.div
                key="shopping"
                variants={tabVariants}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <ShoppingListTab />
              </motion.div>
            )}
            {activeTab === "settings" && (
              <motion.div
                key="settings"
                variants={tabVariants}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <SettingsTab />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Bottom navigation — sticky to app card on md+, fixed to viewport on mobile */}
        <nav
          className="
            fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px]
            backdrop-blur-lg border-t border-border z-40 safe-bottom
            lg:max-w-[520px]
          "
          style={{
            backgroundColor: `color-mix(in oklch, ${theme.orb} 12%, oklch(var(--card) / 0.95))`,
          }}
        >
          <div className="flex items-center justify-around px-2 py-1">
            {TAB_IDS.map((tabId, idx) => {
              const Icon = TAB_ICONS[idx];
              const isActive = activeTab === tabId;
              return (
                <button
                  key={tabId}
                  type="button"
                  data-ocid={TAB_OCIDS[idx]}
                  onClick={() => setActiveTab(tabId)}
                  className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={t(TAB_KEYS[idx])}
                >
                  <div className="relative">
                    <Icon
                      className={`h-5 w-5 transition-all duration-200 ${
                        isActive ? "scale-110" : ""
                      }`}
                    />
                    {isActive && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    )}
                  </div>
                  <span className="text-[10px] font-medium leading-none mt-0.5">
                    {t(TAB_KEYS[idx])}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* FAB — hidden on shopping tab (has its own FAB) */}
        {activeTab !== "shopping" && (
          <div className="fixed bottom-[4.5rem] left-1/2 -translate-x-1/2 z-50">
            <motion.button
              type="button"
              data-ocid="fab.button"
              onClick={openAddExpense}
              className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:shadow-xl active:scale-95 transition-shadow"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              aria-label={t("add_expense")}
            >
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            </motion.button>
          </div>
        )}
      </div>

      {/* Expense / Income Dialog */}
      <ExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={(open) => {
          setExpenseDialogOpen(open);
          if (!open) setEditingExpense(null);
        }}
        expense={editingExpense}
        categories={categories}
        currency={currency}
        month={month}
        onSave={handleSaveExpense}
        onSaveIncome={handleSaveIncome}
        isSaving={isSaving}
      />

      <Toaster position="top-center" richColors closeButton />
      <LockScreen />
    </div>
  );
}
