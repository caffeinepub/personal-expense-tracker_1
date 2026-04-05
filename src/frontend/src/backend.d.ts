export type ActorMethod<Args extends unknown[], Return> = (...args: Args) => Promise<Return>;

export interface Expense {
    id: string;
    categoryId: string;
    paymentMethod: string;
    date: string;
    note: string;
    createdAt: bigint;
    amount: number;
    tags?: string;
    receiptUrl?: string;
    recurring?: boolean | null;
    recurringFrequency?: string | null;
}
export interface ExpenseMeta {
    tags: string | null;
    receiptUrl: string | null;
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
    pinned?: boolean | null;
}
export interface IncomeSource {
    id: string;
    name: string;
    color: string;
    monthlyBudget: number;
}
export interface AppSettings {
    currency: string;
    updatedAt: bigint;
    dailyLimit?: number | null;
    weeklyLimit?: number | null;
}
export interface ShoppingItem {
    id: string;
    name: string;
    category: string;
    estimatedPrice?: number;
    bought: boolean;
    createdAt: bigint;
    date?: string;
}
export interface CategorySummary {
    categoryId: string;
    categoryName: string;
    total: number;
}
export interface MonthlySummary {
    month: string;
    totalExpenses: number;
    totalIncome: number;
    categoryBreakdown: CategorySummary[];
}
export interface DebtRecord {
    id: string;
    description: string;
    personName: string;
    amount: number;
    dueDate?: string | null;
    direction: string; // "owe" | "owed"
    status: string;    // "pending" | "paid"
    createdAt: bigint;
}
export type UserRole = { admin: null } | { user: null } | { guest: null };
export interface _SERVICE {
    _initializeAccessControlWithSecret: ActorMethod<[string], void>;
    assignCallerUserRole: ActorMethod<[Principal, UserRole], void>;
    clearBoughtShoppingItems: ActorMethod<[], void>;
    createCategory: ActorMethod<[Category], void>;
    createExpense: ActorMethod<[Expense], void>;
    createShoppingItem: ActorMethod<[ShoppingItem], void>;
    deleteCategory: ActorMethod<[string], void>;
    deleteExpense: ActorMethod<[string], void>;
    deleteExpenseMeta: ActorMethod<[string], void>;
    deleteShoppingItem: ActorMethod<[string], void>;
    exportExpenses: ActorMethod<[], Expense[]>;
    getAppSettings: ActorMethod<[], AppSettings | null>;
    getCallerUserProfile: ActorMethod<[], UserProfile | null>;
    getCallerUserRole: ActorMethod<[], UserRole>;
    getCategories: ActorMethod<[], Category[]>;
    getDebts: ActorMethod<[], DebtRecord[]>;
    getExpenseMetaList: ActorMethod<[], [string, ExpenseMeta][]>;
    getExpenses: ActorMethod<[], Expense[]>;
    getExpensesByCategory: ActorMethod<[string], Expense[]>;
    getExpensesByMonth: ActorMethod<[string], Expense[]>;
    getIncomeSourcesList: ActorMethod<[], IncomeSource[]>;
    getMonthlyIncome: ActorMethod<[string], MonthlyIncome | null>;
    getMonthlySummary: ActorMethod<[string], MonthlySummary>;
    getShoppingItems: ActorMethod<[], ShoppingItem[]>;
    getUserProfile: ActorMethod<[Principal], UserProfile | null>;
    isCallerAdmin: ActorMethod<[], boolean>;
    resetUserData: ActorMethod<[], void>;
    saveCallerUserProfile: ActorMethod<[UserProfile], void>;
    saveDebts: ActorMethod<[DebtRecord[]], void>;
    saveIncomeSources: ActorMethod<[IncomeSource[]], void>;
    setAppSettings: ActorMethod<[AppSettings], void>;
    setExpenseMeta: ActorMethod<[string, ExpenseMeta], void>;
    setMonthlyIncome: ActorMethod<[MonthlyIncome], void>;
    toggleShoppingItemBought: ActorMethod<[string, boolean], void>;
    updateCategory: ActorMethod<[Category], void>;
    updateExpense: ActorMethod<[Expense], void>;
    updateShoppingItem: ActorMethod<[ShoppingItem], void>;
}

type Principal = { toString(): string };
