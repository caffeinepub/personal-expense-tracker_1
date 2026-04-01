# Personal Expense Tracker

## Current State

Full-featured expense tracker with Dashboard, Expenses, Reports, Shopping List, and Settings tabs. Features income sources, recurring expenses, multi-currency, savings goal, date range filter, charts, bill reminders, spending insights, and cross-device sync via ICP backend. Add Expense modal has Note field with suggestions, Category/Payment dropdowns, amount validation, and recurring checkbox.

## Requested Changes (Diff)

### Add

1. **Tags (free-form text) in Add Expense** -- A text input field in the Add Expense modal (both Expense and Income modes) labeled "Tags" where users can type comma-separated free-form tags (e.g. `#vacation, #work`). Tags are stored with each expense record. Display tags on expense rows in the Expenses tab as small badge chips. No tag management screen needed -- purely free-form in the modal.

2. **Photo receipt attachment in Add Expense** -- A file upload button in the Add Expense modal labeled "Attach Receipt". Accepts image files (jpg, png, etc.). Uses the `blob-storage` Caffeine component to upload and store the file. No built-in viewer -- just shows a paperclip icon / filename indicator on the expense row to signal a receipt is attached. Tapping it opens the file in a new tab.

3. **Savings rate goal in Reports** -- A numeric input field (%) in the Reports tab header or summary area labeled "Savings Goal". User sets a target savings rate (e.g. 20%). The existing savings rate chip/display in Reports shows the actual rate vs. the goal, with a visual indicator (green if on target, red if below). Goal value persists in localStorage.

4. **Copy last month's budget prompt** -- On the first visit of a new calendar month (detected by comparing stored `lastVisitMonth` in localStorage to current month), show a one-time modal/toast prompt: "It's a new month! Copy last month's budgets to this month?" with Confirm and Dismiss buttons. Confirming copies all category budgets from the previous month to the current month. Dismissing skips without copying. Prompt only appears once per new month.

### Modify

- `ExpenseDialog.tsx` -- Add Tags text input field and receipt file upload button. Store tags as comma-separated string on the expense object. Store receipt blob URL on the expense object.
- Expense data model (local) -- Add `tags?: string` and `receiptUrl?: string` fields to expense records.
- `ExpensesTab.tsx` -- Display tags as small badge chips on each expense row. Show paperclip icon if `receiptUrl` is set (links to receipt in new tab).
- `ReportsTab.tsx` -- Add savings goal input. Compare actual vs goal savings rate with color indicator.
- `App.tsx` -- On mount/tab focus, check if it's a new month vs `lastVisitMonth` and trigger the copy-budget prompt if so.
- `main.tsx` -- MUST keep `LanguageProvider` and `AutoLockProvider` permanently at root with comment guards.

### Remove

- Nothing removed.

## Implementation Plan

1. Add `tags` and `receiptUrl` fields to the expense type used across the app.
2. In `ExpenseDialog.tsx`: add a Tags text input (comma-separated, placeholder `e.g. vacation, work`) below the Note field. Add an "Attach Receipt" file input button using `blob-storage` upload. On upload success, store the returned URL.
3. In `ExpensesTab.tsx`: render tags as small green badge chips on each row. Show a Paperclip icon that opens `receiptUrl` in a new tab if present.
4. In `ReportsTab.tsx`: add a savings goal `%` input (persisted to localStorage as `savingsGoal`). Update the savings rate display to show goal vs actual with green/red coloring.
5. In `App.tsx`: on mount, check `localStorage.getItem('lastVisitMonth')` vs `format(new Date(), 'yyyy-MM')`. If different, show a Dialog prompt to copy last month's category budgets. On confirm, copy budgets. Set `lastVisitMonth` to current month regardless of choice.
6. Ensure `LanguageProvider` and `AutoLockProvider` remain in `main.tsx` with comment guards.
