import * as fs from 'node:fs'
import type { PDFPage } from 'pdf-lib'
import { PDFArray, PDFDocument, PDFName, PDFRef, StandardFonts } from 'pdf-lib'

const defaultTargetPath = 'book/output/ebook.pdf'
const mmToPt = (mm: number) => (mm * 72) / 25.4

// theme-techbook の既定に合わせる: マージンは 22mm、ノンブルは下部に配置
const footerMarginX = mmToPt(22)
const footerY = 10

function hasContentsProperty(
  value: unknown,
): value is { contents: Uint8Array } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'contents' in value &&
    (value as { contents?: unknown }).contents instanceof Uint8Array
  )
}

function getContentStreamBytes(page: PDFPage, context: unknown) {
  const node = page.node as { get: (name: unknown) => unknown }
  const lookupContext = context as { lookup: (ref: unknown) => unknown }
  const contents = node.get(PDFName.of('Contents'))
  if (!contents) {
    return 0
  }

  const resolved =
    contents instanceof PDFRef ? lookupContext.lookup(contents) : contents

  if (resolved instanceof PDFArray) {
    let total = 0
    for (let i = 0; i < resolved.size(); i += 1) {
      const stream = lookupContext.lookup(resolved.get(i))
      if (hasContentsProperty(stream)) {
        total += stream.contents.length
      }
    }
    return total
  }

  if (hasContentsProperty(resolved)) {
    return resolved.contents.length
  }

  return 0
}

async function stampBlankPageNumbers(targetPath: string) {
  if (!fs.existsSync(targetPath)) {
    throw new Error(`PDF file "${targetPath}" does not exist.`)
  }

  const pdfBytes = fs.readFileSync(targetPath)
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const pages = pdfDoc.getPages()
  const context = pdfDoc.context
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontSize = 9

  let stampedCount = 0

  pages.forEach((page, index) => {
    const streamBytes = getContentStreamBytes(page, context)
    if (streamBytes > 0) {
      return
    }

    const pageNumber = String(index + 1)
    const textWidth = font.widthOfTextAtSize(pageNumber, fontSize)
    const isOddPage = (index + 1) % 2 === 1
    const x = isOddPage
      ? page.getWidth() - footerMarginX - textWidth
      : footerMarginX

    page.drawText(pageNumber, {
      x,
      y: footerY,
      size: fontSize,
      font,
    })

    stampedCount += 1
  })

  if (stampedCount === 0) {
    return 0
  }

  const newPdfBytes = await pdfDoc.save()
  fs.writeFileSync(targetPath, newPdfBytes)
  return stampedCount
}

const targetPath = process.argv[2] || defaultTargetPath

stampBlankPageNumbers(targetPath)
  .then((count) => {
    if (count > 0) {
      console.log(
        `Stamped page numbers on ${count} blank page(s): ${targetPath}`,
      )
    } else {
      console.log(`No blank pages to stamp: ${targetPath}`)
    }
  })
  .catch((error: Error) => {
    console.error(error.message)
    process.exitCode = 1
  })
