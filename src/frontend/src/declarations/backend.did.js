/* eslint-disable */

// @ts-nocheck

import { IDL } from '@icp-sdk/core/candid';

export const UserRole = IDL.Variant({
  'admin' : IDL.Null,
  'user' : IDL.Null,
  'guest' : IDL.Null,
});
export const Category = IDL.Record({
  'id' : IDL.Text,
  'name' : IDL.Text,
  'color' : IDL.Text,
  'budget' : IDL.Float64,
  'pinned' : IDL.Opt(IDL.Bool),
});
export const Expense = IDL.Record({
  'id' : IDL.Text,
  'categoryId' : IDL.Text,
  'paymentMethod' : IDL.Text,
  'date' : IDL.Text,
  'note' : IDL.Text,
  'createdAt' : IDL.Int,
  'amount' : IDL.Float64,
  'recurring' : IDL.Opt(IDL.Bool),
  'recurringFrequency' : IDL.Opt(IDL.Text),
});
export const ExpenseMeta = IDL.Record({
  'tags' : IDL.Opt(IDL.Text),
  'receiptUrl' : IDL.Opt(IDL.Text),
});
export const ShoppingItem = IDL.Record({
  'id' : IDL.Text,
  'estimatedPrice' : IDL.Opt(IDL.Float64),
  'date' : IDL.Opt(IDL.Text),
  'name' : IDL.Text,
  'createdAt' : IDL.Int,
  'bought' : IDL.Bool,
  'category' : IDL.Text,
});
export const AppSettings = IDL.Record({
  'updatedAt' : IDL.Int,
  'currency' : IDL.Text,
  'dailyLimit' : IDL.Opt(IDL.Float64),
  'weeklyLimit' : IDL.Opt(IDL.Float64),
});
export const UserProfile = IDL.Record({ 'name' : IDL.Text });
export const MonthlyIncome = IDL.Record({
  'month' : IDL.Text,
  'amount' : IDL.Float64,
});
export const CategorySummary = IDL.Record({
  'categoryId' : IDL.Text,
  'total' : IDL.Float64,
  'categoryName' : IDL.Text,
});
export const MonthlySummary = IDL.Record({
  'month' : IDL.Text,
  'categoryBreakdown' : IDL.Vec(CategorySummary),
  'totalIncome' : IDL.Float64,
  'totalExpenses' : IDL.Float64,
});
export const IncomeSource = IDL.Record({
  'id' : IDL.Text,
  'name' : IDL.Text,
  'color' : IDL.Text,
  'monthlyBudget' : IDL.Float64,
});
export const DebtRecord = IDL.Record({
  'id' : IDL.Text,
  'description' : IDL.Text,
  'personName' : IDL.Text,
  'amount' : IDL.Float64,
  'dueDate' : IDL.Opt(IDL.Text),
  'direction' : IDL.Text,
  'status' : IDL.Text,
  'createdAt' : IDL.Int,
});

export const BackupRecord = IDL.Record({
  'name' : IDL.Text,
  'data' : IDL.Text,
  'createdAt' : IDL.Int,
});

