---
name: code-audit
description: Comprehensive quality, security, and test coverage audit for ZenithTab. Use when verifying releases, inspecting code health, or auditing test completeness.
---

# ZenithTab Code & Quality Audit Skill

ZenithTab のソースコード品質、セキュリティ、Manifest V3 適合性、テストカバレッジを包括的に監査し、課題を GitHub Issue に起票するための標準手順です。

リリース準備前、大型リファクタリング後、または定期的な健全性確認の際に実行します。

---

## 監査の手順（5 ステップ）

### ステップ 1: 静的解析とビルド検証
以下のコマンドを順次実行し、エラーおよび警告が 0 件であることを確認します。
```bash
npm run typecheck
npm run lint
npm run build
```
- TypeScript の型エラー、ESLint の警告、Vite のビルドエラーやチャンク肥大化（単一チャンクが極端に巨大でないか）を確認する。

---

### ステップ 2: テスト実行とカバレッジ分析
```bash
npm run test:coverage
npm run test:e2e
```

1. **全体目標基準**:
   - 全体 Lines カバレッジ: **95% 以上**
   - 全体 Branch カバレッジ: **85% 以上**
   - 失敗テスト: **0 件**

2. **重点未カバー行（Uncovered Line #s）の精査対象**:
   - `src/services/storageService.ts`, `syncService.ts`, `shareService.ts`
   - `src/utils/smartInput.ts`, `dropLink.ts`, `todaySummary.ts`, `worldClock.ts`
   - `src/services/calendarService.ts`, `weatherService.ts`
   - 各コンポーネントの例外分岐（パース失敗、API 拒否、オフライン時）が未テストになっていないかを洗い出す。

---

### ステップ 3: セキュリティ & Chrome MV3 適合性監査
1. **危険なコード評価・DOM 操作の排除**:
   - `eval`, `new Function`, `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML` が使用されていないこと。
2. **URL バリデーションの徹底**:
   - ユーザー入力、共有コード、インポート設定に含まれる URL が `isSafeHttpUrl`（または `isSafeUrl`）により `http:` / `https:` に厳格制限されていること（`javascript:`, `data:`, `file:` の排除）。
3. **ストレージとクォータ制限**:
   - `chrome.storage.sync` のアイテム上限（`QUOTA_BYTES_PER_ITEM` = 8,192 バイト）判定において、JavaScript の文字数（UTF-16）ではなく `new TextEncoder().encode(...).length` による **UTF-8 バイト数** で判定されていること。
4. **DoS / 解凍ボム (Decompression Bomb) 対策**:
   - 外部から取り込む圧縮コード（共有コード等）の入力文字列長上限、ストリーム解凍後の最大サイズ上限、およびウィジェット配列長上限が存在すること。

---

### ステップ 4: 多言語 (i18n) & アクセシビリティ & テスト品質
1. **多言語 (i18n) の整合性**:
   - `src/i18n/locales/` 配下の 7 言語（`en`, `ja`, `de`, `es`, `fr`, `ko`, `zh`）でキー構造が完全一致していること。
   - プレースホルダー（`{n}`, `{name}`, `{date}`, `{size}` など）が全言語間で一致していること。
   - コンポーネント JSX 内にハードコードされた英語・日本語文字列が存在しないこと。
2. **アクセシビリティ (a11y)**:
   - モーダル・ダイアログのフォーカストラップおよび `aria-label`, `role="dialog"` の遵守。
   - アイコンのみのボタンにアクセシブルネーム（`aria-label` / `title`）が付与されていること。
3. **テスト実行時の React 19 `act(...)` 警告**:
   - テスト実行時の stderr に React の `act(...)` 警告が出力されていないこと（非同期ステート更新の待機漏れがないか確認）。

---

### ステップ 5: GitHub Issue の起票
監査で発見された具体的な問題点・改善点は、GitHub Issue として発行します。

- **タイトル規則**: `<type>(<scope>): <概要>`
  - 例: `fix(sync): syncService のアイテムサイズ判定における UTF-8 バイト数不整合の修正`
  - 例: `security(share): shareService における入力長制限および Decompression Bomb 防御`
  - 例: `test(coverage): worldClock の単体テスト拡充`
- **本文構成**:
  - `## 概要`
  - `## 問題の箇所`（対象ファイルと該当行コード）
  - `## 原因 / 懸念点`（発生条件、具体的な不具合事象）
  - `## 改善案`（推奨される修正ロジック）
- **起票コマンドの注意点（Windows / PowerShell 環境）**:
  PowerShell での文字列エスケープ事故（`\u` などによる解析エラー）を防止するため、一時ファイル（`scratch/issue_body.md` 等）に Markdown を書き出した上で `--body-file` オプションを用いて発行する。
  ```bash
  gh issue create --title "<タイトル>" --label "<ラベル>" --body-file "<本文ファイルパス>"
  ```
