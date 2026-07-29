# KV移行手順

既存KV Binding `COMMUNITY_STATUS` は作り直さなくて構いません。中のKeyを複数コミュニティ形式へ追加します。

## 新しいKey

- `communities:index` : `["shinagawa"]`
- `community:shinagawa` : コミュニティ基本情報
- `community:shinagawa:status` : 従来の `current-status` の内容
- `community:shinagawa:shop-requests` : 従来の申請データ

## 初期値

### communities:index
```json
["shinagawa"]
```

### community:shinagawa
```json
{
  "id": "shinagawa",
  "name": "品川飲食コミュニティ",
  "area": "品川・北品川・新馬場",
  "description": "品川エリアの飲食店が、リアルタイムの空席情報を共有しています。",
  "shopCount": 2,
  "status": "active",
  "createdAt": "2026-07-29T00:00:00.000Z",
  "updatedAt": "2026-07-29T00:00:00.000Z"
}
```

### community:shinagawa:status
現在の `current-status` の値をそのままコピーします。

### community:shinagawa:shop-requests
現在の店舗申請データをそのままコピーします。存在しなければ以下です。
```json
{"requests":[]}
```

## 注意

移行確認が終わるまで `current-status` など既存Keyは削除しないでください。
Workerには移行期間用として `/status` → `shinagawa` の互換ルートを残します。
