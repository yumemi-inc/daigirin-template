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
const entryConfigPath = path.join(manuscriptsDir, 'config', 'entry.yml')
const generatedDir = path.join(manuscriptsDir, 'generated')
const editedDir = path.join(manuscriptsDir, 'edited')

type GeneratedId = 'index' | 'authors' | 'colophon'

type EntryConfigItem =
  | {
      type: 'generated'
      id: GeneratedId
      title?: string
      toc: boolean
    }
  | {
      type: 'page'
      title: string
      file: string
      toc: boolean
    }
  | {
      type: 'articles'
      toc: boolean
    }

const GENERATED_FILE_NAME_MAP: Record<GeneratedId, string> = {
  index: 'index.md',
  authors: 'authors.md',
  colophon: 'colophon.md',
}

// generated タイプで title 未指定時に使う見出し。
const GENERATED_DEFAULT_TITLE_MAP: Record<GeneratedId, string> = {
  index: '目次',
  authors: '著者紹介',
  colophon: '奥付',
}

// entry.yml がない場合や不正な場合のフォールバック構成。
const DEFAULT_ENTRY_CONFIG: EntryConfigItem[] = [
  { type: 'generated', id: 'index', toc: false },
  { type: 'page', title: 'はじめに', file: 'pages/preface.md', toc: true },
  { type: 'articles', toc: true },
  { type: 'generated', id: 'authors', toc: false },
  { type: 'generated', id: 'colophon', toc: false },
]

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
    // 配列形式・articles キー形式の両方を受け付ける。
    const files = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.articles)
        ? parsed.articles
        : []
    // .md だけを対象にし、実在するファイルだけを残す。
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

/**
 * entry.yml から本全体の entry 設定を読み込みます。
 * @param {string} configPath - entry.yml のパス
 * @returns {EntryConfigItem[]} entry 設定の配列
 */
function getEntryConfigItems(
  configPath: string = entryConfigPath,
): EntryConfigItem[] {
  if (!fs.existsSync(configPath)) {
    return DEFAULT_ENTRY_CONFIG
  }

  const content = fs.readFileSync(configPath, 'utf8')
  const parsed = YAML.parse(content)
  // ルート配列と entries 配列のどちらでも読み込めるようにする。
  const items = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.entries)
      ? parsed.entries
      : []

  // 設定値を型安全に正規化し、不正なエントリは捨てる。
  const normalized = items
    .filter((item: unknown) => typeof item === 'object' && item !== null)
    .map(
      (item: {
        type?: unknown
        id?: unknown
        title?: unknown
        file?: unknown
        toc?: unknown
      }) => {
        const type = typeof item.type === 'string' ? item.type.trim() : ''
        const toc = typeof item.toc === 'boolean' ? item.toc : true

        if (type === 'generated') {
          const id =
            item.id === 'index' ||
            item.id === 'authors' ||
            item.id === 'colophon'
              ? item.id
              : undefined
          if (!id) {
            return null
          }
          return {
            type: 'generated' as const,
            id,
            title: typeof item.title === 'string' ? item.title.trim() : '',
            toc,
          }
        }

        if (type === 'articles') {
          return {
            type: 'articles' as const,
            toc,
          }
        }

        if (type === 'page') {
          const title = typeof item.title === 'string' ? item.title.trim() : ''
          const file = typeof item.file === 'string' ? item.file.trim() : ''
          if (!title || !file) {
            return null
          }
          return {
            type: 'page' as const,
            title,
            file,
            toc,
          }
        }

        return null
      },
    )
    .filter(
      (item: EntryConfigItem | null): item is EntryConfigItem => item !== null,
    )

  if (normalized.length === 0) {
    return DEFAULT_ENTRY_CONFIG
  }

  return normalized
}

/**
 * entry.yml の file を vivliostyle entry 用パスに正規化します。
 */
function toEntryFilePath(filePath: string) {
  if (filePath.endsWith('.html')) {
    return `${filePath.slice(0, -'.html'.length)}.md`
  }
  return filePath
}

/**
 * entry.yml の file を目次リンク用パスに正規化します。
 */
function toTocHrefPath(filePath: string) {
  if (filePath.endsWith('.md')) {
    return `${filePath.slice(0, -'.md'.length)}.html`
  }
  return filePath
}

function getGeneratedFileName(id: GeneratedId) {
  return GENERATED_FILE_NAME_MAP[id]
}

function getGeneratedTitle(id: GeneratedId, title?: string) {
  if (typeof title === 'string' && title.trim().length > 0) {
    return title.trim()
  }
  return GENERATED_DEFAULT_TITLE_MAP[id]
}

/**
 * 手動編集用ファイルが存在する場合はそちらを優先して返します。
 */
function getGeneratedEntryPath(fileName: string) {
  const editedPath = path.join(editedDir, fileName)
  if (fs.existsSync(editedPath)) {
    return `edited/${fileName}`
  }

  const generatedPath = path.join(generatedDir, fileName)
  if (fs.existsSync(generatedPath)) {
    return `generated/${fileName}`
  }

  return `generated/${fileName}`
}

function uniqueEntryPaths(entryPaths: string[]) {
  const seen = new Set<string>()

  // 同一パスは先頭の1件だけ採用し、Vivliostyle の出力衝突を避ける。
  return entryPaths.filter((entryPath: string) => {
    if (seen.has(entryPath)) {
      return false
    }

    seen.add(entryPath)
    return true
  })
}

/**
 * vivliostyle.config.js の entry を自動生成します。
 */
function getBookEntries() {
  const items = getEntryConfigItems(entryConfigPath)

  return uniqueEntryPaths(
    items.flatMap((item: EntryConfigItem) => {
      if (item.type === 'generated') {
        return [getGeneratedEntryPath(getGeneratedFileName(item.id))]
      }

      if (item.type === 'page') {
        return [toEntryFilePath(item.file)]
      }

      return getArticleEntries()
    }),
  )
}

function getTocItems() {
  const items = getEntryConfigItems(entryConfigPath)

  // toc: true の項目だけを目次用データへ変換する。
  return items
    .filter((item: EntryConfigItem) => item.toc)
    .map((item: EntryConfigItem) => {
      if (item.type === 'generated') {
        const fileName = getGeneratedFileName(item.id)
        const entryPath = getGeneratedEntryPath(fileName)
        return {
          type: 'generated' as const,
          title: getGeneratedTitle(item.id, item.title),
          file: toTocHrefPath(entryPath),
        }
      }

      if (item.type === 'page') {
        return {
          type: 'page' as const,
          title: item.title,
          file: toTocHrefPath(item.file),
        }
      }

      return {
        type: 'articles' as const,
      }
    })
}

module.exports = {
  getArticleFiles,
  getArticleEntries,
  getEntryConfigItems,
  toEntryFilePath,
  toTocHrefPath,
  getGeneratedFileName,
  getGeneratedTitle,
  getGeneratedEntryPath,
  uniqueEntryPaths,
  getBookEntries,
  getTocItems,
}
