// Docker 向けの印刷入稿版の設定ファイル
const config = require('./vivliostyle.config.js')
module.exports = {
  ...config,
  theme: [...config.theme, 'theme/theme-press'],
  output: {
    path: './output/press.pdf',
    preflight: 'press-ready',
    preflightOption: ['gray-scale'],
  },
}
