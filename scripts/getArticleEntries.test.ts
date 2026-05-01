import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { getArticleEntries } from './getArticleEntries.js'

describe('getArticleEntries', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'getArticleEntries-'))
    fs.mkdirSync(path.join(tmpDir, 'articles'))
    fs.mkdirSync(path.join(tmpDir, 'config'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  describe('articles ディレクトリが存在しない場合', () => {
    it('空の配列を返す', () => {
      const result = getArticleEntries(path.join(tmpDir, 'nonexistent'))
      expect(result).toEqual([])
    })
  })

  describe('articles.yml が存在しない場合', () => {
    it('アルファベット順でエントリを返す', () => {
      fs.writeFileSync(path.join(tmpDir, 'articles', 'b_chapter.md'), '')
      fs.writeFileSync(path.join(tmpDir, 'articles', 'a_chapter.md'), '')
      fs.writeFileSync(path.join(tmpDir, 'articles', 'c_chapter.md'), '')

      const result = getArticleEntries(path.join(tmpDir, 'articles'))

      expect(result).toEqual([
        'articles/a_chapter.md',
        'articles/b_chapter.md',
        'articles/c_chapter.md',
      ])
    })

    it('.md 以外のファイルは除外される', () => {
      fs.writeFileSync(path.join(tmpDir, 'articles', 'chapter.md'), '')
      fs.writeFileSync(path.join(tmpDir, 'articles', 'image.png'), '')
      fs.mkdirSync(path.join(tmpDir, 'articles', 'images'))

      const result = getArticleEntries(path.join(tmpDir, 'articles'))

      expect(result).toEqual(['articles/chapter.md'])
    })

    it('articles ディレクトリが空の場合は空の配列を返す', () => {
      const result = getArticleEntries(path.join(tmpDir, 'articles'))
      expect(result).toEqual([])
    })
  })

  describe('articles.yml が存在する場合', () => {
    it('yml に記載された順番でエントリを返す', () => {
      fs.writeFileSync(path.join(tmpDir, 'articles', 'a_chapter.md'), '')
      fs.writeFileSync(path.join(tmpDir, 'articles', 'b_chapter.md'), '')
      fs.writeFileSync(path.join(tmpDir, 'articles', 'c_chapter.md'), '')

      const yamlContent = '- c_chapter.md\n- a_chapter.md\n- b_chapter.md\n'
      fs.writeFileSync(path.join(tmpDir, 'config', 'articles.yml'), yamlContent)

      const result = getArticleEntries(
        path.join(tmpDir, 'articles'),
        path.join(tmpDir, 'config', 'articles.yml'),
      )

      expect(result).toEqual([
        'articles/c_chapter.md',
        'articles/a_chapter.md',
        'articles/b_chapter.md',
      ])
    })

    it('yml にコメントが含まれていても正しく解析される', () => {
      fs.writeFileSync(path.join(tmpDir, 'articles', 'chapter.md'), '')

      const yamlContent =
        '# コメント\n# このファイルを削除するとアルファベット順になります\n- chapter.md\n'
      fs.writeFileSync(path.join(tmpDir, 'config', 'articles.yml'), yamlContent)

      const result = getArticleEntries(
        path.join(tmpDir, 'articles'),
        path.join(tmpDir, 'config', 'articles.yml'),
      )

      expect(result).toEqual(['articles/chapter.md'])
    })

    it('yml が配列でない場合はアルファベット順にフォールバックする', () => {
      fs.writeFileSync(path.join(tmpDir, 'articles', 'b_chapter.md'), '')
      fs.writeFileSync(path.join(tmpDir, 'articles', 'a_chapter.md'), '')

      const yamlContent = 'key: value\n'
      fs.writeFileSync(path.join(tmpDir, 'config', 'articles.yml'), yamlContent)

      const result = getArticleEntries(
        path.join(tmpDir, 'articles'),
        path.join(tmpDir, 'config', 'articles.yml'),
      )

      expect(result).toEqual(['articles/a_chapter.md', 'articles/b_chapter.md'])
    })
  })
})
