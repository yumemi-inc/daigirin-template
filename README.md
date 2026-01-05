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

- [book/manuscripts](book/manuscripts) ディレクトリの中に、拡張子 `.md` の Markdown ファイルを作成します。
- [book/vivliostyle.config.js](book/vivliostyle.config.js) ファイル内の `entry` 配列に、その Markdown ファイル名を追加します。

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

### 実行

- `yarn start` : pdf を生成して開く（`make run` 相当）
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
