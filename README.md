# daigirin-template

技術同人誌のテンプレートリポジトリです。新しい同人誌を作成するときは、このリポジトリを利用してください。

## PDFの生成方法

```shell
make run
```

🔖 [グローバル環境を可能な限り汚染せずにMarkdownから組版のPDFを生成（ゆめみ大技林 '23）](https://zenn.dev/yumemi_inc/articles/afe7745cd62af2)

### リリース

次のコマンドで印刷入稿用 PDF が作成されます。

```shell
make pdf_press
```

もしくは、GitHub でタグに「n版」または「n版m刷」（たとえば、`初版`、`初版2刷` や `第二版一刷` など）を付けてプッシュすると、電子版および印刷入稿用 PDF を添付したリリースが作成されます。なお、ここで作成される電子版 PDF には表紙画像はありません。その他のファイル追加など、適宜リリースの Assets を編集してください。

## 書籍の設定

書籍のタイトルの設定などは、[book/vivliostyle.config/index.js](book/vivliostyle.config/index.js) ファイルで行います。

またテンプレートの都合上、年号等が最新に設定できないため、`<!-- -->` でコメントアウトしています。必要に応じて修正してコメントアウトを外してください。

## 原稿の追加方法

* [book/manuscripts](book/manuscripts) ディレクトリの中に、拡張子 `.md` のMarkdownファイルを作成します。
* [book/vivliostyle.config/index.js](book/vivliostyle.config/index.js) ファイル内の `entry` 配列に、そのMarkdownファイル名を追加します。

## 文章校正

校正ツール [textlint](https://textlint.github.io/) を利用して、文章校正ができます。なお、この lint ツールの使用は任意です。書き方で悩んだ・校正したい場合など、必要に応じて導入してください。

### ルール

次のルールを導入しています。

* preset-ja-spacing
  * 日本語周りにおけるスペースの有無を決定する
* preset-ja-technical-writing
  * 技術文書向けの textlint ルールプリセット
* textlint-rule-spellcheck-tech-word
  * WEB+DB 用語統一ルールベースの単語チェック
  * （deprecated になっているので置き換えたい）
* Rules for TechBooster
  * TechBooster の [ルール](https://github.com/TechBooster/ReVIEW-Template/tree/master/prh-rules) を使用しています。
  * iOS に関するルールはほとんどないので適宜追加してください。

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
npm install
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

### 実行

- `npm run start` : pdfを生成して開く（`make run` 相当）
- `npm run lint` : textlintを実行（`make lint` 相当）
- `npm run build` : pdfを生成（`make pdf` 相当）
- `npm run build:press` : プレス版のpdfを生成（`make pdf_press` 相当）
- `npm run open` : pdfを開く（`make open` 相当）
- `npm run clean` : 生成ファイルをすべて削除（`make clean` 相当）

## 試験的機能

### 表紙画像を本文 PDF に挿入する（ローカルのみ）

次のコマンドで、表紙画像を本文 PDF `book/output/ebook.pdf` に挿入します。ただし、表紙画像は `book/cover/cover.png` に限ります。表紙画像を挿入した PDF は `book/output/ebook_covered.pdf` に保存されます。

```shell
yarn cover
```
