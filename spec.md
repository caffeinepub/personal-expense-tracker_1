# PE Tracker — Feature Batch: Spending Trend Chart, Debt/Loan Tracker, Spending Limit Notifications, Expense Notes History, Favorite/Pinned Categories, Dark/Light Mode Toggle Shortcut, Category Color Picker, Export to PDF

## Current State

The app already has:
- Full expense/income/budget CRUD with cross-device sync via ICP backend
- Dashboard with Spent Card, Income Source, Spending Insights, Savings Goal, Bill Reminders, By Category tabs, Recent Transactions
- Reports tab with Donut/Bar charts, Monthly Income card, three stats (Income/Expenses/Balance)
- Expenses tab with advanced filters, recurring expense management modal, search modal
- Settings tab with Regional, Financial, Security, Export/Import, About sections
- LanguageProvider and AutoLockProvider in main.tsx (currently MISSING — must be restored)
- Categories have id, name, color, budget stored in backend
- AppSettings stored per-user in backend (currently only has currency field)
- Export utilities in utils/export.ts (CSV/JSON)
- Dark/light mode via shadcn theme system, toggled in AppHeader

## Requested Changes (Diff)

### Add
1. **Spending Trend Chart** — Line chart in Reports tab showing month-over-month total expenses (and optionally income) for the last 6–12 months. Uses existing expense data aggregated by month on the frontend.
2. **Debt / Loan Tracker** — New section on Dashboard (or dedicated modal accessible from Dashboard). Tracks debts: who owes whom, amount, description, due date, status (pending/paid). Stored in backend via new `saveDebts`/`getDebts` methods. CRUD operations (add, mark paid, delete). Shows total owed/owable on Dashboard.
3. **Spending Limit Notifications** — User can set a daily and/or weekly spending limit in Settings > Financial Settings. When total spending for the current day/week approaches (80%) or exceeds the limit, an in-app alert/badge appears on the Dashboard (similar to Budget Alerts card). Limits stored in backend via AppSettings or a new UserPreferences record.
4. **Expense Notes History** — Modal accessible from Expenses tab toolbar (e.g., Notes icon). Shows all unique notes used across all expenses as a searchable list. Clicking a note pre-fills the Add Expense Note field or copies it to clipboard.
5. **Favorite / Pinned Categories** — Categories can be marked as pinned/favorite in Settings > Financial Settings > Category. Pinned categories appear at the top of the Add Expense category dropdown. Pinned state stored as a boolean field or a separate list in backend settings.
6. **Dark/Light Mode Toggle Shortcut** — Add a floating or fixed shortcut button (accessible from all tabs, perhaps in the header or as a small FAB) that lets the user toggle dark/light mode with a single tap, without navigating to Settings. The current header already has a toggle — make it more prominent or add a keyboard shortcut (press D key).
7. **Category Color Picker** — In Settings > Financial Settings > Category, when adding or editing a category, replace the preset color swatches with a full color picker (HEX input + color wheel/palette). The picked color is saved to the category's `color` field.
8. **Export to PDF** — In Settings > Export & Import Data, add a "Export PDF" button alongside existing CSV/JSON. Generates a formatted PDF report for the selected period (month/quarter/year) using a frontend-only PDF library (jsPDF). PDF includes: summary (total income, total expenses, balance, savings rate), category breakdown table, and list of transactions.

### Modify
- **Backend `AppSettings`**: Add `spendingLimits` optional field: `{ daily: Float; weekly: Float }` — stored alongside currency in `AppSettings`
- **Backend `Category`**: Add `pinned` optional boolean field to allow favorite/pinned categories
- **Backend**: Add `DebtRecord` type and `saveDebts`/`getDebts` methods for debt/loan tracker
- **Settings > Financial Settings > Category**: Replace color swatches with color picker (hex input + palette)
- **Settings > Financial Settings**: Add new "Spending Limits" sub-tab for daily/weekly limit inputs
- **Reports tab**: Add spending trend line chart section above or below existing charts
- **Dashboard**: Add Debt/Loan tracker summary card; add Spending Limit alert card
- **Expenses tab toolbar**: Add Notes History icon/button
- **AppHeader**: Dark/light mode toggle already present — make it also respond to `D` key press
- **main.tsx**: Restore LanguageProvider and AutoLockProvider with permanent comment guards

### Remove
- Nothing removed

## Implementation Plan

1. **Backend (Motoko)**
   - Add `DebtRecord` type: `{ id: Text; description: Text; personName: Text; amount: Float; dueDate: ?Text; direction: Text; /* "owe" | "owed" */ status: Text; /* "pending" | "paid" */ createdAt: Int }`
   - Add `saveDebts(debts: [DebtRecord])` and `getDebts()` methods
   - Extend `AppSettings` to include `dailyLimit: ?Float` and `weeklyLimit: ?Float`
   - Add `pinned` field to `Category` type

2. **Frontend — Debt/Loan Tracker**
   - `DebtTrackerCard` component on Dashboard — shows total owed/owable, list of debts, add/mark paid/delete
   - Uses `saveDebts`/`getDebts` backend methods with React Query

3. **Frontend — Spending Trend Chart**
   - In Reports tab, add a "Spending Trend" section with a Recharts LineChart
   - Aggregates existing expenses by month for last 12 months from the local expense data (no new backend needed)
   - Shows both Expenses and Income trend lines

4. **Frontend — Spending Limit Notifications**
   - Settings > Financial Settings: new "Limits" sub-tab with daily/weekly limit number inputs
   - Saves to backend via extended `AppSettings` or new `saveUserPreferences`
   - Dashboard: `SpendingLimitCard` — calculates today's total & this week's total from expenses, compares to limits, shows progress bar + alert if ≥ 80%

5. **Frontend — Expense Notes History**
   - `NotesHistorySheet` modal triggered by a Notes icon button in Expenses tab toolbar
   - Reads all expenses, extracts unique non-empty notes, displays as searchable list
   - Tapping a note copies it to clipboard (or pre-fills if Add Expense is open)

6. **Frontend — Favorite/Pinned Categories**
   - Add a pin/star toggle to each category row in Settings > Financial Settings > Category
   - Pinned categories show a star icon and sort to top in Add Expense category dropdown
   - `pinned` field stored in Category record

7. **Frontend — Category Color Picker**
   - Replace color swatch grid in Add/Edit Category dialog with a hex color input + a palette of 20 preset colors
   - User can type any hex value or click a preset

8. **Frontend — Export to PDF**
   - Install/use jsPDF (already potentially in package.json, else add via CDN-compatible import)
   - In Settings > Export & Import Data, add PDF export button
   - PDF layout: header (PE Tracker + period), summary table, category breakdown, transactions list

9. **Frontend — Dark/Light Mode Shortcut**
   - Add `useEffect` keydown listener for `D` key in App.tsx or AppHeader to toggle theme
   - Ensure existing header toggle is prominent enough; optionally add a tooltip showing the `D` shortcut

10. **main.tsx** — Restore LanguageProvider and AutoLockProvider with permanent comment guards
