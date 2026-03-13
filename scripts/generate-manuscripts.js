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
 * author_profile: 著者の自己紹介文
 * ---
 */

const fs = require('node:fs')
const path = require('node:path')
const { getArticleFiles } = require('./article-utils.js')

const manuscriptsDir = path.join(__dirname, '../book/manuscripts')
const articlesDir = path.join(manuscriptsDir, 'articles')
const articlesConfigPath = path.join(manuscriptsDir, 'articles.yml')

/**
 * マークダウンの front matter をパースして、キーと値のオブジェクトを返します。
 * @param {string} content - マークダウンの内容
 * @returns {Record<string, string>}
 */
function parseFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}

  const frontMatter = {}
  for (const line of match[1].split(/\r?\n/)) {
    const colonIdx = line.indexOf(':')
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim()
      const value = line
        .slice(colonIdx + 1)
        .trim()
        .replace(/^(['"])(.*)\1$/, '$2')
      frontMatter[key] = value
    }
  }

  return frontMatter
}

/**
 * 記事ファイルのリストから目次 (index.md) の内容を生成します。
 * @param {{ file: string, frontMatter: Record<string, string> }[]} articles
 * @returns {string}
 */
function generateIndex(articles) {
  const lines = [
    '---',
    'class: exclude-hashira',
    '---',
    '',
    '<!-- このファイルは自動生成されます。直接編集しないでください。 -->',
    '',
    "# ゆめみ大技林 <!--'23-->",
    '',
    '<nav id="toc" role="doc-toc">',
    '',
    '## 目次',
    '',
    '1. [はじめに](preface.html)',
    '1. [ゆめみ大技林製作委員会とは](preface.html)',
  ]

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
 * @param {{ file: string, frontMatter: Record<string, string> }[]} articles
 * @returns {string}
 */
function generateAuthors(articles) {
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

  for (const article of articles) {
    const fm = article.frontMatter
    if (fm.author) {
      const titleSuffix = fm.title ? `（${fm.title}）` : ''
      lines.push(`### ${fm.author}${titleSuffix}`)
      lines.push('')
      lines.push(fm.author_profile || '著者の自己紹介を記述してください。')
      lines.push('')
    }
  }

  return lines.join('\n')
}

// メイン処理
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
fs.writeFileSync(indexPath, generateIndex(articles))
console.log('Generated: manuscripts/index.md')

const authorsPath = path.join(manuscriptsDir, 'authors.md')
fs.writeFileSync(authorsPath, generateAuthors(articles))
console.log('Generated: manuscripts/authors.md')

console.log(`Processed ${articles.length} article(s).`)
