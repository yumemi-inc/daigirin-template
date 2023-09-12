# Vivliostyleの公式テーマをカスタマイズして、ゆめみ大技林 '22のテーマを作った

## はじめに
技術書典13にて、株式会社ゆめみのiOSギルドの有志で「ゆめみ大技林 '22」という技術同人誌を制作し、頒布しました。

https://techbookfest.org/product/9g7iLPz8dzmL2QrrbedbxG?productVariantID=gfsBNShXyWyxHiubY2f1m7

私は編集者としてこの本の制作に携わり、主に本としての体裁を整える作業を行いました。
その中で執筆陣からVivliostyleのテーマを自分たちなりにいい感じにカスタマイズしたいという要望を受けました。
この記事は初めてVivliostyleを触った私が、テーマをカスタマイズする際になにをやったかを紹介します。

## 制作環境

| ツール | バージョン | 備考 |
| --- | ---| ---|
| Vivliostyle Cli | 5.5.0 | VivliostyleのCLI |
| Vivliostyle Core | 2.17.0 | VivliostyleのCoreライブラリ |
| Volta | 1.0.8 | Node.jsの管理ツール |
| Node.js | 16.16.0 | Voltaで管理 |
| Yarn | 1.22.19 | Voltaで管理 |

## 著者スペック

- HTML/CSSは詳しくない
- 本の制作は詳しい
    - 元DTP業界で本のデータを作っていた

## カスタマイズした内容の紹介
### 公式のテーマを複製してカスタマイズする

#### テーマとは

