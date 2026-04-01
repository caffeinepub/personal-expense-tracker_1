# Personal Expense Tracker — High-Impact Features + Provider Fix

## Current State
- Dashboard with income source section, by-category charts, spending insights, bill reminders, recent transactions
- Expenses tab with monthly/quarterly/yearly toolbar, filters (payment method, amount range), and expense CRUD
- Reports tab with aggregated category breakdown, savings rate, budget progress bars
- Settings with 5 collapsible sections: Regional Settings (Language, Currency, Number & Date Format), Financial Settings (Incomes, Category, Budgets, Payments), Export & Import Data, Security & Privacy, About
- Add Expense modal with income/expense toggle, recurring, note suggestions, income source dropdown
- Shopping List tab with date groups, cross-device sync
- Backend: `backend.d.ts` has AppSettings (currency only), Expense, Category, IncomeSource, MonthlyIncome, UserProfile
- `main.tsx` is MISSING both `LanguageProvider` and `AutoLockProvider` — must be restored immediately

## Requested Changes (Diff)

### Add
1. **Savings Goal Tracker**
   - New card on the Dashboard (below Spending Insights, above Bill Reminders)
   - User sets a monthly savings target amount (stored in localStorage key `savings_goal`)
   - Displays: goal amount, actual savings (totalIncome - totalExpenses for current month), progress bar, percentage
   - Edit pencil icon to change the goal — opens a small inline input
   - Color: green if on-track (actual >= 80% of goal), amber if close (50–79%), red if under

2. **Date Range Filter in Expenses**
   - Inside the existing expandable Filters panel in ExpensesTab
   - Add two date inputs: "From" and "To" (type="date", works on mobile)
   - When either is set, filter displayed expenses to only those within the date range
   - Clear button (X icon) to reset the date range
   - Date range filter combines with existing payment method and amount range filters (AND logic)

3. **Multi-Currency Support**
   - New sub-section in Settings > Regional Settings > Currency (below current currency selector)
   - A toggle: "Enable multi-currency" (stored in localStorage `multi_currency_enabled`)
   - When enabled, a list of up to 5 secondary currencies with manual exchange rates vs. base currency
   - E.g. "USD: 1 EUR = 1.08 USD" — user sets the rate
   - Stored in localStorage `secondary_currencies` as JSON array of `{code, rate}`
   - In Add Expense modal: when multi-currency is enabled, show a currency selector dropdown next to the Amount field
   - Amount is stored in the backend as-is, but displayed in the base currency (converted using the stored rate)
   - In expense list rows, if currency differs from base, show original currency amount in small text

4. **LanguageProvider + AutoLockProvider in main.tsx**
   - Restore both providers wrapping the entire app with prominent comment guards:
     `// ⚠️ DO NOT REMOVE — LanguageProvider and AutoLockProvider must wrap the entire app`

### Modify
- Dashboard: insert Savings Goal card in correct position
- ExpensesTab: extend Filters panel with date range inputs
- SettingsTab > Regional Settings > Currency: add multi-currency toggle + secondary currency rate table
- ExpenseDialog: conditionally show currency selector when multi-currency enabled
- `main.tsx`: add LanguageProvider and AutoLockProvider back with comment guards

### Remove
- Nothing

## Implementation Plan
1. Fix `main.tsx` — restore `LanguageProvider` (from `../i18n/LanguageContext`) and `AutoLockContext` wrapping App, with comment guards
2. Create `SavingsGoalCard` component — reads localStorage for goal, computes savings from monthly summary, renders progress bar with edit mode
3. Insert SavingsGoalCard into DashboardTab below SpendingInsights
4. Extend ExpensesTab Filters panel — add from/to date inputs, apply AND filter with existing filters
5. Add multi-currency localStorage helpers to `utils/format.ts` or a new `utils/currency.ts`
6. Extend SettingsTab > Regional Settings > Currency tab with multi-currency toggle and rate editor
7. Extend ExpenseDialog — conditionally show currency selector next to amount, store currency code on expense note or as a convention (prefix `[USD]` in note)
8. Update expense row display in ExpensesTab and DashboardTab to show original currency when applicable
