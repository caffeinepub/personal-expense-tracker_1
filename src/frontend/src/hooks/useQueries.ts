import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AppSettings,
  Category,
  DebtRecord,
  Expense,
  ExpenseMeta,
  IncomeSource,
  MonthlyIncome,
  MonthlySummary,
  ShoppingItem,
} from "../types";
import { useTypedActor } from "./useTypedActor";

// ─── Categories ─────────────────────────────────────────────────────────────

export function useCategories() {
  const { actor, isFetching } = useTypedActor();
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCategories();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateCategory() {
  const { actor } = useTypedActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (category: Category) => {
      if (!actor) throw new Error("No actor");
      return actor.createCategory(category);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategory() {
  const { actor } = useTypedActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (category: Category) => {
      if (!actor) throw new Error("No actor");
      return actor.updateCategory(category);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const { actor } = useTypedActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteCategory(categoryId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export function useExpenses() {
  const { actor, isFetching } = useTypedActor();
  return useQuery<Expense[]>({
    queryKey: ["expenses"],
    queryFn: async (): Promise<Expense[]> => {
      if (!actor) return [] as Expense[];
      return actor.getExpenses();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60,
  });
}

export function useExpensesByMonth(month: string) {
  const { actor, isFetching } = useTypedActor();
  return useQuery<Expense[]>({
    queryKey: ["expenses", "month", month],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExpensesByMonth(month);
    },
    enabled: !!actor && !isFetching && !!month,
    staleTime: 1000 * 60,
  });
}

export function useCreateExpense() {
  const { actor } = useTypedActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (expense: Expense) => {
      if (!actor) throw new Error("No actor");
      return actor.createExpense(expense);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}

export function useUpdateExpense() {
  const { actor } = useTypedActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (expense: Expense) => {
      if (!actor) throw new Error("No actor");
      return actor.updateExpense(expense);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}

export function useDeleteExpense() {
  const { actor } = useTypedActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (expenseId: string) => {
      if (!actor) throw new Error("No actor");
      await actor.deleteExpense(expenseId);
      try {
        await actor.deleteExpenseMeta(expenseId);
      } catch {
        /* ignore if no meta */
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["expenseMeta"] });
    },
  });
}

export function useExportExpenses() {
  const { actor } = useTypedActor();
  return useMutation<Expense[]>({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.exportExpenses() as Promise<Expense[]>;
    },
  });
}

// ─── Monthly Income ──────────────────────────────────────────────────────────

export function useMonthlyIncome(month: string) {
  const { actor, isFetching } = useTypedActor();
  return useQuery<MonthlyIncome | null>({
    queryKey: ["income", month],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMonthlyIncome(month);
    },
    enabled: !!actor && !isFetching && !!month,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSetMonthlyIncome() {
  const { actor } = useTypedActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (income: MonthlyIncome) => {
      if (!actor) throw new Error("No actor");
      return actor.setMonthlyIncome(income);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["income", variables.month] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}

// ─── Monthly Summary ─────────────────────────────────────────────────────────

export function useMonthlySummary(month: string) {
  const { actor, isFetching } = useTypedActor();
  return useQuery<MonthlySummary | null>({
    queryKey: ["summary", month],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMonthlySummary(month);
    },
    enabled: !!actor && !isFetching && !!month,
    staleTime: 1000 * 60,
  });
}

// ─── App Settings ────────────────────────────────────────────────────────────

export function useAppSettings() {
  const { actor, isFetching } = useTypedActor();
  return useQuery<AppSettings | null>({
    queryKey: ["settings"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAppSettings();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 10,
  });
}

export function useSetAppSettings() {
  const { actor } = useTypedActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: AppSettings) => {
      if (!actor) throw new Error("No actor");
      return actor.setAppSettings(settings);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

// ─── Reset Data ──────────────────────────────────────────────────────────────

export function useResetUserData() {
  const { actor } = useTypedActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!actor) throw new Error("No actor");
      return actor.resetUserData();
    },
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}

// ─── Shopping Items ──────────────────────────────────────────────────────────

export function useShoppingItems() {
  const { actor, isFetching } = useTypedActor();
  return useQuery<ShoppingItem[]>({
    queryKey: ["shopping"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getShoppingItems();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 30,
  });
}

export function useCreateShoppingItem() {
  const { actor } = useTypedActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (item: ShoppingItem) => {
      if (!actor) throw new Error("No actor");
      return actor.createShoppingItem(item);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping"] }),
  });
}

export function useUpdateShoppingItem() {
  const { actor } = useTypedActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (item: ShoppingItem) => {
      if (!actor) throw new Error("No actor");
      return actor.updateShoppingItem(item);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping"] }),
  });
}

export function useDeleteShoppingItem() {
  const { actor } = useTypedActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteShoppingItem(itemId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping"] }),
  });
}

export function useClearBoughtShoppingItems() {
  const { actor } = useTypedActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!actor) throw new Error("No actor");
      return actor.clearBoughtShoppingItems();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping"] }),
  });
}

export function useToggleShoppingItemBought() {
  const { actor } = useTypedActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, bought }: { id: string; bought: boolean }) => {
      if (!actor) throw new Error("No actor");
      return actor.toggleShoppingItemBought(id, bought);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping"] }),
  });
}

