import * as fs from 'node:fs'
import { createRequire } from 'node:module'
import * as os from 'node:os'
import * as path from 'node:path'

const require = createRequire(import.meta.url)
const {
  getArticleFiles,
  getEntryConfigItems,
  getGeneratedFileName,
  getGeneratedTitle,
  toEntryFilePath,
  toTocHrefPath,
  uniqueEntryPaths,
  getGeneratedEntryPath,
  getBookEntries,
  getTocItems,
} = require('../getArticleEntries.cts') as {
  getArticleFiles: (articlesDir: string, articlesConfigPath: string) => string[]
  getEntryConfigItems: (configPath: string) => Array<Record<string, unknown>>
  getGeneratedFileName: (id: 'index' | 'authors' | 'colophon') => string
  getGeneratedTitle: (
    id: 'index' | 'authors' | 'colophon',
    title?: string,
  ) => string
  toEntryFilePath: (filePath: string) => string
  toTocHrefPath: (filePath: string) => string
  uniqueEntryPaths: (entryPaths: string[]) => string[]
  getGeneratedEntryPath: (
    fileName: string,
    dirs?: { editedDir?: string; generatedDir?: string },
  ) => string
  getBookEntries: (paths?: {
    configPath?: string
    editedDir?: string
    generatedDir?: string
    articlesDir?: string
    articlesConfigPath?: string
  }) => string[]
  getTocItems: (paths?: {
    configPath?: string
    editedDir?: string
    generatedDir?: string
  }) => Array<{
    type: 'generated' | 'page' | 'articles'
    title?: string
    file?: string
  }>
}

describe('getArticleFiles', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'daigirin-articles-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  const articlesDir = () => path.join(tmpDir, 'articles')
  const configPath = () => path.join(tmpDir, 'articles.yml')

  function createArticles(...names: string[]) {
    fs.mkdirSync(articlesDir(), { recursive: true })
    for (const name of names) {
      fs.writeFileSync(path.join(articlesDir(), name), '')
    }
  }

  test('articles ディレクトリが存在しない場合は空配列を返す', () => {
    const result = getArticleFiles(articlesDir(), configPath())
    expect(result).toEqual([])
  })

  test('articles.yml がない場合はアルファベット順で返す', () => {
    createArticles('c.md', 'a.md', 'b.md')
    const result = getArticleFiles(articlesDir(), configPath())
    expect(result).toEqual(['a.md', 'b.md', 'c.md'])
  })

  test('articles.yml の順番に従って返す', () => {
    createArticles('a.md', 'b.md', 'c.md')
    fs.writeFileSync(configPath(), '- c.md\n- a.md\n- b.md\n')
    const result = getArticleFiles(articlesDir(), configPath())
    expect(result).toEqual(['c.md', 'a.md', 'b.md'])
  })

  test('articles.yml に存在しないファイルは除外する', () => {
    createArticles('a.md')
    fs.writeFileSync(configPath(), '- a.md\n- missing.md\n')
    const result = getArticleFiles(articlesDir(), configPath())
    expect(result).toEqual(['a.md'])
  })

  test('articles.yml が空のときはアルファベット順で返す', () => {
    createArticles('b.md', 'a.md')
    fs.writeFileSync(configPath(), '# コメントのみ\n')
    const result = getArticleFiles(articlesDir(), configPath())
    expect(result).toEqual(['a.md', 'b.md'])
  })

  test('articles.yml のエントリが全て存在しないファイルの場合はアルファベット順で返す', () => {
    createArticles('a.md', 'b.md')
    fs.writeFileSync(configPath(), '- missing1.md\n- missing2.md\n')
    const result = getArticleFiles(articlesDir(), configPath())
    expect(result).toEqual(['a.md', 'b.md'])
  })

  test('.md 以外のファイルは除外する', () => {
    createArticles('a.md', 'b.txt', 'c.md')
    const result = getArticleFiles(articlesDir(), configPath())
    expect(result).toEqual(['a.md', 'c.md'])
  })

  test('Windows 改行（CRLF）の articles.yml も正しくパースする', () => {
    createArticles('a.md', 'b.md')
    fs.writeFileSync(configPath(), '- b.md\r\n- a.md\r\n')
    const result = getArticleFiles(articlesDir(), configPath())
    expect(result).toEqual(['b.md', 'a.md'])
  })
})

