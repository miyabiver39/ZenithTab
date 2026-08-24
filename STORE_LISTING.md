# Chrome Web Store 掲載情報（Store Listing）

Chrome Web Store デベロッパーダッシュボードの各入力欄に貼り付けるテキスト集です。
このファイルが掲載文の正本であり、ダッシュボード側を直接編集した場合は必ずここへ反映してください。

## 記載時の原則

過去に「キーワードスパム（Yellow Argon）」で否認された経緯があるため、以下を厳守します。

1. **ブランド名・サービス名を列挙しない。** 対応先は「主要なWeb検索エンジン」「動画検索」
   のように *機能* で記述します。アプリ内UIに固有名を表示することはポリシー違反では
   ありませんが、掲載文（メタデータ）に並べることは違反にあたります。
2. **実装にない機能を書かない。** 「誤解を生じさせるメタデータ」も同じスパム条項の対象です。
   掲載文を更新するときは、必ず該当機能がコードに存在することを確認してください。
3. **プライバシーに関する断言を正確に保つ。** ZenithTab は天気表示のために座標を外部APIへ
   送信します。「外部への送信は一切ない」という書き方はできません。

---

## 1. 基本情報（Basic Info）

- **アイテム名（Title）**: `ZenithTab - New Tab Dashboard`
  - manifest では `_locales/*/messages.json` の `extName` から供給されます。
    ダッシュボード側の表示名もこれに合わせてください。
- **カテゴリ**: 仕事効率化（Productivity）
- **プライバシーポリシーURL**: `https://github.com/miyabiver39/ZenithTab/blob/main/PRIVACY.md`

### 短い説明（Summary / 132文字以内）

- **日本語**:
  ```text
  ウィジェットを自由に配置できる新しいタブのダッシュボード。ブックマーク、RSS、天気、ダイナミック壁紙に対応。
  ```
- **英語**:
  ```text
  A customizable new tab dashboard with drag-and-drop widgets, bookmarks, RSS feeds, weather and dynamic wallpapers.
  ```

---

## 2. 詳細な説明（Detailed Description）

### 日本語版

```text
ZenithTab は、新しいタブを「自分専用の作業台」に変えるダッシュボードです。

ドラッグ＆ドロップで置いたウィジェットと選んだ壁紙が、タブを開くたびにそのまま迎えてくれます。設定はすべてお使いのパソコンの中に保存され、アカウント登録は必要ありません。

■ 自由なグリッド配置
ウィジェットは好きな位置へドラッグでき、四隅をつかんでサイズも変更できます。画面幅に応じたブレークポイントを備えているため、ノートPCでも外部ディスプレイでも配置が崩れません。

■ ショートカットとアプリドロワー
よく使うサイトをタイルとして登録し、ワンクリックで開けます。アプリドロワーでは登録済みのサイトをカテゴリ（AI・開発・メディア・仕事効率化など）で絞り込み、名前で検索して素早く目的の項目にたどり着けます。

■ 統合検索バー
主要なWeb検索、コードリポジトリ検索、動画検索、AIチャットの入力先をワンクリックで切り替えられます。キーボードの「/」キーを押すと、どこにいても検索欄にカーソルが移動します。

■ ブックマークエクスプローラー
Chrome に保存済みのブックマークをそのまま表示します。フォルダの階層をたどり、パンくずで戻り、名前で絞り込めます。アイコンは Chrome 内部のキャッシュから取得するため、外部のアイコンサービスにアドレスが送信されることはありません。

■ RSS / ニュースフィード
キーワードを入力するだけでニュースの一覧を購読できます。お好みのRSS/Atomフィードを追加することもでき、その際は対象サイトへのアクセス許可を Chrome がその都度確認します（許可した配信元にしかアクセスしません）。取得結果はバックグラウンドで更新されるので、タブを開いた瞬間に記事が並びます。

■ 天気
都市名を入力するか、「現在地を検出」をクリックして現在地から設定できます。気温・体感温度・風速・湿度に加えて、今日から3日先までの予報を表示します。位置情報を読み取るのはボタンを押したときだけで、バックグラウンドで取得することはありません。

■ ポモドーロタイマーとToDo
25分の集中と休憩のサイクルを管理するタイマーと、チェックボックス式のToDoリストを備えています。

■ ダイナミック壁紙とグラスモフィズム
宇宙・自然・ミニマル・建築・抽象・サイバーパンクの各コレクション、グラデーションプリセット、手持ちの画像アップロードから選べます。すりガラスのぼかし量、明るさ、暗色オーバーレイの濃さはスライダーで調整できます。

■ 多言語対応
日本語、英語、中国語（簡体字）、スペイン語、フランス語、ドイツ語、韓国語のインターフェースに対応しています。

■ ローカルファースト
レイアウト、メモ、設定はすべてお使いのパソコンの chrome.storage.local に保存されます。ZenithTab には独自のサーバーがなく、アクセス解析も広告もトラッカーもありません。外部への通信は、天気の取得（選択した地点の座標）、ニュースとRSSの取得、壁紙画像の読み込みに限られます。詳細はプライバシーポリシーをご覧ください。

設定はJSONとして書き出し・読み込みができるので、別のパソコンへ持ち運ぶこともバックアップすることもできます。

オープンソース（MITライセンス）です:
https://github.com/miyabiver39/ZenithTab
```

### 英語版

