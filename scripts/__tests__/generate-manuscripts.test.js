'use strict'

const {
  parseYamlBlockScalar,
  parseFrontMatter,
  getTocPages,
  loadGenerateConfig,
  generateIndex,
  generateAuthors,
} = require('../generate-manuscripts.js')

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

// ---------------------------------------------------------------------------
// parseYamlBlockScalar
// ---------------------------------------------------------------------------
describe('parseYamlBlockScalar', () => {
  test('インデントされた複数行をパースする', () => {
    const lines = ['  1行目', '  2行目', '  3行目']
    const { value, nextIndex } = parseYamlBlockScalar(lines, 0)
    expect(value).toBe('1行目\n2行目\n3行目')
    expect(nextIndex).toBe(3)
  })

  test('末尾の空行を除去する', () => {
    const lines = ['  本文', '  ', '']
    const { value } = parseYamlBlockScalar(lines, 0)
    expect(value).toBe('本文')
  })

  test('ブロック中の空行は保持する', () => {
    const lines = ['  1行目', '', '  3行目']
    const { value } = parseYamlBlockScalar(lines, 0)
    expect(value).toBe('1行目\n\n3行目')
  })

  test('インデントが終わったら終了し nextIndex を返す', () => {
    const lines = ['  ブロック行', 'キー: 値']
    const { value, nextIndex } = parseYamlBlockScalar(lines, 0)
    expect(value).toBe('ブロック行')
    expect(nextIndex).toBe(1)
  })

  test('空配列のときは空文字を返す', () => {
    const { value, nextIndex } = parseYamlBlockScalar([], 0)
    expect(value).toBe('')
    expect(nextIndex).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// parseFrontMatter
// ---------------------------------------------------------------------------
describe('parseFrontMatter', () => {
  test('基本的なキーと値をパースする', () => {
    const content = '---\ntitle: テストタイトル\nauthor: テスト著者\n---\n本文'
    const fm = parseFrontMatter(content)
    expect(fm.title).toBe('テストタイトル')
    expect(fm.author).toBe('テスト著者')
  })

  test('クォートで囲まれた値はクォートを除去する', () => {
    const content = "---\ntitle: 'タイトル'\n---\n"
    const fm = parseFrontMatter(content)
    expect(fm.title).toBe('タイトル')
  })

  test('YAML ブロックスカラー（|）で複数行の profile をパースする', () => {
    const content = '---\nprofile: |\n  1行目\n  2行目\n---\n本文'
    const fm = parseFrontMatter(content)
    expect(fm.profile).toBe('1行目\n2行目')
  })

  test('front matter がない場合は空オブジェクトを返す', () => {
    expect(parseFrontMatter('# 本文だけ')).toEqual({})
  })

  test('Windows 改行（CRLF）でもパースできる', () => {
    const content = '---\r\ntitle: CRLF\r\nauthor: 著者\r\n---\r\n'
    const fm = parseFrontMatter(content)
    expect(fm.title).toBe('CRLF')
    expect(fm.author).toBe('著者')
  })
})

// ---------------------------------------------------------------------------
// loadGenerateConfig
// ---------------------------------------------------------------------------
describe('loadGenerateConfig', () => {
  let tmpDir

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'daigirin-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  test('ファイルが存在しない場合は空オブジェクトを返す', () => {
    const result = loadGenerateConfig(path.join(tmpDir, 'missing.yml'))
    expect(result).toEqual({})
  })

  test('通常のキー: 値をパースする', () => {
    const yml = 'profile_template: "{profile}"\n'
    fs.writeFileSync(path.join(tmpDir, 'generate.yml'), yml)
    const result = loadGenerateConfig(path.join(tmpDir, 'generate.yml'))
    expect(result.profile_template).toBe('{profile}')
  })

  test('コメント行は無視する', () => {
    const yml = '# コメント\nprofile_template: "{profile}"\n'
    fs.writeFileSync(path.join(tmpDir, 'generate.yml'), yml)
    const result = loadGenerateConfig(path.join(tmpDir, 'generate.yml'))
    expect(Object.keys(result)).toEqual(['profile_template'])
  })

  test('YAML ブロックスカラー（|）で複数行のテンプレートをパースする', () => {
    const yml =
      'profile_template: |\n  ### {author}（{title}）\n\n  {profile}\n'
    fs.writeFileSync(path.join(tmpDir, 'generate.yml'), yml)
    const result = loadGenerateConfig(path.join(tmpDir, 'generate.yml'))
    expect(result.profile_template).toBe('### {author}（{title}）\n\n{profile}')
  })
})

// ---------------------------------------------------------------------------
// getTocPages
// ---------------------------------------------------------------------------
describe('getTocPages', () => {
  let tmpDir

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'daigirin-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  test('ファイルが存在しない場合は空配列を返す', () => {
    const result = getTocPages(path.join(tmpDir, 'missing.yml'))
    expect(result).toEqual([])
  })

  test('position なしのエントリは before になる', () => {
    const yml = '- title: はじめに\n  file: preface.html\n'
    fs.writeFileSync(path.join(tmpDir, 'pages.yml'), yml)
    const result = getTocPages(path.join(tmpDir, 'pages.yml'))
    expect(result).toHaveLength(1)
    expect(result[0].position).toBe('before')
  })

  test('position: before のエントリは before になる', () => {
    const yml =
      '- title: はじめに\n  file: preface.html\n  position: before\n'
    fs.writeFileSync(path.join(tmpDir, 'pages.yml'), yml)
    const result = getTocPages(path.join(tmpDir, 'pages.yml'))
    expect(result[0].position).toBe('before')
  })

  test('position: after のエントリは after になる', () => {
    const yml =
      '- title: おわりに\n  file: afterword.html\n  position: after\n'
    fs.writeFileSync(path.join(tmpDir, 'pages.yml'), yml)
    const result = getTocPages(path.join(tmpDir, 'pages.yml'))
    expect(result).toHaveLength(1)
    expect(result[0].position).toBe('after')
    expect(result[0].title).toBe('おわりに')
    expect(result[0].file).toBe('afterword.html')
  })

  test('before と after が混在するとき両方取得できる', () => {
    const yml =
      '- title: はじめに\n  file: preface.html\n- title: おわりに\n  file: afterword.html\n  position: after\n'
    fs.writeFileSync(path.join(tmpDir, 'pages.yml'), yml)
    const result = getTocPages(path.join(tmpDir, 'pages.yml'))
    expect(result).toHaveLength(2)
    expect(result.filter((p) => p.position === 'before')).toHaveLength(1)
    expect(result.filter((p) => p.position === 'after')).toHaveLength(1)
  })

  test('title か file が欠けているエントリは除外される', () => {
    const yml = '- title: タイトルのみ\n- file: file-only.html\n'
    fs.writeFileSync(path.join(tmpDir, 'pages.yml'), yml)
    const result = getTocPages(path.join(tmpDir, 'pages.yml'))
    expect(result).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// generateIndex
// ---------------------------------------------------------------------------
describe('generateIndex', () => {
  test('記事タイトルが目次に含まれる', () => {
    const articles = [
      { file: 'article1.md', frontMatter: { title: '記事1' } },
      { file: 'article2.md', frontMatter: { title: '記事2' } },
    ]
    const result = generateIndex(articles, 'テスト本', [])
    expect(result).toContain('# テスト本')
    expect(result).toContain('[記事1](../articles/article1.html)')
    expect(result).toContain('[記事2](../articles/article2.html)')
  })

  test('タイトルがない場合はファイル名（拡張子なし）を使う', () => {
    const articles = [{ file: 'no-title.md', frontMatter: {} }]
    const result = generateIndex(articles, '本', [])
    expect(result).toContain('[no-title](../articles/no-title.html)')
  })

  test('beforePages が目次に含まれる', () => {
    const beforePages = [{ title: 'はじめに', file: 'preface.html' }]
    const result = generateIndex([], '本', beforePages)
    expect(result).toContain('[はじめに](../preface.html)')
  })

  test('afterPages が目次に含まれる', () => {
    const afterPages = [{ title: 'おわりに', file: 'afterword.html' }]
    const result = generateIndex([], '本', [], afterPages)
    expect(result).toContain('[おわりに](../afterword.html)')
  })

  test('beforePages は articles より前、afterPages は articles より後ろに表示される', () => {
    const articles = [
      { file: 'article1.md', frontMatter: { title: '記事1' } },
    ]
    const beforePages = [{ title: 'はじめに', file: 'preface.html' }]
    const afterPages = [{ title: 'おわりに', file: 'afterword.html' }]
    const result = generateIndex(articles, '本', beforePages, afterPages)
    const idxBefore = result.indexOf('[はじめに]')
    const idxArticle = result.indexOf('[記事1]')
    const idxAfter = result.indexOf('[おわりに]')
    expect(idxBefore).toBeLessThan(idxArticle)
    expect(idxArticle).toBeLessThan(idxAfter)
  })

  test('afterPages を省略しても動作する', () => {
    const result = generateIndex([], '本', [])
    expect(result).toBeTruthy()
  })

  test('自動生成コメントが含まれる', () => {
    const result = generateIndex([], '本', [])
    expect(result).toContain(
      '<!-- このファイルは自動生成されます。直接編集しないでください。 -->',
    )
  })
})

// ---------------------------------------------------------------------------
// generateAuthors
// ---------------------------------------------------------------------------
describe('generateAuthors', () => {
  const defaultConfig = {}

  test('著者名とプロフィールが出力に含まれる', () => {
    const articles = [
      {
        file: 'a.md',
        frontMatter: {
          author: '著者A',
          title: 'タイトルA',
          profile: 'プロフィールA',
        },
      },
    ]
    const result = generateAuthors(articles, defaultConfig)
    expect(result).toContain('著者A')
    expect(result).toContain('タイトルA')
    expect(result).toContain('プロフィールA')
  })

  test('デフォルトテンプレート（### {author}（{title}）形式）を使う', () => {
    const articles = [
      {
        file: 'a.md',
        frontMatter: { author: '著者A', title: 'タイトルA', profile: '自己紹介' },
      },
    ]
    const result = generateAuthors(articles, defaultConfig)
    expect(result).toContain('### 著者A（タイトルA）')
    expect(result).toContain('自己紹介')
  })

  test('同じ著者の複数タイトルをコンマ区切りで結合する', () => {
    const articles = [
      {
        file: 'a.md',
        frontMatter: {
          author: '著者A',
          title: 'タイトル1',
          profile: 'プロフィールA',
        },
      },
      {
        file: 'b.md',
        frontMatter: { author: '著者A', title: 'タイトル2', profile: '' },
      },
    ]
    const result = generateAuthors(articles, defaultConfig)
    expect(result).toContain('タイトル1、タイトル2')
    // 著者セクションは1つだけ
    expect(result.split('著者A').length - 1).toBe(1)
  })

  test('著者の登場順を保持する', () => {
    const articles = [
      {
        file: 'a.md',
        frontMatter: { author: '著者B', title: 'B', profile: '' },
      },
      {
        file: 'b.md',
        frontMatter: { author: '著者A', title: 'A', profile: '' },
      },
    ]
    const result = generateAuthors(articles, defaultConfig)
    expect(result.indexOf('著者B')).toBeLessThan(result.indexOf('著者A'))
  })

  test('profile が空のときはデフォルトメッセージを使う', () => {
    const articles = [
      { file: 'a.md', frontMatter: { author: '著者A', title: 'T', profile: '' } },
    ]
    const result = generateAuthors(articles, defaultConfig)
    expect(result).toContain('著者の自己紹介を記述してください。')
  })

  test('author がない記事は無視する', () => {
    const articles = [{ file: 'a.md', frontMatter: { title: 'タイトル' } }]
    const result = generateAuthors(articles, defaultConfig)
    expect(result).not.toContain('タイトル')
  })

  test('カスタム profile_template を使う', () => {
    const articles = [
      {
        file: 'a.md',
        frontMatter: { author: '著者A', title: 'T', profile: '自己紹介' },
      },
    ]
    const config = { profile_template: '**{author}** - {title}: {profile}' }
    const result = generateAuthors(articles, config)
    expect(result).toContain('**著者A** - T: 自己紹介')
  })

  test('自動生成コメントが含まれる', () => {
    const result = generateAuthors([], defaultConfig)
    expect(result).toContain(
      '<!-- このファイルは自動生成されます。直接編集しないでください。 -->',
    )
  })
})
