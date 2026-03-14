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
const generatedDir = path.join(manuscriptsDir, 'generated')
const configDir = path.join(manuscriptsDir, 'config')
const articlesConfigPath = path.join(configDir, 'articles.yml')
const pagesConfigPath = path.join(configDir, 'pages.yml')
const generateConfigPath = path.join(configDir, 'generate.yml')

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
 * YAML のオブジェクト配列（`- key: value` 形式）をパースします。
 * 各アイテムは `label` と `value` などの文字列プロパティを持つオブジェクトです。
 * @param {string[]} lines - 行の配列
 * @param {number} startIndex - 配列の最初の行のインデックス
 * @returns {{ value: Array<Record<string, string>>, nextIndex: number }}
 */
function parseYamlObjectArray(lines, startIndex) {
  const items = []
  let i = startIndex
  let currentItem = null
  let arrayIndent = -1

  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      i++
      continue
    }
    if (line.trim().startsWith('#')) {
      i++
      continue
    }

    // 新しい配列アイテムの開始: "  - key: value"
    const itemMatch = line.match(/^(\s+)-\s+(.+)$/)
    if (itemMatch) {
      const indent = itemMatch[1].length
      if (arrayIndent < 0) arrayIndent = indent

      if (indent === arrayIndent) {
        if (currentItem) items.push(currentItem)
        currentItem = {}
        const rest = itemMatch[2]
        const colonIdx = rest.indexOf(':')
        if (colonIdx > 0) {
          const k = rest.slice(0, colonIdx).trim()
          const v = rest.slice(colonIdx + 1).trim().replace(/^(['"])(.*)\1$/, '$2')
          currentItem[k] = v
        }
        i++
        continue
      }
    }

    // 現在のアイテムのプロパティ続行: "    key: value"（アイテムより深いインデント）
    if (currentItem !== null && arrayIndent >= 0) {
      const lineIndent = (line.match(/^(\s*)/) || ['', ''])[1].length
      if (lineIndent > arrayIndent) {
        const trimmed = line.trim()
        const colonIdx = trimmed.indexOf(':')
        if (colonIdx > 0) {
          const k = trimmed.slice(0, colonIdx).trim()
          const v = trimmed.slice(colonIdx + 1).trim().replace(/^(['"])(.*)\1$/, '$2')
          currentItem[k] = v
          i++
          continue
        }
      }
    }

    break
  }

  if (currentItem) items.push(currentItem)
  return { value: items, nextIndex: i }
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
 * 各エントリに `position: after` を指定すると、articles の後ろに表示されます（省略時は `before`）。
 * @param {string} configPath - pages.yml のパス
 * @returns {{ title: string, file: string, position: 'before' | 'after' }[]}
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
  return items
    .filter((item) => item.title && item.file)
    .map((item) => {
      if (item.position === 'after') return item
      return item.position === 'before' ? item : { ...item, position: 'before' }
    })
}

/**
 * generate.yml からジェネレーター設定を読み込みます。
 * YAML リテラルブロックスカラー（`|` 形式）による複数行の値と、
 * オブジェクト配列（`- key: value` 形式）もサポートします。
 * @param {string} configPath - generate.yml のパス
 * @returns {Record<string, string | Array<Record<string, string>>>}
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
      } else if (rawVal === '') {
        // 空値の場合、次の非空行がオブジェクト配列かどうか確認する
        let j = i + 1
        while (j < lines.length) {
          const t = lines[j].trim()
          if (t && !t.startsWith('#')) break
          j++
        }
        if (j < lines.length && /^\s+-\s+/.test(lines[j])) {
          const { value, nextIndex } = parseYamlObjectArray(lines, j)
          config[key] = value
          i = nextIndex
        } else {
          config[key] = ''
          i++
        }
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
 * @param {{ title: string, file: string }[]} beforePages - articles の前に表示する固定ページ一覧
 * @param {{ title: string, file: string }[]} [afterPages] - articles の後ろに表示する固定ページ一覧
 * @returns {string}
 */
function generateIndex(articles, bookTitle, beforePages, afterPages = []) {
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

  for (const page of beforePages) {
    lines.push(`1. [${page.title}](../${page.file})`)
  }

  for (const article of articles) {
    const htmlFile = article.file.replace('.md', '.html')
    const title = article.frontMatter.title || article.file.replace('.md', '')
    lines.push(`1. [${title}](../articles/${htmlFile})`)
  }

  for (const page of afterPages) {
    lines.push(`1. [${page.title}](../${page.file})`)
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

/**
 * 奥付 (colophon.md) の内容を生成します。
 * タイトルと著作権の発行名は vivliostyle.config.js から取得し、その他の情報は generate.yml から取得します。
 * `colophon_rows` が設定されている場合はその配列からコンテナ行を生成します。
 * 設定されていない場合は `cover_designer`・`print_company`・`contact` から後方互換の行を生成します。
 * @param {string} bookTitle - 書籍タイトル（vivliostyle.config.js の title）
 * @param {string} publisherName - 発行名（vivliostyle.config.js の author）
 * @param {Record<string, string | Array<Record<string, string>>>} generateConfig - generate.yml から読み込んだ設定
 * @returns {string}
 */
function generateColophon(bookTitle, publisherName, generateConfig) {
  const editionHistory = generateConfig.edition_history || '初版'
  const copyrightYear = generateConfig.copyright_year || ''

  const yearPart = copyrightYear ? `${copyrightYear} ` : ''

  // colophon_rows が定義されていればそれを使い、なければ後方互換の固定行を使う
  let rowLines
  if (Array.isArray(generateConfig.colophon_rows)) {
    rowLines = generateConfig.colophon_rows.flatMap((row) => [
      '  <div class="colophon-row">',
      `    <div class="colophon-label">${row.label || ''}</div>`,
      `    <div class="colophon-value">${row.value || ''}</div>`,
      '  </div>',
    ])
  } else {
    const coverDesigner = generateConfig.cover_designer || ''
    const printCompany = generateConfig.print_company || ''
    const contact = generateConfig.contact || ''
    rowLines = [
      '  <div class="colophon-row">',
      '    <div class="colophon-label">発行</div>',
      `    <div class="colophon-value">${publisherName}</div>`,
      '  </div>',
      '  <div class="colophon-row">',
      '    <div class="colophon-label">表紙</div>',
      `    <div class="colophon-value">${coverDesigner}</div>`,
      '  </div>',
      '  <div class="colophon-row">',
      '    <div class="colophon-label">印刷</div>',
      `    <div class="colophon-value">${printCompany}</div>`,
      '  </div>',
      '  <div class="colophon-row">',
      '    <div class="colophon-label">連絡先</div>',
      `    <div class="colophon-value">${contact}</div>`,
      '  </div>',
    ]
  }

  const lines = [
    '---',
    'class: exclude-hashira',
    '---',
    '',
    '<!-- このファイルは自動生成されます。直接編集しないでください。 -->',
    '',
    '<!-- markdownlint-disable MD041 -->',
    '<hr class="page-break" />',
    '<!-- markdownlint-enable MD041 -->',
    '',
    '<section class="colophon">',
    '',
    `## ${bookTitle}`,
    '',
    editionHistory,
    '',
    '---',
    '',
    '<div class="colophon-container">',
    ...rowLines,
    '</div>',
    '',
    '---',
    '',
    '<!-- textlint-disable ja-technical-writing/ja-no-mixed-period -->',
    '',
    `© ${yearPart}${publisherName}`,
    '',
    '<!-- textlint-enable: ja-technical-writing/ja-no-mixed-period -->',
    '',
    '</section>',
    '',
  ]

  return lines.join('\n')
}

if (require.main === module) {
  const vivliostyleConfig = require('../book/vivliostyle.config.js')
  const bookTitle = (vivliostyleConfig.title || 'ゆめみ大技林').trim()
  const tocPages = getTocPages(pagesConfigPath)
  const { beforePages, afterPages } = tocPages.reduce(
    (acc, page) => {
      if (page.position === 'after') {
        acc.afterPages.push(page)
      } else {
        acc.beforePages.push(page)
      }
      return acc
    },
    { beforePages: [], afterPages: [] },
  )
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

  const indexPath = path.join(generatedDir, 'index.md')
  fs.mkdirSync(generatedDir, { recursive: true })
  fs.writeFileSync(
    indexPath,
    generateIndex(articles, bookTitle, beforePages, afterPages),
  )
  console.log('Generated: manuscripts/generated/index.md')

  const authorsPath = path.join(generatedDir, 'authors.md')
  fs.writeFileSync(authorsPath, generateAuthors(articles, generateConfig))
  console.log('Generated: manuscripts/generated/authors.md')

  const colophonPath = path.join(generatedDir, 'colophon.md')
  const publisherName = (vivliostyleConfig.author || '').trim()
  fs.writeFileSync(
    colophonPath,
    generateColophon(bookTitle, publisherName, generateConfig),
  )
  console.log('Generated: manuscripts/generated/colophon.md')

  console.log(`Processed ${articles.length} article(s).`)
}

module.exports = {
  parseYamlBlockScalar,
  parseYamlObjectArray,
  parseFrontMatter,
  getTocPages,
  loadGenerateConfig,
  generateIndex,
  generateAuthors,
  generateColophon,
}
