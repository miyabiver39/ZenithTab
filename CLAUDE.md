# CLAUDE.md — ZenithTab 開発ルール(AI アシスタント向け)

ZenithTab(ゼニスタブ)は Manifest V3 の新しいタブ拡張です。アーキテクチャの全体像は [AGENT.md](./AGENT.md)、運用ルールの要約は [AGENTS.md](./AGENTS.md) を参照してください。このファイルは **AI が作業するときに毎回守る手順** をまとめたものです。

## 1. 作業の進め方

1. **ブランチ**: `main` から `feat/<name>` / `fix/<name>` / `refactor/<name>` / `docs/<name>` を切る。`main` は常にリリース可能な状態を保つ。
2. **コミット**: Conventional Commits(`feat:` `fix:` `refactor:` `test:` `docs:` `chore:`)。本文には「何が問題で、なぜこの形にしたか」を書く。
3. **完了条件**(必ず両方を実行して緑にしてから報告する):
   ```bash
   npm run lint
   npm run typecheck
   npm run test:run
   ```
   カバレッジは `npm run test:coverage`(`coverage/` は git 管理外)。E2E は `npm run test:e2e`(Playwright が dev サーバーを自動起動; UI に触る変更をしたら回す。CI では別ジョブで実行)。
4. **振る舞いを変えないリファクタリング**では、既存テストを一切書き換えずに全件パスさせること。テストを変えなければ通らない場合は、それは振る舞いの変更なので理由を明記する。
5. **Issue 対応**は Issue 本文の要件に沿い、対応した Issue 番号をコミットメッセージに `Closes #N` で入れる。
6. **定期監査・品質検査**: リリース前や定期点検では `.agents/skills/code-audit/SKILL.md` の監査チェックリストに従い、未カバー行や潜在的リスクを精査して Issue を起票する。

## 2. ウィジェットの追加・変更(レジストリ方式)

ウィジェットはレジストリ駆動です。`switch (widget.type)` を新しく書いてはいけません。新しいウィジェットは次の **4 か所** で完結します。

| 手順 | ファイル | 内容 |
| :--- | :--- | :--- |
| 1 | `src/types/widget.ts` | `WidgetType` にキー追加、`<Type>WidgetConfig` インターフェース、`WidgetConfig` ユニオンへ追加 |
| 2 | `src/components/widgets/widgetDefinitions.ts` | `WIDGET_DEFINITIONS.<type>` に `size` / `createDefaultConfig(t, lang)` / 必要なら `urlKeys` `sanitizeConfig` |
| 3 | `src/components/widgets/registry.tsx` | `WIDGET_REGISTRY` に `icon` / `color` / `Component` / `ConfigForm` / 必要なら `beforeSave`(配列の順序 = 「ウィジェット追加」カタログの表示順) |
| 4 | `src/i18n/locales/*.ts`(7 言語すべて) | `widgets.<type>.title` と `widgets.<type>.desc`、フォームで使う文言 |

- 本体は `src/components/widgets/<Name>Widget/<Name>Widget.tsx`、設定フォームは同じフォルダの `<Name>Config.tsx`(`ConfigFormProps` を受け取り、`config` / `setConfig` を編集)。設定不要なら `ConfigForm` は省略可。
- 保存時の正規化(URL 補完、権限要求など)は `beforeSave` に置く。`WidgetConfigModal` は共通フレームなのでウィジェット固有の処理を足さない。
- インポート時に検証すべき URL は `urlKeys`、ネスト構造(アイテム一覧など)は `sanitizeConfig` で宣言する。`storageService.sanitizeWidget` はそれを読むだけ。
- `widgetDefinitions.ts` は React コンポーネントを import しない(store / storageService から読むため、循環参照を避ける)。
- 既定タイトルは `t.widgets.<type>.title` を使う。`utils/widgetTitle.ts` が全ロケールの既定名を認識して言語切替に追従させる。
- `tests/unit/widgetRegistry.test.tsx` が「全型が両テーブルに登録され、7 言語のタイトル/説明がある」ことを検証する。

## 3. i18n