// ─── Income Sources ──────────────────────────────────────────────────────────

export function useIncomeSources() {
  const { actor, isFetching } = useTypedActor();
  return useQuery<IncomeSource[]>({
    queryKey: ["incomeSources"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getIncomeSourcesList();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
  });
}

export function useSaveIncomeSources() {
  const { actor } = useTypedActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sources: IncomeSource[]) => {
      if (!actor) throw new Error("No actor");
      return actor.saveIncomeSources(sources);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incomeSources"] });
    },
  });
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export function useUserProfile() {
  const { actor, isFetching } = useTypedActor();
  return useQuery<{ name: string } | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 10,
  });
}

export function useSaveUserProfile() {
  const { actor } = useTypedActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profile: { name: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["userProfile"] }),
  });
}

// ─── Expense Metadata (tags + receiptUrl stored separately) ─────────────────

export function useExpenseMetaList() {
  const { actor, isFetching } = useTypedActor();
  return useQuery<[string, ExpenseMeta][]>({
    queryKey: ["expenseMeta"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const result = await actor.getExpenseMetaList();
        // Defensive: ensure we always return a valid array of [string, ExpenseMeta] tuples
        if (!Array.isArray(result)) return [];
        return result.filter(
          (item) =>
            Array.isArray(item) &&
            item.length >= 2 &&
            typeof item[0] === "string",
        ) as [string, ExpenseMeta][];
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60,
  });
}

export function useSetExpenseMeta() {
  const { actor } = useTypedActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      expenseId,
      meta,
    }: { expenseId: string; meta: ExpenseMeta }) => {
      if (!actor) throw new Error("No actor");
      return actor.setExpenseMeta(expenseId, meta);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenseMeta"] }),
  });
}

export function useDeleteExpenseMeta() {
  const { actor } = useTypedActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: string) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteExpenseMeta(expenseId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenseMeta"] }),
  });
}

// ─── Debts / Loans ───────────────────────────────────────────────────────────

export function useDebts() {
  const { actor, isFetching } = useTypedActor();
  return useQuery<DebtRecord[]>({
    queryKey: ["debts"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getDebts();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60,
  });
}

export function useSaveDebts() {
  const { actor } = useTypedActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (debts: DebtRecord[]) => {
      if (!actor) throw new Error("No actor");
      // Optimistic update
      qc.setQueryData(["debts"], debts);
      return actor.saveDebts(debts);
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ["debts"] });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["debts"] });
    },
  });
}

// ─── Cloud Backups ───────────────────────────────────────────────────────────

export function useBackupsList() {
  const { actor, isFetching } = useTypedActor();
  return useQuery({
    queryKey: ["backupsList"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getBackupsList();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60,
  });
}

export function useSaveBackup() {
  const { actor } = useTypedActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.saveBackup(name, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["backupsList"] }),
  });
}

export function useDeleteBackup() {
  const { actor } = useTypedActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteBackup(name);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["backupsList"] }),
  });
}
