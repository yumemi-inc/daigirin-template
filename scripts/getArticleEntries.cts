/**
 * articles.yml または articles ディレクトリから記事ファイルの一覧を取得する共有ユーティリティ。
 */

// このファイルが実行時に CommonJS として扱われる。
// import * as fs from 'node:fs' では動かないため、require でインポートする。
const fs = require('node:fs')
const path = require('node:path')
const YAML = require('yaml')

const manuscriptsDir = path.join(__dirname, '../book/manuscripts')
const articlesDir = path.join(manuscriptsDir, 'articles')
const articlesConfigPath = path.join(manuscriptsDir, 'config', 'articles.yml')

/**
 * articles.yml または articles ディレクトリから記事ファイルの一覧を取得します。
 * articles.yml が存在し、有効なエントリがある場合はその順番に従います。
 * 存在しない場合、または内容が空の場合はアルファベット順で取得します。
 * @param {string} articlesDir - articles ディレクトリのパス
 * @param {string} articlesConfigPath - articles.yml のパス
 * @returns {string[]} 記事ファイル名の配列（ファイル名のみ、パスなし）
 */
function getArticleFiles(articlesDir: string, articlesConfigPath: string) {
  if (!fs.existsSync(articlesDir)) {
    return []
  }

  if (fs.existsSync(articlesConfigPath)) {
    const content = fs.readFileSync(articlesConfigPath, 'utf8')
    const parsed = YAML.parse(content)
    const files = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.articles)
        ? parsed.articles
        : []
    const validFiles = files
      .filter((file: unknown) => typeof file === 'string')
      .map((file: string) => file.trim())
      .filter(
        (file: string) =>
          file.endsWith('.md') && fs.existsSync(path.join(articlesDir, file)),
      )
    if (validFiles.length > 0) {
      return validFiles
    }
  }

  return fs
    .readdirSync(articlesDir)
    .filter((file: string) => file.endsWith('.md'))
    .sort()
}

/**
 * vivliostyle.config.js の entry 配列に渡すための記事エントリを返します。
 * articles.yml が存在し、有効なエントリがある場合はその順番に従います。
 * 存在しない場合、または内容が空の場合はアルファベット順で取得します。
 * @returns {string[]} `articles/filename.md` 形式の配列
 */
function getArticleEntries() {
  return getArticleFiles(articlesDir, articlesConfigPath).map(
    (file: string) => `articles/${file}`,
  )
}

module.exports = { getArticleFiles, getArticleEntries }
