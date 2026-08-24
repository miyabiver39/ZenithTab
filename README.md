# 🌌 ZenithTab

> **ZenithTab** is an ultra-fast, beautifully designed, and deeply customizable New Tab dashboard extension for Google Chrome. Built with Manifest V3, React, TypeScript, and Tailwind CSS.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Chrome Manifest V3](https://img.shields.io/badge/Chrome-Manifest_V3-success.svg)]()

---

## ✨ Features

- 🧩 **Free Grid Drag & Drop**: Freely resize, position, and organize widgets with responsive grid alignment using `react-grid-layout`.
- 🔖 **Bookmark & Folder Explorer**: Seamlessly interact with native `chrome.bookmarks` API with nested folder exploration, search, and favicons resolved from Chrome's own local cache (no third-party icon service).
- 📰 **RSS & News Feeds**: Multi-feed RSS/Atom reader with fast XML parsing, keyword topic feeds, and background caching via `chrome.alarms`. Custom feed origins are requested one at a time through `optional_host_permissions`.
- 🖼️ **Dynamic Wallpapers**: Rotating dynamic wallpapers from Unsplash or local gallery with glassmorphism blur and opacity controls.
- 🌐 **Web Embeds (iFrame)**: Embed external tools, dashboards, and live web pages with graceful fallback cards for restricted origins.
- ⏰ **Clock & Weather**: Digital and analog clock styles with date, timezone, and live weather conditions.
- 📝 **Quick Notes**: Instant scratchpad for jotting down notes, markdown thoughts, and todo items with automatic persistence.
- ⚡ **Lightning Fast & Local-First**: All configurations and caches are securely stored via `chrome.storage.local`.
- 🎨 **Glassmorphism UI**: Refined blur and translucent dark/light aesthetic with fine-grained customization.
- 🔄 **Import / Export**: Full JSON export and import for seamless configuration sharing and backup.

---

## 🚀 Quick Start & Installation

### Developer / Local Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/miyabiver39/ZenithTab.git
   cd ZenithTab
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Build the extension:**
   ```bash
   npm run build
   ```
4. **Verify the output** (checks the packed manifest against the emitted files):
   ```bash
   npm run verify
   ```
5. **Load into Google Chrome:**
   - Open Google Chrome and navigate to `chrome://extensions/`.
   - Enable **Developer mode** (toggle switch in the top-right corner).
   - Click **Load unpacked** (パッケージ化されていない拡張機能を読み込む).
   - Select the `dist/` directory inside the project folder.
   - Open a **New Tab** and enjoy ZenithTab!

### Release packaging

```bash
npm run version:bump 1.2.3   # updates package.json + manifest.json, commits, tags
npm run package              # verifies dist/ then writes release/zenith-tab-v1.2.3.zip
```

`npm run package` uses a dependency-free ZIP writer, so it behaves identically on
Windows, macOS, Linux and CI — no `zip` binary required.

---

## 🔐 Permissions & Privacy

| Permission | Why |
| --- | --- |
| `storage` | Keeps your dashboard on your own device (`chrome.storage.local`) |
| `bookmarks` | Renders the Bookmark Explorer widget |
| `alarms` | Refreshes configured feeds in the background |
| `favicon` | Site icons from Chrome's local cache — no third-party icon service |
| `geolocation` | Read once, only when you click "Detect current location" |
| Host permissions | Weather, news, and wallpaper endpoints only |
| Optional host permissions | Requested per-origin, at the moment you add a custom RSS feed |

There is no backend, no analytics, and no tracking. See [PRIVACY.md](PRIVACY.md)
for the full breakdown of every outbound request.

---

## 🛠️ Tech Stack
- **Framework**: React 19 + TypeScript (Strict)
- **Bundler**: Vite + `@crxjs/vite-plugin`
- **Styling**: Tailwind CSS + Lucide Icons (Glassmorphic design system)
- **Layout Engine**: `react-grid-layout`
- **RSS Engine**: `fast-xml-parser`
- **State Management**: Zustand + `chrome.storage.local`
- **Testing**: Vitest + React Testing Library + Playwright

---

## 📂 Project Structure
```text
zenith-tab/
├── .github/
│   └── workflows/
│       ├── build.yml          # CI: typecheck, test, build, verify
│       └── release.yml        # Tag push -> package + GitHub Release (.zip)
├── public/                    # Copied verbatim into dist/
│   ├── _locales/              # Store listing name & description, 7 locales
│   └── icons/                 # Extension icons (16, 48, 128)
├── scripts/
│   ├── lib/zip.js             # Dependency-free ZIP writer (cross-platform)
│   ├── bump-version.js        # Sync package.json + manifest.json, commit, tag
│   ├── package.js             # Verify dist/ then write release/*.zip
│   └── verify-build.js        # Post-build manifest / _locales / asset checks
├── src/
│   ├── background/
│   │   └── service-worker.ts  # Background feed refresh (chrome.alarms)
│   ├── components/
│   │   ├── common/            # Modal, Button, Input, GlassCard
│   │   ├── layout/            # GridContainer, Header, Dock, SettingsPanel
│   │   └── widgets/           # Bookmark, RSS, Iframe, Clock, Weather, Notes...
│   ├── hooks/                 # useBookmarks, useRssFeed, useWeather
│   ├── i18n/                  # In-app UI translations (7 languages)
│   ├── services/              # storageService, rssService, weatherService...
│   ├── store/                 # useDashboardStore.ts (Zustand)
│   ├── types/                 # TypeScript type contracts
│   ├── utils/                 # cn, date, rssParser, favicon, permissions...
│   └── newtab.tsx             # React application root
├── tests/
│   ├── unit/                  # Services, i18n, permissions, parsers
│   ├── components/            # Widget component tests
│   └── e2e/                   # Playwright E2E tests
├── newtab.html                # Entry HTML (new tab override)
├── manifest.json              # Chrome Manifest V3 configuration
├── PRIVACY.md                 # Privacy policy (linked from the store listing)
├── STORE_LISTING.md           # Source of truth for store listing copy
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── LICENSE                    # MIT License
└── README.md
```

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
