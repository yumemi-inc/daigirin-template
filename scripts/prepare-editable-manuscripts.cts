#!/usr/bin/env node

/**
 * generated ディレクトリの自動生成ファイルを edited ディレクトリへコピーし、
 * 手動編集を分離できるようにするスクリプト。
 */

const fs = require('node:fs')
const path = require('node:path')

const manuscriptsDir = path.join(__dirname, '../book/manuscripts')
const generatedDir = path.join(manuscriptsDir, 'generated')
const editedDir = path.join(manuscriptsDir, 'edited')

function parseOptions(argv: string[]) {
  return {
    force: argv.includes('--force'),
  }
}

function copyGeneratedToEdited(options: { force: boolean }) {
  if (!fs.existsSync(generatedDir)) {
    console.log('Skipped: manuscripts/generated does not exist.')
    return { copied: 0, skipped: 0 }
  }

  fs.mkdirSync(editedDir, { recursive: true })

  const targetFiles = fs
    .readdirSync(generatedDir)
    .filter((file: string) => file.endsWith('.md'))

  let copied = 0
  let skipped = 0

  for (const fileName of targetFiles) {
    const sourcePath = path.join(generatedDir, fileName)
    const targetPath = path.join(editedDir, fileName)

    if (!options.force && fs.existsSync(targetPath)) {
      console.log(`Skipped: manuscripts/edited/${fileName} (already exists)`)
      skipped += 1
      continue
    }

    fs.copyFileSync(sourcePath, targetPath)
    console.log(`Copied: manuscripts/edited/${fileName}`)
    copied += 1
  }

  return { copied, skipped }
}

if (require.main === module) {
  const options = parseOptions(process.argv.slice(2))
  const result = copyGeneratedToEdited(options)

  console.log(`Mode: ${options.force ? 'force' : 'safe'}`)
  console.log(`Copied ${result.copied} file(s).`)
  console.log(`Skipped ${result.skipped} file(s).`)
}

module.exports = { copyGeneratedToEdited, parseOptions }
