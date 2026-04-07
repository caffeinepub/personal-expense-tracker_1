import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useAppSettings,
  useCategories,
  useExpenseMetaList,
  useExpenses,
} from "../hooks/useQueries";
import type { Expense } from "../types";
import { getCategoryById } from "../utils/categories";
import { formatCurrency, formatDate } from "../utils/format";

interface GlobalSearchSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onNavigateToMonth: (month: string) => void;
}

export default function GlobalSearchSheet({
  open,
  onOpenChange,
  onNavigateToMonth,
}: GlobalSearchSheetProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { data: allExpenses = [] } = useExpenses();
  const { data: categories = [] } = useCategories();
  const { data: settings } = useAppSettings();
  const { data: expenseMetaList = [] } = useExpenseMetaList();
  const currency = settings?.currency ?? "USD";

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [open]);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const metaByExpenseId = useMemo(() => {
    const map = new Map<string, { tags?: string[]; receiptUrl?: string }>();
    const safeList = Array.isArray(expenseMetaList) ? expenseMetaList : [];
    for (const item of safeList) {
      try {
        if (!Array.isArray(item) || item.length < 2) continue;
        const [id, meta] = item;
        if (typeof id !== "string" || !meta) continue;
        // tags may come back as a comma-separated string from backend or as string[]
        let tagsArr: string[] | undefined;
        const rawTags = meta.tags as unknown;
        if (Array.isArray(rawTags)) {
          tagsArr = (rawTags as string[]).filter(
            (t) => typeof t === "string" && t.length > 0,
          );
        } else if (typeof rawTags === "string" && rawTags.length > 0) {
          tagsArr = rawTags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        }
        map.set(id, {
          tags: tagsArr,
          receiptUrl:
            typeof meta.receiptUrl === "string" ? meta.receiptUrl : undefined,
        });
      } catch {
        // skip malformed entries
      }
    }
    return map;
  }, [expenseMetaList]);

  const results = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];
    return allExpenses
      .filter((e: Expense) => {
        const catName = getCategoryById(categories, e.categoryId)?.name ?? "";
        const tagArr = metaByExpenseId.get(e.id)?.tags ?? e.tags ?? [];
        const tagsStr = (Array.isArray(tagArr) ? tagArr : [tagArr])
          .join(" ")
          .toLowerCase();
        return (
          e.note?.toLowerCase().includes(q) ||
          catName.toLowerCase().includes(q) ||
          String(e.amount).includes(q) ||
          e.paymentMethod?.toLowerCase().includes(q) ||
          tagsStr.includes(q)
        );
      })
      .sort(
        (a: Expense, b: Expense) =>
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
      .slice(0, 50);
  }, [debouncedQuery, allExpenses, categories, metaByExpenseId]);

  const handleResultClick = useCallback(
    (expense: Expense) => {
      const month = expense.date.substring(0, 7);
      onNavigateToMonth(month);
      onOpenChange(false);
    },
    [onNavigateToMonth, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md w-full max-h-[85vh] flex flex-col p-0 gap-0 rounded-2xl"
        data-ocid="global_search.dialog"
      >
        <DialogHeader className="px-4 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold">
              Search All Transactions
            </DialogTitle>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
              aria-label="Close"
              data-ocid="global_search.close_button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        {/* Search Input */}
        <div className="px-4 pb-3 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search by note, category, amount, tags…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-10 text-sm"
              data-ocid="global_search.search_input"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div
          className="flex-1 overflow-y-auto px-4 pb-6"
          data-ocid="global_search.list"
        >
          {!debouncedQuery.trim() ? (
            <div
              className="flex flex-col items-center justify-center h-48 gap-3"
              data-ocid="global_search.empty_state"
            >
              <Search className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground text-center">
                Type to search across all your transactions
              </p>
            </div>
          ) : results.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-48 gap-3"
              data-ocid="global_search.empty_state"
            >
              <Search className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground text-center">
                No transactions found for &ldquo;{debouncedQuery}&rdquo;
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground mb-2">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </p>
              {results.map((expense: Expense, idx: number) => {
                const cat = getCategoryById(categories, expense.categoryId);
                const tagArr =
                  metaByExpenseId.get(expense.id)?.tags ?? expense.tags ?? [];
                const tags = Array.isArray(tagArr) ? tagArr : [];
                return (
                  <button
                    key={expense.id}
                    type="button"
                    data-ocid={`global_search.item.${idx + 1}`}
                    onClick={() => handleResultClick(expense)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
                  >
                    {/* Category color dot */}
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat?.color ?? "#B0B0B0" }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">
                          {cat?.name ?? "Unknown"}
                        </span>
                        <span className="text-sm font-semibold flex-shrink-0 text-foreground">
                          {formatCurrency(Number(expense.amount), currency)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground truncate">
                          {expense.note
                            ? expense.note.length > 40
                              ? `${expense.note.substring(0, 40)}\u2026`
                              : expense.note
                            : "No note"}
                        </span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatDate(expense.date)}
                        </span>
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {tags
                            .slice(0, 3)
                            .filter(Boolean)
                            .map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary"
                              >
                                #{tag}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