```text
ZenithTab turns the new tab page into a workspace you actually arrange yourself.

The widgets you place and the wallpaper you choose are waiting every time you open a tab. Everything is stored on your own computer, and there is no account to create.

■ A grid you arrange
Drag widgets anywhere and grab a corner to resize them. Responsive breakpoints keep your layout intact whether you are on a laptop screen or an external display.

■ Shortcuts and an app drawer
Pin the sites you use most as tiles and open them in one click. The app drawer filters your saved sites by category (AI, development, media, productivity and more) and searches them by name.

■ Unified search bar
Switch in one click between general web search, code repository search, video search, and an AI chat prompt. Press "/" anywhere on the page to jump straight into the search field.

■ Bookmark explorer
Browse the bookmarks already in Chrome. Walk into folders, step back through breadcrumbs, and filter by name. Site icons come from Chrome's own local cache, so the addresses of your bookmarks never reach an outside icon service.

■ RSS and news feeds
Type a keyword to follow a news topic, or add your own RSS/Atom feed. When you add one, Chrome asks your permission for that specific site — ZenithTab only ever reaches the feeds you approve. Articles refresh in the background so the list is already populated when the tab opens.

■ Weather
Set a city by name, or click "Detect current location". You get temperature, feels-like, wind speed, humidity, and the forecast for today plus the next three days. Location is read only when you press the button, never in the background.

■ Pomodoro timer and to-do list
A 25-minute focus and break cycle, plus a checkbox list for the day's tasks.

■ Dynamic wallpapers and glassmorphism
Choose from curated collections (cosmos, nature, minimal, architecture, abstract, cyberpunk), gradient presets, or upload your own image. Sliders control backdrop blur, brightness, and the darkening overlay.

■ Available in seven languages
English, Japanese, Simplified Chinese, Spanish, French, German, and Korean.

■ Local-first
Your layout, notes, and settings live in chrome.storage.local on your machine. ZenithTab has no backend of its own, no analytics, no ads, and no trackers. Its only outbound requests are fetching weather for the location you chose, fetching the news and feeds you configured, and loading wallpaper images. The privacy policy spells this out in full.

Export your setup as JSON to back it up or move it to another computer.

Open source under the MIT license:
https://github.com/miyabiver39/ZenithTab
```

---

## 3. 単一用途の説明（Single Purpose Description）

```text
ZenithTab replaces Chrome's new tab page with a single, user-arranged dashboard. Every feature — widgets, bookmarks, feeds, weather, shortcuts, wallpapers — exists to render that one page. The extension does not inject scripts into websites, modify pages you visit, or run anywhere outside its own new tab page.
```

---

## 4. 権限の正当化理由（Permission Justifications）

ダッシュボードの各権限欄に、以下をそのまま貼り付けます。

### `storage`
```text
Stores the user's dashboard on their own device via chrome.storage.local: widget layout and settings, appearance and wallpaper preferences, notes and to-do items, and cached feed and weather results. Nothing is sent to a remote server.
```

### `bookmarks`
```text
The Bookmark Explorer widget reads the user's existing bookmark tree so they can browse and open their bookmarks from the new tab page. Bookmarks are rendered locally and are never transmitted or modified.
```

### `alarms`
```text
Schedules a periodic background refresh of the RSS and news feeds the user has configured, so articles are already up to date when a new tab is opened.
```

### `favicon`
```text
Displays site icons for bookmarks, shortcuts and app drawer entries using Chrome's own local favicon cache. This lets the extension avoid any third-party favicon service, which would otherwise expose the user's bookmark addresses to an outside server.
```

### `geolocation`
```text
The Weather widget offers a "Detect current location" button. When the user clicks it, the extension reads their coordinates once to fetch a local forecast and to resolve a place name for the widget label. Location is never read in the background or on startup, and the user can instead type a city name.
```

### `host_permissions`
```text
- api.open-meteo.com and geocoding-api.open-meteo.com: fetch the forecast for the location the user selected, and look up coordinates when they search for a city by name.
- nominatim.openstreetmap.org: convert coordinates into a readable place name after the user clicks "Detect current location". The result is cached locally for 30 days.
- news.google.com: fetch RSS headlines for the keyword topic the user configured in the news widget.
- images.unsplash.com: load the built-in wallpaper images.
```

### `optional_host_permissions` (`https://*/*`)
```text
Users can add their own RSS/Atom feed URLs, which can be hosted anywhere. Rather than requesting broad access up front, the extension requests permission for a single origin at the moment the user adds a feed from that site, using chrome.permissions.request(). No host is accessed until the user has explicitly approved it, and permissions can be revoked at any time.
```

---

## 5. データ利用に関する申告（Data Usage Disclosures）

デベロッパーダッシュボードの「プライバシーへの取り組み」で選択する内容です。

| 項目 | 回答 |
| --- | --- |
| 個人を特定できる情報 | 収集しない |
| 健康情報 | 収集しない |
| 財務情報 | 収集しない |
| 認証情報 | 収集しない |
| 個人の通信内容 | 収集しない |
| **位置情報** | **収集する（端末内のみ）** — 天気の表示のためにユーザーが明示的に要求した場合に限り座標を取得し、端末内に保存する。第三者へ販売・移転しない |
| ウェブ閲覧履歴 | 収集しない |
| ユーザーのアクティビティ | 収集しない |
| ウェブサイトのコンテンツ | 収集しない |

3つの確認事項には、いずれも「はい（遵守する）」を選択します。

- 取り扱うユーザーデータを、承認された用途以外に使用または譲渡していない
- ユーザーデータを、その主要な用途と無関係な第三者に販売していない
- ユーザーデータを、信用力の判断や融資目的で使用または譲渡していない

---

## 6. 再申請前チェックリスト

- [ ] `npm run build && npm run verify` が成功する
- [ ] 掲載文にブランド名の羅列がない
- [ ] 掲載文に書いた機能がすべて実装されている
- [ ] プライバシーポリシーURLが公開状態で開ける
- [ ] `geolocation` を含む全権限の正当化理由を入力した
- [ ] スクリーンショットが現在のUIと一致している
- [ ] `manifest.json` と `package.json` のバージョンが一致している
