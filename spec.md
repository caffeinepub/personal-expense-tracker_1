# Personal Expense Tracker — Shopping List Tab

## Current State

The app has 4 tabs: Dashboard, Expenses, Reports, Settings. Navigation uses a bottom nav bar with icons and labels. Tabs are defined in `TAB_IDS`, `TAB_ICONS`, `TAB_KEYS`, `TAB_OCIDS` arrays in `App.tsx`. The app uses Zustand-like state (custom hooks + localStorage) for persistence. Theme color is synced from the card theme to the header/nav background via `color-mix`. The FAB opens the Add Expense dialog. `main.tsx` is missing `LanguageProvider` and `AutoLockProvider` — this causes white screen and broken translations.

## Requested Changes (Diff)

### Add
- New tab: "Shopping List" (tab id: `shopping`, icon: `ShoppingCart` from lucide-react)
- New page: `src/frontend/src/pages/ShoppingListTab.tsx`
- New store: `src/frontend/src/hooks/useShoppingList.ts` — Zustand store persisted to localStorage
  - Item shape: `{ id, name, category, estimatedPrice?: number, bought: boolean, createdAt }`
  - Actions: addItem, toggleBought, deleteItem, clearBought
- FAB on Shopping List tab opens an "Add Item" dialog (name + category picker + optional estimated price)
- When an item is checked (bought), show an optional quick-expense dialog to log it as an expense
- Show estimated total (sum of estimatedPrice of unbought items) at the top of the list
- Translation keys: `tab_shopping`, `shopping_list`, `add_item`, `item_name`, `estimated_price`, `estimated_total`, `mark_bought`, `log_as_expense`, `clear_bought`, `no_items_yet`
- Add `LanguageProvider` and `AutoLockProvider` permanently to `main.tsx` (regression fix)

### Modify
- `App.tsx`: add `shopping` to `TAB_IDS`, add `ShoppingCart` to `TAB_ICONS`, add keys/ocids for the new tab; render `<ShoppingListTab>` when active; the FAB should be hidden on the shopping tab (it has its own FAB)
- `src/frontend/src/i18n/translations.ts`: add shopping list translation keys for all 8 languages
- `main.tsx`: ensure `LanguageProvider` and `AutoLockProvider` are wrapped at root (permanent fix)

### Remove
- Nothing removed

## Implementation Plan

1. Create `useShoppingList.ts` Zustand store with localStorage persistence
2. Create `ShoppingListTab.tsx` with flat item list, estimated total banner, FAB, add-item dialog, check-to-buy flow with optional quick expense log
3. Update `App.tsx` to include the new tab, hide global FAB on shopping tab
4. Add translation keys to `translations.ts` for all 8 languages
5. Fix `main.tsx` to permanently include `LanguageProvider` and `AutoLockProvider`
6. Validate (lint + typecheck + build)
