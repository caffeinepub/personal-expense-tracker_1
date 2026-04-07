// ─── Domain Types for PE Tracker ─────────────────────────────────────────────
// All shared domain types live here. Import from this file instead of backend.d

export interface Category {
  id: string;
  name: string;
  color: string;
  budget: number;
  pinned?: boolean;
}

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  date: string;
  note?: string;
  paymentMethod: string;
  createdAt: bigint;
  type?: string;
  currency?: string;
  originalAmount?: number;
  originalCurrency?: string;
  tags?: string[];
  receiptUrl?: string;
  recurring?: boolean;
  recurringFrequency?: string;
}

export interface MonthlyIncome {
  month: string;
  amount: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  price?: number;
  estimatedPrice?: number;
  category: string;
  bought: boolean;
  date?: string;
  createdAt: bigint;
}

export interface IncomeSource {
  id: string;
  name: string;
  color: string;
  monthlyBudget: number;
}

export interface DebtRecord {
  id: string;
  personName: string;
  description: string;
  amount: number;
  dueDate?: string;
  direction: "owe" | "owed";
  status: "pending" | "settled";
  createdAt: bigint;
}

export interface AppSettings {
  currency: string;
  updatedAt: bigint;
  language?: string;
  numberFormat?: string;
  dateFormat?: string;
  dailyLimit?: number | null;
  weeklyLimit?: number | null;
  multiCurrencyEnabled?: boolean;
  secondaryCurrencies?: { code: string; rate: number }[];
  savingsRateGoal?: number | null;
}

export interface ExpenseMeta {
  tags?: string[];
  receiptUrl?: string;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  total: number;
}

export interface MonthlySummary {
  totalExpenses: number;
  totalIncome: number;
  categoryBreakdown: CategoryBreakdown[];
}

// ─── Typed Backend Actor Interface ────────────────────────────────────────────
// All actor method signatures. Cast actor to this type via useTypedActor.
export interface BackendActor {
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: Category): Promise<void>;
  updateCategory(category: Category): Promise<void>;
  deleteCategory(id: string): Promise<void>;

  // Expenses
  getExpenses(): Promise<Expense[]>;
  getExpensesByMonth(month: string): Promise<Expense[]>;
  createExpense(expense: Expense): Promise<void>;
  updateExpense(expense: Expense): Promise<void>;
  deleteExpense(id: string): Promise<void>;
  exportExpenses(): Promise<Expense[]>;

  // Monthly Income
  getMonthlyIncome(month: string): Promise<MonthlyIncome | null>;
  setMonthlyIncome(income: MonthlyIncome): Promise<void>;

  // Summary
  getMonthlySummary(month: string): Promise<MonthlySummary | null>;

  // Settings
  getAppSettings(): Promise<AppSettings | null>;
  setAppSettings(settings: AppSettings): Promise<void>;

  // Reset
  resetUserData(): Promise<void>;

  // Shopping
  getShoppingItems(): Promise<ShoppingItem[]>;
  createShoppingItem(item: ShoppingItem): Promise<void>;
  updateShoppingItem(item: ShoppingItem): Promise<void>;
  deleteShoppingItem(id: string): Promise<void>;
  clearBoughtShoppingItems(): Promise<void>;
  toggleShoppingItemBought(id: string, bought: boolean): Promise<void>;

  // Income Sources
  getIncomeSourcesList(): Promise<IncomeSource[]>;
  saveIncomeSources(sources: IncomeSource[]): Promise<void>;

  // User Profile
  getCallerUserProfile(): Promise<{ name: string } | null>;
  saveCallerUserProfile(profile: { name: string }): Promise<void>;

  // Expense Meta
  getExpenseMetaList(): Promise<[string, ExpenseMeta][]>;
  setExpenseMeta(expenseId: string, meta: ExpenseMeta): Promise<void>;
  deleteExpenseMeta(expenseId: string): Promise<void>;

  // Debts
  getDebts(): Promise<DebtRecord[]>;
  saveDebts(debts: DebtRecord[]): Promise<void>;

  // Backups
  getBackupsList(): Promise<{ name: string; createdAt: bigint }[]>;
  saveBackup(name: string, data: string): Promise<void>;
  deleteBackup(name: string): Promise<void>;
  getBackup(name: string): Promise<string | null>;
}
