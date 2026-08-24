# 🛍️ Chrome Web Store 掲載情報（Store Listing）

Chrome Web Store デベロッパーダッシュボードの各入力欄に設定するテキスト集です。  
キーワードスパム（Yellow Argon）ポリシーおよび単一用途ポリシーに100%準拠しています。

---

## 1. 基本情報（Basic Info）

- **アイテム名（Title）**: `ZenithTab`
- **短い説明（Summary / Short Description - 132文字以内）**:
  - **日本語**: 自由なグリッド配置、ブックマーク探索、RSSフィード、美しい壁紙を備えた高機能な新規タブダッシュボード。
  - **英語**: A customizable and elegant new tab dashboard with interactive widgets, bookmarks explorer, RSS feeds, and dynamic wallpapers.

---

## 2. 詳細な説明（Detailed Description）

### 🇯🇵 日本語版（Japanese）

```text
ZenithTab は、新しいタブを美しく洗練された生産性ダッシュボードへと進化させる Chrome 拡張機能です。

お好みのウィジェットを自由自在にグリッド配置し、あなただけの理想的な作業空間を構築できます。すりガラス調（Glassmorphism）のモダンなデザインと、軽快なパフォーマンスを両立しています。

✨ 主な機能

🧩 自由なグリッドレイアウト
・ドラッグ＆ドロップで直感的にウィジェットの移動・リサイズが可能
・ワークスペースに合わせた柔軟なレイアウトの保存

🔖 ブックマーク＆フォルダエクスプローラー
・ブラウザのブックマークを階層構造のまま美しく表示
・フォルダの展開・折りたたみ、クイック検索に対応

📰 RSS・ニュースフィード
・お気に入りの RSS / Atom フィードを登録して最新記事を一覧表示
・定期的なバックグラウンド自動更新に対応

🖼️ ダイナミック壁紙＆カスタマイズ
・高画質な美しい壁紙の自動切り替え
・すりガラスのぼかし具合や透明度、ライト/ダークテーマの調整

🔍 マルチ検索バー
・複数の検索エンジンやツールをワンクリックで切り替えて素早く検索

⏰ 時計＆ライブ天気
・デジタル / アナログ時計の表示
・現在地やお好みの都市のリアルタイム天気・気温表示

📝 クイックメモ
・作業中のアイデアやタスクをサッと書き留められるローカルメモ機能

⚡ ローカルファースト＆プライバシー配慮
・設定やデータはすべてブラウザ内に安全に保存され、外部トラッカーや広告は一切含まれません。
・設定のエクスポート / インポートにも対応
```

---

### 🇺🇸 英語版（English）

```text
Transform your New Tab page into a stunning, highly productive, and fully customizable dashboard with ZenithTab.

Organize your daily workflow with flexible widgets, sleek glassmorphism aesthetics, and ultra-fast performance.

✨ Key Features

🧩 Freeform Grid Layout
• Drag, drop, and resize widgets freely on a responsive grid system.
• Customize your dashboard layout to match your workflow.

🔖 Bookmark & Folder Explorer
• Browse and search your browser bookmarks with a clean, hierarchical folder view.
• Instant favicon loading and smooth folder navigation.

📰 RSS & News Feeds
• Add your favorite RSS / Atom feeds to stay updated with the latest articles.
• Automatic background feed updates with local caching.

🖼️ Dynamic Wallpapers & Theme Customization
• Rotating curated backdrop wallpapers or custom image links.
• Fine-tune glassmorphism blur, card opacity, and dark/light themes.

🔍 Multi-Engine Search Bar
• Switch effortlessly between different search engines and productivity tools with a single click.

⏰ Clock & Live Weather
• Digital and analog clock styles with date and time formats.
• Real-time local weather forecasts and temperature indicators.

📝 Quick Notes Scratchpad
• Jot down thoughts, todo lists, and quick reminders that persist automatically.

⚡ Local-First & Privacy Focused
• All data and configurations are stored securely inside your browser. No external tracking or ads.
• Seamless JSON backup, export, and import support.
```

---

## 3. 権限の正当化理由（Permission Justifications）

Chrome Web Store の「プライバシー」タブで各権限の理由入力を求められた場合は、以下を貼り付けてください。

### `bookmarks`
- **Justification**: ZenithTab includes an interactive Bookmark Explorer widget that allows users to view, search, and navigate their existing browser bookmarks directly from the new tab dashboard.

### `storage`
- **Justification**: Used to store user preferences, custom widget arrangements, notes content, and cached RSS feeds locally on the user's device (`chrome.storage.local`).

### `alarms`
- **Justification**: Used to periodically refresh configured RSS feeds and weather data in the background at user-specified intervals.

### `favicon`
- **Justification**: Used to display website favicons for items in the Bookmark Explorer widget via Chrome's native favicon service.

### `host_permissions`
- **`https://api.open-meteo.com/*`, `https://geocoding-api.open-meteo.com/*`, `https://nominatim.openstreetmap.org/*`**: Required to fetch real-time weather forecasts and geocoding information for the Weather widget based on the city configured by the user.
- **`https://news.google.com/*`**: Required to fetch RSS headlines for Google News keyword topic feeds configured in the RSS widget.
- **`https://images.unsplash.com/*`**: Required to load dynamic high-resolution background wallpapers.
