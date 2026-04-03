import type { Category, Expense } from "../backend.d";

// ─── Export ─────────────────────────────────────────────────────────────────────────

export function exportToCSV(expenses: Expense[], categories: Category[]): void {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  const header = ["Date", "Category", "Amount", "Note", "Payment Method"];
  const rows = expenses.map((e) => [
    // Use ISO date (YYYY-MM-DD) to avoid commas in formatted dates like "Nov 3, 2025"
    e.date,
    `"${(catMap.get(e.categoryId) ?? e.categoryId).replace(/"/g, '""')}"`,
    e.amount.toFixed(2),
    `"${(e.note ?? "").replace(/"/g, '""')}"`,
    `"${(e.paymentMethod ?? "").replace(/"/g, '""')}"`,
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
    expenses: expenses.map((e) => ({
      ...e,
      // Convert BigInt createdAt to number for JSON serialization
      createdAt: Number(e.createdAt),
    })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  triggerDownload(
    blob,
    `expenses-${new Date().toISOString().slice(0, 10)}.json`,
  );
}

export async function exportToPDF(
  expenses: Expense[],
  categories: Category[],
  currency: string,
  periodLabel: string,
  totalIncome: number,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const balance = totalIncome - totalExpenses;
  const savingsRate =
    totalIncome > 0
      ? (((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1)
      : null;

  const fmt = (n: number) =>
    `${currency} ${n.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  let y = 18;
  const marginL = 14;
  const pageW = 210;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 61, 46);
  doc.text("PE Tracker — Expense Report", marginL, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(`Period: ${periodLabel}`, marginL, y);
  y += 5;
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}`,
    marginL,
    y,
  );
  y += 8;

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(marginL, y, pageW - marginL, y);
  y += 6;

  // Summary section
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Summary", marginL, y);
  y += 6;

  const summaryRows = [
    ["Total Income", fmt(totalIncome)],
    ["Total Expenses", fmt(totalExpenses)],
    ["Balance", fmt(balance)],
    ["Savings Rate", savingsRate !== null ? `${savingsRate}%` : "N/A"],
  ];

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  for (const [label, value] of summaryRows) {
    doc.setTextColor(80, 80, 80);
    doc.text(label, marginL, y);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text(value, 90, y);
    doc.setFont("helvetica", "normal");
    y += 5;
  }
  y += 4;

  // Category breakdown
  doc.setDrawColor(200, 200, 200);
  doc.line(marginL, y, pageW - marginL, y);
  y += 6;

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Category Breakdown", marginL, y);
  y += 6;

  // Build category totals
  const catTotals = new Map<
    string,
    { name: string; total: number; budget: number }
  >();
  for (const e of expenses) {
    const existing = catTotals.get(e.categoryId);
    const cat = categories.find((c) => c.id === e.categoryId);
    if (existing) {
      existing.total += Number(e.amount);
    } else {
      catTotals.set(e.categoryId, {
        name: catMap.get(e.categoryId) ?? e.categoryId,
        total: Number(e.amount),
        budget: cat?.budget ?? 0,
      });
    }
  }

  const catRows = Array.from(catTotals.values()).sort(
    (a, b) => b.total - a.total,
  );

  // Table header
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("Category", marginL, y);
  doc.text("Budget", 95, y);
  doc.text("Spent", 135, y);
  doc.text("% Used", 165, y);
  y += 4;
  doc.setDrawColor(220, 220, 220);
  doc.line(marginL, y, pageW - marginL, y);
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  for (const row of catRows) {
    if (y > 270) {
      doc.addPage();
      y = 18;
    }
    const pct =
      row.budget > 0 ? `${Math.round((row.total / row.budget) * 100)}%` : "—";
    doc.text(row.name.slice(0, 30), marginL, y);
    doc.text(row.budget > 0 ? fmt(row.budget) : "—", 95, y);
    doc.text(fmt(row.total), 135, y);
    doc.text(pct, 165, y);
    y += 5;
  }
  y += 4;

  // Transaction list
  if (y > 250) {
    doc.addPage();
    y = 18;
  }
  doc.setDrawColor(200, 200, 200);
  doc.line(marginL, y, pageW - marginL, y);
  y += 6;

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Transactions", marginL, y);
  y += 6;

  // Column headers
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("Date", marginL, y);
  doc.text("Category", 45, y);
  doc.text("Note", 95, y);
  doc.text("Amount", 168, y);
  y += 4;
  doc.setDrawColor(220, 220, 220);
  doc.line(marginL, y, pageW - marginL, y);
  y += 4;

  const sorted = [...expenses].sort((a, b) => a.date.localeCompare(b.date));
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  for (const e of sorted) {
    if (y > 278) {
      doc.addPage();
      y = 18;
    }
    doc.setFontSize(8);
    doc.text(e.date, marginL, y);
    doc.text((catMap.get(e.categoryId) ?? "").slice(0, 20), 45, y);
    doc.text((e.note ?? "").slice(0, 35), 95, y);
    doc.text(fmt(Number(e.amount)), 165, y, { align: "right" });
    y += 5;
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} • Generated by PE Tracker`,
      pageW / 2,
      290,
      { align: "center" },
    );
  }

  const safePeriod = periodLabel.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  doc.save(`pe-tracker-report-${safePeriod}.pdf`);
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

// ─── Import ─────────────────────────────────────────────────────────────────────────

// Parse a JSON file exported by this app
export function parseImportJSON(text: string): Partial<Expense>[] {
  const data = JSON.parse(text);
  const raw: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.expenses)
      ? data.expenses
      : null;
  if (!raw) throw new Error("Invalid JSON format");
  return raw.map((item: any) => ({
    ...item,
    // Re-wrap createdAt as BigInt (might be number in exported JSON)
    createdAt:
      item.createdAt != null ? BigInt(item.createdAt) : BigInt(Date.now()),
    amount: typeof item.amount === "number" ? item.amount : Number(item.amount),
  }));
}

// Parse a CSV file exported by this app
// Expected columns: Date, Category, Amount, Note, Payment Method
export function parseImportCSV(text: string): Partial<Expense>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  return lines
    .slice(1)
    .map((line) => {
      // Split on commas that are NOT inside quotes
      const cols = splitCSVLine(line);
      const date = normalizeDate(cols[0]?.trim() ?? "");
      const categoryName = cols[1]?.trim().replace(/^"|"$/g, "") ?? "";
      const amount = Number.parseFloat(cols[2]?.trim() ?? "0");
      const note = (cols[3]?.trim() ?? "")
        .replace(/^"|"$/g, "")
        .replace(/""/g, '"');
      const paymentMethod = (cols[4]?.trim() ?? "").replace(/^"|"$/g, "");
      return { date, note, amount, paymentMethod, categoryId: categoryName };
    })
    .filter((e) => typeof e.amount === "number" && e.amount > 0);
}

// Split a single CSV line respecting quoted fields
function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// Normalize various date formats to YYYY-MM-DD
function normalizeDate(raw: string): string {
  if (!raw) return "";
  // Already ISO: 2026-03-14
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  // DD.MM.YYYY or DD/MM/YYYY
  const dmy = raw.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (dmy)
    return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  // MM/DD/YYYY
  const mdy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy)
    return `${mdy[3]}-${mdy[1].padStart(2, "0")}-${mdy[2].padStart(2, "0")}`;
  // Try native Date parse for formats like "Nov 3, 2025" or "Mar 14, 2026"
  try {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }
  } catch {
    // ignore
  }
  return raw;
}
