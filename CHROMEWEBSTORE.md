# Chrome Web Store Listing — ZenithTab

> Last Updated: 2026-09-16

## Store Listing

**Extension Name** [REQUIRED]
ZenithTab - New Tab Dashboard

**Short Description** [REQUIRED]
A customizable new tab dashboard with drag-and-drop widgets, bookmarks, RSS feeds, weather and dynamic wallpapers.

**Detailed Description** [REQUIRED]
ZenithTab transforms your new tab into a personal, highly organized productivity dashboard.

Arrange widgets freely with drag-and-drop, pick dynamic wallpapers, and launch your daily workflows instantly. All settings are stored completely inside your local browser profile—no external account, tracking, or cloud sync required. If you like, an opt-in switch lets your appearance, Dock and keyboard shortcuts follow you between Chrome installs through Chrome's own account sync (chrome.storage.sync); widgets, notes and tasks always stay on the device.

Key Features:
- Flexible Grid Layout: Drag, drop, and resize widgets with responsive breakpoints across laptops and external monitors.
- Multi-Page Workspaces: Organize widgets across distinct named pages for work, personal, and research workflows.
- Unified Search Bar: Quick-toggle between web search, repository search, video search, and AI assistant targets, with inline smart answers (calculator, percentages, unit and number-base conversions, dice, coin flips, random picks, day countdowns) shown before you search.
- Bookmarks Explorer: Browse and search Chrome bookmarks with breadcrumb navigation and zero URL leakage.
- RSS & News Feeds: Follow news topics and custom RSS/Atom feeds with automatic background cache refresh.
- Live Weather: Real-time temperature, condition forecasts, and 3-day projections with on-demand location detection.
- App Drawer & Quick Dock: Launch registered web apps categorized by tags, or use persistent top/bottom dock shortcuts.
- Quick Access: Jump back to your most-visited sites or reopen recently closed tabs, straight from the new tab.
- Focus & Utilities: Built-in Pomodoro timer, to-do checklist, quick scratchpad, habit tracker, countdowns, QR codes and an iCal calendar view.
- Safe to Experiment: Undo any delete or move (toast or Ctrl+Z), restore deleted widgets and pages from the trash for 30 days, and roll the whole dashboard back to an automatic backup.
- Privacy-First: Zero telemetry, zero analytics, zero ad network requests.

How to Use:
1. Open a new tab to see your default dashboard.
2. Click "Add Widget" to choose and place widgets on your grid.
3. Drag widgets to reposition, or drag corners to resize.
4. Access settings to customize themes, wallpapers, or create new workspace pages.

Privacy & Permissions:
ZenithTab operates locally on your machine. Data stays strictly inside chrome.storage.local, and network requests are only made when you explicitly configure features (e.g. weather forecasts or RSS feeds). The optional settings sync (off by default) uses chrome.storage.sync, i.e. Chrome's own account sync — the developer never sees it.

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
| storage | permissions | Saves user layout preferences, widget placements, custom search engines, notes, and theme options locally in chrome.storage.local. When the user turns on **Settings › Backup › Sync settings** (off by default), the same permission is used for chrome.storage.sync to keep only the appearance settings (theme, language, glass effect, dock position), the Dock items (labels, URLs, icons) and the keyboard-shortcut bindings in step across the user's own Chrome installs via Chrome's account sync. Widgets, pages, notes, tasks, habits, calendar links and bookmarks are never written to sync storage. Nothing is sent to the developer. |
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
- **Optional settings sync (chrome.storage.sync, off by default)**: When enabled by the user, only the appearance settings (theme, language, glass blur/opacity, corner radius, dock position, adaptive text), the Dock entries (label, URL, icon, open-in-new-tab flag) and keyboard-shortcut bindings (key combo, label, URL) are stored in Chrome's account sync storage. This is Google's Chrome Sync, governed by Google's privacy policy and end-to-end encryptable with a sync passphrase; the developer operates no server and cannot read it. Widget contents (notes, to-dos, habit history, countdowns, calendar feed URLs), pages, layouts, wallpapers and bookmarks are never synced. Turning the switch off removes ZenithTab's items from sync storage.
- **Share codes**: "Share this layout" produces a text string the user copies themselves; it contains the page's widget arrangement and settings with personal content removed (note text, tasks, habit history, calendar URLs, countdowns, QR payloads and the weather location are stripped). ZenithTab never transmits or hosts share codes.

### Data Security & Privacy Policy
- **Privacy Policy URL**: https://github.com/miyabiver39/ZenithTab/blob/main/PRIVACY.md
- **Single Purpose Policy**: Verified compliant.
- **Limited Use Policy**: ZenithTab does not sell user data, use data for credit/lending, or transmit data to external AI servers.

