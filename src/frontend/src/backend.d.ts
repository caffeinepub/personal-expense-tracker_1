import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AppSettings {
    updatedAt: bigint;
    currency: string;
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
export interface Category {
    id: string;
    name: string;
    color: string;
    budget: number;
}
export interface IncomeSource {
    id: string;
    name: string;
    color: string;
    monthlyBudget: number;
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
    deleteCategory(categoryId: string): Promise<void>;
    deleteExpense(expenseId: string): Promise<void>;
    deleteShoppingItem(itemId: string): Promise<void>;
    exportExpenses(): Promise<Array<Expense>>;
    getAppSettings(): Promise<AppSettings | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCategories(): Promise<Array<Category>>;
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
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveIncomeSources(sources: Array<IncomeSource>): Promise<void>;
    setAppSettings(settings: AppSettings): Promise<void>;
    setMonthlyIncome(income: MonthlyIncome): Promise<void>;
    toggleShoppingItemBought(itemId: string, bought: boolean): Promise<void>;
    updateCategory(category: Category): Promise<void>;
    updateExpense(expense: Expense): Promise<void>;
    updateShoppingItem(item: ShoppingItem): Promise<void>;
}
