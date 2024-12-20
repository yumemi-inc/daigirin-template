/**
 * local および Docker に共通する印刷入稿版向けの Vivliostyle 設定ファイル
 * 
 * @description
 * - この設定ファイルで build せず、local と Docker それぞれの設定ファイルを利用してください
 * - 仮値は Docker 側に寄せて、もし誤って利用されても、設定で事故しないようにしてください
 * - vivliostyle-cli で実行する時は、システム的にアクセス制限はできないので、注意してください
 */
const config = require('./index.js')
module.exports = {
    ...config,
    theme: [
        ...config.theme,
        '../theme/theme-press.css',
    ],
    output: {
        path: '../output/press.pdf',
        preflight: 'press-ready',
        preflightOption: [
            'gray-scale',
        ],
    },
}
