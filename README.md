# community_prot コミュニティ一覧対応版

## 今回の構成

```text
community_prot/
├─ index.html          # コミュニティ一覧
├─ community.html      # 店舗・空席一覧
├─ communities.json    # コミュニティ設定
├─ communities.js      # 一覧画面処理
├─ community.js        # 店舗一覧画面処理
└─ style.css           # 共通デザイン
```

## GitHub Pagesへの反映

現在のリポジトリ直下に、この6ファイルを配置してください。

- 既存の `index.html` は、今回の `community.html` 相当になります。
- 今回の `index.html` が新しいコミュニティ一覧ページです。
- 既存の `script.js` は使用しないため、残しても問題ありませんが削除して構いません。
- `status.json` もWorkerを利用しているなら画面からは使用しません。

## URL

コミュニティ一覧:

```text
https://kamu0907.github.io/community_prot/
```

品川コミュニティ:

```text
https://kamu0907.github.io/community_prot/community.html?id=shinagawa
```

## 現在のWorkerを壊さない設計

`communities.json` の `apiUrl` に、現在利用中のWorker URLを設定しています。

```json
"apiUrl": "https://tight-snowflake-f83f.kameyama.workers.dev/status"
```

そのため、LINEから更新している現在の品川の空席データを、そのまま表示できます。
WorkerコードやKV構造の変更は不要です。

## コミュニティを追加するとき

まず `communities.json` にカードを追加します。

```json
{
  "id": "kamata",
  "name": "蒲田飲食コミュニティ",
  "area": "蒲田・京急蒲田",
  "description": "蒲田エリアの飲食店コミュニティです。",
  "shopCount": 0,
  "status": "preparing",
  "apiUrl": ""
}
```

準備中は `status` を `preparing` にします。公開時は `active` に変更し、専用WorkerのURLを `apiUrl` に設定します。

## shopCountについて

現在は一覧表示用の固定値です。品川の掲載店舗数に合わせて `communities.json` の `shopCount` を変更してください。

将来Workerを複数コミュニティ対応にした段階で、APIから自動取得する形に変更できます。
