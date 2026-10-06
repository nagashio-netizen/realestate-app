# CLAUDE.md

このファイルは、Claude Code がこのリポジトリで作業する際のガイドラインです。

## プロジェクト概要

不動産管理Webアプリ（realestate-app）。Supabase 認証（メールアドレス＋パスワード）で会員登録・ログインし、ログイン後に物件一覧を表示する。

- `/login`・`/signup` … ログイン・会員登録画面（ログイン済みなら `/properties` へリダイレクト）
- `/properties` … 物件一覧（未ログインなら `/login` へリダイレクト）。物件はダミーデータ（`src/data/properties.js`）
- その他のパスは `/properties` へリダイレクト

## 技術スタック

- React + Vite、ルーティングは react-router-dom
- 認証: Supabase（`@supabase/supabase-js`）
- Supabase の接続情報は `.env`（`VITE_SUPABASE_URL`・`VITE_SUPABASE_PUBLISHABLE_KEY`）で管理する。`.env` はコミットせず、雛形は `.env.example`
- ブラウザに公開してよいのは Publishable key だけ。Secret key（service_role）はフロントエンドに置かない

## 構成

- `src/lib/supabaseClient.js` … Supabase クライアントの生成
- `src/contexts/AuthContext.jsx` … ログイン状態の共有（`useAuth()` で session・signUp・signIn・signOut を取得）
- `src/components/ProtectedRoute.jsx` … `ProtectedRoute`（要ログイン）と `GuestRoute`（未ログイン専用）
- `src/pages/` … 各画面（Login・Signup・Properties）

## コマンド

- `npm install` … 依存関係のインストール
- `npm run dev` … 開発サーバー起動（http://localhost:5173）
- `npm run build` … 本番ビルド（`dist/` に出力）
- `npm run preview` … ビルド結果をローカルで確認

テストは未導入。

## 開発方針

- 応答・コードコメント・コミットメッセージは日本語で記述する
- 既存コードの命名規則・書き方に合わせる
- 金額は浮動小数点ではなく整数（円単位）で扱い、丸め誤差を防ぐ
- 日付は ISO 8601 形式（`YYYY-MM-DD`）で保存する
- 物件の所有者・顧客などの実在の個人情報をリポジトリにコミットしない。サンプルデータはダミー値を使う

## Git 運用ルール

### 基本ルール

- **コードを変更するたびに、コミットして GitHub にプッシュすること。**
  - 1つの作業（機能追加・バグ修正・リファクタリングなど）が完了したら、その都度 `git add` → `git commit` → `git push` まで行う
  - 変更をローカルに溜め込まない
- プッシュ前に `git status` で差分を確認し、意図しないファイル（秘密情報・認証情報など）が含まれていないか確認する
- プッシュ前に、動作確認やテストが通ることを確認する（テストがある場合）
- プッシュに失敗した場合（リモートとの競合など）は、`git pull --rebase` で取り込んでから再度プッシュする
- 強制プッシュ（`git push --force` など）や `git reset --hard` など、履歴やリモートの内容を壊す操作は、ユーザーの明示的な許可なく行わない
- リモートは `https://github.com/nagashio-netizen/realestate-app.git`、ブランチは `main` を使用する

### コミットメッセージ

- 日本語で、変更内容が一目でわかるように書く
- 先頭にプレフィックスを付ける

| プレフィックス | 用途 |
| --- | --- |
| `feat:` | 新機能の追加 |
| `fix:` | バグ修正 |
| `refactor:` | 動作を変えないコード整理 |
| `style:` | 見た目・フォーマットの変更 |
| `docs:` | ドキュメントの変更 |
| `test:` | テストの追加・修正 |
| `chore:` | 設定・依存関係などの雑務 |

例: `feat: 物件一覧の検索機能を追加`

### コミットしてはいけないもの

- `.env` などの認証情報・APIキー
- `node_modules/` などの依存パッケージ
- ビルド成果物
- 実在の顧客・物件所有者の個人情報

これらは `.gitignore` に登録しておくこと。
