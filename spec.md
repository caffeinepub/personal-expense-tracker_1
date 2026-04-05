# PE Tracker

## Current State
- Add Expense modal: recurring checkbox defaults to `false` for new expenses, and is hidden when editing
- Edit Expense modal: the recurring expense section is completely hidden (`!isEditing` guard prevents it from rendering)
- Budget Alerts collapsible header: uses `bg-card hover:bg-muted/40` (no distinct background color)
- Debt/Loan Tracker collapsible header: uses `bg-card hover:bg-muted/40` (no distinct background color)
- Spending Limits card: no collapsible header row with background color — just a plain card
- Dashboard layout order: Quick Stats → Spending Insights/Savings → Budget Alerts → Bill Reminders → Spending Limits → Debt/Loan Tracker → Income Source → By Category/Recent
- main.tsx: Missing LanguageProvider and AutoLockProvider wrappers

## Requested Changes (Diff)

### Add
- Collapsible header background color to Budget Alerts section (amber/red tinted)
- Collapsible header background color to Debt/Loan Tracker section (blue/primary tinted)
- Background color to Spending Limits header row (purple/indigo tinted), convert to collapsible with header
- Recurring expense section in Edit Expense modal (always checked, default Monthly)
- LanguageProvider + AutoLockProvider back into main.tsx

### Modify
- Add Expense modal: recurring checkbox defaults to `true` (checked) for new expenses
- Dashboard layout: reorder sections so Debt/Loan Tracker is beneath Income Source, and Budget Alerts + Spending Limits are beneath Debt/Loan Tracker
  - New order: Quick Stats → Spending Insights/Savings → Bill Reminders → Income Source → Debt/Loan Tracker → Budget Alerts → Spending Limits → By Category/Recent
- Edit Expense modal: show recurring section (always checked, default Monthly), remove the `!isEditing` guard
- Budget Alerts header: add a distinct tinted background matching the alert state (amber/red)
- Debt/Loan Tracker header: add a distinct tinted gradient background
- Spending Limits: wrap in collapsible with colored header row

### Remove
- Nothing removed

## Implementation Plan
1. **ExpenseDialog.tsx**: 
   - Set `recurring` initial state to `true` (default checked)
   - For `else` branch (new expense, no prefill): set `setRecurring(true)` 
   - Remove `!isEditing` guard from recurring section — show it in both add and edit modes
   - When editing, always set recurring to `true` if not already set
2. **DashboardTab.tsx**:
   - Reorder sections: move Debt/Loan Tracker to after Income Source section
   - Move Budget Alerts and Spending Limits to after Debt/Loan Tracker
   - Add tinted background color to Budget Alerts collapsible header button
   - Add tinted background color to Debt/Loan Tracker collapsible header button
   - Wrap SpendingLimitCard in a collapsible section with colored header row
3. **main.tsx**: Add LanguageProvider and AutoLockProvider with comment guards