describe('entry config utilities', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'daigirin-entry-config-test-'),
    )
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  const configPath = () => path.join(tmpDir, 'entry.yml')

  test('entry.yml の構成定義を読み込める', () => {
    fs.writeFileSync(
      configPath(),
      [
        '- type: generated',
        '  id: index',
        '  toc: false',
        '- type: page',
        '  title: はじめに',
        '  file: pages/preface.md',
        '  toc: true',
        '- type: articles',
        '  toc: true',
      ].join('\n'),
    )

    const result = getEntryConfigItems(configPath())
    expect(result).toEqual([
      { type: 'generated', id: 'index', title: '', toc: false },
      { type: 'page', title: 'はじめに', file: 'pages/preface.md', toc: true },
      { type: 'articles', toc: true },
    ])
  })

  test('page の toc が未指定の場合は true になる', () => {
    fs.writeFileSync(
      configPath(),
      '- type: page\n  title: はじめに\n  file: pages/preface.md\n',
    )

    const result = getEntryConfigItems(configPath())
    expect(result).toEqual([
      { type: 'page', title: 'はじめに', file: 'pages/preface.md', toc: true },
    ])
  })

  test('generated の id からファイル名を解決できる', () => {
    expect(getGeneratedFileName('index')).toBe('index.md')
    expect(getGeneratedFileName('authors')).toBe('authors.md')
    expect(getGeneratedFileName('colophon')).toBe('colophon.md')
  })

  test('generated のタイトルは未指定時に既定値を返す', () => {
    expect(getGeneratedTitle('index')).toBe('目次')
    expect(getGeneratedTitle('authors')).toBe('著者紹介')
    expect(getGeneratedTitle('colophon')).toBe('奥付')
    expect(getGeneratedTitle('authors', '執筆者')).toBe('執筆者')
  })

  test('entry 用パスは html を md に変換する', () => {
    expect(toEntryFilePath('pages/preface.html')).toBe('pages/preface.md')
    expect(toEntryFilePath('pages/preface.md')).toBe('pages/preface.md')
  })

  test('目次リンク用パスは md を html に変換する', () => {
    expect(toTocHrefPath('pages/preface.md')).toBe('pages/preface.html')
    expect(toTocHrefPath('pages/preface.html')).toBe('pages/preface.html')
  })

  test('entry パスの重複は先頭のみ残す', () => {
    expect(
      uniqueEntryPaths([
        'generated/index.md',
        'pages/preface.md',
        'pages/preface.md',
        'articles/sample0.md',
        'articles/sample0.md',
      ]),
    ).toEqual(['generated/index.md', 'pages/preface.md', 'articles/sample0.md'])
  })
})

describe('getGeneratedEntryPath', () => {
  let tmpDir: string
  let editedDir: string
  let generatedDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'daigirin-generated-entry-test-'),
    )
    editedDir = path.join(tmpDir, 'edited')
    generatedDir = path.join(tmpDir, 'generated')
    fs.mkdirSync(editedDir, { recursive: true })
    fs.mkdirSync(generatedDir, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  test('edited/ のファイルが存在する場合は edited/ を優先する', () => {
    fs.writeFileSync(path.join(editedDir, 'index.md'), '')
    expect(getGeneratedEntryPath('index.md', { editedDir, generatedDir })).toBe(
      'edited/index.md',
    )
  })

  test('edited/ になく generated/ に存在する場合は generated/ を返す', () => {
    fs.writeFileSync(path.join(generatedDir, 'index.md'), '')
    expect(getGeneratedEntryPath('index.md', { editedDir, generatedDir })).toBe(
      'generated/index.md',
    )
  })

  test('どちらにもファイルがない場合は generated/ を返す', () => {
    expect(getGeneratedEntryPath('index.md', { editedDir, generatedDir })).toBe(
      'generated/index.md',
    )
  })
})

