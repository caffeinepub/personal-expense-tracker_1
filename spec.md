# Personal Expense Tracker

## Current State
- `main.tsx` wraps App with `QueryClientProvider` and `InternetIdentityProvider` but is **missing** `LanguageProvider` and `AutoLockProvider`.
- Dashboard > By Category > Income tab has `chartViewIncome: "donut" | "horizontal"` state.
- `chartDataIncome` is a single entry `[{ name: "Income", value: totalIncome, color: "#10b981" }]` — not broken down by source.
- Income tab renders: Donut chart (toggle to horizontal) and Horizontal bar chart (toggle to donut).
- `incomeSources` is loaded from localStorage via `getIncomeSources()` and used in the Dashboard Income collapsible section.

## Requested Changes (Diff)

### Add
- `chartViewIncome` gets a third state: `"vertical"` for vertical bar chart.
- `chartDataIncome` now computes breakdown by income source (using `incomeSources` from localStorage). If no income sources defined, fall back to single total entry.
- Vertical bar chart view in Income tab (replacing or alongside horizontal).
- Toggle cycle: donut → vertical → horizontal → donut (3-way cycle using the floating toggle button).

### Modify
- `chartViewIncome` type: `"donut" | "vertical" | "horizontal"`.
- `chartDataIncome` useMemo: map `incomeSources` to `{ name, value: src.monthlyBudget, color: src.color }`. If `incomeSources` is empty, use `[{ name: "Income", value: totalIncome, color: "#10b981" }]`.
- Income tab rendering: add a vertical bar chart block (layout="horizontal" BarChart with XAxis as categories, YAxis as values), update toggle button icons and onClick handlers to cycle through 3 views.
- `main.tsx`: wrap App with `LanguageProvider` and `AutoLockProvider` with permanent comment guards.

### Remove
- Nothing removed.

## Implementation Plan
1. Fix `main.tsx` — add `LanguageProvider` (from `../i18n/LanguageContext`) and `AutoLockProvider` (from `../contexts/AutoLockContext`) with comment guards.
2. In `DashboardTab.tsx`:
   a. Update `chartViewIncome` type to `"donut" | "vertical" | "horizontal"`.
   b. Update `chartDataIncome` useMemo to use `incomeSources.map(src => ({ name: src.name, value: src.monthlyBudget, color: src.color }))` when sources exist.
   c. Add vertical bar chart block (standard `BarChart` with no `layout="vertical"`, XAxis=category, YAxis=number).
   d. Update toggle buttons to cycle: donut→vertical, vertical→horizontal, horizontal→donut, with appropriate icons (PieChartIcon, BarChart2, BarChartHorizontal or AlignLeft).
