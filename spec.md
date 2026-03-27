# Personal Expense Tracker

## Current State
- Shopping list uses Zustand + localStorage (device-local, no cross-device sync)
- ExpenseDialog reads payment methods from localStorage once on mount (doesn't react to Settings changes)
- Dashboard Recent Transactions shows Category badge on one line, Note/Payment on a separate line
- Expenses tab shows Category badge + Payment on one row, Note on a separate line
- LanguageProvider is missing from main.tsx (translations return raw keys)

## Requested Changes (Diff)

### Add
- Backend: `ShoppingItem` type + `createShoppingItem`, `getShoppingItems`, `updateShoppingItem`, `deleteShoppingItem`, `clearBoughtShoppingItems` canister methods for cross-device sync
- Shopping list query hooks in `useQueries.ts` matching the backend pattern

### Modify
- `main.tsx`: Add `LanguageProvider` and `AutoLockProvider` wrapping `App` (with comment guards)
- `ShoppingListTab.tsx`: Replace Zustand store with backend queries for cross-device persistence
- `ExpenseDialog.tsx`: Read payment methods dynamically on every open (useEffect on `open` prop) instead of once on mount
- `DashboardTab.tsx` Recent Transactions: Change row info line to show `Category | Note` in a single line using `|` separator
- `ExpensesTab.tsx` expense rows: Change info line to show `Category | Payment | Note` in a single line using `|` separator

### Remove
- `useShoppingList.ts` Zustand store (replaced by backend queries)

## Implementation Plan
1. Generate Motoko backend code with ShoppingItem support
2. Update useQueries.ts with shopping list hooks
3. Rewrite ShoppingListTab to use backend queries
4. Fix ExpenseDialog payment methods to re-read on open
5. Fix DashboardTab Recent Transactions row format
6. Fix ExpensesTab row format
7. Fix main.tsx with LanguageProvider + AutoLockProvider
