import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Category {
    id: string;
    name: string;
    color: string;
    pinned?: boolean;
    budget: number;
}
export interface IncomeSource {
    id: string;
    monthlyBudget: number;
    name: string;
    color: string;
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
export interface AppSettings {
    dailyLimit?: number;
    updatedAt: bigint;
    currency: string;
    weeklyLimit?: number;
}
export interface ExpenseMeta {
    receiptUrl?: string;
    tags?: string;
}
export interface CategorySummary {
    categoryId: string;
    total: number;
    categoryName: string;
}
export interface MonthlySummary {
    month: string;
    categoryBreakdown: Array<CategorySummary>;
    totalIncome: number;
    totalExpenses: number;
}
export interface Expense {
    id: string;
    categoryId: string;
    paymentMethod: string;
    date: string;
    note: string;
    createdAt: bigint;
    amount: number;
}
export interface MonthlyIncome {
    month: string;
    amount: number;
}
export interface UserProfile {
    name: string;
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
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
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
    getCallerUserRole(): Promise<UserRole>;
    getCategories(): Promise<Array<Category>>;
    getDebts(): Promise<Array<DebtRecord>>;
    getExpenseMetaList(): Promise<Array<[string, ExpenseMeta]>>;
    getExpenses(): Promise<Array<Expense>>;
    getExpensesByCategory(categoryId: string): Promise<Array<Expense>>;
    getExpensesByMonth(month: string): Promise<Array<Expense>>;
    getIncomeSourcesList(): Promise<Array<IncomeSource>>;
    getMonthlyIncome(month: string): Promise<MonthlyIncome | null>;
    getMonthlySummary(month: string): Promise<MonthlySummary>;
    getShoppingItems(): Promise<Array<ShoppingItem>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    resetUserData(): Promise<void>;
    saveBackup(name: string, data: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveDebts(debts: Array<DebtRecord>): Promise<void>;
    saveIncomeSources(sources: Array<IncomeSource>): Promise<void>;
    setAppSettings(settings: AppSettings): Promise<void>;
    setExpenseMeta(expenseId: string, meta: ExpenseMeta): Promise<void>;
    setMonthlyIncome(income: MonthlyIncome): Promise<void>;
    toggleShoppingItemBought(itemId: string, bought: boolean): Promise<void>;
    updateCategory(category: Category): Promise<void>;
    updateExpense(expense: Expense): Promise<void>;
    updateShoppingItem(item: ShoppingItem): Promise<void>;
}
