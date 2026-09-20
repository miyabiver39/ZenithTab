<div align="center">

<img src="../../public/icons/icon128.png" width="96" height="96" alt="ZenithTab アイコン" />

# ZenithTab

**速くて、美しくて、とことんカスタマイズできる Google Chrome の新しいタブ。**

ドラッグ&ドロップのウィジェット、ガラス質感の UI、ダイナミック壁紙、7 言語対応 — ローカル完結、アカウント不要、トラッキングなし。

[![Build and Test](https://github.com/miyabiver39/ZenithTab/actions/workflows/build.yml/badge.svg)](https://github.com/miyabiver39/ZenithTab/actions/workflows/build.yml)
[![Latest release](https://img.shields.io/github/v/release/miyabiver39/ZenithTab?label=release&color=0ea5e9)](https://github.com/miyabiver39/ZenithTab/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)
[![Chrome Manifest V3](https://img.shields.io/badge/Chrome-Manifest_V3-success.svg)](../../manifest.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg?logo=typescript&logoColor=white)](../../tsconfig.json)
[![React 19](https://img.shields.io/badge/React-19-20232a.svg?logo=react&logoColor=61dafb)](../../package.json)
[![i18n](https://img.shields.io/badge/i18n-7_languages-8b5cf6.svg)](../../src/i18n/locales)
[![Tests](https://img.shields.io/badge/tests-Vitest_%2B_Playwright-6e9f18.svg)](../../tests)

[**インストール**](#-インストール) · [**機能**](#-機能) · [**開発**](#️-開発) · [**変更履歴**](../../CHANGELOG.md) · [**プライバシー**](../../PRIVACY.md)

[English](../../README.md) · **日本語** · [简体中文](README.zh-CN.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [한국어](README.ko.md)

<img src="../../store-assets/screenshot_1_1280x800.png" width="880" alt="ZenithTab のダッシュボード" />

</div>

---

## ✨ 機能

### ウィジェット

| ウィジェット | できること |
| :-- | :-- |
| 🔍 **クイック検索** | 複数エンジン対応の検索バー(Google・Bing・DuckDuckGo・GitHub・YouTube・ChatGPT + 自作エンジン)。**スマート回答**をその場で表示: `120*1.1`、`20% of 150`、`10 km to mi`、`0xff`、`2d6`、`coin`、`random 1-100`、`choose a, b, c`、`2026-12-31 まで`。 |
| 🌐 **ショートカット** | よく使うサイトをタイル状に。ファビコンは Chrome 自身のキャッシュから取得。 |
| ⏰ **時計** | デジタル / アナログ / ミニマル、秒・日付・タイムゾーン。 |
| 🌤️ **天気** | 現在の天気と 3 日間予報(Open-Meteo)。ワンクリックの現在地検出も可。 |
| 🔖 **ブックマーク** | Chrome のブックマークをフォルダごと閲覧・検索。 |
| 📰 **ニュース & RSS** | Google ニュース(トップ・トピック・キーワード検索)や任意の RSS / Atom フィードをバックグラウンドで更新。 |
| ⏱️ **集中タイマー** | ポモドーロ。短い / 長い休憩とセッション数のカウント。 |
| ✅ **タスク管理** | フィルタ付きのシンプルな ToDo。削除は元に戻せます。 |
| 📝 **クイックメモ** | 複数ページの Markdown メモ帳。 |
| 🖼️ **Web 埋め込み** | 任意のページやツールを iframe で埋め込み。埋め込み拒否サイトには代替カードを表示。 |
| ⚡ **クイックアクセス** | Chrome の「よく見るサイト」と「最近閉じたタブ」(その場で復元可能)。 |
| 📱 **QR コード** | URL・電話番号・テキストを QR コードに。スマホにリンクを送るときに便利。 |
| ⏳ **カウントダウン** | 誕生日・旅行・試験・締切まであと何日。毎年繰り返しにも対応。 |
| 🔥 **習慣トラッカー** | 日課を毎日チェックして連続日数をキープ。 |
| 📅 **カレンダー** | iCal(.ics)リンクから今日と直近の予定を表示 — Google カレンダー・Outlook・Apple。 |

### ダッシュボード

- 🧩 **自由なグリッド配置** — レスポンシブなグリッド上でウィジェットをドラッグ・リサイズ・整列。横 2 列まで縮められます。
- 📑 **複数ページ** — 仕事用 / 家用 … と独立したダッシュボードを `Ctrl+Alt+←/→` で切り替え。
- 🖼️ **壁紙** — Unsplash コレクション、グラデーション、自分の画像。**時間帯モード**で朝・昼・夕・夜と雰囲気が変わり、明るい壁紙では文字色が自動で暗くなります。
- 🎨 **ガラス質感** — ぼかし・角丸・ドックを調整。
- ↩️ **フールプルーフ** — あらゆる削除と配置変更を元に戻せる(`Ctrl+Z`)、ウィジェットとページの 30 日間ごみ箱、危険な操作の前に自動バックアップ。
- ⌨️ **キーボードショートカット** — 組み込み(`/` で検索、元に戻す / やり直す、ページ切替)に加えて、好きな URL を開く独自のキー割り当て。
- 🌍 **7 言語** — English、日本語、简体中文、Español、Français、Deutsch、한국어。既定値は地域に合わせて変わります(検索エンジン、ニュースの版、天気の都市、ドック)。
- 🔄 **インポート / エクスポート** — ダッシュボード全体を JSON 1 ファイルに。
- 🔒 **ローカル完結** — すべて `chrome.storage.local` に保存。バックエンドなし、解析なし、トラッキングなし。

---

## 🚀 インストール

### リリースから(推奨)

1. [最新リリース](https://github.com/miyabiver39/ZenithTab/releases/latest)から `zenith-tab-vX.Y.Z.zip` をダウンロードして展開します。
2. `chrome://extensions/` を開き、右上の **デベロッパー モード** をオンにします。
3. **パッケージ化されていない拡張機能を読み込む** をクリックし、展開したフォルダを選びます。
4. 新しいタブを開きます。

> サイドロードした拡張を更新するときは、**新しいフォルダ**に展開して読み込み直す(または拡張カードの ↻ を押す)でください。Chrome は再読み込み時にしか `manifest.json` を読み直さないため、ファイルを上書きしただけでは権限が古いままになります。

### ソースから

```bash
git clone https://github.com/miyabiver39/ZenithTab.git
cd ZenithTab
npm install
npm run build      # → dist/
npm run verify     # パッケージ後の manifest と dist/ の整合を確認
```

あとは上記と同じ手順で `dist/` を読み込みます。

---

## 🔐 権限とプライバシー

| 権限 | 用途 |
| :-- | :-- |
| `storage`, `unlimitedStorage` | ダッシュボード・メモ・キャッシュを端末内に保存。カスタム壁紙で 10 MB 上限に当たらないように |
| `bookmarks` | ブックマークウィジェット |
| `alarms` | バックグラウンドのフィード更新 |
| `favicon` | Chrome のローカルキャッシュからサイトアイコンを取得 — 外部のアイコンサービスは使いません |
| `geolocation` | 「現在地を検出」を押したときだけ 1 回読み取り |
| ホスト権限 | 天気(Open-Meteo)、Google ニュース、Unsplash の壁紙 |
| 任意: `topSites`, `sessions`, `tabs` | クイックアクセスウィジェットを追加したときに要求(よく見るサイト、最近閉じたタブとそのタイトル) |
| 任意のホスト権限 | カスタム RSS フィードやカレンダーを追加した瞬間に、そのオリジンだけを要求 |

バックエンドも解析もトラッキングもありません。すべての外部通信は [PRIVACY.md](../../PRIVACY.md) に列挙しています。

---

## 🛠️ 開発

| 作業 | コマンド |
| :-- | :-- |
| 開発サーバー(HMR) | `npm run dev` → http://localhost:5173/newtab.html |
| ビルド | `npm run build` |
| Lint / 型 / 単体テスト | `npm run lint` · `npm run typecheck` · `npm run test:run` |
| E2E(Playwright) | `npm run test:e2e` |
| カバレッジ | `npm run test:coverage` |
| リリース | `npm run version:bump X.Y.Z` → `npm run package`(先に開発サーバーを止める)→ `git push origin main --tags` |

**VS Code**: リポジトリに `.vscode/` が含まれています。`Ctrl+Shift+B` でビルド、`F5` で開発サーバーを起動して Chrome を開き、ブレークポイントが効きます(「Debug new tab」)。ビルド済み拡張を読み込む構成(「Debug extension」)もあります。「check all」タスクは lint → typecheck → テストを順に実行し、CI と同じ関門になります。

`v*` タグを push すると ZIP と SBOM がビルドされ、GitHub Release が公開されます。

### 技術スタック

React 19 + TypeScript(strict)· Vite + `@crxjs/vite-plugin` · Tailwind CSS + Lucide アイコン · `react-grid-layout` · Zustand · `fast-xml-parser` · Vitest + Testing Library + Playwright

### ディレクトリ構成

```text
src/
├── background/service-worker.ts   # バックグラウンドのフィード更新(chrome.alarms)
├── components/
│   ├── common/                    # Modal, Button, Input, GlassCard, ConfirmDialog, UndoToast
│   ├── layout/                    # Header, Dock, GridContainer, SettingsPanel, 各モーダル
│   └── widgets/                   # ウィジェットごとのフォルダ + registry.tsx / widgetDefinitions.ts
├── hooks/                         # useRssFeed, useWeather, useLayoutUndo, …
├── i18n/locales/                  # UI 文言、7 言語
├── services/                      # storage, migrations, rss, weather, calendar, wallpaper, trash, snapshots
├── store/                         # Zustand ストア + Undo スタック
├── utils/                         # パーサー(RSS, iCal)、スマート入力、カウントダウン / 習慣の計算 …
└── newtab.tsx                     # アプリのルート
tests/                             # unit / components / e2e
public/_locales/                   # ストア掲載用の名前と説明
```

ウィジェットの追加はレジストリへの登録だけです — [CLAUDE.md](../../CLAUDE.md) §2 と [AGENT.md](../../AGENT.md) を参照してください。

---

## 🤝 コントリビュート

Issue と Pull Request を歓迎します。`main` からブランチを切り、Conventional Commits で書き、`npm run lint`・`npm run typecheck`・`npm run test:run` が通ることを確認してください。[変更履歴](../../CHANGELOG.md)は Keep a Changelog 形式です。

## 📄 ライセンス

[MIT](../../LICENSE)
