#!/usr/bin/env node

/**
 * 記事ファイルの front matter を読み込み、index.md（目次）と
 * authors.md（著者紹介）および colophon.md（奥付）を自動生成するスクリプト。
 */

const fs = require('node:fs')
const path = require('node:path')
const YAML = require('yaml')
const { getArticleFiles, getTocItems } = require('./getArticleEntries.cts')
const {
  parseFrontMatter,
  resolveArticleTitle,
  resolveArticleAuthor,
  generateIndex,
  generateAuthors,
  generateColophon,
} = require('./generate-manuscripts-utils.cts')

const manuscriptsDir = path.join(__dirname, '../book/manuscripts')
const articlesDir = path.join(manuscriptsDir, 'articles')
const generatedDir = path.join(manuscriptsDir, 'generated')
const configDir = path.join(manuscriptsDir, 'config')
const articlesConfigPath = path.join(configDir, 'articles.yml')
const generateConfigPath = path.join(configDir, 'generate.yml')

const DEFAULT_BOOK_TITLE = 'ゆめみより'
const GENERATED_INDEX_FILE = 'index.md'
const GENERATED_AUTHORS_FILE = 'authors.md'
const GENERATED_COLOPHON_FILE = 'colophon.md'
const GENERATE_MODE = 'force'

/**
 * generate.yml を読み込む。
 * 設定ファイルがない、またはオブジェクト形式でない場合は空設定として扱う。
 */
function loadGenerateConfig(configPath: string) {
  if (!fs.existsSync(configPath)) {
    return {}
  }
  const content = fs.readFileSync(configPath, 'utf8')
  let parsed: unknown
  try {
    parsed = YAML.parse(content)
  } catch (e) {
    throw new Error(
      `generate.yml の YAML パースに失敗しました。ファイルの記述を確認してください。\n${e instanceof Error ? e.message : String(e)}`,
    )
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {}
  }
  return parsed
}

/**
 * 生成ファイルを書き出し、ログしやすい相対パスを表示する。
 */
function writeGeneratedFile(filePath: string, content: string) {
  fs.writeFileSync(filePath, content)
  const relativePath = path.relative(manuscriptsDir, filePath)
  console.log(`Generated: manuscripts/${relativePath}`)
  return true
}

if (require.main === module) {
  const vivliostyleConfig = require('../book/vivliostyle.config.js')
  // config 側が空文字を返しても既定値へフォールバックする。
  const bookTitle =
    typeof vivliostyleConfig.title === 'string'
      ? vivliostyleConfig.title.trim() || DEFAULT_BOOK_TITLE
      : DEFAULT_BOOK_TITLE
  const publisherName =
    typeof vivliostyleConfig.author === 'string'
      ? vivliostyleConfig.author.trim()
      : ''

  const tocItems = getTocItems()
  const generateConfig = loadGenerateConfig(generateConfigPath)

  const articleFiles = getArticleFiles(articlesDir, articlesConfigPath)
  // 記事ごとに front matter を解決して、生成に必要な情報へ正規化する。
  const articles = articleFiles.map((file: string) => {
    const filePath = path.join(articlesDir, file)
    const content = fs.readFileSync(filePath, 'utf8')
    const frontMatter = parseFrontMatter(content)
    return {
      file,
      frontMatter,
      title: resolveArticleTitle(frontMatter, content, file),
      author: resolveArticleAuthor(frontMatter),
    }
  })

  fs.mkdirSync(generatedDir, { recursive: true })

  const indexPath = path.join(generatedDir, GENERATED_INDEX_FILE)
  const authorsPath = path.join(generatedDir, GENERATED_AUTHORS_FILE)
  const colophonPath = path.join(generatedDir, GENERATED_COLOPHON_FILE)

  let generatedCount = 0

  // 生成本数を明示的にカウントし、終了ログで確認しやすくする。
  if (
    writeGeneratedFile(
      indexPath,
      generateIndex(articles, bookTitle, tocItems, generateConfig),
    )
  ) {
    generatedCount += 1
  }

  if (
    writeGeneratedFile(authorsPath, generateAuthors(articles, generateConfig))
  ) {
    generatedCount += 1
  }

  if (
    writeGeneratedFile(
      colophonPath,
      generateColophon(bookTitle, publisherName, generateConfig),
    )
  ) {
    generatedCount += 1
  }

  console.log(`Mode: ${GENERATE_MODE}`)
  console.log(`Processed ${articles.length} article(s).`)
  console.log(`Generated ${generatedCount} file(s).`)
}

module.exports = {
  loadGenerateConfig,
  writeGeneratedFile,
}
