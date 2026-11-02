# 受験物理 Set Up（Astro）

独自Laravel CMSの公開APIをビルド時に読み込み、記事・固定ページ・カテゴリーを静的HTMLとして生成します。

## CMS連携

`.env.example` を `.env` にコピーし、CMSの公開URLを設定します。

```env
CMS_API_URL=https://cms.example.com
PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
PUBLIC_GOOGLE_ADSENSE_CLIENT_ID=ca-pub-1234567890123456
```

利用するAPI：

- `GET /api/v1/posts?limit=100`
- `GET /api/v1/pages?limit=100`
- `GET /api/v1/taxonomies`
- `GET/POST /api/v1/posts/{slug}/comments`
- `GET/POST /api/v1/pages/{slug}/comments`

`CMS_API_URL` が未設定、またはAPIへ接続できないローカル環境では、既存のサンプル記事へ自動的にフォールバックします。本番ビルドではCMS URLを必ず設定してください。

CMSのMarkdownは `remark-math` と `rehype-katex` で処理し、コードブロックはShikiでハイライトします。記事ごとのSEOタイトル、概要、canonical、noindex、アイキャッチ画像も反映します。

## コマンド

```sh
npm install
npm run dev
npm run build
npm run start
npx astro check
```

CMSで公開した内容を本番へ反映するには、CMSの公開Webhookからこのプロジェクトのデプロイビルドを起動してください。WebhookトークンはAstroの公開環境変数へ入れず、デプロイサービスまたはCMS側の秘密情報として管理します。

## GA4・Google AdSense

`.env` またはデプロイ環境に次の公開環境変数を設定すると、本番ビルドの全ページで有効になります。

- `PUBLIC_GA4_MEASUREMENT_ID`: GA4の測定ID（`G-` から始まる値）
- `PUBLIC_GOOGLE_ADSENSE_CLIENT_ID`: AdSenseのパブリッシャーID（`ca-pub-` から始まる値）

未設定または形式が正しくない場合は読み込みません。ローカル開発サーバーでも読み込まれないため、アクセス解析や広告表示の確認は本番ビルドで行ってください。AdSenseはサイト全体の自動広告に対応しています。個別の広告ユニットを配置する場合は、別途広告スロットIDを指定したコンポーネントを追加してください。

## 限定公開ページ

CMSで限定公開パスワードを設定した記事・固定ページは、AstroのSSRルートでパスワード入力フォームを表示します。CMSの記事設定で指定した限定公開パスワードだけを入力すると閲覧できます。

フォームで受け取ったパスワードはサーバー側でCMSの`X-Content-Password`ヘッダーへ変換し、そのリクエスト内だけで使用します。URL、Cookie、ローカルストレージ、静的HTMLには保存しません。限定公開レスポンスは`private, no-store`かつ`noindex`です。ページを再読み込みした場合は再入力が必要です。

SSRのため、本番環境では`node dist/server/entry.mjs`を実行できるNode.js環境が必要です。CMSとの通信は必ずHTTPSにしてください。
