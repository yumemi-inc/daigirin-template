/**
 * generate-manuscripts.cts から分離した純粋関数群。
 */

const YAML = require('yaml')

/**
 * 記事本文先頭の front matter を抽出してオブジェクト化する。
 */
function parseFrontMatter(content: string) {
  // --- ... --- ブロックを先頭から最短一致で取り出す。
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  const parsed = YAML.parse(match[1])
  if (!parsed || typeof parsed !== 'object') return {}
  return parsed
}

/**
 * 記事タイトルを決定する。
 * front matter の title、本文中の H1、ファイル名の順で採用する。
 */
function resolveArticleTitle(
  frontMatter: Record<string, unknown>,
  content: string,
  fileName: string,
) {
  // 優先順位: front matter title -> H1 見出し -> ファイル名。
  const frontMatterTitle =
    typeof frontMatter.title === 'string' ? frontMatter.title.trim() : ''
  if (frontMatterTitle) {
    return frontMatterTitle
  }

  const headingMatch = content.match(/^#\s+(.+)$/m)
  const headingTitle = headingMatch?.[1]?.trim() || ''
  if (headingTitle) {
    return headingTitle
  }

  return fileName.replace(/\.md$/, '')
}

/**
 * front matter から著者名を取得する。
 * 値がない場合は空文字を返す。
 */
function resolveArticleAuthor(frontMatter: Record<string, unknown>) {
  return typeof frontMatter.author === 'string' ? frontMatter.author.trim() : ''
}

/**
 * テンプレート文字列のプレースホルダーを与えられた値で置換する。
 */
function applyTemplate(template: string, values: Record<string, string>) {
  // {key} 形式のプレースホルダーを全置換する。
  return Object.entries(values).reduce(
    (result: string, [key, value]: [string, string]) =>
      result.replaceAll(`{${key}}`, value),
    template,
  )
}

/**
 * 記事目次ラベルを生成する。
 * generate.yml の articles_toc テンプレートを適用し、空なら title を使う。
 */
function getArticlesTocLabel(
  article: { file: string; title: string; author: string },
  generateConfig: Record<string, unknown>,
) {
  // 未設定時でも目次が空にならないよう、既定テンプレートを持たせる。
  const templateRaw = generateConfig.articles_toc
  const template =
    typeof templateRaw === 'string' && templateRaw.trim().length > 0
      ? templateRaw
      : '{title}'

  const label = applyTemplate(template, {
    title: article.title,
    author: article.author,
    file: article.file.replace('.md', ''),
  }).trim()

  return label || article.title
}

/**
 * index.md（目次ページ）本文を生成する。
 * 固定ページ項目と articles 展開項目を1つの目次へ組み立てる。
 */
function generateIndex(
  articles: Array<{
    file: string
    frontMatter: Record<string, unknown>
    title: string
    author: string
  }>,
  bookTitle: string,
  tocItems: Array<
    | { type: 'generated'; title: string; file: string }
    | { type: 'page'; title: string; file: string }
    | { type: 'articles' }
  >,
  generateConfig: Record<string, unknown>,
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

  // entry.yml 由来の tocItems をそのまま走査し、articles は展開して出力する。
  for (const item of tocItems) {
    if (item.type === 'articles') {
      for (const article of articles) {
        const htmlFile = article.file.replace('.md', '.html')
        const title = getArticlesTocLabel(article, generateConfig)
        lines.push(`1. [${title}](../articles/${htmlFile})`)
      }
      continue
    }

    lines.push(`1. [${item.title}](../${item.file})`)
  }

  lines.push('')
  lines.push('</nav>')
  lines.push('')

  return lines.join('\n')
}

/**
 * authors.md（著者紹介ページ）本文を生成する。
 * 著者ごとに記事タイトルを集約し、プロフィールテンプレートへ反映する。
 */
function generateAuthors(
  articles: Array<{
    file: string
    frontMatter: Record<string, unknown>
    title: string
    author: string
  }>,
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
    const author = article.author
    if (!author) continue

    if (!authorMap.has(author)) {
      authorMap.set(author, { titles: [], profile: '' })
    }

    // 同一著者の記事タイトルを蓄積し、profile は最初の非空値を採用する。
    const entry = authorMap.get(author)
    const title = article.title
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

/**
 * colophon.md（奥付ページ）本文を生成する。
 * 設定値が未指定の項目は既定値で補完する。
 */
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

  // 文字列配列で組み立てることで、テンプレート変更時の差分を追いやすくする。
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

module.exports = {
  parseFrontMatter,
  resolveArticleTitle,
  resolveArticleAuthor,
  applyTemplate,
  getArticlesTocLabel,
  generateIndex,
  generateAuthors,
  generateColophon,
}
