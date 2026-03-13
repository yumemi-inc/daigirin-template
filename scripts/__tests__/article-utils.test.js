'use strict'

const { getArticleFiles } = require('../article-utils.js')

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

// ---------------------------------------------------------------------------
// getArticleFiles
// ---------------------------------------------------------------------------
describe('getArticleFiles', () => {
  let tmpDir

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'daigirin-articles-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  const articlesDir = () => path.join(tmpDir, 'articles')
  const configPath = () => path.join(tmpDir, 'articles.yml')

  function createArticles(...names) {
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
