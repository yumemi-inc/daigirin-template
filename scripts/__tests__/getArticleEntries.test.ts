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
