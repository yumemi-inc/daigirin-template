import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  parseFrontMatter,
  resolveArticleTitle,
  resolveArticleAuthor,
  applyTemplate,
  getArticlesTocLabel,
  generateIndex,
  generateAuthors,
  generateColophon,
} = require('../generate-manuscripts-utils.cts') as {
  parseFrontMatter: (content: string) => Record<string, unknown>
  resolveArticleTitle: (
    frontMatter: Record<string, unknown>,
    content: string,
    fileName: string,
  ) => string
  resolveArticleAuthor: (frontMatter: Record<string, unknown>) => string
  applyTemplate: (template: string, values: Record<string, string>) => string
  getArticlesTocLabel: (
    article: { file: string; title: string; author: string },
    generateConfig: Record<string, unknown>,
  ) => string
  generateIndex: (
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
  ) => string
  generateAuthors: (
    articles: Array<{
      file: string
      frontMatter: Record<string, unknown>
      title: string
      author: string
    }>,
    generateConfig: Record<string, unknown>,
  ) => string
  generateColophon: (
    bookTitle: string,
    publisherName: string,
    generateConfig: Record<string, unknown>,
  ) => string
}

describe('parseFrontMatter', () => {
  test('front matter を正しくパースできる', () => {
    const content = [
      '---',
      'title: タイトル',
      'author: 著者',
      '---',
      '',
      '本文',
    ].join('\n')
    expect(parseFrontMatter(content)).toEqual({
      title: 'タイトル',
      author: '著者',
    })
  })

  test('front matter がない場合は空オブジェクトを返す', () => {
    expect(parseFrontMatter('# 見出し\n\n本文')).toEqual({})
  })

  test('CRLF の front matter もパースできる', () => {
    const content = '---\r\ntitle: タイトル\r\n---\r\n\r\n本文'
    expect(parseFrontMatter(content)).toEqual({ title: 'タイトル' })
  })
})

describe('resolveArticleTitle', () => {
  test('front matter の title を優先して使う', () => {
    const result = resolveArticleTitle(
      { title: 'FMタイトル' },
      '---\ntitle: FMタイトル\n---\n\n# H1タイトル',
      'sample.md',
    )
    expect(result).toBe('FMタイトル')
  })

  test('front matter の title がなければ H1 を記事タイトルとして使う', () => {
    const result = resolveArticleTitle(
      {},
      ['---', 'author: 著者', '---', '', '# 記事タイトル', '本文'].join('\n'),
      'sample.md',
    )
    expect(result).toBe('記事タイトル')
  })

  test('front matter も H1 もない場合はファイル名（拡張子なし）を使う', () => {
    const result = resolveArticleTitle({}, '本文のみ', 'my-article.md')
    expect(result).toBe('my-article')
  })
})

describe('resolveArticleAuthor', () => {
  test('front matter の author を返す', () => {
    expect(resolveArticleAuthor({ author: '著者名' })).toBe('著者名')
  })

  test('author がない場合は空文字を返す', () => {
    expect(resolveArticleAuthor({})).toBe('')
  })

  test('author が文字列以外の場合は空文字を返す', () => {
    expect(resolveArticleAuthor({ author: 123 })).toBe('')
  })
})

describe('applyTemplate', () => {
  test('複数の変数を置換できる', () => {
    const result = applyTemplate('{title}({author})[{file}]', {
      title: '記事タイトル',
      author: '著者名',
      file: 'sample',
    })
    expect(result).toBe('記事タイトル(著者名)[sample]')
  })

  test('同じ変数が複数箇所にある場合も全て置換する', () => {
    const result = applyTemplate('{title} - {title}', { title: 'ABC' })
    expect(result).toBe('ABC - ABC')
  })
})

