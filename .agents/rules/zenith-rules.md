---
title: ZenithTab Development Rules
trigger: always_on
---

# ZenithTab Development Rules

1. **Manifest V3 Constraints**:
   - No remote code evaluation (`eval`, `new Function`, external inline scripts).
   - Background tasks must use Service Workers and `chrome.alarms` (never persistent background pages).
   - All network requests requiring CORS must be declared in `manifest.json` `host_permissions`.

2. **State & Storage Architecture**:
   - Primary state lives in `useDashboardStore` (Zustand).
   - All persistent changes are mirrored to `storageService` which writes to `chrome.storage.local`.
   - Always preserve the `localStorage` fallback in `src/utils/storage.ts` so tests and web preview run without errors.

3. **UI / Glassmorphism Design System**:
   - Use `GlassCard` and utility classes (`bg-slate-900/40`, `border-white/10`, `backdrop-blur-md`, `text-slate-100`).
   - Use Lucide icons with consistent sizing (`size={14}` for widget controls, `size={16}` for list items, `size={20}` for headers/cards).
   - Widgets must support both Dark and Light themes via Tailwind CSS variables.

4. **Internationalization (i18n)**:
   - Never hardcode raw Japanese or English strings in component JSX.
   - Always add keys to `src/i18n/locales/en.ts` and `src/i18n/locales/ja.ts` (and other locales), then access via `useTranslation()`.

5. **Quality Assurance**:
   - Strict TypeScript checking: `npm run typecheck`.
   - Unit & component tests: `npm run test:run`.
   - Production bundle validation: `npm run build`.
