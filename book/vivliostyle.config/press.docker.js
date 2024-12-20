/**
 * Docker & 印刷入稿版向けの Vivliostyle 設定ファイル
 * 
 * @description
 * - Docker & 印刷入稿版に関する設定です
 * - 印刷入稿版に関する設定は press.js を編集してください
 */
const config = require('./press.js')
module.exports = {
    ...config,
    output: {
        ...config.output,
        preflight: 'press-ready',
    },
}
