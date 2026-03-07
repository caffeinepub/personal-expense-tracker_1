import { endOfMonth, format, isValid, parseISO, startOfMonth } from "date-fns";

// ─── Currency Formatting ─────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
};

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "JPY" ? 0 : 2,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(amount);
}

export function formatAmount(amount: number, currency: string): string {
  // Compact for large amounts
  if (Math.abs(amount) >= 100000) {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${(amount / 1000).toFixed(1)}k`;
  }
  return formatCurrency(amount, currency);
}

// ─── Date Formatting ─────────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "MMM d");
  } catch {
    return dateStr;
  }
}

export function formatMonthYear(month: string): string {
  // month = "YYYY-MM"
  try {
    return format(parseISO(`${month}-01`), "MMMM yyyy");
  } catch {
    return month;
  }
}

export function currentMonth(): string {
  return format(new Date(), "yyyy-MM");
}

export function prevMonth(month: string): string {
  try {
    const d = parseISO(`${month}-01`);
    d.setMonth(d.getMonth() - 1);
    return format(d, "yyyy-MM");
  } catch {
    return month;
  }
}

export function nextMonth(month: string): string {
  try {
    const d = parseISO(`${month}-01`);
    d.setMonth(d.getMonth() + 1);
    return format(d, "yyyy-MM");
  } catch {
    return month;
  }
}

export function isCurrentMonth(month: string): boolean {
  return month === currentMonth();
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function getMonthRange(month: string): { start: string; end: string } {
  const d = parseISO(`${month}-01`);
  return {
    start: format(startOfMonth(d), "yyyy-MM-dd"),
    end: format(endOfMonth(d), "yyyy-MM-dd"),
  };
}

export function isValidDate(dateStr: string): boolean {
  const d = parseISO(dateStr);
  return isValid(d);
}

// ─── Percentage ──────────────────────────────────────────────────────────────

export function pct(value: number, total: number): number {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
}

export function groupByDate<T extends { date: string }>(
  items: T[],
): Record<string, T[]> {
  return items.reduce(
    (acc, item) => {
      const key = item.date;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, T[]>,
  );
}
