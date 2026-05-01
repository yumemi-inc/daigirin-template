const path = require('node:path')
const { getArticleEntries } = require('./getArticleEntries')

const manuscriptsDir = path.resolve(__dirname, 'manuscripts')
const articlesDir = path.join(manuscriptsDir, 'articles')
const configFile = path.join(manuscriptsDir, 'config', 'articles.yml')

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
    'pages/index.md',
    // はじめに
    'pages/preface.md',
    // 各章の原稿（articles ディレクトリから自動取得）
    ...getArticleEntries(articlesDir, configFile),

    // 著者紹介
    'pages/authors.md',
    // 奥付
    'pages/colophon.md',
  ],
  entryContext: './manuscripts',
  output: ['output/ebook.pdf'],
  workspaceDir: '.vivliostyle',
  toc: false,
  cover: undefined,
}
