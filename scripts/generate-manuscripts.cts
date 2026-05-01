#!/usr/bin/env node

/**
 * 記事ファイルの front matter を読み込み、index.md（目次）と
 * authors.md（著者紹介）および colophon.md（奥付）を自動生成するスクリプト。
 */

const fs = require('node:fs')
const path = require('node:path')
const YAML = require('yaml')
const { getArticleFiles } = require('./getArticleEntries.cts')

const manuscriptsDir = path.join(__dirname, '../book/manuscripts')
const articlesDir = path.join(manuscriptsDir, 'articles')
const generatedDir = path.join(manuscriptsDir, 'generated')
const configDir = path.join(manuscriptsDir, 'config')
const articlesConfigPath = path.join(configDir, 'articles.yml')
const pagesConfigPath = path.join(configDir, 'pages.yml')
const generateConfigPath = path.join(configDir, 'generate.yml')

function parseFrontMatter(content: string) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  const parsed = YAML.parse(match[1])
  if (!parsed || typeof parsed !== 'object') return {}
  return parsed
}

function getTocPages(configPath: string) {
  if (!fs.existsSync(configPath)) {
    return []
  }
  const content = fs.readFileSync(configPath, 'utf8')
  const parsed = YAML.parse(content)
  const pages = Array.isArray(parsed) ? parsed : []
  return pages
    .filter((item: unknown) => typeof item === 'object' && item !== null)
    .map((item: { title?: unknown; file?: unknown; position?: unknown }) => ({
      title: typeof item.title === 'string' ? item.title : '',
      file: typeof item.file === 'string' ? item.file : '',
      position: item.position === 'after' ? 'after' : 'before',
    }))
    .filter((item: { title: string; file: string }) => item.title && item.file)
}

function loadGenerateConfig(configPath: string) {
  if (!fs.existsSync(configPath)) {
    return {}
  }
  const content = fs.readFileSync(configPath, 'utf8')
  const parsed = YAML.parse(content)
  if (!parsed || typeof parsed !== 'object') {
    return {}
  }
  return parsed
}

