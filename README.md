# コミュニティ一覧統合版

修正前の申請・管理機能とデザインを残したまま、コミュニティ一覧を追加した版です。

## 配置方法

ZIP内のファイルをGitHub Pagesのリポジトリ直下へすべて上書き・追加してください。
既存ファイルを個別に削除する必要はありません。

## 主なURL

- `index.html`：コミュニティ一覧
- `community.html?id=shinagawa`：品川コミュニティ
- `request.html`：店舗掲載申請
- `admin-login.html`：管理者ログイン
- `admin-requests.html`：申請管理

## API

既存の以下のAPIを変更せず利用します。

- `GET /status`
- `POST /shop-requests`
- `GET /shop-requests`
- `POST /admin/login`
- `POST /admin/shop-requests/{requestId}/approve`

## 注意

`communities.json`の`shopCount`は一覧カード表示用の固定値です。店舗数が変わった場合は数値を更新してください。
