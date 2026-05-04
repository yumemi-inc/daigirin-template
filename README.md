# daigirin-template

技術同人誌のテンプレートリポジトリです。新しい同人誌を作成するときは、このリポジトリを利用してください。

## PDF の生成方法

```shell
make run
```

🔖 [グローバル環境を可能な限り汚染せずに Markdown から組版の PDF を生成（ゆめみ大技林 '23）](https://zenn.dev/yumemi_inc/articles/afe7745cd62af2)

### 電子版 PDF に表紙画像を追加する

表紙画像をプロジェクト内の `book/cover/cover.png` に保存している場合は、電子版 PDF と表紙画像の結合をコマンドで実行できます。次のコマンドで、表紙画像を結合した PDF `output/ebook_covered.pdf` を生成します。なお、電子版 PDF は事前に生成しておいてください。

```shell
make cover
```

結合後の PDF に質の問題がある場合や、表紙画像がリポジトリ管理できない場合は、手動で結合（Acrobat Pro で PDF に画像を挿入するなど）してください。

### リリース

次のコマンドで印刷入稿用 PDF が作成されます。

```shell
make pdf_press
```

もしくは、GitHub でタグに「n 版」または「n 版 m 刷」（たとえば、`初版`、`初版2刷` や `第二版一刷` など）を付けてプッシュすると、電子版および印刷入稿用 PDF を添付したリリースが作成されます。`cover` ディレクトリに表紙画像や PSD ファイルがある場合は、それらもアセットに追加します。

## 書籍の設定

書籍のタイトルの設定などは、[book/vivliostyle.config.js](book/vivliostyle.config.js) ファイルで行います。

またテンプレートの都合上、年号等が最新に設定できないため、`<!-- -->` でコメントアウトしています。必要に応じて修正してコメントアウトを外してください。

## 原稿の追加方法

原稿ファイルは [book/manuscripts](book/manuscripts) ディレクトリ以下に配置します。ディレクトリ構成は次のとおりです。

```text
book/manuscripts/
├── articles/          # 記事ファイルを配置するディレクトリ
│   ├── your_chapter.md
│   └── images_your_chapter/
├── config/
│   ├── articles.yml   # 記事の順番を制御するファイル（オプション）
│   ├── entry.yml      # 本全体の構成順と目次表示を制御する設定（オプション）
│   └── generate.yml   # 自動生成の設定（オプション）
├── generated/         # 自動生成されるファイル
│   ├── index.md
│   ├── authors.md
│   └── colophon.md
├── edited/            # 自動生成ファイルを手動編集するためのコピー先
│   ├── index.md
│   ├── authors.md
│   └── colophon.md
└── pages/             # はじめに・あとがきなど記事以外のページ
    ├── preface.md     # はじめに
```

### 記事の追加

1. [book/manuscripts/articles](book/manuscripts/articles) ディレクトリ内に、拡張子 `.md` の Markdown ファイルを作成します。
2. PDF ビルド時に `articles/` ディレクトリ内の Markdown ファイルが自動的に検出されます。[book/vivliostyle.config.js](book/vivliostyle.config.js) を手動で編集する必要はありません。

### front matter

各記事ファイルの先頭に次の front matter を記述してください。

```yaml
---
class: content
title: 記事のタイトル
author: 著者名
profile: 著者の自己紹介文
---
```

`profile` は YAML ブロックスカラー `|` で複数行で記述できます。

```yaml
profile: |
  1 行目の自己紹介文です。
  2 行目の自己紹介文です。
```

### 記事の順番の制御

- **`config/articles.yml` が存在する場合**: そのファイルに記載されたファイル名の順番で記事が設定されます。
- **`config/articles.yml` を削除した場合**: `articles/` ディレクトリ内のファイルがアルファベット順で自動設定されます。

`config/articles.yml` の記述例：

```yml
# 記事の順番を制御するファイル（オプション）
# このファイルを削除すると、articles ディレクトリ内のファイルがアルファベット順で自動設定されます。
# 記事ファイルのファイル名のみを記載してください（パスは不要）。
- your_chapter.md
- another_chapter.md
```

## 自動生成ファイル

次のファイルが自動生成対象です。

- **`book/manuscripts/generated/index.md`**（目次）: 各記事の `title` を一覧化します。
- **`book/manuscripts/generated/authors.md`**（著者紹介）: 各記事の `author` と `profile` を集約します。
- **`book/manuscripts/generated/colophon.md`**（奥付）: 書籍設定と `generate.yml` から生成します。

`yarn build` / `yarn build:press` 実行時は、自動生成ファイルを毎回再生成します。

自動生成ファイルだけを更新したい場合は、次のコマンドを実行します。

```shell
yarn generate
```

自動生成したファイルを手動編集したい場合は、次のコマンドで `generated/` から `edited/` へコピーします。

```shell
yarn edit
```

`edited/index.md` などが存在する場合、PDF ビルド時は `generated/` より `edited/` が優先されるため、再生成とのコンフリクトを避けられます。

### entry.yml の構成設定

本の構成順（`vivliostyle.config.js` の `entry`）は [book/manuscripts/config/entry.yml](book/manuscripts/config/entry.yml) で定義します。

`type` には次の固定値を使います。

- `generated`: 自動生成ファイル（`id: index | authors | colophon`）
- `page`: 任意ページ（`title` と `file` が必要）
- `articles`: 記事一覧（`articles.yml` または `articles/` の自動検出）

`toc` フィールドで「目次ページ（generated/index.md）に表示する・しない」を制御できます。

```yaml
- type: generated
  id: index
  toc: false

- type: page
  title: はじめに
  file: pages/preface.md
  toc: true

- type: articles
  toc: true

- type: generated
  id: authors
  toc: false

- type: generated
  id: colophon
  toc: false
```

### 著者紹介のテンプレート設定

[book/manuscripts/config/generate.yml](book/manuscripts/config/generate.yml) で、著者紹介の出力フォーマットを変更できます。

- `{author}`: 著者名
- `{title}`: 記事タイトル（同じ著者が複数執筆している場合は読点区切り）
- `{profile}`: プロフィール文

```yaml
profile_template: |
  ### {author}（{title}）

  {profile}
```

### 目次の記事表示テンプレート

[book/manuscripts/config/generate.yml](book/manuscripts/config/generate.yml) の `articles_toc` で、目次ページにおける記事の表示文字列を変更できます。

- `{title}`: 記事タイトル
- `{author}`: 著者名
- `{file}`: 拡張子なしファイル名

`title` は front matter に無い場合、記事内の最初の H1 を使い、それも無ければファイル名を使います。

```yaml
articles_toc: |
  {title}({author})
```

### 編集作業

自動生成された記事の偶数ページの調整などは、`yarn edit` で生成した `edited/` 配下のファイルに対して行ってください。この作業は、編集者向けで、執筆者は不要です。

## 文章校正

校正ツール [textlint](https://textlint.github.io/) を利用して、文章校正ができます。なお、この lint ツールの使用は任意です。書き方で悩んだ・校正したい場合など、必要に応じて導入してください。

### ルール

次のルールを導入しています。

- preset-ja-spacing
  - 日本語周りにおけるスペースの有無を決定する
- preset-ja-technical-writing
  - 技術文書向けの textlint ルールプリセット
- textlint-rule-spellcheck-tech-word
  - WEB+DB 用語統一ルールベースの単語チェック
  - （deprecated になっているので置き換えたい）
- Rules for TechBooster
  - TechBooster の [ルール](https://github.com/TechBooster/ReVIEW-Template/tree/master/prh-rules) を使用しています。
  - iOS に関するルールはほとんどないので適宜追加してください。

その他、スペルチェックのルール `textlint-rule-spellchecker` がありますが、エディターのスペルチェックと競合しやすいので、今回は追加していません。VS Code を利用している場合は、プラグイン [Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker) を追加すれば、スペルチェックが行われます。

### ローカル環境で実行する

```shell
make lint
```

### VS Code + Node.js で実行する

ローカルに Node.js 環境がある場合は、VS Code のプラグイン `taichi.vscode-textlint` を導入することで、ファイル保存時に textlint が実行されます。

### VS Code + Docker で実行する

VS Code にプラグイン [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) を追加します。コマンドパレット（ショートカットキー Command + Shift + P）を開いて、`Remote-Containers: Reopen in Container` を実行します。コンテナーが立ち上がったら、執筆を始めてください。ファイル保存時に textlint が自動実行されます。ただし、Docker を利用する場合は、ライセンスに注意して利用してください。

### 無効

あるファイルを textlint の対象から外したい場合は `.textlintignore` にそのファイルを追加してください。また、ファイル内の特定の文章に対してルールを無効にしたい場合は、次のように記述してください。

```text
<!-- textlint-disable -->

textlint を無効にしたい文章をここに書く

<!-- textlint-enable -->
```

## ローカル環境の Node.js でビルドする

ローカル環境に Node.js がインストールされている場合は、Docker を使わずにビルドできます。

### 準備

次のコマンドで、ビルドに必要なツールをローカル環境にインストールします。

```shell
yarn install
```

プレス版の PDF をビルドするには、Ghostscript および Xpdf も必要になります。次のコマンドでインストールします。

```shell
brew install ghostscript
brew install xpdf
```

Yarn を利用する場合は corepack を有効にしてください。

```shell
corepack enable
または
corepack enable yarn
```

Node.js 24 以降では、scripts 配下の TypeScript ファイルも Node の組み込み TypeScript 実行でそのまま扱えます。追加のトランスパイラや `ts-node` は不要です。

### 実行

- `yarn start` : pdf を生成して開く（`make run` 相当）
- `yarn generate` : 原稿ファイルを自動生成
- `yarn edit` : 自動生成ファイルを `edited/` にコピー（手動編集用）
- `yarn lint` : textlint を実行（`make lint` 相当）
- `yarn build` : pdf を生成（`make pdf` 相当）
- `yarn build:press` : プレス版の pdf を生成（`make pdf_press` 相当）
- `yarn cover` : 電子版 pdf と表紙画像を結合する（`make cover` 相当）
- `yarn open` : pdf を開く（`make open` 相当）
- `yarn clean` : 生成ファイルをすべて削除（`make clean` 相当）

## セキュリティ対策

ローカルおよび CI で、[@aikidosec/safe-chain](https://github.com/AikidoSec/safe-chain) を利用して、npm パッケージの安全性を確認できます。

### ローカル環境

[@aikidosec/safe-chain](https://github.com/AikidoSec/safe-chain) の README にしたがって、ローカル環境にインストールしてください。なお、Docker を利用される場合は、安全確認したパッケージがインストールされるので原則的に対応不要です。

### CI

package.json の変更を含む PR が作成されたら、GitHub Actions でパッケージが確認されます。なお、Actions で利用する`@aikidosec/safe-chain` はバージョン固定しています。`@aikidosec/safe-chain` が更新されたら、それ自身の安全性を確認した後に、次のファイルを更新してください。

- `.github/workflows/aikidosec-safe-chain.yml`
  - `name: Install safe-chain` の `export SAFE_CHAIN_VERSION=1.3.2` で指定するバージョンを更新する

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

### 注意事項

- このリポジトリの MIT ライセンスには、ゆめみの紹介文は含まれません。