- ユーザーに見える文字列は必ず `src/i18n/locales/{en,ja,zh,es,fr,de,ko}.ts` の **7 言語すべて**に追加する(`tests/unit/i18n.test.ts` がキー構造の一致を検証)。
- 文字列はロケールファイルにのみ置き、JSX にハードコードしない。
- 初回起動時に生成されるデフォルト文言(メモ、タスク、ニュース名)は `defaults.*`、地域別のドック / ショートカット / 天気都市は `src/config/defaults/regionalPresets.ts`。

## 4. ストレージとテスト環境

- 永続化は `storageService` / `utils/storage.ts` 経由(拡張外では `localStorage` にフォールバック)。`chrome.*` API を直接呼ぶ場合は未定義環境での安全なフォールバックを必ず用意する。
- テストは Vitest + Testing Library。`tests/setup.ts` が `chrome` をモックし(`tests/helpers/chrome.ts`)、各テスト後にストレージとモックをリセットする。新しい Chrome API を使うときは `chromeMock` にも追加する。
- コンポーネントテストの操作は `tests/helpers/user.ts` の `setupUser()`(user-event)で行い、クエリは `getByRole` / `getByLabelText` / `getByTestId` を優先する(class 名依存の `querySelector` は避ける)。range スライダー・HTML5 DnD・`load`/`error` イベントだけは `fireEvent` を使い、理由をコメントする。フェイクタイマー下でも動く(setup が RTL に vitest のタイマーを橋渡し)。
- ID 生成は `utils/id.ts` の `uniqueId()` を使う(`Date.now()` 単独は同一ミリ秒で衝突する)。
- 動的な Tailwind クラス(`grid-cols-${n}` など)はビルド時に消えるので、動的値はインラインスタイルで当てる。

## 5. 保存データの互換性(必読)

既存ユーザーは自動更新でそのまま新コードに乗る。保存済みデータを壊さないために:

- **追加的な変更**(新しい任意フィールド)はスキーマ版を上げない。読み込み時のハイドレーション(`storageService.hydrateWidget` = レジストリの `createDefaultConfig` で欠けたキーだけ補完、`getWallpaper` / `getAppearance` の浅いマージ)が面倒を見る。
- 既定値の補完で**ユーザーの見え方が変わる**場合(例: 旧 RSS の `searchQuery` に `googleNewsMode` の既定を足すと検索がトップニュースに化ける)は、`widgetDefinitions.ts` の `migrateConfig` で旧データから正しい値を導く。
- **破壊的変更**(キー名の変更、値の構造変更、キーの統合/分割)は `src/services/migrations.ts` で `CURRENT_SCHEMA_VERSION` を +1 し、`MIGRATIONS[<新版>]` に前進・冪等なステップを1つ追加する。直前のスナップショット(`backup_before_v<N>`)と1版ずつのコミットは基盤側が行う。
- 旧キーの削除は**2リリースに分ける**(N: 新キーに書き旧キーも読む → N+1: 旧キー削除)。
- マイグレーションは新しいタブの `initialize()` 先頭でだけ走る(Service Worker では走らせない)。エクスポート JSON のインポートも同じ関数を通る。
- 新しいバージョンを出したら `tests/fixtures/export-v<version>.json` を1つ追加し、`tests/unit/upgradeRegression.test.tsx` の対象に加える。

## 6. リリース手順

1. `CHANGELOG.md` に該当バージョンの節を追記(Keep a Changelog 形式、日本語)。
2. `npm run version:bump X.Y.Z`(package.json と manifest.json を更新し、コミットとタグを作成)。機能追加はマイナー、修正はパッチ。
3. **dev サーバー(`npm run dev` / プレビュー)を止めてから** `npm run package`。CRXJS の dev モードが `dist/` を上書きし、10KB ほどの壊れた ZIP ができる。
4. `git push origin main --tags`。`v*` タグの push で GitHub Actions が ZIP と SBOM を添付した Release を作る。CI の結果を確認して報告する。
5. 権限(`manifest.json` の `permissions` / `host_permissions`)を変えたら `CHROMEWEBSTORE.md` の権限表も更新する。

## 7. 環境上の注意(Windows)

- リポジトリは CRLF / LF が混在している。`sed -i` は CRLF を落とすので、既存ファイルの編集は Edit ツールか改行を保持するスクリプトで行い、`git diff --stat` で全行書き換えになっていないか確認する。
- `scripts/package.js` は `release/` に ZIP を出力する(git 管理外)。
