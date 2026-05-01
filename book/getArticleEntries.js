const fs = require('node:fs')
const { parse: parseYaml } = require('yaml')

/**
 * articles ディレクトリから記事エントリを取得する
 *
 * config/articles.yml が存在する場合はその順番に従い、
 * 存在しない場合は articles ディレクトリ内のファイルをアルファベット順で返します。
 *
 * @param {string} articlesDir - articles ディレクトリのパス
 * @param {string} [configFile] - articles.yml ファイルのパス（省略可能）
 * @returns {string[]} 記事エントリのパス配列（"articles/filename.md" 形式）
 */
function getArticleEntries(articlesDir, configFile) {
  if (!fs.existsSync(articlesDir)) {
    return []
  }

  const allFiles = fs
    .readdirSync(articlesDir)
    .filter((f) => f.endsWith('.md'))
    .sort()

  let orderedFiles

  if (configFile && fs.existsSync(configFile)) {
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

module.exports = { getArticleEntries }
