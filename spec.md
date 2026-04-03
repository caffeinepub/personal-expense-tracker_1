# PE Tracker

## Current State
- RecurringManagerSheet and GlobalSearchSheet are slide-up Sheet (bottom drawer) components
- Both are triggered by ghost buttons in the Expenses tab header (no background color)
- BudgetAlertsCard uses hardcoded light-mode colors (rgb(254 242 242 / 0.8)) that don't adapt to dark mode
- DashboardTab imports and renders BillReminders, but the card IS present — need to verify rendering condition
- Expenses tab header shows `{t('browse_manage')}` (e.g. 'Browse & Manage') as the label next to 'Expenses |'
- Reports tab header shows `periodLabel` (e.g. 'January 2026') as the dynamic label next to 'Reports |'
- Recurring expense data is stored as part of normal expenses (recurring flag + recurringFrequency field) synced via ICP backend already — RecurringManagerSheet reads from useExpenses() which is backend-synced
- main.tsx is missing LanguageProvider and AutoLockProvider

## Requested Changes (Diff)

### Add
- LanguageProvider and AutoLockProvider permanently anchored in main.tsx with comment guards
- Bill Reminders card: ensure it always renders on Dashboard (fix any condition that might hide it, e.g. wrap in AnimatePresence, remove any conditional that hides it prematurely)

### Modify
1. **Cross-device sync for recurring expenses**: RecurringManagerSheet already reads from useExpenses() which syncs via ICP backend. The recurring flag is stored on expense records already. Add a note/comment clarifying this. If there's a localStorage fallback short-circuiting backend fetch for recurring, remove it. Ensure the recurring expense display in RecurringManagerSheet works purely from backend data.

2. **RecurringManagerSheet → Modal Dialog**: Convert from Sheet (bottom drawer) to Dialog (centered modal popup), similar to ExpenseDialog style. Keep all existing content and functionality.

3. **GlobalSearchSheet → Modal Dialog**: Convert from Sheet (bottom drawer) to Dialog (centered modal popup), similar to ExpenseDialog style. Keep all existing content and functionality.

4. **Recurring and Search All buttons**: Add a visible background color to both buttons in the Expenses tab header. Use a styled filled variant — e.g. a subtle green/primary tinted background (bg-primary/10 border border-primary/20) so they stand out.

5. **BudgetAlertsCard dark mode**: Replace hardcoded light-mode inline style colors with CSS variables / Tailwind dark: classes that adapt to dark mode:
   - Background: use `bg-red-50 dark:bg-red-950/30` and `bg-amber-50 dark:bg-amber-950/30` instead of inline rgba
   - Border: use `border-red-200 dark:border-red-800/50` and `border-amber-200 dark:border-amber-800/50`
   - Header bg: use Tailwind `bg-red-500/8 dark:bg-red-500/15` and `bg-amber-500/8 dark:bg-amber-500/15`

6. **Expenses tab header label**: Replace `{t('browse_manage')}` with a dynamic period label matching the selected period/month, formatted the same way as Reports tab:
   - Monthly: `formatMonthYear(month)` → e.g. "January 2026"
   - Quarterly: `Q${currentQ} ${selectedYear}` 
   - Yearly: `${selectedYear}`
   Keep the same font-display, text-xl, font-bold styling as Reports tab header.

7. **main.tsx LanguageProvider**: Add LanguageProvider (from ../i18n/LanguageContext) and AutoLockProvider (from ../contexts/AutoLockContext) wrapping the app with prominent comment guards.

### Remove
- Nothing removed

## Implementation Plan
1. Update `main.tsx` — add LanguageProvider + AutoLockProvider with comment guards
2. Convert `RecurringManagerSheet.tsx` — replace Sheet with Dialog component, keep all logic
3. Convert `GlobalSearchSheet.tsx` — replace Sheet with Dialog component, keep all logic
4. Update `ExpensesTab.tsx` — style Recurring and Search All buttons with visible background; update header label to show dynamic period label (month/quarter/year) instead of 'Browse & Manage'
5. Update `BudgetAlertsCard.tsx` — fix dark mode colors using Tailwind dark: classes
6. Update `DashboardTab.tsx` — ensure BillReminders always renders (no hidden condition), wrap in AnimatePresence if needed