テーマとは、本のサイズ、縦書き/横書きなどの本の大枠な要素から、フォントサイズ、フォントの色、見出し前後のアキなど本の詳細なレイアウトの要素までを定義した仕様書のようなものです。
Vivliostyleには公式テーマがいくつか用意されています。
以下は[themeのリポジトリ](https://github.com/vivliostyle/themes)から抜粋した、テーマの一覧です。

- Techbook
- Bunko
- Slide
- Academic
- Gutenberg

これらのテーマを用いることで簡単にいい感じのレイアウトで本が作れます。
また、テーマはCSSで書かれているので、自分でCSS（SCSS）を書き換えてカスタマイズしたテーマを利用することもできます。
今回は公式テーマであるTechbookを複製してカスタマイズしましたが、自分でゼロからテーマを作成することもできるので、興味のある方は以下の記事を参照ください。

https://vivliostyle.github.io/vivliostyle_doc/ja/vivliostyle-user-group-vol5/content/yamasy/index.html

#### テーマを複製し、読み込めるようにする

公式テーマをまるごと複製して、自作のテーマとして読み込めるようにします。

1. `./node_modules/@vivliostyle/theme-techbook` をリポジトリ内の適当なところに複製します
    - たとえば `theme-techbook`を`my_theme`にリネームして `./theme` ディレクトリに格納します
2.  `./vivliostyle.config.js` のthemeに1のテーマを設定します
    - `theme: 'theme/my_theme'` と書き換えます

手順は [公式チュートリアル](https://vivliostyle.org/ja/tutorials/customize/#%E6%97%A2%E5%AD%98%E3%83%86%E3%83%BC%E3%83%9E%E3%81%AE%E3%82%AB%E3%82%B9%E3%82%BF%E3%83%9E%E3%82%A4%E3%82%BA) を参考にしました。

#### 複製したテーマをカスタマイズする

カスタマイズの手順は以下です。

1. SCSSを書き換えます
2. CSSにコンパイルします
3. VivliostyleのViewerか、PDFを生成して確認します

書き換えるたびに上記手順を繰り返すのは効率が悪いので、`yarn dev` コマンドを利用しましょう。
以下に手順を紹介します。

1. `my_theme`ディレクトリに移動します
2. `volta install yarn` を実行してyarnコマンドを使えるようにします
3. `yarn dev` を実行するとプレビューが表示されます
    - `theme/my_theme/vivliostyle.config.js` で設定した内容を元にプレビューが表示されます
    - 表示される原稿の初期値は `my_theme/example/techbook.md`
4.  SCSSを編集して保存するとCSSがコンパイルされて、プレビューが自動更新されます

:::message
テーマの最終成果物は以下の3ファイルですが、このファイルを直接編集してもSCSSをコンパイルすると上書きされてしまうので、注意が必要です。
  
  
| ファイル名 | 説明 |
|---|---|
| theme_common.css | Themeの共通部分 |
| theme_print.css | 出版物 (PDFなど) 印刷用 |
| theme_screen.css | 出版物 (HTMLなど) 閲覧用 |
:::


次の節からは具体的なカスタマイズについて紹介します。

### 判型（本のサイズ）を変える

公式テーマのtech-bookを使用した場合、判型はB5サイズになっています。
ゆめみ大技林では判型をA5にすることにしたので、テーマのどこを書き換えればいいのかを調査し、カスタマイズしました。

#### 判型を変えるときに気にする要素

DTPをやっていた頃はざっくり以下の要素を気にしていました（本当はもっとあるけどケースバイケースなので割愛）。

- 判型
    - いわずもがな
- 天地小口のどのマージン
    - 上下左右のマージンのことです
    - のどは綴じたときに読めなくなる可能性があるので、ページ数によって調整が必要です
- 本文の文字の大きさ
    - 判型が変わると当然描画領域が変わるので、本文の量や視認性を考慮して文字の大きさを変える必要があります
- 図版の大きさ
    - これはケースバイケースですが、文字の大きさ同様に視認性と1ページに収めたい文章量に応じて調整します

#### 判型やサイズに関する定義はどこでされているのか

実際にSCSSのどこで定義されているのかを調査しました。

判型はscssディレクトリ内の `_variables.scss` に定義されていました。コメントは著者補足です。
    
```scss:_variables.scss
// B5
$page-width: 182mm; // 幅
$page-height: 257mm; // 高さ
$page-bleed: 3mm; // 塗り足し（ドブ）。写真や図版などを紙面ギリギリに配置したレイアウトで断裁時に白がでないようにするための余白
```
    
天地小口のどの指定は `_variables.scss` に定義されていました。コメントは著者補足です。
    
```scss:_variables.scss
// Page
$page-margin-top: 25mm; // 天
$page-margin-bottom: 39mm; // 地
$page-margin-outer: 18mm; // 小口（本の綴じていないほうのマージン）
$page-margin-inner: 35mm; // のど（本の綴じているほうのマージン）
```
    
印刷物の文字サイズは `_variables.scss` に定義されていましたが、呼び出している箇所はありませんでした。
    
```scss:_variables.scss
$master-font-size-for-print: 75%;
```
    
見出し関連の文字サイズは `_media.scss` に定義されていました。
    
```scss:_media.scss
h1 {
    font-size: 2.4rem;
    line-height: 1.2;
}

h2 {
    font-size: 1.8rem;
    line-height: 1.2;
}

h3 {
    font-size: 1.4rem;
    line-height: 1.2;
}
```
    
柱とノンブルの位置は `_media.scss` に定義されていました。
    
```scss:_media.scss
@page :left {
    font-family: $font-family;
    margin-left: $page-margin-outer;
    margin-right: $page-margin-inner;

    @top-center {
    content: env(pub-title);
    font-size: $master-font-size-for-print;
    text-align: left;
    padding: 12mm 2mm 0 2mm;
    }
    @bottom-left {
    content: counter(page);
    margin-top: 15mm;
    margin-bottom: -$page-bleed;
    padding: 0 2mm 15mm 2mm;
    }
}

@page :right {
    font-family: $font-family;
    margin-left: $page-margin-inner;
    margin-right: $page-margin-outer;

    @top-center {
    content: env(doc-title);
    font-size: $master-font-size-for-print;
    text-align: right;
    padding: 12mm 2mm 0 2mm;
    }
    @bottom-right {
    content: counter(page);
    margin-top: 15mm;
    margin-bottom: -$page-bleed;
    padding: 0 2mm 15mm 2mm;
    }
}
```
    

#### もろもろのサイズをA5サイズにあわせて調整する

調査した箇所をA5サイズでちょうどよい（当社比）感じに見えるように調整を行いました。
調整したところは以下のような内容で、順に説明していきます。

- 判型を変更する
- 本文の文字サイズを変更する
- 天地小口のどの指定を変更する
- 見出し関連の文字サイズを変更する
- ノンブル、柱関連の設定を変更する

最初にPreviewを立ち上げ、SCSSの編集した結果を確認しながら調整する準備をしました。
    
```bash
$ cd book/theme
$ yarn dev ## previewが立ち上がる
```
    
また、今後Previewを見るまでもない調整を行ったときのために、SCSSをコンパイルするscriptも定義しました。
    
```json:package.json
"build-theme": "sass theme/scss:theme"
```
        
まず、判型をA5サイズに変更しました。
    
```scss:_variables.scss
// A5
$page-width: 148mm; // 幅
$page-height: 210mm; // 高さ
$page-bleed: 3mm; // 塗り足し（ドブ）。写真や図版などを紙面ギリギリに配置したレイアウトで断裁時に白がでないようにするための余白
```
    
続いて、本文の文字サイズがちょっと大きいという指摘があったため、本文の文字サイズ用の変数の値を11pxに変更して、各要素に適用しました。
    
```scss:_variables.scss
$master-font-size-for-print: 11px;
```
    
上記で修正した変数を本文、コード、ノンブルの文字サイズとして適用しました。
        
```scss:_media.scss
@media print {
    :root {
    widows: 3;
    orphans: 3;
    hyphens: auto;
    font-size: $master-font-size-for-print; // 本文サイズ
}

.token {
    font-size: 10px; // コードブロックのサイズ。本文より若干小さくした
}

@top-center {
    content: env(pub-title);
    font-size: $master-font-size-for-print; // 柱
    text-align: left;
    padding: 12mm 0mm 0 0mm;
}
```

```scss:_counter.scss
&::footnote-call {
    font-size: $master-font-size-for-print;
    margin: 0 0.3rem;
}
```
        
続いて、天地小口のどの指定を変えました。
    
```scss:_variables.scss
// Page
$page-margin-top: 20mm; // 天
$page-margin-bottom: 25mm; // 地
$page-margin-outer: 16mm; // 小口（本の綴じていないほうのマージン）
$page-margin-inner: 18mm; // のど（本の綴じているほうのマージン）
```
    
続いて、見出し関連の文字サイズがちょっと大きく見えたので、0.2em程度小さくしました。
    
```scss:_media.scss
h1 {
    font-size: 2.2rem;
    line-height: 1.2;
}

h2 {
    font-size: 1.6rem;
    line-height: 1.2;
}

h3 {
    font-size: 1.3rem;
    line-height: 1.2;
}
```
    
最後に、ノンブルが次ページに送られたり、柱の天のマージンが狭かったりしたので、位置を調整しました。
今回のカスタマイズの中で一番難しかったです。
CSSの知識が深ければすぐに解決できたかもしれません。
    
```scss:_media.scss
@page :left {
    font-family: $font-family;
    margin-left: $page-margin-outer;
    margin-right: $page-margin-inner;

    @top-center {
    content: env(pub-title);
    font-size: $master-font-size-for-print;
    text-align: left;
    padding: 12mm 0mm 0 0mm;
    }
    @bottom-left {
    content: counter(page);
    margin-top: 7mm;
    margin-bottom: -$page-bleed;
    padding: 0 0mm 15mm 0mm;
    }
}

@page :right {
    font-family: $font-family;
    margin-left: $page-margin-inner;
    margin-right: $page-margin-outer;

    @top-center {
    content: env(doc-title);
    font-size: $master-font-size-for-print;
    text-align: right;
    padding: 12mm 0mm 0 0mm;
    }
    @bottom-right {
    content: counter(page);
    margin-top: 7mm;
    margin-bottom: -$page-bleed;
    padding: 0 0mm 15mm 0mm;
    }
}
```
    

### コードブロックを折返しする

コードブロックで折返しがされずに行末が途切れてしまうという問題があり、テーマである程度抑制するようにしました。
ただし、機械的に折返しが行われるため、URLがうまく改行されない、または読みづらいなどの問題があり、原稿FIX後に著者と編集者による温かみのある手作業で改行を挿入しました。

[pre要素で折り返し改行させる方法](https://lab.syncer.jp/Web/CSS/Snippet/11/) を参考にして、CSSで折り返しを有効にしました
    
```scss:_lib-prism-okaidia.scss
white-space: pre-wrap;
```
    

### 1C印刷用に色を切り替えられるようにする

ゆめみ大技林は表紙は4C刷りですが、本文は1C（白黒）刷りのため、印刷用PDF生成時にカラーの部分を1Cに切り替える必要がありました。
今回は変数を用いて切り替えるようにしました。
公式テーマの色はほとんど `_variables.scss` に定義された変数を用いていたのですが、一部変数を使わず要素の中で直接色指定をしている箇所があり、次回以降はそこも変数にしたいと思っています。

最初に、`_variables.scss` に印刷モードを表現する変数を追加しました。
    
```scss:_variables.scss
// 印刷用の設定か
// - true: 印刷用
// - false: 電子書籍用
$print-mode: true;
```
    
次に、 `_variables.scss` のカラー定義に関する変数に対して、if関数を用いて `$print-mode` の値によって1C用の色、4C用の色を代入できるようにしました（以下は一例）。
if関数便利ですね。
    
```scss:_variables.scss
$color_black: if($print_mode, #000000, #34495e);
$color_black_dark: if($print_mode, #000000, #2c3e50);
$color_gray: if($print_mode, #959595, #95a5a6);
$color_gray_dark: if($print_mode, #7f7f7f, #7f8c8d);
```
    
最後に、要素の中で直接色指定をしている箇所を以下のように修正しました。
    
```scss
:not(pre) > code[class*='language-'],
pre[class*='language-'] {
    background: if($print-mode, #CCCCCC, #272822);
}
```

### Markdownの切り替わりで必ず奇数ページから始まるようにする

Markdownが切り替わったら必ず奇数ページから章が始まるようにすると、章が変わったことがわかりやすく読みやすくなると思い、 [公式チュートリアル](https://vivliostyle.org/ja/tutorials/configure-page-text/#%E3%83%9A%E3%83%BC%E3%82%B8%E3%81%AE%E5%A7%8B%E3%81%BE%E3%82%8B%E5%81%B4) を参考にして、テーマを修正しました。
    
```scss:_base.scss
body {
    break-before: recto;
}
```

:::message
注意点として、この定義を追加すると ファイルごとに奇数ページ始まりにするVivliostyleの設定により自動生成されたページに、ノンブルが表示されないという問題が発生します。
詳細は[解決できなかったこと](#解決できなかったこと)に記載しました。
:::

### 奥付のレイアウトを一般的な書籍っぽくする

奥付を追加しただけではページの左上に表示されて奥付感がないと思ったので、それっぽいレイアウトに変えました。
奥付の作成方法は [公式チュートリアル](https://docs.vivliostyle.org/#/ja/create-book#%E5%A5%A5%E4%BB%98%E3%81%AE%E8%BF%BD%E5%8A%A0) を参考にしました。
レイアウトは [Vivliostyle で本を作ろう Vol.5](https://vivliostyle.org/ja/samples/#:~:text=Vivliostyle%20%E3%81%A7%E6%9C%AC%E3%82%92%E4%BD%9C%E3%82%8D%E3%81%86%20Vol.5) を参考にしました。

最初に、奥付用のMarkdownを作成しました（書籍名などはダミー）。
    
```markdown:colophon.md
<section id="colophon" role="doc-colophon">

### レノくんファンに贈る本

2022年10月1日 初版

---

* 発行 レノくんの父ちゃん
* 印刷 虎次郎印刷

---

© 2022 レノくんファン製作委員会

</section>
```
    
次に、`_theme_common.scss` に以下を追加しました。
    
```scss:_theme_common.scss
section#colophon {
    position: relative;
    float-reference: page;
    float: bottom;
    margin-bottom: 0;
}
```

これで以下のようなレイアウトが実現できました。
    
![奥付のレイアウト見本](https://storage.googleapis.com/zenn-user-upload/d6464906fe3c-20220914.png)


### 改ページ用のCSSを定義する

読みやすさのために任意の箇所で改ページしたいという要望があったので、以下のような定義を追加しました。
[Vivliostyle: 技術同人誌をつくって入稿用PDFをビルドする（後編）](https://zenn.dev/sky_y/articles/markdown-advent-2020-vivliostyle4#%E3%83%86%E3%83%BC%E3%83%9E%E3%82%92%E3%82%B3%E3%83%94%E3%83%BC%E3%81%97%E3%81%A6css%E3%82%92%E8%BF%BD%E8%A8%98%E3%81%99%E3%82%8B) で紹介されていたCSSを参考にしました。
        
```scss:_base.scss
hr.page-break {
    break-before: page;
    visibility: hidden;
    margin: 0px;
    padding: 0px;
    height: 1px;
}
```

Markdownに次のような記述をすると、改ページできるようになりました。
HTMLタグの上下の空行も必要です。

```markdown

<hr class="page-break" />

```

:::message
注意点として、改ページするCSSを用いると改ページした先のページの先頭に空行が挿入され、隣のページとページの先頭があわなくなるという問題が発生します。
詳細は[解決できなかったこと](#解決できなかったこと)に記載しました。
:::

### 章タイトルに飾りをいれる

章タイトルまわりが殺風景だったので、昔DTPで制作していた冊子のように簡単な飾りをいれることにしました。
ここでいう章タイトルとは各Markdownの中にある `## 1つ` で装飾された見出しを指します（HTML変換時に `h1` タグになります）。

1. 各Markdownの先頭以外で `## 1つ` を使わないように修正します
    - そうしないと章タイトルが本文中に表示される変な本になってしまいます
2. 飾りを入れたいMarkdownの先頭にClassを定義します
    
    ```markdown
    ---
    class: content
    ---
    ```
    
    - この定義によって、`body.content` というCSS指定ができます
    - すべてのページの章タイトルに飾りがついてしまうので、まえがきや奥付に飾りがつくことを防ぐことが目的です
3. Markdown先頭の章タイトルを以下のように修正する
    
    ```markdown
    <div class="doc-header">
      <h1>章タイトル</h1>
      <div class="doc-author">著者名</div>
    </div>
    
    ## 章タイトル
    ```
    
    - 章タイトルが2つ登場しますが、Markdownの `## 1つ` で始まる章タイトルはこのあと定義するCSSにより非表示になります
        - 注意点として、Markdownに`## 1つ` がひとつもない状態にすると柱が章タイトルにならないという仕様があり、柱を正しく表示するために `div.doc-header` 内の `h1` タグの章タイトルと、Markdownの `## 1つ` で始まる章タイトルが必要になります
        - ちなみに、Markdownに `## 1つ` がひとつもない状態では、 `## 2つ` （ `h2` タグが付与される）で装飾された見出しを柱として表示する仕様のようです
    - 柱に付随した話として、公式テーマでは柱はHTMLのtitle属性を取得する `env(doc-title)` を使用して表示するように定義されています
        - `_media.scss` から抜粋
            
            ```scss:_media.scss
            @top-center {
                content: env(doc-title);
                font-size: $master-font-size-for-print;
                text-align: right;
                padding: 12mm 0mm 0 0mm;
              }
            ```
            
        - [ドキュメント](https://docs.vivliostyle.org/ja/supported-css-features.html)
4. 飾り用のCSSを定義する
    
    ```scss:_base.scss
    // body.content内のh1を非表示にする
    body.content {
      h1 {
        display: none;
      }
    }
    
    // 章タイトルと飾りを定義する
    div.doc-header {
      // 左右の線を引く。印刷モードは1C、電子書籍モードはカラーになる
      @if $print-mode {
        border-left: 4pt solid $color_black;
        border-bottom: 2pt solid $color_black;
      }
      @else {
        border-left: 4pt solid $color_green_dark;
        border-bottom: 2pt solid $color_green_dark;
      }
      // 余白感の調整
      padding-top: 5pt;
      padding-left: 14pt;
      padding-bottom: 10pt;
      margin-bottom: 20pt;
      position: relative;
    
      // 非表示にしたh1を表示する
      h1 {
        display: block;
      }
    }
    
    // 章タイトル飾りの縦線の内側の線を定義する
    div.doc-header::before {
      content: "";
      position: absolute;
      width: 100%;
      height: calc(100% + 2pt);
      @if $print-mode {
        border-left: 2pt solid $color_black;
      }
      @else {
        border-left: 2pt solid $color_green_dark;
      }
      top: 0pt;
      left: 2pt;
    }
    
    // 著者名
    div.doc-author {
      text-align: right;
    }
    ```
    
これで以下のようなレイアウトが実現できました。

![章タイトルのレイアウト見本](https://storage.googleapis.com/zenn-user-upload/adff4b30c9e5-20220914.png)
 

### トンボを出力する

印刷用PDFにトンボを出力するように修正しました。
    
```scss:_media.scss
@page {
    size: $page-width $page-height;
    margin-top: $page-margin-top;
    margin-bottom: $page-margin-bottom - 6mm;
    // 印刷モードのときだけトンボを出力する
    @if $print-mode {
    marks: crop cross; // トンボつける
    }
```

## 解決できなかったこと

最後に今回スキル不足、または時間的制約のために解消できなかったことを紹介します。
これらを解決する手段をお持ちの方は、教えていただけるとすごくうれしいです。

- 特定のページに柱を表示しないようにしたい
    - たとえばまえがきや奥付に柱は不要だと思ったので、表示したくないです
    - 案：柱を表示したくないページ用のClassを定義して、そのページ内では柱の文字色を白か透明にすればいけるかも？
- ファイルごとに奇数ページ始まりにするVivliostyleの設定により自動生成されたページに、ノンブルが表示されない
    - 印刷所によっては入稿規約に全ページにノンブルが表示されていることと記載されているので、なんらかの対応が必要になります
        - 今回は印刷所に「このページは白紙ですよ」とお伝えして対応いただいたが、毎度そうするのは避けたいですね…
    - Vivliostyle側の処理なのでいい解決方法が思い浮かばなかったです
    - 案：原稿がFIXしたあとに必要なページに手動で改ページを追加して調整すれば対応可能ですが、目視で確認しないといけないのでちょっと手間がかかるので、シュッと解決したいです
- 改ページするCSSを用いると改ページした先のページの先頭に空行が挿入され、隣のページとページの先頭があわなくなる
    - Vivliostyleの仕様でHTMLタグの前後に空行が必要で、HTMLタグの直後の改行がページの先頭になってしまうからだと想定されます
    - 今回は左右ともに見出しで始まるようにしてごまかしました
    

## さいごに

この記事では、初めて触ったVivliostyleでテーマをカスタマイズするという、なかなか挑戦的な取り組み例（＆一部失敗例）をお届けました。
InDesignならこう組版できるのにーみたいな思いも感じつつ、Vivliostyleが思っていた以上に簡単に本の体裁を保ったPDFを作成することができて、こいつはすごいぞ！とちょっとした感動を覚えました。
これを機にVivliostyleに対してなんらか貢献できることはないか、考えてみようかなと思います。

最後の最後に。
ゆめみ大技林 '22、絶賛頒布中なのでこの記事を読み終えた記念も兼ねて購入（0円！）していただけると、編集＆執筆陣一同とてもうれしく思います。

https://techbookfest.org/product/9g7iLPz8dzmL2QrrbedbxG?productVariantID=gfsBNShXyWyxHiubY2f1m7