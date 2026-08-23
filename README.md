# 🌌 ZenithTab

> **ZenithTab** is an ultra-fast, beautifully designed, and deeply customizable New Tab dashboard extension for Google Chrome. Built with Manifest V3, React, TypeScript, and Tailwind CSS.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Chrome Manifest V3](https://img.shields.io/badge/Chrome-Manifest_V3-success.svg)]()

---

## ✨ Features

- 🧩 **Free Grid Drag & Drop**: Freely resize, position, and organize widgets with responsive grid alignment using `react-grid-layout`.
- 🔖 **Bookmark & Folder Explorer**: Seamlessly interact with native `chrome.bookmarks` API with nested folder exploration, search, and automatic favicon fetching.
- 📰 **RSS & Google News Feed**: Live multi-feed RSS/Atom reader with fast XML parsing, instant Google News keyword search feeds, and background caching via `chrome.alarms`.
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
   git clone https://github.com/miyabiver39/ZenthTab.git
   cd ZenthTab
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Build the extension:**
   ```bash
   npm run build
   ```
4. **Load into Google Chrome:**
   - Open Google Chrome and navigate to `chrome://extensions/`.
   - Enable **Developer mode** (toggle switch in the top-right corner).
   - Click **Load unpacked** (パッケージ化されていない拡張機能を読み込む).
   - Select the `dist/` directory inside the project folder.
   - Open a **New Tab** and enjoy ZenithTab!

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
│       ├── build.yml          # CI (Lint, Test, Build)
│       └── release.yml        # GitHub Releases 自動パッケージング (.zip)
├── public/
│   ├── icons/                 # Extension icons (16, 48, 128)
│   └── default-wallpapers/    # Curated backdrop collection
├── src/
│   ├── background/
│   │   └── service-worker.ts  # RSS & sync background worker (chrome.alarms)
│   ├── components/
│   │   ├── common/            # Modal, Button, Tooltip, Dropdown, GlassCard
│   │   ├── layout/            # GridContainer, Header, Dock, SettingsPanel
│   │   └── widgets/           # Bookmark, RSS, Iframe, Clock, Weather, Notes
│   ├── hooks/                 # useBookmarks, useRssFeed, useStorage, useWallpaper
│   ├── services/              # storageService, rssService, wallpaperService, etc.
│   ├── store/                 # useDashboardStore.ts (Zustand)
│   ├── types/                 # TypeScript type contracts
│   ├── utils/                 # cn, date, rssParser, url, favicon, storage
│   ├── newtab.html            # Entry HTML
│   └── newtab.tsx             # React Application root
├── tests/
│   ├── unit/                  # rssParser, storage, utils tests
│   ├── components/            # Widget component tests
│   └── e2e/                   # Playwright E2E tests
├── manifest.json              # Chrome Manifest V3 configuration
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
