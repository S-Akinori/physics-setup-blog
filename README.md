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

限定本文は静的HTMLへ含めません。ブラウザからXserver上の`/api/content.php`へパスワードをPOSTし、PHPがCMSの`X-Content-Password`ヘッダーへ変換します。URL、Cookie、ローカルストレージには保存しません。ページを再読み込みした場合は再入力が必要です。

CMSとの通信は必ずHTTPSを使用します。デプロイ時にGitHub Actionsが`CMS_API_URL`から`dist/api/config.php`を生成し、`.htaccess`で外部アクセスを拒否します。

## Xserverへの自動デプロイ

`.github/workflows/deploy-xserver.yml`が、次のタイミングで静的サイトをビルドしてXserverへSSH転送します。

- `main`ブランチへのpush
- GitHub Actionsからの手動実行
- `cms-published`の`repository_dispatch`

GitHubリポジトリの`Settings > Secrets and variables > Actions`へ次を登録します。

- `CMS_API_URL`: 公開CMSのHTTPS URL
- `SITE_URL`: 公開サイトURL（例：`https://ryebourbon.xsrv.jp`）
- `PUBLIC_GA4_MEASUREMENT_ID`: GA4測定ID（例：`G-XXXXXXXXXX`）
- `PUBLIC_GOOGLE_ADSENSE_CLIENT_ID`: AdSenseパブリッシャーID（例：`ca-pub-1234567890123456`）
- `XSERVER_HOST`: `サーバーID.xsrv.jp`または`sv***.xserver.jp`
- `XSERVER_USER`: XserverのサーバーID
- `XSERVER_SSH_KEY`: Xserverへ登録した公開鍵に対応する秘密鍵
- `XSERVER_KNOWN_HOSTS`: サーバーパネルに表示されるSSHホスト鍵情報
- `XSERVER_DEPLOY_PATH`: `/home/サーバーID/対象ドメイン/public_html`

XserverのSSHポートは`10022`です。GitHub Actionsの実行元は国外IPになる場合があるため、接続できない場合はXserverのSSHアクセス制限を確認してください。

ワークフローは安全のため`--delete`を使用しません。WordPressからの初回切り替え前に必ずファイルとDBをバックアップし、可能ならステージング用サブドメインの`public_html`で確認してください。`index.html`と`.htaccess`の配置後はAstroが優先表示されます。動作確認後、残ったWordPressファイルはバックアップを確保してから手動で整理します。

CMSから自動更新する場合は、記事公開WebhookからGitHub APIへ次の`repository_dispatch`を送信します。

```json
{
  "event_type": "cms-published"
}
```
