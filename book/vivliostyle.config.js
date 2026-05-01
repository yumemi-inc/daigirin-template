const fs = require('node:fs')
const path = require('node:path')
const { parse: parseYaml } = require('yaml')

/**
 * articles ディレクトリから記事エントリを取得する
 *
 * config/articles.yml が存在する場合はその順番に従い、
 * 存在しない場合は articles ディレクトリ内のファイルをアルファベット順で返します。
 *
 * @returns 記事エントリのパス配列（"articles/filename.md" 形式）
 */
function getArticleEntries() {
  const manuscriptsDir = path.resolve(__dirname, 'manuscripts')
  const articlesDir = path.join(manuscriptsDir, 'articles')
  const configFile = path.join(manuscriptsDir, 'config', 'articles.yml')

  if (!fs.existsSync(articlesDir)) {
    return []
  }

  const allFiles = fs
    .readdirSync(articlesDir)
    .filter((f) => f.endsWith('.md'))
    .sort()

  let orderedFiles

  if (fs.existsSync(configFile)) {
    const yamlContent = fs.readFileSync(configFile, 'utf8')
    const parsed = parseYaml(yamlContent)
    if (Array.isArray(parsed)) {
      orderedFiles = parsed
    } else {
      orderedFiles = allFiles
    }
  } else {
    orderedFiles = allFiles
  }

  return orderedFiles.map((f) => `articles/${f}`)
}

module.exports = {
  title: 'ゆめみより ' /*\'23'*/,
  author: 'ゆめみより製作委員会',
  language: 'ja',
  size: 'A5',
  theme: [
    'vivliostyle-theme-macneko-techbook@0.5.0',
    '@mitsuharu/vivliostyle-theme-noto-sans-jp@0.1.4',
    'theme/theme-custom',
  ],
  entry: [
    // 目次
    'pages/index.md',
    // はじめに
    'pages/preface.md',
    // 各章の原稿（articles ディレクトリから自動取得）
    ...getArticleEntries(),

    // 著者紹介
    'pages/authors.md',
    // 奥付
    'pages/colophon.md',
  ],
  entryContext: './manuscripts',
  output: ['output/ebook.pdf'],
  workspaceDir: '.vivliostyle',
  toc: false,
  cover: undefined,
}
