module.exports = {
  title: 'ゆめみ大技林 \'23',
  author: 'ゆめみ大技林製作委員会',
  language: 'ja',
  size: 'A5',
  theme: 'theme/theme_print.css',
  entry: [
    // 目次
    'index.md',
    // はじめに
    'preface.md',
    // 各章の原稿
    // iOS
    'xcode_cloud_transition.md',
    'miharun.md',
    'grpc.md',
    'komiya.md',
    // Android
    'jetpackcompose_animation.md',
    'doggy.md',
    'emoto.md',
    // Futter
    'flutter_code.md',
    // その他
    'mrs1669_machine_spec.md',
    'usami_automaton.md',
    'yusuga_markdown-to-typesetting-pdf.md',
    // 紹介
    'yumemi.md',
    'authors.md',
    // 奥付
    'colophon.md'
  ],
  entryContext: './manuscripts',
  output: [
    'output/ebook.pdf',
  ],
  workspaceDir: '.vivliostyle',
  toc: false,
  cover: undefined,
}