describe('getArticlesTocLabel', () => {
  test('articles_toc テンプレートの変数を展開できる', () => {
    const result = getArticlesTocLabel(
      { file: 'sample.md', title: '記事タイトル', author: '著者名' },
      { articles_toc: '{title}({author})' },
    )
    expect(result).toBe('記事タイトル(著者名)')
  })

  test('articles_toc で {file} を拡張子なしで展開できる', () => {
    const result = getArticlesTocLabel(
      { file: 'sample-file.md', title: '記事タイトル', author: '著者名' },
      { articles_toc: '{file}:{title}' },
    )
    expect(result).toBe('sample-file:記事タイトル')
  })

  test('articles_toc が未設定の場合は title を既定値として使う', () => {
    const result = getArticlesTocLabel(
      { file: 'sample.md', title: '記事タイトル', author: '著者名' },
      {},
    )
    expect(result).toBe('記事タイトル')
  })
})

describe('generateIndex', () => {
  test('articles_toc 設定を反映する', () => {
    const result = generateIndex(
      [
        {
          file: 'sample.md',
          frontMatter: {},
          title: '記事タイトル',
          author: '著者名',
        },
      ],
      '書籍タイトル',
      [{ type: 'articles' }],
      { articles_toc: '{title}({author})' },
    )
    expect(result).toContain('[記事タイトル(著者名)](../articles/sample.html)')
  })

  test('page アイテムのリンクを含む', () => {
    const result = generateIndex(
      [],
      '書籍タイトル',
      [{ type: 'page', title: 'はじめに', file: 'pages/preface.html' }],
      {},
    )
    expect(result).toContain('[はじめに](../pages/preface.html)')
  })

  test('書籍タイトルを H1 として含む', () => {
    const result = generateIndex([], 'テスト本', [], {})
    expect(result).toContain('# テスト本')
  })
})

describe('generateAuthors', () => {
  test('著者のセクションを生成する', () => {
    const result = generateAuthors(
      [
        {
          file: 'article.md',
          frontMatter: { profile: '自己紹介文' },
          title: '記事タイトル',
          author: '著者名',
        },
      ],
      {},
    )
    expect(result).toContain('著者名')
    expect(result).toContain('自己紹介文')
  })

  test('author が空の記事はスキップする', () => {
    const result = generateAuthors(
      [{ file: 'article.md', frontMatter: {}, title: 'タイトル', author: '' }],
      {},
    )
    expect(result).toContain('著者情報がありません')
  })

  test('同一著者の複数記事をまとめる', () => {
    const result = generateAuthors(
      [
        {
          file: 'a.md',
          frontMatter: { profile: 'プロフィール' },
          title: '記事A',
          author: '著者X',
        },
        { file: 'b.md', frontMatter: {}, title: '記事B', author: '著者X' },
      ],
      {},
    )
    expect(result).toContain('記事A')
    expect(result).toContain('記事B')
    // 著者セクションは1つだけ
    expect(result.split('著者X').length - 1).toBe(1)
  })
})

describe('generateColophon', () => {
  test('書籍タイトルと発行者を含む', () => {
    const result = generateColophon('テスト本', '発行者名', {})
    expect(result).toContain('テスト本')
    expect(result).toContain('発行者名')
  })

  test('edition_history が未設定の場合は「初版」を使う', () => {
    const result = generateColophon('本', '発行者', {})
    expect(result).toContain('初版')
  })

  test('edition_history を反映する', () => {
    const result = generateColophon('本', '発行者', {
      edition_history: '第2版',
    })
    expect(result).toContain('第2版')
  })

  test('copyright_year を © 表示に含める', () => {
    const result = generateColophon('本', '発行者', { copyright_year: '2025' })
    expect(result).toContain('© 2025 発行者')
  })

  test('colophon_rows の内容を含む', () => {
    const result = generateColophon('本', '発行者', {
      colophon_rows: [{ label: '発行日', value: '2025年1月1日' }],
    })
    expect(result).toContain('発行日')
    expect(result).toContain('2025年1月1日')
  })
})
