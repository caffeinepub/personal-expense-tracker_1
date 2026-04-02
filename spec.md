# Personal Expense Tracker

## Current State

### Dashboard Tab (DashboardTab.tsx)
- Quick Stats Row (Income/Expenses/Balance): stat labels use `text-sm font-semibold uppercase`, stat values use `text-lg font-bold` with blue/red/green colors already applied.
- Icons: `ArrowUpCircle`, `ArrowDownCircle`, `Scale` are present but colored `text-muted-foreground` (no color).
- Savings Goal card: the inline input uses `flex-1` width (takes full available space).
- Bottom nav: icons are `h-5 w-5` (20px), labels are `text-[10px]` (10px).

### Reports Tab (ReportsTab.tsx)
- Monthly Income card: `CardContent` padding `pt-4 pb-4 px-4`. The label uses `text-xs`. The amount uses `text-2xl font-bold`.
- SummaryCard (3 stats): `CardContent` padding `pt-3 pb-3 px-3`. Layout: icon on top, then label (`text-xs`), then value (`text-sm font-bold`). Icon and label are separate rows — label comes AFTER the icon.
- Stat values: `text-sm` (14px), color driven by a `color` prop (`text-positive`/`text-negative` — no distinct blue/red/green per stat).

### main.tsx
- Missing `LanguageProvider` and `AutoLockProvider` — only has `InternetIdentityProvider` and `QueryClientProvider`.

## Requested Changes (Diff)

### Add
- In `main.tsx`: wrap `<App />` with `LanguageProvider` (from `../i18n/LanguageContext`) and `AutoLockProvider` (from `../contexts/AutoLockContext`) with prominent comment guards.

### Modify

**Dashboard — Quick Stats Row:**
- Stat labels: change from `text-sm` to `text-[12px]` (12px), keep `uppercase`. Color each icon to match its stat: Income icon → `text-blue-500`, Expenses icon → `text-red-500`, Balance icon → `text-emerald-500`.
- Stat values: change from `text-lg` (18px) to `text-base` (16px). Colors remain: blue for Income, red for Expenses, green for Balance.

**Dashboard — Savings Goal:**
- The inline goal input: change from `flex-1` to a fixed width of approximately `w-20` or `max-w-[80px]` (about 40% narrower than current full-width).

**App — Bottom Nav (in App.tsx):**
- Icons: change from `h-5 w-5` (20px) to `h-[22px] w-[22px]` (22px).
- Labels: change from `text-[10px]` to `text-[12px]` (12px).

**Reports — Monthly Income card:**
- Reduce `CardContent` padding from `pt-4 pb-4 px-4` to `pt-2 pb-2 px-3`. Keep card height approximately the same by ensuring font sizes and content stay unchanged.

**Reports — SummaryCard component:**
- Reduce `CardContent` padding from `pt-3 pb-3 px-3` to `pt-2 pb-2 px-2`. Keep card height approximately the same.
- Move the label BEFORE the icon: layout should be label row first (uppercase 14px), then icon+value row OR label row with icon inline. Specifically: place the label text (`text-[14px] uppercase font-medium text-muted-foreground`) as the first element, then the icon and value below.
- Stat values: change from `text-sm` (14px) to `text-base` (16px).
- Color each stat value distinctly: Income → `text-blue-600 dark:text-blue-400`, Expenses → `text-red-600 dark:text-red-400`, Balance → use existing `color` prop but map to green for positive and red for negative.
- Update the 3 SummaryCard usages to pass explicit color classes for value: income=blue, expenses=red, balance=green/red.

### Remove
- Nothing removed.

## Implementation Plan

1. **main.tsx** — Add `LanguageProvider` and `AutoLockProvider` wrapping `<App />` inside `QueryClientProvider > InternetIdentityProvider`, with `// !! DO NOT REMOVE` comment guards.
2. **DashboardTab.tsx — Quick Stats icons** — Change `ArrowUpCircle` icon class from `text-muted-foreground` to `text-blue-500`, `ArrowDownCircle` to `text-red-500`, `Scale` to `text-emerald-500`.
3. **DashboardTab.tsx — Quick Stats labels** — Change label `text-sm` → `text-[12px]`.
4. **DashboardTab.tsx — Quick Stats values** — Change value `text-lg` → `text-base`.
5. **DashboardTab.tsx — Savings Goal input** — Change input from `flex-1` to `w-20` (fixed narrower width).
6. **App.tsx — Bottom Nav icons** — Change icon `h-5 w-5` → `h-[22px] w-[22px]`, label `text-[10px]` → `text-[12px]`.
7. **ReportsTab.tsx — Monthly Income padding** — Change `pt-4 pb-4 px-4` → `pt-2 pb-2 px-3`.
8. **ReportsTab.tsx — SummaryCard padding** — Change `pt-3 pb-3 px-3` → `pt-2 pb-2 px-2`.
9. **ReportsTab.tsx — SummaryCard label position** — Move label before icon (label first row, then icon+value). Label: `text-[14px] uppercase font-medium text-muted-foreground`.
10. **ReportsTab.tsx — SummaryCard values** — Change `text-sm` → `text-base`. Update `color` prop usage to use `text-blue-600 dark:text-blue-400` for income, `text-red-600 dark:text-red-400` for expenses, and existing positive/negative colors for balance.
