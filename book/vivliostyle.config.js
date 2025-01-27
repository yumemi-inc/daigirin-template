module.exports = {
  title: 'ゆめみ大技林 ' /*\'23'*/,
  author: 'ゆめみ大技林製作委員会',
  language: 'ja',
  size: 'A5',
  theme: [
    '@vivliostyle/theme-base@1.0.1', // 大技林テーマが 2.0.0 に対応したら削除してください。
    '@vivliostyle/theme-techbook@1.0.1', // 大技林テーマが 2.0.0 に対応したら削除してください。
    'vivliostyle-theme-macneko-techbook@0.2.0',
    '@mitsuharu/vivliostyle-theme-noto-sans-jp@0.1.4',
    'theme/theme-custom',
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
    'colophon.md',
  ],
  entryContext: './manuscripts',
  output: ['output/ebook.pdf'],
  workspaceDir: '.vivliostyle',
  toc: false,
  cover: undefined,
}
