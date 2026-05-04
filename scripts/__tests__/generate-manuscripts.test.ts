import * as fs from 'node:fs'
import { createRequire } from 'node:module'
import * as os from 'node:os'
import * as path from 'node:path'

const require = createRequire(import.meta.url)
const { loadGenerateConfig } = require('../generate-manuscripts.cts') as {
  loadGenerateConfig: (configPath: string) => Record<string, unknown>
}

describe('loadGenerateConfig', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'daigirin-generate-config-test-'),
    )
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  const configPath = () => path.join(tmpDir, 'generate.yml')

  test('generate.yml を読み込んでオブジェクトを返す', () => {
    fs.writeFileSync(configPath(), 'articles_toc: "{title}({author})"\n')
    const result = loadGenerateConfig(configPath())
    expect(result).toEqual({ articles_toc: '{title}({author})' })
  })

  test('ファイルが存在しない場合は空オブジェクトを返す', () => {
    const result = loadGenerateConfig(path.join(tmpDir, 'missing.yml'))
    expect(result).toEqual({})
  })

  test('YAML の内容がオブジェクトでない場合は空オブジェクトを返す', () => {
    fs.writeFileSync(configPath(), '- item1\n- item2\n')
    const result = loadGenerateConfig(configPath())
    expect(result).toEqual({})
  })

  test('空ファイルの場合は空オブジェクトを返す', () => {
    fs.writeFileSync(configPath(), '')
    const result = loadGenerateConfig(configPath())
    expect(result).toEqual({})
  })
})
