# ZenithTab Privacy Policy

**Last updated: 2026-08-24 — applies to ZenithTab v1.2.2 and later.**

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

None of it is synced to a server. Uninstalling the extension removes it, and
**Settings → Reset dashboard** clears it on demand. The JSON export feature
produces a file that you control and that ZenithTab never uploads anywhere.

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

## 7. Children

ZenithTab is a general-purpose productivity tool. It does not knowingly collect
information from anyone, of any age.

## 8. Changes

Material changes to this policy will be published in this file and reflected in
the extension's Chrome Web Store listing before they take effect.

## 9. Contact

Questions or concerns: <miyabi.ver39@gmail.com>, or open an issue at
<https://github.com/miyabiver39/ZenithTab/issues>.

---

# ZenithTab プライバシーポリシー

**最終更新: 2026年8月24日 — ZenithTab v1.2.2 以降に適用されます。**

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

これらがサーバーへ同期されることはありません。拡張機能をアンインストールすれば削除され、
「設定 → ダッシュボードをリセット」でいつでも消去できます。JSONエクスポート機能で
生成されるファイルはあなたの管理下にあり、ZenithTab がどこかへ送信することはありません。

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

## 7. お問い合わせ

<miyabi.ver39@gmail.com> または <https://github.com/miyabiver39/ZenithTab/issues>