---

## Version History

| Version | Date | Changes Summary |
|---------|------|-----------------|
| 1.11.5 | 2026-09-24 | Fix: Copilot in the search-engine catalog opened an empty chat because Copilot no longer accepts a query in the URL; it now goes through Bing's Copilot Search, and engines added in 1.11.4 are switched over automatically. |
| 1.11.4 | 2026-09-24 | Quick Search: add search engines from a catalog, like shortcuts and the dock — web search, AI assistants (Claude, Perplexity, Google AI Mode, Copilot, Grok, Le Chat, Felo), video, shopping, maps & reference, developer and social sites, plus regional engines. One engine list with a star for the default; removed built-ins come back from the catalog; the smart-answer examples are collapsed by default. |
| 1.11.3 | 2026-09-24 | Bug fixes: an imported config with a malformed page list (or a restored trashed page) can no longer crash the dashboard on every new tab, and stored page lists are repaired on load; config imports are capped at 10 MB / 50 pages / 200 widgets per page, with a clear message for oversized files; a language file that fails to load is no longer retried and logged on every re-render. |
| 1.11.2 | 2026-09-22 | Hardening & a11y: fixes a crash from a malformed imported/shared shortcut list; validates RSS links and imported wallpaper/appearance/synced settings; isolates a crashing widget instead of resetting everything, with a "restore latest backup" option; caps RSS/iCal response size; icon-only buttons now have translated accessible names; App Drawer is a real focus-trapped dialog; only the active locale loads, shrinking the main script 34%. |
| 1.11.1 | 2026-09-22 | Hardening: settings sync measures item size in UTF-8 bytes; share codes are capped in length, decompressed size and item count; month/year date answers clamp to the month's last day; catalog favicon fallback no longer leaks between tiles. Store copy and privacy policy now describe the opt-in sync and share codes. |
| 1.11.0 | 2026-09-22 | Easy setup release: 3-step first-run wizard (language, interests, purpose) with "set up again"; regional site & feed catalogs for shortcuts, dock and news (plus bookmarks / most-visited import and drag-and-drop links); page templates (Work, Study, News, Minimal); one-time weather location offer; more smart answers (dates from now, weekdays, world clock); a "today" line in the header; share codes / QR for a page layout; opt-in settings sync via the Chrome account. |
| 1.10.5 | 2026-09-22 | Bug fixes: weather forecast no longer shows a snowflake for rain showers (fog, thunderstorm and night icons added; freezing drizzle/rain labels); backup and trash lists in Settings scroll within their own box and the backup retention rule is shown. |
| 1.10.4 | 2026-09-21 | Bug fixes: Pomodoro keeps real time in background tabs; calendar shows long-running recurring events, keeps every feed's cache when fetching in parallel and applies colour changes immediately; widget background saves no longer close an open settings dialog; custom search engines are limited to http(s) URLs; an empty dock imports as empty; corrupted page records no longer crash startup. |
| 1.10.3 | 2026-09-21 | Internal quality release: per-field store subscriptions (fewer re-renders), vendor chunk splitting and lazy-loaded dialogs (largest chunk 824 kB → 388 kB), accessible modal dialogs with a focus trap, more test coverage; fixes an Atom feed going blank on an unparsable date. |
| 1.10.2 | 2026-09-21 | Smart answers are discoverable: a ✨ button in the search bar (or typing "?") shows the list of things the bar can answer, with clickable examples; the same list appears in the widget settings. CI moved to Node 24-ready actions. |
| 1.10.1 | 2026-09-20 | Store listing refresh: short description and detailed copy (7 languages) plus the privacy policy now cover Calendar, Habit tracker, Countdown, Quick Access, smart answers and the optional `tabs` permission. No functional changes. |
| 1.10.0 | 2026-09-20 | Widgets can be resized down to 2 columns and 1–2 rows (registry minimums apply to existing widgets; compact one-row layouts for clock and countdown). Calendar widget accepts Google Calendar embed / "add by URL" links (auto-converted to the .ics feed) and explains non-iCal responses. |
| 1.9.0 | 2026-09-20 | New widgets: Calendar (iCal/.ics links, recurring events, multiple calendars), Habit Tracker (daily check-off with streaks) and Countdown (days until a date, yearly repeats). Search bar smart answers (calculator, unit/base conversion, dice, coin flip, random, choose, days until). Text on light wallpapers switches to a dark colour automatically. Built-in keyboard shortcuts listed in settings. Fixes: QR code stays square at any widget size; "Recently closed" tabs now show (new optional `tabs` permission). |
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
