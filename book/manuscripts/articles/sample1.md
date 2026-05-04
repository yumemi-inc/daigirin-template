---
class: content
author: サンプル1の著者
profile: |
  サンプル1の自己紹介です。文末にスペース２つを入れると改行されます（もしくは改行タグを設定してください）。  
  複数行プロフィールの例です。
---

<div class="doc-header">
  <div class="doc-title">サンプル1のタイトル</div>
  <div class="doc-author">サンプル1の著者</div>
</div>

# サンプル1のタイトル

このセクションは、通常の説明文を掲載するためのサンプルです。実際の原稿では、背景、目的、結論の順に記述すると読みやすくなります。

ここでは、章の冒頭に短い導入文を置く例を示しています。読者が次に何を読むのかを先に伝えることで、本文の理解が進みやすくなります。また、専門用語を使う場合は、初出で簡単な説明を添えると親切です。

続く段落では、具体例や注意点を整理して書くことを想定しています。箇条書きや図表を併用すると、情報の比較や要点の把握が容易になります。最後に、節のまとめを一文で示すと、内容の着地点が明確になります。

<!-- 強制改ページ -->
<hr class="page-break"/>

## サンプルコード

```ts
type Task = {
  title: string
  done: boolean
}

const tasks: Task[] = [
  { title: '原稿の見出しを整える', done: true },
  { title: '図表の番号を確認する', done: false },
  { title: '最終レビューを実施する', done: false },
]

const remaining = tasks.filter((task) => !task.done)
console.log(`未完了タスク: ${remaining.length}`)
```

## 進行状況テーブル

| 項目 | 状態 | 担当 | メモ |
| :-- | :-- | :-- | :-- |
| 原稿作成 | 完了 | 著者A | 初稿を提出済み |
| 技術確認 | 進行中 | 著者B | サンプルコードを見直し中 |
| 校正 | 未着手 | 編集者 | 用語統一ルールを適用予定 |

## 参考画像

![図版サンプル](./images_sample/sample_image.jpg)

<!-- 
マークダウン記法でも幅を指定することもできます。

![幅を 100 にした](./images_sample_chapter/sample_image.jpg){width=100}

HTML の img タグも利用できますが、図名・番号は表示されません
<img src="./images_sample_chapter/sample_image.jpg" width="100%" alt="altを設定しても、図名は表示されません" />
-->
