[![npm version](https://badge.fury.io/js/angular2-expandable-list.svg)](https://badge.fury.io/js/angular2-expandable-list)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

# remix-cloudflare-workers-fetch

> remix server adapter for cloudflare workers worker module.

You can use remix from the worker module of cloudflare workers.  
Implement the worker as follows and call the createFetch function.  

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

This section describes the modifications required to call remix from the fetch function.    
This article will use as an example a remix project created using the following method.

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

### remix application settings

Make the following modifications to prevent remix build from creating workers for cloudflare workers.  

- Remove server from remix.config.js

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
Execute the following command.  
The remix server module will be created in build directory.

```sh
npx remix build
```


### module worker settings

Create worker directory and implement the module worker.

```sh
mkdir worker
touch worker/index.ts
```

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

Worker/index.ts is built with esbuild.  
Create the following file.

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

Execute the following command.  
A module worker will be created in the dist directory.

```sh
npx ts-node build-worker.ts
```

### wrangler settings

Change wrangler.toml to the following.

```toml
name = "fetch-example"
main = "dist/index.mjs"

workers_dev = true
compatibility_date = "2022-05-15"

[site]
bucket = "./public"
```

## check

Please confirm that REMIX starts up with the following command.

```sh
wrangler login
wrangler dev
```