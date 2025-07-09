// biome-ignore lint/style/useNodejsImportProtocol: プロジェクトの都合で CommonJS を使用するため
const fs = require('fs')
const { PDFDocument } = require('pdf-lib')

/**
 * 本文 PDF に表紙画像を挿入するスクリプト
 *
 * 本文 PDF の `book/output/ebook.pdf` と表紙画像の `book/cover/cover.png` が存在する時、
 * 表紙画像を挿入した PDF `book/output/ebook_covered.pdf` を生成します。
 *
 * 表紙画像は本文と製作タイミングが異なる、手動で挿入したい場合も想定できるので、任意機能です。
 *
 */

// 本文 PDF のパス（入力）
const pdfPath = 'book/output/ebook.pdf'

// 表紙画像 のパス（入力）
const imagePath = 'book/cover/cover.png'

// 表紙画像を挿入した後の PDF のパス（出力）
const outputPath = 'book/output/ebook_covered.pdf'

// A5 のサイズ
const pageWidth = 419.53
const pageHeight = 595.25

/**
 * PDF に表紙画像を挿入する
 */
const insertImageAsFirstPage = async () => {
  // ファイルの存在を確認する
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF file "${pdfPath}" does not exist.`)
  }
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image file "${imagePath}" does not exist.`)
  }

  // PDFを読み込む
  const pdfBytes = fs.readFileSync(pdfPath)
  const pdfDoc = await PDFDocument.load(pdfBytes)

  // 画像を読み込む
  const imageBytes = fs.readFileSync(imagePath)

  // 画像を埋め込む (PNG/JPEGを自動判別)
  const embeddedImage = imagePath.endsWith('.png')
    ? await pdfDoc.embedPng(imageBytes)
    : imagePath.endsWith('.jpg') || imagePath.endsWith('.jpeg')
      ? await pdfDoc.embedJpg(imageBytes)
      : (() => {
          throw new Error('Unsupported image format. Use PNG or JPG.')
        })()

  // 新しいページを最初のページに作成する (ページサイズを指定)
  const newPage = pdfDoc.insertPage(0, [pageWidth, pageHeight])

  // 画像をページ全体にスケーリングして描画する
  newPage.drawImage(embeddedImage, {
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
  })

  // PDFを保存
  const newPdfBytes = await pdfDoc.save()
  fs.writeFileSync(outputPath, newPdfBytes)
}

// 表紙画像を挿入する
insertImageAsFirstPage().catch((err) => {
  console.warn(err.message)
})