function generateIndex(
  articles: Array<{ file: string; frontMatter: Record<string, unknown> }>,
  bookTitle: string,
  beforePages: Array<{ title: string; file: string }>,
  afterPages: Array<{ title: string; file: string }> = [],
) {
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
    const titleRaw = article.frontMatter.title
    const title =
      typeof titleRaw === 'string' && titleRaw.trim().length > 0
        ? titleRaw
        : article.file.replace('.md', '')
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

function generateAuthors(
  articles: Array<{ file: string; frontMatter: Record<string, unknown> }>,
  generateConfig: Record<string, unknown>,
) {
  const lines = [
    '---',
    'class: exclude-hashira',
    '---',
    '',
    '<!-- このファイルは自動生成されます。直接編集しないでください。 -->',
    '',
    '<section class="authors-section">',
    '',
    '## 著者紹介',
    '',
  ]

  const authorMap = new Map<string, { titles: string[]; profile: string }>()
  for (const article of articles) {
    const fm = article.frontMatter
    const author = typeof fm.author === 'string' ? fm.author.trim() : ''
    if (!author) continue

    if (!authorMap.has(author)) {
      authorMap.set(author, { titles: [], profile: '' })
    }

    const entry = authorMap.get(author)
    const title = typeof fm.title === 'string' ? fm.title.trim() : ''
    const profile = typeof fm.profile === 'string' ? fm.profile.trim() : ''

    if (title) {
      entry.titles.push(title)
    }
    if (!entry.profile && profile) {
      entry.profile = profile
    }
  }

  const defaultProfileTemplate = '### {author}（{title}）\n\n{profile}'
  const profileTemplateRaw = generateConfig.profile_template
  const profileTemplate =
    typeof profileTemplateRaw === 'string' &&
    profileTemplateRaw.trim().length > 0
      ? profileTemplateRaw
      : defaultProfileTemplate

  for (const [author, { titles, profile }] of authorMap) {
    const title = titles.length > 0 ? titles.join('、') : '無題'
    const profileText = profile || '著者の自己紹介を記述してください。'
    const section = profileTemplate
      .replace('{author}', author)
      .replace('{title}', title)
      .replace('{profile}', profileText)
    lines.push(section)
    lines.push('')
  }

  if (authorMap.size === 0) {
    lines.push(
      '著者情報がありません。各記事の front matter に `author` と `profile` を設定してください。',
    )
    lines.push('')
  }

  lines.push('</section>')
  lines.push('')

  return lines.join('\n')
}

function generateColophon(
  bookTitle: string,
  publisherName: string,
  generateConfig: Record<string, unknown>,
) {
  const editionHistoryRaw = generateConfig.edition_history
  const editionHistory =
    typeof editionHistoryRaw === 'string' && editionHistoryRaw.trim().length > 0
      ? editionHistoryRaw
      : '初版'

  const copyrightYearRaw = generateConfig.copyright_year
  const copyrightYear =
    typeof copyrightYearRaw === 'string' ? copyrightYearRaw.trim() : ''
  const yearPart = copyrightYear ? `${copyrightYear} ` : ''

  const rowsRaw = generateConfig.colophon_rows
  const colophonRows = Array.isArray(rowsRaw)
    ? rowsRaw
        .filter((row: unknown) => typeof row === 'object' && row !== null)
        .map((row: { label?: unknown; value?: unknown }) => ({
          label: typeof row.label === 'string' ? row.label : '',
          value: typeof row.value === 'string' ? row.value : '',
        }))
    : []

  const rowLines = colophonRows.flatMap(
    (row: { label: string; value: string }) => [
      '  <div class="colophon-row">',
      `    <div class="colophon-label">${row.label}</div>`,
      `    <div class="colophon-value">${row.value}</div>`,
      '  </div>',
    ],
  )

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

type GenerateMode = 'force' | 'if-missing'

function parseGenerateMode(argv: string[]): GenerateMode {
  if (argv.includes('--if-missing')) {
    return 'if-missing'
  }
  return 'force'
}

function writeGeneratedFile(
  filePath: string,
  content: string,
  mode: GenerateMode,
) {
  if (mode === 'if-missing' && fs.existsSync(filePath)) {
    const relativePath = path.relative(manuscriptsDir, filePath)
    console.log(`Skipped: manuscripts/${relativePath} (already exists)`)
    return false
  }

  fs.writeFileSync(filePath, content)
  const relativePath = path.relative(manuscriptsDir, filePath)
  console.log(`Generated: manuscripts/${relativePath}`)
  return true
}

if (require.main === module) {
  const mode = parseGenerateMode(process.argv.slice(2))
  const vivliostyleConfig = require('../book/vivliostyle.config.js')
  const bookTitle =
    typeof vivliostyleConfig.title === 'string'
      ? vivliostyleConfig.title.trim() || 'ゆめみより'
      : 'ゆめみより'
  const publisherName =
    typeof vivliostyleConfig.author === 'string'
      ? vivliostyleConfig.author.trim()
      : ''

  const tocPages = getTocPages(pagesConfigPath)
  const { beforePages, afterPages } = tocPages.reduce(
    (
      acc: {
        beforePages: Array<{ title: string; file: string }>
        afterPages: Array<{ title: string; file: string }>
      },
      page: { title: string; file: string; position: 'before' | 'after' },
    ) => {
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
  const articles = articleFiles.map((file: string) => {
    const filePath = path.join(articlesDir, file)
    const content = fs.readFileSync(filePath, 'utf8')
    return {
      file,
      frontMatter: parseFrontMatter(content),
    }
  })

  fs.mkdirSync(generatedDir, { recursive: true })

  const indexPath = path.join(generatedDir, 'index.md')
  const authorsPath = path.join(generatedDir, 'authors.md')
  const colophonPath = path.join(generatedDir, 'colophon.md')

  let generatedCount = 0

  if (
    writeGeneratedFile(
      indexPath,
      generateIndex(articles, bookTitle, beforePages, afterPages),
      mode,
    )
  ) {
    generatedCount += 1
  }

  if (
    writeGeneratedFile(
      authorsPath,
      generateAuthors(articles, generateConfig),
      mode,
    )
  ) {
    generatedCount += 1
  }

  if (
    writeGeneratedFile(
      colophonPath,
      generateColophon(bookTitle, publisherName, generateConfig),
      mode,
    )
  ) {
    generatedCount += 1
  }

  console.log(`Mode: ${mode}`)
  console.log(`Processed ${articles.length} article(s).`)
  console.log(`Generated ${generatedCount} file(s).`)
}

module.exports = {
  parseFrontMatter,
  getTocPages,
  loadGenerateConfig,
  generateIndex,
  generateAuthors,
  generateColophon,
}
