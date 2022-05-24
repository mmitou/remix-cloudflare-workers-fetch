[![npm version](https://badge.fury.io/js/angular2-expandable-list.svg)](https://badge.fury.io/js/angular2-expandable-list)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

# remix-cloudflare-workers-fetch

> remix server adapter for cloudflare workers worker module.

cloudflare workersのworker moduleからremixを使えるようにしました。  
workerを以下のように実装して、createFetch関数を呼び出して下さい。  

worker/index.ts  
```ts
import { createFetch } from "remix-cloudflare-workers-fetch";
import type { ServerBuild } from "remix-cloudflare-workers-fetch";
import * as build from "../build";
//@ts-ignore
import assetJson from "__STATIC_CONTENT_MANIFEST";


const fetch = createFetch({
  build: build as unknown as ServerBuild,
  assetJson,
  mode: "production",
  options: {
    cacheControl: {
      bypassCache: true,
    }
  }
});

export default {
  fetch,
};
```


## Install

```sh
npm install remix-cloudflare-workers-fetch
```

## Usage

fetch関数からremixを呼び出すために必要な修正について説明します。  
この記事では以下の方法で作成したremixのプロジェクトを例にします。

```sh
npx create-remix@latest
? Where would you like to create your app? fetch-example
? What type of app do you want to create? Just the basics
? Where do you want to deploy? Choose Remix if you're unsure; it's easy to change deployment targets. Cloudflare Workers
? Do you want me to run `npm install`? Yes
...
? TypeScript or JavaScript? TypeScript

cd fetch-example

npm i -D wrangler@latest esbuild ts-node
npx wrangler -v
2.0.5

npm i remix-cloudflare-workers-fetch
```

### remixアプリケーションの設定

cloudflare workersのworkerをremix buildが作成しないようにするため、以下の修正をします。  

- remix.config.jsからserverを削除する

```js
/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
  serverBuildTarget: "cloudflare-workers",
  // server: "./server.js", 
  devServerBroadcastDelay: 1000,
  ignoredRouteFiles: ["**/.*"],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // serverBuildPath: "build/index.js",
  // publicPath: "/build/",
};
```

以下のコマンドを実行して下さい。  
remixサーバーのモジュールがbuildディレクトリに作成されます。

```sh
npx remix build
```


### module workerの設定

workerディレクトリを作成してmodule workerを実装します。

worker/index.ts
```ts
import { createFetch } from "remix-cloudflare-workers-fetch";
import type { ServerBuild } from "remix-cloudflare-workers-fetch";
import * as build from "../build";
//@ts-ignore
import assetJson from "__STATIC_CONTENT_MANIFEST";

const fetch = createFetch({
  build: build as unknown as ServerBuild,
  assetJson,
  mode: "production",
  options: {
    cacheControl: {
      bypassCache: true,
    }
  }
});

export default {
  fetch,
};
```

worker/index.tsはesbuildでbuildします。  
以下のファイルを作成して下さい。

build-worker.ts
```ts
import { build } from "esbuild";

build({
  entryPoints: ["./worker/index.ts"],
  bundle: true,
  sourcemap: true,
  format: "esm",
  outfile: "dist/index.mjs",
  minify: true,
  external: ["__STATIC_CONTENT_MANIFEST"],
}).catch(() => process.exit(1));
```

以下のコマンドを実行して下さい。  
distディレクトリにmodule workerが作成されます。
```sh
npx ts-node build-worker.ts
```

### wranglerの設定

wrangler.tomlを以下の内容に変更して下さい。

```toml
name = "fetch-example"
main = "dist/index.mjs"

workers_dev = true
compatibility_date = "2022-05-15"

[site]
bucket = "./public"
```

## 動作確認

以下のコマンドでremixが立ち上がる事を確認して下さい。

```sh
wrangler login
wrangler dev
```