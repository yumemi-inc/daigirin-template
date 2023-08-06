# daigirin-template

技術同人誌のテンプレートリポジトリです。新しい同人誌を作成するときは、このリポジトリを利用してください。

## PDFの生成方法

### npm を使った方法 (推奨)

```shell
npm ci && npm start
```

### Docker を無理やり使った方法 (非推奨)

```shell
docker compose up -d
./npm ci && ./npm start
```

## 書籍の設定

書籍のタイトルの設定などは、[book/vivliostyle.config.js](vivliostyle.config.js) ファイルで行います。

またテンプレートの都合上、年号等が最新に設定できないため、`<!-- -->` でコメントアウトしています。必要に応じて修正してコメントアウトを外してください。

## 原稿の追加方法

* [book/manuscripts](book/manuscripts) ディレクトリの中に、拡張子 `.md` のMarkdownファイルを作成します。
* [book/vivliostyle.config.js](vivliostyle.config.js) ファイル内の `entry` 配列に、そのMarkdownファイル名を追加します。

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

- `npm run lint`

### VS Code + Docker で実行する

VS Code にプラグイン [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) を追加します。コマンドパレット（ショートカットキー Command + Shift + P）を開いて、`Remote-Containers: Reopen in Container` を実行します。コンテナーが立ち上がったら、執筆を始めてください。ファイル保存時に textlint が自動実行されます。


### 無効

あるファイルを textlint の対象から外したい場合は `.textlintignore` にそのファイルを追加してください。また、ファイル内の特定の文章に対してルールを無効にしたい場合は、次のように記述してください。

```text
<!-- textlint-disable -->

textlint を無効にしたい文章をここに書く

<!-- textlint-enable -->
```
