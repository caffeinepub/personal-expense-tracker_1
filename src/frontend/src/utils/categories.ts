import type { Category } from "../backend.d";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "food", name: "Food & Dining", color: "#FF6B6B", budget: 0 },
  { id: "transport", name: "Transport", color: "#4ECDC4", budget: 0 },
  { id: "entertainment", name: "Entertainment", color: "#45B7D1", budget: 0 },
  { id: "bills", name: "Bills & Utilities", color: "#96CEB4", budget: 0 },
  { id: "shopping", name: "Shopping", color: "#F0C040", budget: 0 },
  { id: "health", name: "Health", color: "#DDA0DD", budget: 0 },
  { id: "other", name: "Other", color: "#B0B0B0", budget: 0 },
];

export const PRESET_COLORS = [
  "#FF6B6B",
  "#FF8E53",
  "#F0C040",
  "#4CAF50",
  "#4ECDC4",
  "#45B7D1",
  "#6495ED",
  "#9B59B6",
  "#DDA0DD",
  "#FF69B4",
  "#96CEB4",
  "#B0B0B0",
];

export function getCategoryById(
  categories: Category[],
  id: string,
): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function getCategoryColor(categories: Category[], id: string): string {
  return getCategoryById(categories, id)?.color ?? "#B0B0B0";
}

export function getCategoryName(categories: Category[], id: string): string {
  return getCategoryById(categories, id)?.name ?? "Unknown";
}
