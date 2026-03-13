/**
 * articles.yml または articles ディレクトリから記事ファイルの一覧を取得する共有ユーティリティ。
 */

const fs = require('node:fs')
const path = require('node:path')

const manuscriptsDir = path.join(__dirname, '../book/manuscripts')
const articlesDir = path.join(manuscriptsDir, 'articles')
const articlesConfigPath = path.join(manuscriptsDir, 'articles.yml')

/**
 * articles.yml または articles ディレクトリから記事ファイルの一覧を取得します。
 * articles.yml が存在する場合はその順番に従います。
 * 存在しない場合はアルファベット順で取得します。
 * @param {string} articlesDir - articles ディレクトリのパス
 * @param {string} articlesConfigPath - articles.yml のパス
 * @returns {string[]} 記事ファイル名の配列（ファイル名のみ、パスなし）
 */
function getArticleFiles(articlesDir, articlesConfigPath) {
  if (!fs.existsSync(articlesDir)) {
    return []
  }

  if (fs.existsSync(articlesConfigPath)) {
    const content = fs.readFileSync(articlesConfigPath, 'utf8')
    return content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('- '))
      .map((line) => line.slice(2).trim())
      .filter(
        (file) =>
          file.endsWith('.md') && fs.existsSync(path.join(articlesDir, file)),
      )
  }

  return fs
    .readdirSync(articlesDir)
    .filter((file) => file.endsWith('.md'))
    .sort()
}

/**
 * vivliostyle.config.js の entry 配列に渡すための記事エントリを返します。
 * articles.yml が存在する場合はその順番に従います。
 * 存在しない場合はアルファベット順で取得します。
 * @returns {string[]} `articles/filename.md` 形式の配列
 */
function getArticleEntries() {
  return getArticleFiles(articlesDir, articlesConfigPath).map(
    (file) => `articles/${file}`,
  )
}

module.exports = { getArticleFiles, getArticleEntries }
