# community_prot 複数コミュニティ対応 v2

## 公開画面
- `index.html` 公開コミュニティ一覧
- `community-create.html` コミュニティ作成
- `community.html?id=shinagawa` 各コミュニティの店舗・空席一覧
- `request.html?communityId=shinagawa` 店舗掲載申請

公開画面から管理者画面へのリンクは削除しています。管理者は従来どおり `admin-login.html` を直接開きます。

## コミュニティ作成フロー
1. 誰でも作成フォームを送信可能
2. KVへ `status: pending` で保存
3. 作成者へコミュニティIDと管理コードを表示
4. 運営が確認して `status: active` に変更
5. 一覧へ表示

## Worker
`worker-multi-community.example.js` は複数コミュニティ用ルートの参考実装です。
現在のWorkerにあるLINE webhook、管理者ログイン、申請承認処理を残した上で統合してください。

## KV
`KV-MIGRATION.md` に既存品川データを消さずに移行する手順があります。