describe('getBookEntries', () => {
  let tmpDir: string
  let editedDir: string
  let generatedDir: string
  let configPath: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'daigirin-book-entries-test-'),
    )
    editedDir = path.join(tmpDir, 'edited')
    generatedDir = path.join(tmpDir, 'generated')
    configPath = path.join(tmpDir, 'entry.yml')
    fs.mkdirSync(editedDir, { recursive: true })
    fs.mkdirSync(generatedDir, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  function paths(extra?: Record<string, string>) {
    return { configPath, editedDir, generatedDir, ...extra }
  }

  test('page エントリの .html ファイルは .md に正規化される', () => {
    fs.writeFileSync(
      configPath,
      '- type: page\n  title: はじめに\n  file: pages/preface.html\n  toc: true\n',
    )
    const result = getBookEntries(paths())
    expect(result).toContain('pages/preface.md')
    expect(result).not.toContain('pages/preface.html')
  })

  test('generated エントリは edited/ が存在すれば edited/ を優先する', () => {
    fs.writeFileSync(configPath, '- type: generated\n  id: index\n  toc: false\n')
    fs.writeFileSync(path.join(editedDir, 'index.md'), '')
    expect(getBookEntries(paths())).toContain('edited/index.md')
  })

  test('generated エントリは edited/ がなければ generated/ を返す', () => {
    fs.writeFileSync(configPath, '- type: generated\n  id: index\n  toc: false\n')
    expect(getBookEntries(paths())).toContain('generated/index.md')
  })

  test('generated/page/articles が混在した entry.yml を正しく処理する', () => {
    const articlesDir = path.join(tmpDir, 'articles')
    fs.mkdirSync(articlesDir, { recursive: true })
    fs.writeFileSync(path.join(articlesDir, 'ch1.md'), '')
    fs.writeFileSync(
      configPath,
      [
        '- type: generated',
        '  id: index',
        '  toc: false',
        '- type: page',
        '  title: はじめに',
        '  file: pages/preface.md',
        '  toc: true',
        '- type: articles',
        '  toc: true',
      ].join('\n'),
    )
    const result = getBookEntries(paths({ articlesDir }))
    expect(result).toContain('generated/index.md')
    expect(result).toContain('pages/preface.md')
    expect(result).toContain('articles/ch1.md')
  })
})

describe('getTocItems', () => {
  let tmpDir: string
  let editedDir: string
  let generatedDir: string
  let configPath: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'daigirin-toc-items-test-'),
    )
    editedDir = path.join(tmpDir, 'edited')
    generatedDir = path.join(tmpDir, 'generated')
    configPath = path.join(tmpDir, 'entry.yml')
    fs.mkdirSync(editedDir, { recursive: true })
    fs.mkdirSync(generatedDir, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  function paths() {
    return { configPath, editedDir, generatedDir }
  }

  test('toc: false の項目は目次から除外される', () => {
    fs.writeFileSync(
      configPath,
      [
        '- type: generated',
        '  id: index',
        '  toc: false',
        '- type: page',
        '  title: はじめに',
        '  file: pages/preface.md',
        '  toc: true',
      ].join('\n'),
    )
    const result = getTocItems(paths())
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ type: 'page', title: 'はじめに' })
  })

  test('toc: true の全項目が目次に含まれる', () => {
    fs.writeFileSync(
      configPath,
      [
        '- type: generated',
        '  id: index',
        '  toc: true',
        '- type: page',
        '  title: はじめに',
        '  file: pages/preface.md',
        '  toc: true',
        '- type: articles',
        '  toc: true',
      ].join('\n'),
    )
    const result = getTocItems(paths())
    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({ type: 'generated' })
    expect(result[1]).toMatchObject({ type: 'page' })
    expect(result[2]).toMatchObject({ type: 'articles' })
  })

  test('page の目次リンクは .md が .html に変換される', () => {
    fs.writeFileSync(
      configPath,
      '- type: page\n  title: はじめに\n  file: pages/preface.md\n  toc: true\n',
    )
    const result = getTocItems(paths())
    expect(result[0]).toMatchObject({ file: 'pages/preface.html' })
  })

  test('generated エントリで edited/ 優先の場合、目次リンクも edited/ になる', () => {
    fs.writeFileSync(
      configPath,
      '- type: generated\n  id: authors\n  toc: true\n',
    )
    fs.writeFileSync(path.join(editedDir, 'authors.md'), '')
    const result = getTocItems(paths())
    expect(result[0]).toMatchObject({ file: 'edited/authors.html' })
  })

  test('generated エントリで edited/ がない場合、目次リンクは generated/ になる', () => {
    fs.writeFileSync(
      configPath,
      '- type: generated\n  id: authors\n  toc: true\n',
    )
    const result = getTocItems(paths())
    expect(result[0]).toMatchObject({ file: 'generated/authors.html' })
  })
})
