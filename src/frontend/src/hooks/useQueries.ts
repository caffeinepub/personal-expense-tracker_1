import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AppSettings,
  Category,
  Expense,
  MonthlyIncome,
} from "../backend.d";
import { useActor } from "./useActor";

// ─── Categories ─────────────────────────────────────────────────────────────

export function useCategories() {
  const { actor, isFetching } = useActor();
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
  const { actor } = useActor();
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
  const { actor } = useActor();
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
  const { actor } = useActor();
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
  const { actor, isFetching } = useActor();
  return useQuery<Expense[]>({
    queryKey: ["expenses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExpenses();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60,
  });
}

export function useExpensesByMonth(month: string) {
  const { actor, isFetching } = useActor();
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
  const { actor } = useActor();
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
  const { actor } = useActor();
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
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: string) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteExpense(expenseId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}

export function useExportExpenses() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: () => {
      if (!actor) throw new Error("No actor");
      return actor.exportExpenses();
    },
  });
}

// ─── Monthly Income ──────────────────────────────────────────────────────────

export function useMonthlyIncome(month: string) {
  const { actor, isFetching } = useActor();
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
  const { actor } = useActor();
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
  const { actor, isFetching } = useActor();
  return useQuery({
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
  const { actor, isFetching } = useActor();
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
  const { actor } = useActor();
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
  const { actor } = useActor();
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
