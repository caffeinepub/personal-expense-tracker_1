# PE Tracker - Version 89

## Current State
The app is a full-stack Personal Expense Tracker with dashboard, expenses, reports, settings, and shopping list tabs. Key issues: income sources not synced on mobile in dashboard, wrong header section title, recent transactions truncated to 7, chart labels may not be visible in dark mode, Add Item labels not capitalized, AppHeader needs redesign, LanguageProvider missing from main.tsx.

## Requested Changes (Diff)

### Add
- New premium AppHeader with username display (editable), pencil icon, theme toggle (rounded square), logout (rounded square)

### Modify
1. DashboardTab: Load incomeSources reactively from `useIncomeSources()` hook (backend sync) instead of one-time localStorage read
2. DashboardTab: Rename "DASHBOARD | Income" header to "DASHBOARD | Income Source"
3. DashboardTab: Remove `.slice(0, 7)` from recentExpenses so all transactions show
4. DashboardTab: Fix chart labels (XAxis/YAxis tick fill) to use CSS variable that adapts to dark mode; donut chart legend text color fixed
5. ShoppingListTab: Use `t("category_label")` and `t("date_label")` for Add/Edit Item dialog labels (returns "Category" and "Date" capitalized)
6. main.tsx: Wrap app with LanguageProvider and AutoLockProvider permanently with comment guards
7. App.tsx: Ensure smooth loading with spinner until data ready

### Remove
- Nothing removed

## Implementation Plan
1. Update main.tsx with LanguageProvider + AutoLockProvider + comment guards
2. Update AppHeader.tsx with new premium design: gradient bg, PE Tracker title, subtitle, username with edit icon, theme toggle rounded square, logout rounded square
3. Update DashboardTab.tsx: use useIncomeSources hook for reactive sync, rename header, remove slice, fix chart label colors
4. Update ShoppingListTab.tsx: capitalize Category/Date labels
5. Ensure App.tsx loading is smooth
