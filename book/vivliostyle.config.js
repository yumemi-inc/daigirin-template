const fs = require('node:fs')
const path = require('node:path')

const manuscriptsDir = path.join(__dirname, 'manuscripts')
const articlesDir = path.join(manuscriptsDir, 'articles')
const articlesConfigPath = path.join(manuscriptsDir, 'articles.yml')

/**
 * articles ディレクトリのマークダウンファイルを自動取得します。
 * articles.yml が存在する場合はその順番に従います。
 * 存在しない場合はアルファベット順で取得します。
 * @returns {string[]}
 */
function getArticleEntries() {
  if (!fs.existsSync(articlesDir)) {
    return []
  }

  let articleFiles

  if (fs.existsSync(articlesConfigPath)) {
    // articles.yml の順番に従う
    const content = fs.readFileSync(articlesConfigPath, 'utf8')
    articleFiles = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('- '))
      .map((line) => line.slice(2).trim())
      .filter((file) => file.endsWith('.md'))
  } else {
    // アルファベット順で自動取得
    articleFiles = fs
      .readdirSync(articlesDir)
      .filter((file) => file.endsWith('.md'))
      .sort()
  }

  // ファイルが存在するものだけ返す
  return articleFiles
    .filter((file) => fs.existsSync(path.join(articlesDir, file)))
    .map((file) => `articles/${file}`)
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
