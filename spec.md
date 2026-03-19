# Personal Expense Tracker

## Current State
- LockScreen uses an invisible opacity-0 native input overlaid on PIN slots. Fails on mobile.
- Income chart in DashboardTab filters expenses for isIncome===true. But income is stored as MonthlyIncome (total only), so chartDataIncome is always empty.

## Requested Changes (Diff)

### Add
- Custom numeric keypad (0-9 + backspace) in LockScreen, no native input required.

### Modify
- LockScreen: Remove invisible input hack. Render 3x4 numeric keypad buttons. PIN filled via button clicks.
- DashboardTab Income chart: Use totalIncome from summary to build chartDataIncome as [{name:'Income', value:totalIncome, color:'#10b981'}]. Show donut + horizontal bar with toggle. Empty state only when totalIncome===0.

### Remove
- inputRef, useRef, invisible input, onClick focus handler from LockScreen.
- Incorrect chartDataIncome memo filtering expenses.

## Implementation Plan
1. Rewrite LockScreen PIN section with numeric keypad buttons.
2. Fix chartDataIncome to use totalIncome from summary.
3. Ensure LanguageProvider and AutoLockProvider stay in main.tsx.
