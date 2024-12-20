/**
 * 電子版と印刷版に共通する Vivliostyle の設定ファイル
 * 
 * @description
 * - この設定ファイルで build せず、電子版・印刷版それぞれの設定ファイルを利用してください
 * - 電子版と印刷版で異なる設定はそれぞれの個別 config で上書きしてください
 * - 仮値は電子版に寄せて、もし誤って利用されても、設定で事故しないようにしてください
 * - vivliostyle-cli で実行する時は、システム的にアクセス制限はできないので、注意してください
 */
module.exports = {
  title: 'ゆめみ大技林 '/*\'23'*/,
  author: 'ゆめみ大技林製作委員会',
  language: 'ja',
  size: 'A5',
  theme: [
    'vivliostyle-theme-macneko-techbook',
    '@mitsuharu/vivliostyle-theme-noto-sans-jp',
    '../theme/theme-custom',
  ],
  entry: [
    // 目次
    'index.md',
    // はじめに
    'preface.md',
    // 各章の原稿
    'sample_chapter.md', // サンプル用ページです。執筆時は削除してください。

    // 会社紹介（必要なら以下をアンコメントして利用、掲載時は頒布イベントの出展要項に注意）
    // 'yumemi.md',
    // 著者紹介
    'authors.md',
    // 奥付
    'colophon.md'
  ],
  entryContext: '../manuscripts',
  output: [
    '../output/ebook.pdf',
  ],
  workspaceDir: '../.vivliostyle',
  toc: false,
  cover: undefined,
}
