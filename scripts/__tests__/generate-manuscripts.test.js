'use strict'

const {
  parseYamlBlockScalar,
  parseYamlObjectArray,
  parseFrontMatter,
  getTocPages,
  loadGenerateConfig,
  generateIndex,
  generateAuthors,
  generateColophon,
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
// parseYamlObjectArray
// ---------------------------------------------------------------------------
describe('parseYamlObjectArray', () => {
  test('label と value のペアをパースする', () => {
    const lines = [
      '  - label: 発行',
      '    value: ゆめみ大技林製作委員会',
      '  - label: 連絡先',
      '    value: https://x.com/yumemiinc',
    ]
    const { value, nextIndex } = parseYamlObjectArray(lines, 0)
    expect(value).toHaveLength(2)
    expect(value[0]).toEqual({ label: '発行', value: 'ゆめみ大技林製作委員会' })
    expect(value[1]).toEqual({ label: '連絡先', value: 'https://x.com/yumemiinc' })
    expect(nextIndex).toBe(4)
  })

  test('空の value を持つアイテムをパースする', () => {
    const lines = [
      '  - label: 表紙',
      "    value: ''",
    ]
    const { value } = parseYamlObjectArray(lines, 0)
    expect(value).toHaveLength(1)
    expect(value[0]).toEqual({ label: '表紙', value: '' })
  })

  test('配列の後ろの行では終了して nextIndex を返す', () => {
    const lines = [
      '  - label: 発行',
      '    value: 社',
      'next_key: foo',
    ]
    const { value, nextIndex } = parseYamlObjectArray(lines, 0)
    expect(value).toHaveLength(1)
    expect(nextIndex).toBe(2)
  })

  test('コメント行はスキップする', () => {
    const lines = [
      '  # コメント',
      '  - label: 発行',
      '    value: 社',
    ]
    const { value } = parseYamlObjectArray(lines, 0)
    expect(value).toHaveLength(1)
    expect(value[0].label).toBe('発行')
  })

  test('空配列のときは空配列を返す', () => {
    const { value, nextIndex } = parseYamlObjectArray([], 0)
    expect(value).toEqual([])
    expect(nextIndex).toBe(0)
  })

  test('複数プロパティを持つアイテムをパースする', () => {
    const lines = [
      '  - label: 発行',
      '    value: 社',
      '    extra: 追加情報',
    ]
    const { value } = parseYamlObjectArray(lines, 0)
    expect(value[0]).toEqual({ label: '発行', value: '社', extra: '追加情報' })
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

  test('colophon_rows としてオブジェクト配列をパースする', () => {
    const yml = [
      'colophon_rows:',
      '  - label: 発行',
      '    value: ゆめみ大技林製作委員会',
      '  - label: 連絡先',
      '    value: https://x.com/yumemiinc',
      '',
    ].join('\n')
    fs.writeFileSync(path.join(tmpDir, 'generate.yml'), yml)
    const result = loadGenerateConfig(path.join(tmpDir, 'generate.yml'))
    expect(Array.isArray(result.colophon_rows)).toBe(true)
    expect(result.colophon_rows).toHaveLength(2)
    expect(result.colophon_rows[0]).toEqual({ label: '発行', value: 'ゆめみ大技林製作委員会' })
    expect(result.colophon_rows[1]).toEqual({ label: '連絡先', value: 'https://x.com/yumemiinc' })
  })

  test('colophon_rows の後に続くキーも正しくパースする', () => {
    const yml = [
      'colophon_rows:',
      '  - label: 発行',
      '    value: 社',
      'copyright_year: 2023',
      '',
    ].join('\n')
    fs.writeFileSync(path.join(tmpDir, 'generate.yml'), yml)
    const result = loadGenerateConfig(path.join(tmpDir, 'generate.yml'))
    expect(Array.isArray(result.colophon_rows)).toBe(true)
    expect(result.colophon_rows).toHaveLength(1)
    expect(result.copyright_year).toBe('2023')
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

// ---------------------------------------------------------------------------
// generateColophon
// ---------------------------------------------------------------------------
describe('generateColophon', () => {
  test('書籍タイトルが奥付タイトルに含まれる', () => {
    const result = generateColophon('ゆめみ大技林 \'23', 'ゆめみ大技林製作委員会', {})
    expect(result).toContain("## ゆめみ大技林 '23")
  })

  test('発行名（author）が発行欄に含まれる', () => {
    const result = generateColophon('テスト本', 'テスト発行社', {})
    expect(result).toContain('テスト発行社')
  })

  test('edition_history が設定されていれば出力に含まれる', () => {
    const result = generateColophon('本', '社', {
      edition_history: '2023年5月15日 初版',
    })
    expect(result).toContain('2023年5月15日 初版')
  })

  test('edition_history に複数行の版履歴を設定できる', () => {
    const history = '2023年5月15日 初版\n2023年5月20日 初版 2刷\n2023年6月15日 第二版'
    const result = generateColophon('本', '社', { edition_history: history })
    expect(result).toContain('2023年5月15日 初版')
    expect(result).toContain('2023年5月20日 初版 2刷')
    expect(result).toContain('2023年6月15日 第二版')
  })

  test('edition_history が未設定のときデフォルト「初版」が使われる', () => {
    const result = generateColophon('本', '社', {})
    expect(result).toContain('初版')
    expect(result).not.toContain('undefined')
  })

  test('表紙デザイナーが設定されていれば表紙欄に含まれる', () => {
    const result = generateColophon('本', '社', { cover_designer: '吉森由之助' })
    expect(result).toContain('吉森由之助')
  })

  test('印刷会社が設定されていれば印刷欄に含まれる', () => {
    const result = generateColophon('本', '社', { print_company: '日光企画' })
    expect(result).toContain('日光企画')
  })

  test('連絡先が設定されていれば連絡先欄に含まれる', () => {
    const result = generateColophon('本', '社', { contact: 'https://x.com/yumemiinc' })
    expect(result).toContain('https://x.com/yumemiinc')
  })

  test('コピーライト年が設定されていれば copyright 行に含まれる', () => {
    const result = generateColophon('本', '発行社', { copyright_year: '2023' })
    expect(result).toContain('© 2023 発行社')
  })

  test('コピーライト年が未設定のとき年なしで出力される', () => {
    const result = generateColophon('本', '発行社', {})
    expect(result).toContain('© 発行社')
    expect(result).not.toContain('undefined')
  })

  test('自動生成コメントが含まれる', () => {
    const result = generateColophon('本', '社', {})
    expect(result).toContain(
      '<!-- このファイルは自動生成されます。直接編集しないでください。 -->',
    )
  })

  test('colophon セクションタグが含まれる', () => {
    const result = generateColophon('本', '社', {})
    expect(result).toContain('<section class="colophon">')
    expect(result).toContain('</section>')
  })

  test('colophon_rows が定義されているとき、その label と value が出力に含まれる', () => {
    const config = {
      colophon_rows: [
        { label: '発行', value: 'ゆめみ大技林製作委員会' },
        { label: '連絡先', value: 'https://x.com/yumemiinc' },
      ],
    }
    const result = generateColophon('本', '社', config)
    expect(result).toContain('発行')
    expect(result).toContain('ゆめみ大技林製作委員会')
    expect(result).toContain('連絡先')
    expect(result).toContain('https://x.com/yumemiinc')
  })

  test('colophon_rows が定義されているとき、HTML 構造が正しく生成される', () => {
    const config = {
      colophon_rows: [
        { label: '発行', value: '出版社' },
      ],
    }
    const result = generateColophon('本', '社', config)
    expect(result).toContain('<div class="colophon-label">発行</div>')
    expect(result).toContain('<div class="colophon-value">出版社</div>')
  })

  test('colophon_rows が定義されているとき、行数がそのままになる', () => {
    const config = {
      colophon_rows: [
        { label: 'A', value: '1' },
        { label: 'B', value: '2' },
        { label: 'C', value: '3' },
      ],
    }
    const result = generateColophon('本', '社', config)
    expect((result.match(/class="colophon-row"/g) || []).length).toBe(3)
  })

  test('colophon_rows が空配列のとき、行なしで生成される', () => {
    const result = generateColophon('本', '社', { colophon_rows: [] })
    expect(result).toContain('<div class="colophon-container">')
    expect(result).not.toContain('colophon-row')
  })

  test('colophon_rows が未定義のとき、後方互換の固定行（発行・表紙・印刷・連絡先）が生成される', () => {
    const result = generateColophon('本', 'テスト発行社', {})
    expect(result).toContain('発行')
    expect(result).toContain('テスト発行社')
    expect(result).toContain('表紙')
    expect(result).toContain('印刷')
    expect(result).toContain('連絡先')
  })
})
