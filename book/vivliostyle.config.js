const path = require('node:path')
const { getArticleFiles } = require('../scripts/article-utils.js')

const manuscriptsDir = path.join(__dirname, 'manuscripts')
const articlesDir = path.join(manuscriptsDir, 'articles')
const articlesConfigPath = path.join(manuscriptsDir, 'articles.yml')

/**
 * articles ディレクトリのマークダウンファイルをエントリ形式で返します。
 * articles.yml が存在する場合はその順番に従います。
 * 存在しない場合はアルファベット順で取得します。
 * @returns {string[]}
 */
function getArticleEntries() {
  return getArticleFiles(articlesDir, articlesConfigPath).map(
    (file) => `articles/${file}`,
  )
}

module.exports = {
  title: 'ゆめみ大技林 ' /*\'23'*/,
  author: 'ゆめみ大技林製作委員会',
  language: 'ja',
  size: 'A5',
  theme: [
    'vivliostyle-theme-macneko-techbook@0.5.0',
    '@mitsuharu/vivliostyle-theme-noto-sans-jp@0.1.4',
    'theme/theme-custom',
  ],
  entry: [
    // 目次
    'index.md',
    // はじめに
    'preface.md',
    // 各章の原稿（articles ディレクトリから自動取得）
    ...getArticleEntries(),
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
