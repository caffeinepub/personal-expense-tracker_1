# Personal Expense Tracker

## Current State
SettingsTab.tsx has 5 collapsible sections: Regional Settings, Financial Settings, Export & Import Data, Security & Privacy Settings, and About. Inconsistencies:
- Financial Settings and Security & Privacy Settings: `CardHeader` has `cursor-pointer select-none onClick` (full row clickable)
- Regional Settings, Export & Import Data, About: only the `SectionToggle` button is clickable — the header row itself has no `onClick`
- All sections use conditional rendering `{open && <CardContent>}` — no animation
- `SectionToggle` is a Button with its own `onClick`, which causes double-fire when the header is also clickable
- Export & Import Data has no description text below the title
- About has no description text below the title
- `main.tsx` is missing `LanguageProvider` and `AutoLockProvider` wrappers

## Requested Changes (Diff)

### Add
- Smooth expand/collapse animation on all 5 sections using CSS grid trick (`grid-rows-[0fr]` → `grid-rows-[1fr]` transition)
- Description text below Export & Import Data title: "Select a date range and export or import your expense data."
- Description text below About title: "App information and version details."
- `LanguageProvider` and `AutoLockProvider` back in `main.tsx` with comment guards

### Modify
- Regional Settings `CardHeader`: add `cursor-pointer select-none` and `onClick={() => setRegionalOpen(p => !p)}`
- Export & Import Data `CardHeader`: add `cursor-pointer select-none` and `onClick={() => setExportOpen(p => !p)}`
- About `CardHeader`: add `cursor-pointer select-none` and `onClick={() => setAboutOpen(p => !p)}`
- `SectionToggle` component: remove its own `onClick` handler (make it purely visual), add `e.stopPropagation()` to prevent double-fire OR just remove the button's onClick since the parent header handles it. Change the Button to a `div` or non-interactive element.
- Replace all `{open && <CardContent>}` patterns with animated wrapper: always render content, use `grid` transition for smooth height animation
- Chevron icon: rotate 180deg when open using `transition-transform duration-200`

### Remove
- Redundant `onClick` on `SectionToggle` Button (since parent CardHeader now handles toggle)

## Implementation Plan
1. Update `SectionToggle` to remove its own click handler — it becomes a pure visual chevron indicator. Replace `Button` with a simple `div` showing the chevron with `rotate-180` when open.
2. Add `cursor-pointer select-none onClick` to Regional Settings and Export & Import Data and About `CardHeader` elements.
3. Replace all 5 `{open && <CardContent>}` conditional renders with an animated wrapper:
   ```tsx
   <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
     <div className="overflow-hidden">
       <CardContent ...>...</CardContent>
     </div>
   </div>
   ```
4. Add description paragraph to Export card header and About card header.
5. Fix `main.tsx`: wrap `<App />` with `LanguageProvider` and `AutoLockProvider` with comment guards.
