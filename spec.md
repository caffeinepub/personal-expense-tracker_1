# Personal Expense Tracker

## Current State
The Dashboard's Total Spent card uses a fixed green gradient (`oklch(0.52 0.15 160)` to `oklch(0.30 0.12 165)`). There is no menu on the card and no way to change its appearance. The card currently has no three-dots icon.

## Requested Changes (Diff)

### Add
- A `MoreVertical` (three-dots) icon button in the top-right corner of the Total Spent card that opens a Theme picker dialog.
- A `ThemePickerDialog` component with 5 gradient theme options displayed as selectable swatches:
  1. **Purple/Blue** – purple to indigo/blue
  2. **Sunset** – orange to pink/rose
  3. **Ocean** – teal to cyan
  4. **Forest** – green (current-ish)
  5. **Midnight** – dark blue to near-black
- Each swatch previews the full gradient with a label, a checkmark on the selected one.
- Selected theme persisted to `localStorage` under key `totalSpentCardTheme` so it survives page refreshes.
- A `useCardTheme` hook that reads/writes the theme from localStorage.

### Modify
- `DashboardTab.tsx`: replace the hardcoded gradient style on the Total Spent card with the value from `useCardTheme`. Add the three-dots button in the card's top-right corner.

### Remove
- Nothing removed.

## Implementation Plan
1. Create `src/frontend/src/hooks/useCardTheme.ts` – hook that reads from localStorage, provides theme gradient CSS string + setter.
2. Define the 5 theme objects (name, gradient CSS, orb color, highlight color) in a shared constants file or inline in the hook.
3. Create `src/frontend/src/components/ThemePickerDialog.tsx` – dialog triggered by three-dots button, shows gradient swatches in a grid, checkmark on selected, saves on tap.
4. Update `DashboardTab.tsx` to:
   - Import and use `useCardTheme`.
   - Apply dynamic gradient to the card `style`.
   - Add `MoreVertical` icon button positioned absolute top-right on the card.
   - Wire click to open `ThemePickerDialog`.
5. Validate (lint, typecheck, build).
