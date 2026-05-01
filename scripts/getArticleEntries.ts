import * as fs from 'node:fs'
import { parse as parseYaml } from 'yaml'

/**
 * articles ディレクトリから記事エントリを取得する
 *
 * config/articles.yml が存在する場合はその順番に従い、
 * 存在しない場合は articles ディレクトリ内のファイルをアルファベット順で返します。
 *
 * @param articlesDir - articles ディレクトリのパス
 * @param configFile - articles.yml ファイルのパス（省略可能）
 * @returns 記事エントリのパス配列（"articles/filename.md" 形式）
 */
export function getArticleEntries(
  articlesDir: string,
  configFile?: string,
): string[] {
  if (!fs.existsSync(articlesDir)) {
    return []
  }

  const allFiles = fs
    .readdirSync(articlesDir)
    .filter((f) => f.endsWith('.md'))
    .sort()

  let orderedFiles: string[]

  if (configFile && fs.existsSync(configFile)) {
    const yamlContent = fs.readFileSync(configFile, 'utf8')
    const parsed = parseYaml(yamlContent)
    if (Array.isArray(parsed)) {
      orderedFiles = parsed as string[]
    } else {
      orderedFiles = allFiles
    }
  } else {
    orderedFiles = allFiles
  }

  return orderedFiles.map((f) => `articles/${f}`)
}
