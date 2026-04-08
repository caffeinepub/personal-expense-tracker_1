import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserProfile {
    name: string;
}
export interface IncomeSource {
    id: string;
    monthlyBudget: number;
    name: string;
    color: string;
}
export interface CategorySummary {
    categoryId: string;
    total: number;
    categoryName: string;
}
export interface DebtRecord {
    id: string;
    status: string;
    direction: string;
    createdAt: bigint;
    dueDate?: string;
    description: string;
    personName: string;
    amount: number;
}
export interface MonthlySummary {
    month: string;
    categoryBreakdown: Array<CategorySummary>;
    totalIncome: number;
    totalExpenses: number;
}
export interface NetWorthItem {
    id: string;
    name: string;
    createdAt: bigint;
    itemType: string;
    amount: number;
}
export interface AppSettings {
    dailyLimit?: number;
    updatedAt: bigint;
    currency: string;
    weeklyLimit?: number;
}
export interface Expense {
    id: string;
    categoryId: string;
    paymentMethod: string;
    date: string;
    note: string;
    createdAt: bigint;
    recurring?: boolean;
    tags?: string;
    recurringFrequency?: string;
    amount: number;
}
export interface BackupRecord {
    data: string;
    name: string;
    createdAt: bigint;
}
export interface ShoppingItem {
    id: string;
    estimatedPrice?: number;
    date?: string;
    name: string;
    createdAt: bigint;
    bought: boolean;
    category: string;
}
export interface ExpenseMeta {
    receiptUrl?: string;
    tags?: string;
}
export interface ExchangeRateEntry {
    rate: number;
    updatedAt: bigint;
    currency: string;
}
export interface Category {
    id: string;
    name: string;
    color: string;
    pinned?: boolean;
    budget: number;
}
export interface MonthlyIncome {
    month: string;
    amount: number;
}
export interface backendInterface {
    clearBoughtShoppingItems(): Promise<void>;
    createCategory(category: Category): Promise<void>;
    createExpense(expense: Expense): Promise<void>;
    createShoppingItem(item: ShoppingItem): Promise<void>;
    deleteBackup(name: string): Promise<void>;
    deleteCategory(categoryId: string): Promise<void>;
    deleteExpense(expenseId: string): Promise<void>;
    deleteExpenseMeta(expenseId: string): Promise<void>;
    deleteShoppingItem(itemId: string): Promise<void>;
    exportExpenses(): Promise<Array<Expense>>;
    getAppSettings(): Promise<AppSettings | null>;
    getBackupsList(): Promise<Array<BackupRecord>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCategories(): Promise<Array<Category>>;
    getDebts(): Promise<Array<DebtRecord>>;
    getExchangeRates(): Promise<Array<ExchangeRateEntry>>;
    getExpenseMetaList(): Promise<Array<[string, ExpenseMeta]>>;
    getExpenses(): Promise<Array<Expense>>;
    getExpensesByCategory(categoryId: string): Promise<Array<Expense>>;
    getExpensesByMonth(month: string): Promise<Array<Expense>>;
    getIncomeSourcesList(): Promise<Array<IncomeSource>>;
    getMonthlyIncome(month: string): Promise<MonthlyIncome | null>;
    getMonthlySummary(month: string): Promise<MonthlySummary>;
    getNetWorthItems(): Promise<Array<NetWorthItem>>;
    getShoppingItems(): Promise<Array<ShoppingItem>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    resetUserData(): Promise<void>;
    saveBackup(name: string, data: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveDebts(debts: Array<DebtRecord>): Promise<void>;
    saveExchangeRates(rates: Array<ExchangeRateEntry>): Promise<void>;
    saveIncomeSources(sources: Array<IncomeSource>): Promise<void>;
    saveNetWorthItems(items: Array<NetWorthItem>): Promise<void>;
    setAppSettings(settings: AppSettings): Promise<void>;
    setExpenseMeta(expenseId: string, meta: ExpenseMeta): Promise<void>;
    setMonthlyIncome(income: MonthlyIncome): Promise<void>;
    toggleShoppingItemBought(itemId: string, bought: boolean): Promise<void>;
    updateCategory(category: Category): Promise<void>;
    updateExpense(expense: Expense): Promise<void>;
    updateShoppingItem(item: ShoppingItem): Promise<void>;
}