export const idlService = IDL.Service({
  '_initializeAccessControlWithSecret' : IDL.Func([IDL.Text], [], []),
  'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
  'clearBoughtShoppingItems' : IDL.Func([], [], []),
  'createCategory' : IDL.Func([Category], [], []),
  'createExpense' : IDL.Func([Expense], [], []),
  'createShoppingItem' : IDL.Func([ShoppingItem], [], []),
  'deleteBackup' : IDL.Func([IDL.Text], [], []),
  'deleteCategory' : IDL.Func([IDL.Text], [], []),
  'deleteExpense' : IDL.Func([IDL.Text], [], []),
  'deleteExpenseMeta' : IDL.Func([IDL.Text], [], []),
  'deleteShoppingItem' : IDL.Func([IDL.Text], [], []),
  'exportExpenses' : IDL.Func([], [IDL.Vec(Expense)], ['query']),
  'getAppSettings' : IDL.Func([], [IDL.Opt(AppSettings)], ['query']),
  'getCallerUserProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
  'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
  'getBackupsList' : IDL.Func([], [IDL.Vec(BackupRecord)], ['query']),
  'getCategories' : IDL.Func([], [IDL.Vec(Category)], ['query']),
  'getDebts' : IDL.Func([], [IDL.Vec(DebtRecord)], ['query']),
  'getExpenseMetaList' : IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Text, ExpenseMeta))], ['query']),
  'getExpenses' : IDL.Func([], [IDL.Vec(Expense)], ['query']),
  'getExpensesByCategory' : IDL.Func([IDL.Text], [IDL.Vec(Expense)], ['query']),
  'getExpensesByMonth' : IDL.Func([IDL.Text], [IDL.Vec(Expense)], ['query']),
  'getIncomeSourcesList' : IDL.Func([], [IDL.Vec(IncomeSource)], ['query']),
  'getMonthlyIncome' : IDL.Func([IDL.Text], [IDL.Opt(MonthlyIncome)], ['query']),
  'getMonthlySummary' : IDL.Func([IDL.Text], [MonthlySummary], ['query']),
  'getShoppingItems' : IDL.Func([], [IDL.Vec(ShoppingItem)], ['query']),
  'getUserProfile' : IDL.Func([IDL.Principal], [IDL.Opt(UserProfile)], ['query']),
  'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
  'resetUserData' : IDL.Func([], [], []),
  'saveBackup' : IDL.Func([IDL.Text, IDL.Text], [], []),
  'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
  'saveDebts' : IDL.Func([IDL.Vec(DebtRecord)], [], []),
  'saveIncomeSources' : IDL.Func([IDL.Vec(IncomeSource)], [], []),
  'setAppSettings' : IDL.Func([AppSettings], [], []),
  'setExpenseMeta' : IDL.Func([IDL.Text, ExpenseMeta], [], []),
  'setMonthlyIncome' : IDL.Func([MonthlyIncome], [], []),
  'toggleShoppingItemBought' : IDL.Func([IDL.Text, IDL.Bool], [], []),
  'updateCategory' : IDL.Func([Category], [], []),
  'updateExpense' : IDL.Func([Expense], [], []),
  'updateShoppingItem' : IDL.Func([ShoppingItem], [], []),
});

export const idlInitArgs = [];

