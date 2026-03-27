# Personal Expense Tracker — Smart Pre-fill & Quick-Add from Bill Reminders

## Current State
- `ExpenseDialog.tsx` has Note field as a plain text input with no autocomplete/suggestion logic.
- `BillReminders.tsx` shows upcoming recurring bills with a dismiss (X) button only — no way to quickly log them.
- `main.tsx` is missing `LanguageProvider` and `AutoLockProvider` wrappers (regression that keeps recurring).

## Requested Changes (Diff)

### Add
- **Note field autocomplete/suggestion in ExpenseDialog**: As the user types in the Note field, scan all past expenses for note matches (case-insensitive contains). Show a dropdown of up to 5 suggestions. Each suggestion shows note text, amount, and category name. Selecting a suggestion auto-fills: Note, Amount, Category, and Payment Method.
- **Quick-Add button in BillReminders**: Each bill reminder row gets an "Add Now" (or play/plus icon) button alongside the dismiss button. Clicking it calls a provided `onQuickAdd` callback with the recurring expense data, which opens ExpenseDialog pre-filled with: Amount, Category, Payment Method, and today's date (not the original recurring date). Note field auto-filled with the bill's note.
- **`onQuickAdd` prop wired in App.tsx**: `BillReminders` receives `onQuickAdd` callback; `App.tsx` passes a handler that calls `setEditingExpense(null)` and opens the dialog with pre-filled values.
- **Pre-fill prop in ExpenseDialog**: Accept optional `prefill` prop `{ amount?: string; categoryId?: string; paymentMethod?: string; note?: string }` so it can be pre-populated for quick-add without being in "edit" mode.

### Modify
- `ExpenseDialog.tsx`: Add Note autocomplete dropdown. Add `prefill` optional prop. Apply prefill values when `open` changes and no `expense` (editing) is set.
- `BillReminders.tsx`: Add "Add Now" button per row. Accept `onQuickAdd?: (data: PrefillData) => void` prop.
- `App.tsx`: Pass `onQuickAdd` to `BillReminders` in `DashboardTab` (via prop drilling or direct). Wire handler to open ExpenseDialog with prefill. Since `BillReminders` is rendered inside `DashboardTab`, either pass a callback down or lift `onQuickAdd` to `DashboardTab` → `App`.
- `main.tsx`: Re-anchor `LanguageProvider` and `AutoLockProvider` with comment guards.

### Remove
- Nothing removed.

## Implementation Plan
1. Fix `main.tsx` — add `LanguageProvider` and `AutoLockProvider` with DO NOT REMOVE comment guards.
2. Add `prefill` prop to `ExpenseDialog` and apply it in the `useEffect` that runs on `open`.
3. Add Note autocomplete: build a small inline dropdown using the list of all expenses passed in or fetched via `useExpenses()` inside the dialog. Show suggestions as user types (≥2 chars), hide on selection or blur.
4. Update `BillReminders` to accept `onQuickAdd` prop and render an "Add" icon button per row next to the dismiss button.
5. Wire `onQuickAdd` from `DashboardTab` up to `App.tsx` via a new `onQuickAdd` prop, and connect it to open `ExpenseDialog` with the prefill data.
