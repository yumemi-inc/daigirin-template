#!/usr/bin/env node

/**
 * 記事ファイルの front matter を読み込み、index.md（目次）と authors.md（著者紹介）を自動生成するスクリプト。
 *
 * 各記事ファイルの front matter に以下のフィールドを記載してください。
 *
 * ---
 * class: content
 * title: 記事のタイトル
 * author: 著者名
 * profile: 著者の自己紹介文（複数行は YAML ブロックスカラー `|` で記述できます）
 * ---
 */

const fs = require('node:fs')
const path = require('node:path')
const { getArticleFiles } = require('./article-utils.js')

const manuscriptsDir = path.join(__dirname, '../book/manuscripts')
const articlesDir = path.join(manuscriptsDir, 'articles')
const articlesConfigPath = path.join(manuscriptsDir, 'articles.yml')
const pagesConfigPath = path.join(manuscriptsDir, 'pages.yml')
const generateConfigPath = path.join(manuscriptsDir, 'generate.yml')

/**
 * YAML リテラルブロックスカラー（`|` 形式）をパースします。
 * @param {string[]} lines - 行の配列
 * @param {number} startIndex - ブロック内容の最初の行のインデックス
 * @returns {{ value: string, nextIndex: number }}
 */
function parseYamlBlockScalar(lines, startIndex) {
  const blockLines = []
  let i = startIndex
  let indent = -1

  while (i < lines.length) {
    const blockLine = lines[i]
    if (blockLine.trim() === '') {
      if (indent >= 0) blockLines.push('')
      i++
      continue
    }
    if (indent < 0) {
      const m = blockLine.match(/^(\s+)/)
      indent = m ? m[1].length : 0
    }
    if (indent > 0 && blockLine.startsWith(' '.repeat(indent))) {
      blockLines.push(blockLine.slice(indent))
      i++
    } else {
      break
    }
  }

  // 末尾の空行を除去
  while (blockLines.length && blockLines[blockLines.length - 1] === '') {
    blockLines.pop()
  }

  return { value: blockLines.join('\n'), nextIndex: i }
}

/**
 * マークダウンの front matter をパースして、キーと値のオブジェクトを返します。
 * YAML ブロックスカラー（`|` 形式）による複数行の値もサポートします。
 * @param {string} content - マークダウンの内容
 * @returns {Record<string, string>}
 */
function parseFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}

  const frontMatter = {}
  const lines = match[1].split(/\r?\n/)
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const colonIdx = line.indexOf(':')
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim()
      const rawVal = line.slice(colonIdx + 1).trim()

      if (rawVal === '|') {
        const { value, nextIndex } = parseYamlBlockScalar(lines, i + 1)
        frontMatter[key] = value
        i = nextIndex
      } else {
        frontMatter[key] = rawVal.replace(/^(['"])(.*)\1$/, '$2')
        i++
      }
    } else {
      i++
    }
  }

  return frontMatter
}

/**
 * pages.yml から目次に表示する固定ページの一覧を取得します。
 * @param {string} configPath - pages.yml のパス
 * @returns {{ title: string, file: string }[]}
 */
function getTocPages(configPath) {
  if (!fs.existsSync(configPath)) {
    return []
  }
  const content = fs.readFileSync(configPath, 'utf8')
  const items = []
  let current = null

  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trimEnd()
    if (!line || line.trim().startsWith('#')) continue

    if (/^-\s+/.test(line)) {
      if (current) items.push(current)
      current = {}
      const rest = line.replace(/^-\s+/, '')
      const colonIdx = rest.indexOf(':')
      if (colonIdx > 0) {
        current[rest.slice(0, colonIdx).trim()] = rest
          .slice(colonIdx + 1)
          .trim()
      }
    } else if (current !== null) {
      const stripped = line.trim()
      const colonIdx = stripped.indexOf(':')
      if (colonIdx > 0) {
        current[stripped.slice(0, colonIdx).trim()] = stripped
          .slice(colonIdx + 1)
          .trim()
      }
    }
  }
  if (current) items.push(current)
  return items.filter((item) => item.title && item.file)
}

/**
 * generate.yml からジェネレーター設定を読み込みます。
 * YAML リテラルブロックスカラー（`|` 形式）による複数行の値もサポートします。
 * @param {string} configPath - generate.yml のパス
 * @returns {Record<string, string>}
 */
function loadGenerateConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    return {}
  }
  const content = fs.readFileSync(configPath, 'utf8')
  const config = {}
  const lines = content.split(/\r?\n/)
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      i++
      continue
    }
    const colonIdx = trimmed.indexOf(':')
    if (colonIdx > 0) {
      const key = trimmed.slice(0, colonIdx).trim()
      const rawVal = trimmed.slice(colonIdx + 1).trim()

      if (rawVal === '|') {
        const { value, nextIndex } = parseYamlBlockScalar(lines, i + 1)
        config[key] = value
        i = nextIndex
      } else {
        config[key] = rawVal.replace(/^(['"])(.*)\1$/, '$2')
        i++
      }
    } else {
      i++
    }
  }

  return config
}

/**
 * 記事ファイルのリストから目次 (index.md) の内容を生成します。
 * @param {{ file: string, frontMatter: Record<string, string> }[]} articles
 * @param {string} bookTitle - 書籍タイトル（vivliostyle.config.js から取得）
 * @param {{ title: string, file: string }[]} tocPages - 固定ページ一覧（pages.yml から取得）
 * @returns {string}
 */
function generateIndex(articles, bookTitle, tocPages) {
  const lines = [
    '---',
    'class: exclude-hashira',
    '---',
    '',
    '<!-- このファイルは自動生成されます。直接編集しないでください。 -->',
    '',
    `# ${bookTitle}`,
    '',
    '<nav id="toc" role="doc-toc">',
    '',
    '## 目次',
    '',
  ]

  for (const page of tocPages) {
    lines.push(`1. [${page.title}](${page.file})`)
  }

  for (const article of articles) {
    const htmlFile = article.file.replace('.md', '.html')
    const title = article.frontMatter.title || article.file.replace('.md', '')
    lines.push(`1. [${title}](articles/${htmlFile})`)
  }

  lines.push('')
  lines.push('</nav>')
  lines.push('')

  return lines.join('\n')
}

/**
 * 記事ファイルのリストから著者紹介 (authors.md) の内容を生成します。
 * 同じ著者が複数の記事を執筆している場合はひとつにまとめ、タイトルをコンマ区切りで表示します。
 * @param {{ file: string, frontMatter: Record<string, string> }[]} articles
 * @param {Record<string, string>} generateConfig - generate.yml から読み込んだ設定
 * @returns {string}
 */
function generateAuthors(articles, generateConfig) {
  const lines = [
    '---',
    'class: exclude-hashira',
    '---',
    '',
    '<!-- このファイルは自動生成されます。直接編集しないでください。 -->',
    '',
    '## 著者紹介',
    '',
  ]

  // 著者ごとにまとめる（記事の登場順を保持）
  /** @type {Map<string, { titles: string[], profile: string }>} */
  const authorMap = new Map()
  for (const article of articles) {
    const fm = article.frontMatter
    if (!fm.author) continue
    if (!authorMap.has(fm.author)) {
      authorMap.set(fm.author, { titles: [], profile: fm.profile || '' })
    }
    const entry = authorMap.get(fm.author)
    if (fm.title) entry.titles.push(fm.title)
    if (!entry.profile && fm.profile) entry.profile = fm.profile
  }

  const DEFAULT_PROFILE_TEMPLATE = '### {author}（{title}）\n\n{profile}'
  const profileTemplate =
    generateConfig.profile_template !== undefined
      ? generateConfig.profile_template
      : DEFAULT_PROFILE_TEMPLATE

  for (const [author, { titles, profile }] of authorMap) {
    const title = titles.join('、')
    const profileText = profile || '著者の自己紹介を記述してください。'
    const section = profileTemplate
      .replace('{author}', author)
      .replace('{title}', title)
      .replace('{profile}', profileText)
    lines.push(section)
    lines.push('')
  }

  return lines.join('\n')
}

// メイン処理
if (require.main === module) {
  const vivliostyleConfig = require('../book/vivliostyle.config.js')
  const bookTitle = (vivliostyleConfig.title || 'ゆめみ大技林').trim()
  const tocPages = getTocPages(pagesConfigPath)
  const generateConfig = loadGenerateConfig(generateConfigPath)

  const articleFiles = getArticleFiles(articlesDir, articlesConfigPath)
  const articles = articleFiles.map((file) => {
    const filePath = path.join(articlesDir, file)
    const content = fs.readFileSync(filePath, 'utf8')
    return {
      file,
      frontMatter: parseFrontMatter(content),
    }
  })

  const indexPath = path.join(manuscriptsDir, 'index.md')
  fs.writeFileSync(indexPath, generateIndex(articles, bookTitle, tocPages))
  console.log('Generated: manuscripts/index.md')

  const authorsPath = path.join(manuscriptsDir, 'authors.md')
  fs.writeFileSync(authorsPath, generateAuthors(articles, generateConfig))
  console.log('Generated: manuscripts/authors.md')

  console.log(`Processed ${articles.length} article(s).`)
}

module.exports = {
  parseYamlBlockScalar,
  parseFrontMatter,
  getTocPages,
  loadGenerateConfig,
  generateIndex,
  generateAuthors,
}
