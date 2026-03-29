# Personal Expense Tracker

## Current State
- Expenses and Reports tabs have a horizontal toolbar with Monthly/Quarterly/Yearly navigators.
- The active/selected period button has no distinct visual style (no green gradient).
- The list in Expenses only shows the current month's data; Quarterly and Yearly selections don't aggregate data across multiple months.
- The Note field in Add Expense is a plain text input that shows inline suggestion dropdown only when typing 2+ chars.
- main.tsx is missing LanguageProvider and AutoLockProvider.

## Requested Changes (Diff)

### Add
- Active period type (Monthly / Quarterly / Yearly) indicator: whichever navigator was last interacted with gets a green gradient highlight on its container/label.
- `periodType` state (`'monthly' | 'quarterly' | 'yearly'`) in both ExpensesTab and ReportsTab.
- Quarterly aggregation: when Quarterly is active, aggregate expenses for all 3 months of the selected quarter (Q1=Jan-Mar, Q2=Apr-Jun, Q3=Jul-Sep, Q4=Oct-Dec) and show per-row totals.
- Yearly aggregation: when Yearly is active, aggregate expenses for all 12 months of the selected year and show per-row totals.
- Note field becomes a dropdown-style button: shows current note value (or placeholder), clicking opens a dropdown list of all unique past expense notes as suggestion options.
- LanguageProvider and AutoLockProvider back in main.tsx with comment guards.

### Modify
- Toolbar period buttons styled with green gradient when that period type is active.
- Expenses list: when quarterly or yearly, load all relevant months' data and group/sum by category for a summary view.
- ReportsTab: when quarterly or yearly, show aggregated totals in summary cards.
- Note field: replace Input with a button+dropdown using DropdownMenu component.

### Remove
- Note field text input inline suggestion behavior (replace entirely with dropdown).

## Implementation Plan
1. Add `periodType` state and green-gradient active styling to the Monthly/Quarterly/Yearly navigator containers in ExpensesTab and ReportsTab.
2. In ExpensesTab: when `periodType === 'quarterly'`, load expenses for 3 months; when `periodType === 'yearly'`, load all 12 months. Aggregate and display summary rows per category with total amount.
3. In ExpenseDialog: replace the Note Input field with a DropdownMenu trigger button that shows the note value and a ChevronDown icon, with all unique past notes as dropdown items (plus a text input within the dropdown or an editable approach).
4. Fix main.tsx: add LanguageProvider and AutoLockProvider with comment guards.
