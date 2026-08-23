# ZenithTab (ゼニスタブ) - Agent Instructions & Architecture Guide

This document serves as the persistent memory and developer guide for AI coding assistants (Antigravity) and contributors working on **ZenithTab**.

---

## 1. Project Overview & Architecture

ZenithTab is a high-performance, customizable New Tab dashboard Chrome Extension built on **Manifest V3**.

### Tech Stack
- **Runtime**: Chrome Extension (Manifest V3 - `chrome_url_overrides.newtab`)
- **Frontend**: React 19 + TypeScript (Strict)
- **Bundler**: Vite + `@crxjs/vite-plugin`
- **Styling**: Tailwind CSS + Lucide Icons (Glassmorphic Design System)
- **Grid Engine**: `react-grid-layout` (Multi-breakpoint responsive: `lg`, `md`, `sm`, `xs`)
- **State & Persistence**: Zustand with automatic synchronization to `chrome.storage.local` (with `localStorage` fallback)
- **RSS Engine**: `fast-xml-parser` (RSS 2.0, Atom 1.0, Google News)
- **Background Sync**: `chrome.alarms` + Service Worker (`src/background/service-worker.ts`)
- **Internationalization (i18n)**: Multi-language engine (`src/i18n/`) supporting `ja`, `en`, `zh-CN`, `es`, `fr`, `de`, `ko`
- **Testing**: Vitest + React Testing Library + Playwright

---

## 2. Directory Structure

```text
zenith-tab/
├── .agents/
│   ├── rules/                 # Project-specific coding rules
│   └── skills/                # Project workflow skills
├── .github/
│   └── workflows/
│       ├── build.yml          # CI: TypeCheck, Vitest, Vite Build
│       └── release.yml        # CI/CD: Automated zip creation & GitHub Releases
├── public/
│   ├── icons/                 # Extension icons (icon16, icon48, icon128)
│   └── default-wallpapers/    # Local fallback wallpapers
├── scripts/
│   ├── generate-icons.js      # PNG icon generator
│   └── bump-version.js        # Version sync & Git tagging automation
├── src/
│   ├── background/            # Service worker (RSS alarm sync)
│   ├── components/
│   │   ├── common/            # Button, Modal, Input, GlassCard
│   │   ├── layout/            # Header, Dock, GridContainer, SettingsPanel, Modals
│   │   └── widgets/           # Clock, Weather, Bookmarks, RSS, Search, Pomodoro, Todo, Iframe, Notes
│   ├── hooks/                 # useBookmarks, useRssFeed, useWeather
│   ├── i18n/                  # Localization engine and translation dictionaries
│   ├── services/              # storageService, rssService, weatherService, bookmarkService, wallpaperService
│   ├── store/                 # useDashboardStore.ts (Zustand)
│   ├── types/                 # TypeScript type contracts
│   ├── utils/                 # cn, date, rssParser, storage, favicon
│   ├── newtab.html            # Entry HTML
│   ├── newtab.tsx             # Root React component
│   └── index.css              # Tailwind and Glassmorphism styling
├── tests/
│   ├── unit/                  # Unit tests (rssParser, storage, i18n, weather)
│   ├── components/            # Component tests (ClockWidget, BookmarkWidget)
│   └── e2e/                   # Playwright E2E tests
├── manifest.json              # Chrome Manifest V3
├── package.json
└── vite.config.ts
```

---

## 3. Git & Branching Strategy: GitHub Flow

All work in this repository strictly adheres to **GitHub Flow**:

1. **`main` is always stable and deployable**:
   - Never commit broken code to `main`.
   - All tests and typechecks must pass before merging.
2. **Feature / Fix Branches**:
   - Create a dedicated branch off `main` for each new feature or fix:
     - `feature/add-<widget-name>` (e.g. `feature/add-calculator-widget`)
     - `fix/<bug-description>` (e.g. `fix/rss-time-formatting`)
     - `chore/<task-name>` (e.g. `chore/update-dependencies`)
3. **Commit Messages (Conventional Commits)**:
   - `feat: ...` (New features)
   - `fix: ...` (Bug fixes)
   - `docs: ...` (Documentation changes)
   - `style: ...` (Formatting, CSS)
   - `refactor: ...` (Code restructuring)
   - `test: ...` (Adding/updating tests)
   - `chore: ...` (Build, config, dependencies)
4. **Pull Requests & CI**:
   - Open a PR to `main`. GitHub Actions (`build.yml`) will automatically run `typecheck`, `vitest`, and `vite build`.
   - Merge into `main` after CI passes.

---

## 4. Release & Versioning Workflow (SemVer)

Versions are strictly managed in both `package.json` and `manifest.json`.

### To Release a New Version:
Run the built-in automated release script:
```bash
# 1. Run version bump (updates package.json & manifest.json, creates git commit & tag)
npm run version:bump 1.0.1  # For bug fixes
npm run version:bump 1.1.0  # For new features
npm run version:bump 2.0.0  # For breaking changes

# 2. Push to GitHub with tags
git push origin main --tags
```
> **What happens automatically**:
> GitHub Actions (`.github/workflows/release.yml`) will trigger on the tag push, test the code, create the production build, package `zenith-tab-vX.X.X.zip`, and create a GitHub Release with the zip artifact ready for Chrome Web Store upload!

---

## 5. Coding Standards & Guidelines

1. **Strict Type Safety**: No `any` where avoidable. All widget configs must have explicit interfaces in `src/types/widget.ts`.
2. **Internationalization (i18n)**:
   - Never hardcode user-facing strings in JSX.
   - Always register translation keys in `src/i18n/locales/` (`en.ts`, `ja.ts`, etc.) and access them via `const { t } = useTranslation();`.
3. **Storage & Fallbacks**:
   - Use `storageService` or `storageGet`/`storageSet` from `src/utils/storage.ts` so code works seamlessly in both Chrome Extension runtime and standard browser/testing environments.
4. **Testing Mandatory**:
   - Run `npm run test:run` and `npm run typecheck` after every modification.
