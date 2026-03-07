import type { Category, Expense } from "../backend.d";
import { formatDate } from "./format";

export function exportToCSV(expenses: Expense[], categories: Category[]): void {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  const header = ["Date", "Category", "Amount", "Note", "Payment Method"];
  const rows = expenses.map((e) => [
    formatDate(e.date),
    catMap.get(e.categoryId) ?? e.categoryId,
    e.amount.toFixed(2),
    `"${(e.note ?? "").replace(/"/g, '""')}"`,
    e.paymentMethod ?? "",
  ]);

  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(
    blob,
    `expenses-${new Date().toISOString().slice(0, 10)}.csv`,
  );
}

export function exportToJSON(
  expenses: Expense[],
  categories: Category[],
): void {
  const data = {
    exportedAt: new Date().toISOString(),
    categories,
    expenses,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  triggerDownload(
    blob,
    `expenses-${new Date().toISOString().slice(0, 10)}.json`,
  );
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
