/**
 * 電子版向けの Vivliostyle 設定ファイル
 */
const config = require('./index.js')
module.exports = {
    ...config,
    output: [
      '../output/ebook.pdf',
    ],
}
