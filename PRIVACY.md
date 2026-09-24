# ZenithTab Privacy Policy

**Last updated: 2026-09-24 — applies to ZenithTab v1.10.0 and later.**

ZenithTab is a local-first new tab dashboard. It has no accounts, no analytics,
no advertising, and no backend of its own. This document describes exactly what
stays on your device and the few cases where the extension talks to an outside
server on your behalf.

---

## 1. What ZenithTab collects

**Nothing.** The developer operates no server, receives no data from the
extension, and has no way to identify you or your browsing.

There is no telemetry, no crash reporting, no analytics SDK, no advertising
identifier, and no tracking pixel anywhere in the codebase.

## 2. What is stored, and where

Everything ZenithTab remembers is written to `chrome.storage.local`, which lives
on your own computer inside your Chrome profile:

| Data | Purpose |
| --- | --- |
| Widget layout, sizes and settings | Rebuild your dashboard on each new tab |
| Wallpaper choice and appearance settings | Restore your theme |
| Uploaded wallpaper image (downscaled) | Display your own background |
| Quick Notes and to-do items | Keep your notes between sessions |
| Cached RSS articles | Show a populated feed instantly |
| Weather readings and the resolved place name | Avoid refetching on every tab |
| Shortcut and app drawer entries | Show your launcher tiles |
| Cached calendar feeds (the raw .ics text) | Show your upcoming events instantly |
| Habit check-offs and countdown dates | Keep your streaks and countdowns |
| Trash and automatic backups (copies of your own dashboard data) | Undo deletes and restore after a reset or import |

None of it is synced to a server run by the developer. Uninstalling the
extension removes it, and **Settings → Reset dashboard** clears it on demand.
The JSON export feature produces a file that you control and that ZenithTab
never uploads anywhere.

### Optional: settings sync through your Chrome account

**Settings → Backup & Sync → Sync settings** is off by default. If you turn it
on, ZenithTab writes a small subset of its data to `chrome.storage.sync`, which
is Chrome's built-in account sync (the same mechanism Chrome uses for your own
bookmarks and extensions). Only these travel:

| Synced | Not synced |
| --- | --- |
| Appearance settings (theme, language, glass effect, corner radius, dock position) | Widgets, pages and layouts |
| Dock entries (label, URL, icon, open-in-new-tab) | Notes, to-dos, habit history, countdowns |
| Keyboard-shortcut bindings (combo, label, URL) | Calendar feed URLs, cached articles, weather, wallpapers, bookmarks |

The data goes to your Google account under Google's privacy policy — it can be
end-to-end encrypted with a Chrome sync passphrase — and the developer has no
server and no way to read it. Turning the switch off deletes ZenithTab's items
from sync storage.

### Share codes

"Share this layout" turns the current page into a text string you copy
yourself. Personal content is stripped before encoding (note text, tasks, habit
history, calendar URLs, countdowns, QR payloads and your weather location).
ZenithTab does not transmit, host or shorten share codes.

## 3. Network requests ZenithTab makes

These are the only outbound requests, and each one happens solely to render a
feature you enabled:

| Destination | When | What is sent |
| --- | --- | --- |
| `api.open-meteo.com` | The weather widget refreshes (at most every 30 minutes) | The coordinates of the location you selected |
| `geocoding-api.open-meteo.com` | You search for a city by name in the weather settings | The text you typed |
| `nominatim.openstreetmap.org` | **Only** when you click "Detect current location" | Your approximate coordinates, rounded to 4 decimal places, to convert them into a place name. The result is cached locally for 30 days so this is a rare request |
| `news.google.com` | The news feed widget refreshes | The keyword you configured for the feed |
| `images.unsplash.com` | A built-in wallpaper is displayed | A standard image request |
| The site hosting an RSS/Atom feed **you added yourself** | That feed refreshes | A standard feed request. Chrome asks for your permission for that specific site before the first fetch, and you can revoke it at any time |
| The site hosting an iCal (.ics) calendar **you added yourself** | The calendar widget refreshes (at most every 15 minutes) | A standard request for the calendar file. As with feeds, Chrome asks for your permission for that specific site when you add it, and you can revoke it at any time |
| A web page **you chose to embed** | The Web embed widget is on screen | The browser loads that page directly, just as if you had opened it in a tab, so the site sees the request and its own cookies apply. ZenithTab adds nothing to it |

No request carries an identifier, a cookie set by ZenithTab, your browsing
history, your bookmarks, or the contents of your notes.

