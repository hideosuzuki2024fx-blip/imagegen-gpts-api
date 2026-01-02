# imagegen-gpts-api

綾瀬写真館（ImageGen GPT）専用の API 定義リポジトリです。

このリポジトリには、以下の OpenAPI スキーマを収録しています：

| ファイル名 | 役割 |
|-------------|------|
| actions/openapi.imagegen-broker.yaml | Broker 方式の自己学習辞書 API |
| actions/openapi.github-contents.yaml | GitHub Contents API (GET/PUT) |
| actions/openapi.vercel-hook.yaml | Vercel Deploy Hook API |

各 GPTs で「Schema URL」に **Raw GitHub URL** を貼ることで即利用可能です。

例:  
https://raw.githubusercontent.com/hideosuzuki2024fx-blip/imagegen-gpts-api/main/actions/openapi.imagegen-broker.yaml
