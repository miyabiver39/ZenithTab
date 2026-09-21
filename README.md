<div align="center">

<img src="public/icons/icon128.png" width="96" height="96" alt="ZenithTab icon" />

# ZenithTab

**A fast, beautiful, deeply customizable New Tab dashboard for Google Chrome.**

Drag-and-drop widgets, glassmorphism UI, dynamic wallpapers, 7 languages — local-first, no accounts, no tracking.

[![Build and Test](https://github.com/miyabiver39/ZenithTab/actions/workflows/build.yml/badge.svg)](https://github.com/miyabiver39/ZenithTab/actions/workflows/build.yml)
[![Latest release](https://img.shields.io/github/v/release/miyabiver39/ZenithTab?label=release&color=0ea5e9)](https://github.com/miyabiver39/ZenithTab/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Chrome Manifest V3](https://img.shields.io/badge/Chrome-Manifest_V3-success.svg)](manifest.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg?logo=typescript&logoColor=white)](tsconfig.json)
[![React 19](https://img.shields.io/badge/React-19-20232a.svg?logo=react&logoColor=61dafb)](package.json)
[![i18n](https://img.shields.io/badge/i18n-7_languages-8b5cf6.svg)](src/i18n/locales)
[![Tests](https://img.shields.io/badge/tests-Vitest_%2B_Playwright-6e9f18.svg)](tests)

[**Install**](#-install) · [**Features**](#-features) · [**Development**](#-development) · [**Changelog**](CHANGELOG.md) · [**Privacy**](PRIVACY.md)

**English** · [日本語](docs/readme/README.ja.md) · [简体中文](docs/readme/README.zh-CN.md) · [Español](docs/readme/README.es.md) · [Français](docs/readme/README.fr.md) · [Deutsch](docs/readme/README.de.md) · [한국어](docs/readme/README.ko.md)

<img src="store-assets/screenshot_1_1280x800.png" width="880" alt="ZenithTab dashboard" />

</div>

---

## ✨ Features

### Widgets

| Widget | What it does |
| :-- | :-- |
| 🔍 **Quick Search** | Multi-engine search bar (Google, Bing, DuckDuckGo, GitHub, YouTube, ChatGPT + your own). **Smart answers** inline: `120*1.1`, `20% of 150`, `10 km to mi`, `0xff`, `2d6`, `coin`, `random 1-100`, `choose a, b, c`, `days until 2026-12-31`, `in 30 days`, `what day is 2026-12-25`, `time in London`. |
| 🌐 **Shortcuts** | Your favourite sites as a tile grid, with favicons from Chrome's own cache. Pick them from a **regional catalog** (30–55 everyday sites per region), your bookmarks or most-visited sites — or just drag a link onto the widget. |
| ⏰ **Clock** | Digital / analog / minimal, seconds, date, time zone. |
| 🌤️ **Weather** | Current conditions and a 3-day forecast (Open-Meteo); offers to use your location once, otherwise one click. |
| 🔖 **Bookmarks** | Browse and search your Chrome bookmarks, folders included. |
| 📰 **News & RSS** | Google News (headlines, topics, keyword search), a catalog of well-known feeds per region, or any RSS/Atom URL, refreshed in the background. |
| ⏱️ **Focus Timer** | Pomodoro sessions with short/long breaks and a session counter. |
| ✅ **Tasks** | A simple todo list with filters and undoable deletes. |
| 📝 **Quick Notes** | Multi-page Markdown scratchpad. |
| 🖼️ **Web Embed** | Embed any page or tool in an iframe, with a graceful fallback for sites that refuse embedding. |
| ⚡ **Quick Access** | Chrome's most-visited sites and recently closed tabs (restorable in place). |
| 📱 **QR Code** | Turn a URL, phone number or text into a QR code — send a link to your phone. |
| ⏳ **Countdown** | Days until a birthday, trip, exam or deadline; yearly repeats. |
| 🔥 **Habit Tracker** | Tick off daily habits and keep the streak alive. |
| 📅 **Calendar** | Today's and upcoming events from any iCal (.ics) link — Google Calendar, Outlook, Apple. |

### Dashboard

- ✨ **3-step setup** — language & region, interests, purpose; the answers pick your template, news topics and shortcuts. Skippable, re-runnable from Settings.
- 🧩 **Free grid layout** — drag, resize and arrange widgets on a responsive grid; widgets shrink down to 2 columns.
- 📑 **Multiple pages** — separate dashboards (work / home / …), switchable with `Ctrl+Alt+←/→`; start a page from a **template** (Work, Study, News, Minimal).
- 📣 **Today at a glance** — the header shows open tasks, today's calendar events and the nearest countdown across all pages.
- 🖼️ **Wallpapers** — Unsplash collections, gradients or your own image; a **time-aware mode** shifts the look through morning, day, sunset and night; text switches to dark automatically on light wallpapers.
- 🎨 **Glassmorphism** — tune blur, corner radius and the dock.
- ↩️ **Fool-proof** — undo for every delete and layout change (`Ctrl+Z`), a 30-day trash for widgets and pages, automatic backups before risky actions.
- ⌨️ **Keyboard shortcuts** — built-in (`/` to search, undo/redo, page switching) plus your own key combos that open any URL.
- 🌍 **7 languages** — English, 日本語, 简体中文, Español, Français, Deutsch, 한국어; defaults follow your region (search engines, news edition, weather city, dock).
- 🔄 **Import / Export** — the whole dashboard as one JSON file. **Share codes** turn a page into a short `zt1.` string / QR code with your personal content stripped.
- ☁️ **Settings sync (opt-in)** — appearance, dock and keyboard shortcuts through your Chrome account; widgets and pages stay on the device.
- 🔒 **Local-first** — everything lives in `chrome.storage.local`. No backend, no analytics, no tracking.

---

## 🚀 Install

### From a release (recommended)

1. Download `zenith-tab-vX.Y.Z.zip` from the [latest release](https://github.com/miyabiver39/ZenithTab/releases/latest) and unzip it.
2. Open `chrome://extensions/` and turn on **Developer mode** (top right).
3. Click **Load unpacked** and pick the unzipped folder.
4. Open a new tab.

> Updating a side-loaded install? Load the new version into a **fresh folder** (or click ↻ on the extension card) — Chrome only re-reads `manifest.json` on reload, so replacing files in place leaves permissions stale.

### From source

```bash
git clone https://github.com/miyabiver39/ZenithTab.git
cd ZenithTab
npm install
npm run build      # → dist/
npm run verify     # checks the packed manifest against dist/
```

Then load `dist/` as an unpacked extension as above.

---

## 🔐 Permissions & privacy

| Permission | Why |
| :-- | :-- |
| `storage`, `unlimitedStorage` | Your dashboard, notes and caches stay on your device; no 10 MB cap for custom wallpapers |
| `bookmarks` | The Bookmarks widget |
| `alarms` | Background feed refresh |
| `favicon` | Site icons from Chrome's local cache — no third-party icon service |
| `geolocation` | Read once, only when you click "Detect current location" |
| Host permissions | Weather (Open-Meteo), Google News, Unsplash wallpapers |
| Optional: `topSites`, `sessions`, `tabs` | Requested when you add the Quick Access widget (most-visited sites, recently closed tabs and their titles) |
| Optional host permissions | Requested per origin, at the moment you add a custom RSS feed or calendar |

There is no backend, no analytics and no tracking. [PRIVACY.md](PRIVACY.md) lists every outbound request.

---

## 🛠️ Development

| Task | Command |
| :-- | :-- |
| Dev server (HMR) | `npm run dev` → http://localhost:5173/newtab.html |
| Build | `npm run build` |
| Lint / types / unit tests | `npm run lint` · `npm run typecheck` · `npm run test:run` |
| E2E (Playwright) | `npm run test:e2e` |
| Coverage | `npm run test:coverage` |
| Release | `npm run version:bump X.Y.Z` → `npm run package` (stop the dev server first) → `git push origin main --tags` |

**VS Code**: the repo ships `.vscode/` — `Ctrl+Shift+B` builds, `F5` starts the dev server and opens Chrome with breakpoints working ("Debug new tab"), or loads the built extension ("Debug extension"). The "check all" task runs lint → typecheck → tests, the same gate CI uses.

Pushing a `v*` tag builds the ZIP and SBOM and publishes a GitHub Release.

### Tech stack

React 19 + TypeScript (strict) · Vite + `@crxjs/vite-plugin` · Tailwind CSS + Lucide icons · `react-grid-layout` · Zustand · `fast-xml-parser` · Vitest + Testing Library + Playwright

### Project layout

```text
src/
├── background/service-worker.ts   # Background feed refresh (chrome.alarms)
├── components/
│   ├── common/                    # Modal, Button, Input, GlassCard, ConfirmDialog, UndoToast
│   ├── layout/                    # Header, Dock, GridContainer, SettingsPanel, modals
│   └── widgets/                   # One folder per widget + registry.tsx / widgetDefinitions.ts
├── hooks/                         # useRssFeed, useWeather, useLayoutUndo, …
├── i18n/locales/                  # UI strings, 7 languages
├── services/                      # storage, migrations, rss, weather, calendar, wallpaper, trash, snapshots
├── store/                         # Zustand store + undo stack
├── utils/                         # parsers (RSS, iCal), smart input, countdown/habit maths, …
└── newtab.tsx                     # App root
tests/                             # unit / components / e2e
public/_locales/                   # Store listing name & description
```

Adding a widget is a registry entry — see [CLAUDE.md](CLAUDE.md) §2 and [AGENT.md](AGENT.md).

---

## 🤝 Contributing

Issues and pull requests are welcome. Work on a branch off `main`, use Conventional Commits, and make sure `npm run lint`, `npm run typecheck` and `npm run test:run` pass. The [changelog](CHANGELOG.md) follows Keep a Changelog.

## 📄 License

[MIT](LICENSE)
