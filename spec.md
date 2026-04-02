# Personal Expense Tracker — UI Fixes (6 items)

## Current State
- `main.tsx` is missing `LanguageProvider` and `AutoLockProvider` — translations return raw keys.
- Dashboard "By Category" and "Recent Transactions" tabs are plain underline-style buttons (`border-b-2`), not solid filled buttons.
- Bottom nav Settings tab is slightly out of frame on mobile devices (spacing/overflow issue).
- Bottom nav bottom-left and bottom-right corners of the app card layout are not rounded on mobile (only `md:rounded-3xl` applies).
- In `ReportsTab`, the `SummaryCard` renders: label → icon (below label) → value. The icon is NOT inline before the label.
- In `ShoppingListTab`, "SHOPPING" is `text-[10px]` and "Shopping List" is `text-sm` — inconsistent sizes vs Reports tab label style.

## Requested Changes (Diff)

### Add
- `LanguageProvider` and `AutoLockProvider` wrapped around `<App />` in `main.tsx` with comment guards.
- Bottom nav container: add `rounded-b-2xl` (or matching the app card `rounded-3xl`) to the nav element on mobile so bottom-left and bottom-right corners of the overall layout are rounded.

### Modify
1. **Dashboard "By Category" / "Recent Transactions" tabs** (`DashboardTab.tsx`): Change from plain underline buttons to solid filled gradient buttons. Use a gradient matching the Income Source row (dark green gradient, e.g. `linear-gradient(135deg, oklch(0.52 0.17 145), oklch(0.42 0.15 145))`). Active tab = filled gradient button with white text; inactive tab = muted/ghost style.

2. **Bottom nav Settings tab overflow** (`App.tsx`): Ensure the Settings tab button is fully visible and not clipped on small mobile screens. Likely fix: reduce `px-4` padding on nav buttons or add `min-w-0` / use `flex-1` equal distribution, or use `overflow-hidden` with `text-ellipsis` on the label. Keep icon size `h-[22px] w-[22px]` and label `text-[12px]`.

3. **App layout bottom corners** (`App.tsx`): The app card wrapper div (`h-dvh` on mobile) currently has no rounded corners on mobile. Add `rounded-b-3xl overflow-hidden` to match the tablet rounding. The bottom nav should also get `rounded-b-3xl` to match.

4. **Reports `SummaryCard`** (`ReportsTab.tsx`): Restructure the card layout so each stat renders as a single horizontal row: `[Icon] [Label]` inline (icon before label, left-aligned), then value below. The icon should be `h-4 w-4` colored, sitting to the left of the label text in the same line, not below it. Layout: `flex items-center gap-1.5` for icon+label row, then value on its own line below.

5. **Shopping tab section label** (`ShoppingListTab.tsx`): Match the Reports tab label style. Change "SHOPPING" from `text-[10px] font-semibold tracking-widest` to match the Reports tab's section title size and weight. Use `text-sm font-bold uppercase tracking-widest` for both parts or use the same styling pattern as other section headers in Reports (which use `text-xs font-semibold uppercase tracking-wider`).

### Remove
- Nothing removed.

## Implementation Plan
1. **`main.tsx`** — Add `LanguageProvider` import from `./i18n/LanguageContext` and `AutoLockProvider` import from `./contexts/AutoLockContext`. Wrap `<App />` with both providers inside `QueryClientProvider`. Add comment guards.
2. **`DashboardTab.tsx`** — Find the "By Category" and "Recent Transactions" tab buttons (around line 808–832). Replace the `border-b-2` underline style with solid filled gradient buttons. Active = gradient background + white text, rounded pill; inactive = muted background, gray text.
3. **`App.tsx`** (bottom nav) — Fix Settings tab overflow: change `justify-around` to `justify-evenly` or reduce `px-4` on each button to `px-2` / `px-3`. Also add `rounded-b-3xl` to the app card wrapper for mobile. Add `rounded-b-3xl` to the `<nav>` element.
4. **`ReportsTab.tsx`** — Update `SummaryCard` component: change internal layout so icon and label are inline (`flex items-center gap-1`), with value on a separate line below.
5. **`ShoppingListTab.tsx`** — Update the section header "SHOPPING" label font size and weight to match Reports tab label style.
