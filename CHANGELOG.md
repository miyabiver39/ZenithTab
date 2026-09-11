# Changelog

このファイルは ZenithTab (ZenthTab) の変更履歴です。
[Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) の形式に準拠し、[Semantic Versioning](https://semver.org/lang/ja/) を採用しています。

Chrome ウェブストアのリリースノートは、公開のたびにこのファイルの該当バージョンの内容をもとに作成します。

## [Unreleased]

### Added

### Fixed

## [1.3.0] - 2026-09-11

### Added
- ダッシュボードの複数ページ対応。ウィジェットとレイアウトをページ単位で切り替え可能に(タブクリックで切替、ダブルクリックでリネーム、+ で新規ページ追加)
- 検索ウィジェットでカスタム検索エンジンを追加可能に(名前・URLテンプレート・任意の絵文字アイコン)
- クイックドックの項目を自由にカスタマイズ可能に(追加・削除・並べ替え、22種のアイコンまたは任意の絵文字)
- 左上の挨拶メッセージがランダムにユーモラスなメッセージへ変化するように(Minecraft/Discordのスプラッシュテキスト風、全7言語対応)
- 任意のリンクにキーボードショートカットを割り当てられる機能を追加(設定 → ショートカットキー)
- クイックメモにページ(タブ)機能を追加。1ウィジェットに最大8ページまでメモを分けて管理可能
- QRコード生成ウィジェットを追加。URL・電話番号・テキストをQRコード化し、ダウンロード・コピーに対応

### Fixed
- 検索バーのエンジン選択ドロップダウンを `document.body` にポータル表示し、下のウィジェットに隠れて見えなくなる問題を解消
- react-grid-layout の `data-grid` 属性がブレークポイント別レイアウトを常に上書きしていた不具合を修正し、ウィンドウ幅を変えてもウィジェットが重なったり崩れたりしないように改善
- ダッシュボード下部の不要な余白を解消(コンテナの二重ストレッチを解消し、Dock が下部にある時だけ余白を確保するよう変更)

## [1.2.3] - 2026-08-25

### Fixed
- ウィジェットのリサイズハンドルを、レイアウト編集モード以外では非表示にした
- ダッシュボードの言語設定に合わせて、時計の日付・時刻表示のフォーマットを修正

### Docs
- ストア掲載文を5言語分追加し、ホスト権限の正当化理由を修正

## [1.2.2] - 2026-08-25

### Fixed
- 検索バーのレイアウトを改善し、デフォルトのウェルカムノートにユーモアを追加
- QuickNotes のデフォルト内容を簡潔な英語に変更
- ストア掲載文と実装の不一致を解消し、権限まわりを堅牢化

### Chore
- パッケージ化スクリプトが Windows の `Compress-Archive` に対応

## [1.2.1] - 2026-08-24

### Fixed
- ストアのキーワードスパムポリシー違反を解消し、掲載文を更新

## [1.2.0] - 2026-08-23

### Fixed
- `host_permissions` を必要な API ドメインのみに制限し、Chrome ウェブストアの審査を高速化

### Docs
- Chrome ウェブストア用のスクリーンショット・プロモーション画像を追加

## [1.1.0] - 2026-08-23

### Added
- App Drawer(アプリドロワー)とショートカット起動用ウィジェットを追加

## [1.0.0] - 2026-08-23

### Added
- 初回リリース(Manifest V3)
- i18n(多言語)対応、現在地ベースの天気表示、検索・ポモドーロ・Todo ウィジェット

[Unreleased]: https://github.com/miyabiver39/ZenithTab/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/miyabiver39/ZenithTab/compare/v1.2.3...v1.3.0
[1.2.3]: https://github.com/miyabiver39/ZenithTab/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/miyabiver39/ZenithTab/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/miyabiver39/ZenithTab/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/miyabiver39/ZenithTab/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/miyabiver39/ZenithTab/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/miyabiver39/ZenithTab/releases/tag/v1.0.0