export const idlFactory = ({ IDL }) => {
  const UserRole = IDL.Variant({
    'admin' : IDL.Null,
    'user' : IDL.Null,
    'guest' : IDL.Null,
  });
  const Category = IDL.Record({
    'id' : IDL.Text,
    'name' : IDL.Text,
    'color' : IDL.Text,
    'budget' : IDL.Float64,
    'pinned' : IDL.Opt(IDL.Bool),
  });
  const Expense = IDL.Record({
    'id' : IDL.Text,
    'categoryId' : IDL.Text,
    'paymentMethod' : IDL.Text,
    'date' : IDL.Text,
    'note' : IDL.Text,
    'createdAt' : IDL.Int,
    'amount' : IDL.Float64,
    'recurring' : IDL.Opt(IDL.Bool),
    'recurringFrequency' : IDL.Opt(IDL.Text),
  });
  const ExpenseMeta = IDL.Record({
    'tags' : IDL.Opt(IDL.Text),
    'receiptUrl' : IDL.Opt(IDL.Text),
  });
  const ShoppingItem = IDL.Record({
    'id' : IDL.Text,
    'estimatedPrice' : IDL.Opt(IDL.Float64),
    'date' : IDL.Opt(IDL.Text),
    'name' : IDL.Text,
    'createdAt' : IDL.Int,
    'bought' : IDL.Bool,
    'category' : IDL.Text,
  });
  const AppSettings = IDL.Record({
    'updatedAt' : IDL.Int,
    'currency' : IDL.Text,
    'dailyLimit' : IDL.Opt(IDL.Float64),
    'weeklyLimit' : IDL.Opt(IDL.Float64),
  });
  const UserProfile = IDL.Record({ 'name' : IDL.Text });
  const MonthlyIncome = IDL.Record({
    'month' : IDL.Text,
    'amount' : IDL.Float64,
  });
  const CategorySummary = IDL.Record({
    'categoryId' : IDL.Text,
    'total' : IDL.Float64,
    'categoryName' : IDL.Text,
  });
  const MonthlySummary = IDL.Record({
    'month' : IDL.Text,
    'categoryBreakdown' : IDL.Vec(CategorySummary),
    'totalIncome' : IDL.Float64,
    'totalExpenses' : IDL.Float64,
  });
  const IncomeSource = IDL.Record({
    'id' : IDL.Text,
    'name' : IDL.Text,
    'color' : IDL.Text,
    'monthlyBudget' : IDL.Float64,
  });
  const DebtRecord = IDL.Record({
    'id' : IDL.Text,
    'description' : IDL.Text,
    'personName' : IDL.Text,
    'amount' : IDL.Float64,
    'dueDate' : IDL.Opt(IDL.Text),
    'direction' : IDL.Text,
    'status' : IDL.Text,
    'createdAt' : IDL.Int,
  });
  const BackupRecord = IDL.Record({
    'name' : IDL.Text,
    'data' : IDL.Text,
    'createdAt' : IDL.Int,
  });

  return IDL.Service({
    '_initializeAccessControlWithSecret' : IDL.Func([IDL.Text], [], []),
    'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
    'clearBoughtShoppingItems' : IDL.Func([], [], []),
    'createCategory' : IDL.Func([Category], [], []),
    'createExpense' : IDL.Func([Expense], [], []),
    'createShoppingItem' : IDL.Func([ShoppingItem], [], []),
    'deleteBackup' : IDL.Func([IDL.Text], [], []),
    'deleteCategory' : IDL.Func([IDL.Text], [], []),
    'deleteExpense' : IDL.Func([IDL.Text], [], []),
    'deleteExpenseMeta' : IDL.Func([IDL.Text], [], []),
    'deleteShoppingItem' : IDL.Func([IDL.Text], [], []),
    'exportExpenses' : IDL.Func([], [IDL.Vec(Expense)], ['query']),
    'getAppSettings' : IDL.Func([], [IDL.Opt(AppSettings)], ['query']),
    'getCallerUserProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
    'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
    'getBackupsList' : IDL.Func([], [IDL.Vec(BackupRecord)], ['query']),
    'getCategories' : IDL.Func([], [IDL.Vec(Category)], ['query']),
    'getDebts' : IDL.Func([], [IDL.Vec(DebtRecord)], ['query']),
    'getExpenseMetaList' : IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Text, ExpenseMeta))], ['query']),
    'getExpenses' : IDL.Func([], [IDL.Vec(Expense)], ['query']),
    'getExpensesByCategory' : IDL.Func([IDL.Text], [IDL.Vec(Expense)], ['query']),
    'getExpensesByMonth' : IDL.Func([IDL.Text], [IDL.Vec(Expense)], ['query']),
    'getIncomeSourcesList' : IDL.Func([], [IDL.Vec(IncomeSource)], ['query']),
    'getMonthlyIncome' : IDL.Func([IDL.Text], [IDL.Opt(MonthlyIncome)], ['query']),
    'getMonthlySummary' : IDL.Func([IDL.Text], [MonthlySummary], ['query']),
    'getShoppingItems' : IDL.Func([], [IDL.Vec(ShoppingItem)], ['query']),
    'getUserProfile' : IDL.Func([IDL.Principal], [IDL.Opt(UserProfile)], ['query']),
    'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
    'resetUserData' : IDL.Func([], [], []),
    'saveBackup' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
    'saveDebts' : IDL.Func([IDL.Vec(DebtRecord)], [], []),
    'saveIncomeSources' : IDL.Func([IDL.Vec(IncomeSource)], [], []),
    'setAppSettings' : IDL.Func([AppSettings], [], []),
    'setExpenseMeta' : IDL.Func([IDL.Text, ExpenseMeta], [], []),
    'setMonthlyIncome' : IDL.Func([MonthlyIncome], [], []),
    'toggleShoppingItemBought' : IDL.Func([IDL.Text, IDL.Bool], [], []),
    'updateCategory' : IDL.Func([Category], [], []),
    'updateExpense' : IDL.Func([Expense], [], []),
    'updateShoppingItem' : IDL.Func([ShoppingItem], [], []),
  });
};

export const init = ({ IDL }) => { return []; };
