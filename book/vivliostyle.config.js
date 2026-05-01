const { getArticleEntries } = require('../scripts/getArticleEntries.cts')

module.exports = {
  title: 'ゆめみより ' /*\'23'*/,
  author: 'ゆめみより製作委員会',
  language: 'ja',
  size: 'A5',
  theme: [
    'vivliostyle-theme-macneko-techbook@0.5.0',
    '@mitsuharu/vivliostyle-theme-noto-sans-jp@0.1.4',
    'theme/theme-custom',
  ],
  entry: [
    // 目次
    'generated/index.md',
    // はじめに
    'pages/preface.md',
    // 各章の原稿（articles ディレクトリから自動取得）
    ...getArticleEntries(),

    // 著者紹介
    'generated/authors.md',
    // 奥付
    'generated/colophon.md',
  ],
  entryContext: './manuscripts',
  output: ['output/ebook.pdf'],
  workspaceDir: '.vivliostyle',
  toc: false,
  cover: undefined,
}
