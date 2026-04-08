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
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const balance = totalIncome - totalExpenses;
  const savingsRate =
    totalIncome > 0
      ? (((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1)
      : null;

  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

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
  const sorted = [...expenses].sort((a, b) => a.date.localeCompare(b.date));

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>PE Tracker — ${periodLabel}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; color: #222; margin: 24px; }
    h1 { color: #0b3d2e; font-size: 20px; margin-bottom: 4px; }
    h2 { font-size: 14px; margin: 16px 0 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .meta { color: #666; font-size: 11px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    th { background: #f3f4f6; text-align: left; padding: 5px 8px; font-size: 11px; color: #555; }
    td { padding: 4px 8px; border-bottom: 1px solid #f0f0f0; }
    .summary-table td:last-child { font-weight: bold; }
    .amount { text-align: right; }
    .footer { margin-top: 24px; font-size: 10px; color: #999; text-align: center; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>PE Tracker — Expense Report</h1>
  <div class="meta">Period: ${periodLabel} &nbsp;•&nbsp; Generated: ${new Date().toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}</div>

  <h2>Summary</h2>
  <table class="summary-table" style="max-width:360px">
    <tr><td>Total Income</td><td>${fmt(totalIncome)}</td></tr>
    <tr><td>Total Expenses</td><td>${fmt(totalExpenses)}</td></tr>
    <tr><td>Balance</td><td>${fmt(balance)}</td></tr>
    <tr><td>Savings Rate</td><td>${savingsRate !== null ? `${savingsRate}%` : "N/A"}</td></tr>
  </table>

  <h2>Category Breakdown</h2>
  <table>
    <thead><tr><th>Category</th><th class="amount">Budget</th><th class="amount">Spent</th><th class="amount">% Used</th></tr></thead>
    <tbody>
      ${catRows
        .map((row) => {
          const pct =
            row.budget > 0
              ? `${Math.round((row.total / row.budget) * 100)}%`
              : "—";
          return `<tr><td>${row.name}</td><td class="amount">${row.budget > 0 ? fmt(row.budget) : "—"}</td><td class="amount">${fmt(row.total)}</td><td class="amount">${pct}</td></tr>`;
        })
        .join("")}
    </tbody>
  </table>

  <h2>Transactions (${sorted.length})</h2>
  <table>
    <thead><tr><th>Date</th><th>Category</th><th>Note</th><th>Payment</th><th class="amount">Amount</th></tr></thead>
    <tbody>
      ${sorted
        .map(
          (e) => `<tr>
        <td>${e.date}</td>
        <td>${catMap.get(e.categoryId) ?? ""}</td>
        <td>${e.note ?? ""}</td>
        <td>${e.paymentMethod ?? ""}</td>
        <td class="amount">${fmt(Number(e.amount))}</td>
      </tr>`,
        )
        .join("")}
    </tbody>
  </table>

  <div class="footer">Generated by PE Tracker &nbsp;•&nbsp; caffeine.ai</div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.focus();
  } else {
    // Fallback: trigger direct download of HTML
    triggerDownload(
      blob,
      `pe-tracker-report-${periodLabel.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.html`,
    );
  }
  setTimeout(() => URL.revokeObjectURL(url), 5000);
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
