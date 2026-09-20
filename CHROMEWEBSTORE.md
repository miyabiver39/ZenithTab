# Chrome Web Store Listing — ZenithTab

> Last Updated: 2026-09-16

## Store Listing

**Extension Name** [REQUIRED]
ZenithTab - New Tab Dashboard

**Short Description** [REQUIRED]
A customizable new tab dashboard with drag-and-drop widgets, bookmarks, RSS feeds, weather and dynamic wallpapers.

**Detailed Description** [REQUIRED]
ZenithTab transforms your new tab into a personal, highly organized productivity dashboard.

Arrange widgets freely with drag-and-drop, pick dynamic wallpapers, and launch your daily workflows instantly. All settings are stored completely inside your local browser profile—no external account, tracking, or cloud sync required.

Key Features:
- Flexible Grid Layout: Drag, drop, and resize widgets with responsive breakpoints across laptops and external monitors.
- Multi-Page Workspaces: Organize widgets across distinct named pages for work, personal, and research workflows.
- Unified Search Bar: Quick-toggle between web search, repository search, video search, and AI assistant targets.
- Bookmarks Explorer: Browse and search Chrome bookmarks with breadcrumb navigation and zero URL leakage.
- RSS & News Feeds: Follow news topics and custom RSS/Atom feeds with automatic background cache refresh.
- Live Weather: Real-time temperature, condition forecasts, and 3-day projections with on-demand location detection.
- App Drawer & Quick Dock: Launch registered web apps categorized by tags, or use persistent top/bottom dock shortcuts.
- Quick Access: Jump back to your most-visited sites or reopen recently closed tabs, straight from the new tab.
- Focus & Utilities: Built-in Pomodoro timer, to-do checklist, quick scratchpad, and calculator.
- Safe to Experiment: Undo any delete or move (toast or Ctrl+Z), restore deleted widgets and pages from the trash for 30 days, and roll the whole dashboard back to an automatic backup.
- Privacy-First: Zero telemetry, zero analytics, zero ad network requests.

How to Use:
1. Open a new tab to see your default dashboard.
2. Click "Add Widget" to choose and place widgets on your grid.
3. Drag widgets to reposition, or drag corners to resize.
4. Access settings to customize themes, wallpapers, or create new workspace pages.

Privacy & Permissions:
ZenithTab operates locally on your machine. Data stays strictly inside chrome.storage.local, and network requests are only made when you explicitly configure features (e.g. weather forecasts or RSS feeds).

Support & Feedback:
https://github.com/miyabiver39/ZenithTab/issues

**Category** [REQUIRED]
Productivity

**Single Purpose** [REQUIRED]
Provides a customizable, privacy-first productivity dashboard with widgets, bookmarks, and feeds on every new tab.

**Primary Language** [REQUIRED]
English

---

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | store-assets/shop_icon_128x128.png |
| Screenshot 1 [REQUIRED] | 1280×800 PNG | ✅ Ready | store-assets/screenshot_1_1280x800.png |
| Screenshot 2 [RECOMMENDED] | 1280×800 PNG | ✅ Ready | store-assets/screenshot_2_1280x800.png |
| Screenshot 3 [RECOMMENDED] | 1280×800 PNG | ✅ Ready | store-assets/screenshot_3_1280x800.png |
| Screenshot 4 | 1280×800 PNG | ✅ Ready | store-assets/screenshot_4_1280x800.png |
| Screenshot 5 | 1280×800 PNG | ✅ Ready | store-assets/screenshot_5_1280x800.png |
| Small Promo Tile [RECOMMENDED] | 440×280 PNG | ✅ Ready | store-assets/promo_tile_small_440x280.png |
| Marquee Promo Tile | 1400×560 PNG | ✅ Ready | store-assets/marquee_promo_tile_1400x560.png |