Each destination is operated by an independent third party under its own
privacy policy: [Open-Meteo](https://open-meteo.com/en/terms),
[OpenStreetMap / Nominatim](https://osmfoundation.org/wiki/Privacy_Policy),
[Google](https://policies.google.com/privacy), and
[Unsplash](https://unsplash.com/privacy).

## 4. Location

Location is **never** requested in the background and never on startup. It is
read only when you click "Detect current location" in the weather widget, and it
is used for exactly two things: fetching a forecast for those coordinates, and
turning them into a city name to label the widget. Coordinates are rounded and
stored only on your device. Declining the browser prompt costs you nothing — you
can type a city name instead.

## 5. Bookmarks

The `bookmarks` permission lets the Bookmark Explorer widget read and display
your existing bookmark tree so you can open bookmarks from the new tab page.
Bookmarks are read directly from Chrome, rendered locally, and never transmitted,
copied, or modified.

## 6. Site icons

Favicons come exclusively from Chrome's own local favicon store. ZenithTab does
not use any third-party favicon service, so the addresses of your bookmarks and
shortcuts never leave your machine.

## 7. Quick Access (most-visited sites and recently closed tabs)

The `topSites`, `sessions` and `tabs` permissions are optional. They are not
granted at install time; Chrome asks for them only when you add the Quick
Access widget (and for `tabs` when you first open its "Recently closed" view —
without it Chrome withholds the URLs and titles of closed tabs, so the list
would be empty). The widget reads the lists each time it is shown, renders
them locally, and lets you reopen a closed tab in place. Nothing from these
lists is stored, aggregated, or transmitted, and ZenithTab never enumerates or
monitors your open tabs. Removing the widget or revoking the permissions in
`chrome://extensions` stops the reads entirely.

## 8. Children

ZenithTab is a general-purpose productivity tool. It does not knowingly collect
information from anyone, of any age.

## 9. Changes

Material changes to this policy will be published in this file and reflected in
the extension's Chrome Web Store listing before they take effect.

## 10. Contact

Questions or concerns: <miyabi.ver39@gmail.com>, or open an issue at
<https://github.com/miyabiver39/ZenithTab/issues>.

---

# ZenithTab プライバシーポリシー

**最終更新: 2026年9月24日 — ZenithTab v1.10.0 以降に適用されます。**

ZenithTab はローカルファーストの「新しいタブ」ダッシュボードです。アカウント登録、
アクセス解析、広告、独自のサーバーはいずれも存在しません。本ポリシーでは、端末内に
留まるデータと、拡張機能があなたに代わって外部サーバーへ通信する数少ないケースを
正確に説明します。

## 1. 収集する情報

**ありません。** 開発者はサーバーを運用しておらず、拡張機能から一切データを受け取り
ません。あなたを特定する手段も持ちません。テレメトリ、クラッシュレポート、解析SDK、
広告ID、トラッキングピクセルは、コードのどこにも含まれていません。

## 2. 保存される情報と保存先

ZenithTab が記憶する情報はすべて、お使いのパソコンの Chrome プロファイル内にある
`chrome.storage.local` に保存されます。

- ウィジェットの配置・サイズ・設定
- 壁紙の選択と外観設定、アップロードした壁紙画像（縮小処理済み）
- クイックメモとToDoの内容
- RSS記事のキャッシュ
- 天気の取得結果と地名
- ショートカット／アプリドロワーの登録内容
- カレンダーのキャッシュ（取得した .ics の内容）
- 習慣トラッカーのチェック記録とカウントダウンの日付
- ごみ箱と自動バックアップ（ダッシュボードのデータ自身の複製）

これらが開発者のサーバーへ同期されることはありません。拡張機能をアンインストールすれば
削除され、「設定 → ダッシュボードをリセット」でいつでも消去できます。JSONエクスポート
機能で生成されるファイルはあなたの管理下にあり、ZenithTab がどこかへ送信することは
ありません。

### 任意: Chrome アカウントによる設定の同期

「設定 → バックアップ & 同期 → 設定を同期する」は既定でオフです。オンにすると、
ZenithTab はデータのごく一部を `chrome.storage.sync`（Chrome 自身のアカウント同期。
ブックマークや拡張機能の同期と同じ仕組み）に書き込みます。同期されるのは次だけです。

| 同期される | 同期されない |
| --- | --- |
| 外観設定（テーマ、言語、ガラス効果、角丸、ドックの位置） | ウィジェット、ページ、レイアウト |
| ドックの項目（ラベル、URL、アイコン、新しいタブで開く） | メモ、ToDo、習慣の記録、カウントダウン |
| ショートカットキーの割り当て（キー、ラベル、URL） | カレンダーの URL、記事キャッシュ、天気、壁紙、ブックマーク |

データは Google のプライバシーポリシーのもとであなたの Google アカウントに保存され
（Chrome の同期パスフレーズでエンドツーエンド暗号化できます）、開発者はサーバーを
持たず読むこともできません。スイッチをオフにすると ZenithTab の項目は同期ストレージ
から削除されます。

### 共有コード

「この構成を共有」は、今のページを自分でコピーする文字列にします。エンコード前に
個人的な内容（メモ本文、タスク、習慣の記録、カレンダーの URL、カウントダウン、
QR の内容、天気の位置）を取り除きます。ZenithTab が共有コードを送信・保管・短縮
することはありません。

## 3. 外部への通信

以下が唯一の外部通信であり、いずれもあなたが有効にした機能を表示するためだけに行われます。

| 通信先 | タイミング | 送信内容 |
| --- | --- | --- |
| `api.open-meteo.com` | 天気ウィジェットの更新時（最短30分間隔） | あなたが選択した地点の座標 |
| `geocoding-api.open-meteo.com` | 天気設定で都市名を検索したとき | 入力した文字列 |
| `nominatim.openstreetmap.org` | 「現在地を検出」を**クリックしたときのみ** | 小数点以下4桁に丸めた概略座標（地名への変換用）。結果は端末内に30日間キャッシュされるため、通信はごく稀です |
| `news.google.com` | ニュースフィードの更新時 | 設定したキーワード |
| `images.unsplash.com` | 内蔵壁紙の表示時 | 通常の画像リクエスト |
| **あなたが自分で追加した**RSS/Atomフィードの配信元 | そのフィードの更新時 | 通常のフィード取得リクエスト。初回取得前に、そのサイトに対する許可をChromeが確認します。許可はいつでも取り消せます |
| **あなたが自分で追加した**iCal（.ics）カレンダーの配信元 | カレンダーウィジェットの更新時（最短15分間隔） | 通常のカレンダーファイル取得リクエスト。フィードと同様、追加した時点でそのサイトに対する許可をChromeが確認します。許可はいつでも取り消せます |
| **あなたが埋め込みを設定した**Webページ | Web 埋め込みウィジェットの表示時 | ブラウザがそのページを直接読み込みます（タブで開いたときと同じく、そのサイトにリクエストが届き、そのサイトの Cookie が適用されます）。ZenithTab が情報を付け加えることはありません |

いずれの通信にも、識別子、ZenithTab が発行するCookie、閲覧履歴、ブックマーク、
メモの内容は含まれません。

## 4. 位置情報

位置情報がバックグラウンドで取得されることはなく、起動時に取得されることもありません。
天気ウィジェットの「現在地を検出」をクリックしたときにのみ読み取られ、用途は
「その座標の天気予報を取得すること」と「ウィジェットに表示する地名へ変換すること」の
2点だけです。座標は丸めた上で端末内にのみ保存されます。ブラウザの確認を拒否しても
支障はなく、代わりに都市名を直接入力できます。

## 5. ブックマーク

`bookmarks` 権限は、ブックマークウィジェットが既存のブックマークツリーを読み取って
表示するために使用します。ブックマークは Chrome から直接読み取ってローカルで描画する
のみで、送信・複製・変更は一切行いません。

## 6. サイトアイコン

ファビコンは Chrome 自身のローカルキャッシュのみから取得します。第三者のファビコン
サービスは利用しないため、ブックマークやショートカットのアドレスが端末外へ出ることは
ありません。

## 7. クイックアクセス（よく見るサイト・最近閉じたタブ）

`topSites` `sessions` `tabs` は任意権限で、インストール時には付与されません。クイック
アクセスウィジェットを追加したとき（`tabs` は「最近閉じたタブ」を初めて開いたとき。
この権限がないと Chrome は閉じたタブの URL とタイトルを返さないため一覧が空になります）
にのみ Chrome が確認します。ウィジェットは表示のたびに一覧を読み取ってローカルで描画し、
閉じたタブをその場で復元できるようにするだけです。一覧の内容を保存・集計・送信することは
なく、開いているタブを列挙したり監視したりすることもありません。ウィジェットを削除するか
`chrome://extensions` で権限を取り消せば、読み取りは完全に止まります。

## 8. お問い合わせ

<miyabi.ver39@gmail.com> または <https://github.com/miyabiver39/ZenithTab/issues>