---

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| storage | permissions | Saves user layout preferences, widget placements, custom search engines, notes, and theme options locally in chrome.storage.local. |
| bookmarks | permissions | Reads the user's Chrome bookmark folders to display and search bookmarks inside the Bookmarks widget without uploading URLs anywhere. |
| alarms | permissions | Schedules background refresh cycles via chrome.alarms in the service worker for weather forecast and RSS feed updates. |
| favicon | permissions | Fetches site favicons for bookmark entries and launcher shortcuts using the browser's built-in favicon utility. |
| unlimitedStorage | permissions | Lifts the 10 MB chrome.storage.local cap so a user-uploaded wallpaper plus cached feeds can never fail to save; no data leaves the device. Shows no install warning. |
| topSites | optional_permissions | Requested only when the user adds the Quick Access widget: lists the sites Chrome already ranks as most visited so they can be offered as one-click shortcuts; read locally, never uploaded. |
| sessions | optional_permissions | Requested only when the user adds the Quick Access widget: lists and restores the user's recently closed tabs; data stays in the browser. |
| tabs | optional_permissions | Requested together with `sessions` for the Quick Access widget's "Recently closed" view: Chrome omits the `url` and `title` of a closed tab unless this permission is granted, so without it the list has nothing to show. Used only to display those closed tabs locally; the extension never enumerates or reads open tabs. |
| geolocation | permissions | Determines user coordinates only when the user clicks "Detect current location" in the Weather widget to configure local weather forecasts. |
| https://api.open-meteo.com/* | host_permissions | Fetches weather forecasts and current meteorological conditions for the user's chosen location without requiring API keys. |
| https://geocoding-api.open-meteo.com/* | host_permissions | Converts city names entered by the user into geographic coordinates for weather forecasting. |
| https://nominatim.openstreetmap.org/* | host_permissions | Converts detected GPS coordinates into human-readable place names when the user clicks "Detect current location". |
| https://news.google.com/* | host_permissions | Fetches Google News RSS feeds for configured topics to display headlines in the RSS/News widget. |
| https://images.unsplash.com/* | host_permissions | Loads curated high-resolution wallpaper images when Unsplash wallpaper mode is selected by the user. |
| https://*/* | optional_host_permissions | Prompts for runtime user approval to fetch external custom RSS/Atom feeds added manually by the user. |

---

## Privacy & Data Use

### Data Collection
- **Personal Information**: None collected or transmitted.
- **Health / Financial / Authentication / Contacts**: None collected.
- **Web History**: Not collected.
- **User Content**: Notes, to-dos, and shortcuts remain exclusively in local browser storage.

### Data Security & Privacy Policy
- **Privacy Policy URL**: https://github.com/miyabiver39/ZenithTab/blob/main/PRIVACY.md
- **Single Purpose Policy**: Verified compliant.
- **Limited Use Policy**: ZenithTab does not sell user data, use data for credit/lending, or transmit data to external AI servers.

---

## Version History

| Version | Date | Changes Summary |
|---------|------|-----------------|
| 1.8.1 | 2026-09-17 | Pomodoro widget: completed-session counter no longer clips at the default two-row height (spacing, font size and layout tuned). |
| 1.8.0 | 2026-09-17 | Undo for every delete and layout change (toast + Ctrl+Z); 30-day trash for widgets and pages; automatic whole-dashboard backups before reset/import/restore and after quiet periods, with a restore UI; in-app confirm dialogs replace window.confirm. Fixes the tab freeze after adding a widget or removing a page (finite layout coordinates, self-repairing stored layouts). |
| 1.7.1 | 2026-09-16 | Dependency updates (npm audit clean) and accessibility attributes across settings forms and widgets; lint, E2E and user-event test infrastructure. |
| 1.7.0 | 2026-09-16 | Schema versioning with a forward migration pipeline and pre-migration snapshots; upgrade regression tests against real 1.2/1.3/1.5 data; read-time hydration of settings written by older versions; unlimitedStorage; background feed refresh covers every page. |
| 1.6.1 | 2026-09-16 | Quick Access permissions (topSites, sessions) moved to optional_permissions and requested when the widget is added, so updates never disable the extension; widget registry refactor (no behaviour change). |
| 1.6.0 | 2026-09-16 | New Quick Access widget: most-visited sites and recently closed tabs, list or grid, one-click restore, Chrome-internal APIs only. |
| 1.5.0 | 2026-09-16 | Time-aware dynamic wallpaper (morning/day/sunset/night) with a curated automatic mode and a per-slot custom mode, cross-fade, offline gradient fallback; configured column count now honoured in Shortcuts and Bookmarks. |
| 1.4.1 | 2026-09-16 | Region-aware first-run presets for Dock, Shortcuts and weather city in 7 languages; collision-free ids for pages, widgets and items. |
| 1.4.0 | 2026-09-16 | Google News headline / topic / keyword modes with per-language editions; widget titles, weekdays and weather conditions follow the UI language; Web Embed rejects non-http(s) URLs instead of crashing; test suite rebuilt (98% coverage). |
| 1.3.3 | 2026-09-16 | Empty-page guidance and page duplication; localized first-run content (welcome note, sample tasks, news); general-audience default Dock and shortcuts; top-stories news default; multi-tab storage sync. |
| 1.3.2 | 2026-09-04 | Unified built-in and custom search engine management; stability improvements for storage reads. |
| 1.3.1 | 2026-09-03 | Search engine auto-detection, presets, and reduced memory footprint during workspace page switching. |
