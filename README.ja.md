[![npm version](https://badge.fury.io/js/angular2-expandable-list.svg)](https://badge.fury.io/js/angular2-expandable-list)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

# remix-cloudflare-workers-fetch

> cloudflare workersのfetch関数からremixを呼び出すためのプロジェクト

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

### remixアプリケーションのビルド

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

```
npx remix build
```


### module workerのビルド

workerディレクトリを作成してmodule workerを実装します。

worker/index.ts
```ts
import { createFetch } from "remix-cloudflare-workers-fetch";
import * as build from "../build";
//@ts-ignore
import assetJson from "__STATIC_CONTENT_MANIFEST";
import type { ServerBuild } from "@remix-run/server-runtime";

const fetch = createFetch({
  build: build as unknown as ServerBuild,
  assetJson,
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
```
npx ts-node build-worker.ts
```

### wranglerの設定変更

wrangler.tomlを以下の内容に変更して下さい。

```toml
name = "fetch-example"
main = "dist/index.mjs"

workers_dev = true
compatibility_date = "2022-05-15"

[site]
bucket = "./public"
```



















## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

## Installation

**BEFORE YOU INSTALL:** please read the [prerequisites](#prerequisites)

Start with cloning this repo on your local machine:

```sh
$ git clone https://github.com/ORG/PROJECT.git
$ cd PROJECT
```

To install and set up the library, run:

```sh
$ npm install -S myLib
```

Or if you prefer using Yarn:

```sh
$ yarn add --dev myLib
```

## Usage

### Serving the app

```sh
$ npm start
```

### Running the tests

```sh
$ npm test
```

### Building a distribution version

```sh
$ npm run build
```

This task will create a distribution version of the project
inside your local `dist/` folder

### Serving the distribution version

```sh
$ npm run serve:dist
```

This will use `lite-server` for servign your already
generated distribution version of the project.

*Note* this requires
[Building a distribution version](#building-a-distribution-version) first.

## API

### useBasicFetch

```js
useBasicFetch(url: string = '', delay: number = 0)
```

Supported options and result fields for the `useBasicFetch` hook are listed below.

#### Options

`url`

| Type | Default value |
| --- | --- |
| string | '' |

If present, the request will be performed as soon as the component is mounted

Example:

```tsx
const MyComponent: React.FC = () => {
  const { data, error, loading } = useBasicFetch('https://api.icndb.com/jokes/random');

  if (error) {
    return <p>Error</p>;
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="App">
      <h2>Chuck Norris Joke of the day</h2>
      {data && data.value && <p>{data.value.joke}</p>}
    </div>
  );
};
```

`delay`

| Type | Default value | Description |
| --- | --- | --- |
| number | 0 | Time in milliseconds |

If present, the request will be delayed by the given amount of time

Example:

```tsx
type Joke = {
  value: {
    id: number;
    joke: string;
  };
};

const MyComponent: React.FC = () => {
  const { data, error, loading } = useBasicFetch<Joke>('https://api.icndb.com/jokes/random', 2000);

  if (error) {
    return <p>Error</p>;
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="App">
      <h2>Chuck Norris Joke of the day</h2>
      {data && data.value && <p>{data.value.joke}</p>}
    </div>
  );
};
```

### fetchData

```js
fetchData(url: string)
```

Perform an asynchronous http request against a given url

```tsx
type Joke = {
  value: {
    id: number;
    joke: string;
  };
};

const ChuckNorrisJokes: React.FC = () => {
  const { data, fetchData, error, loading } = useBasicFetch<Joke>();
  const [jokeId, setJokeId] = useState(1);

  useEffect(() => {
    fetchData(`https://api.icndb.com/jokes/${jokeId}`);
  }, [jokeId, fetchData]);

  const handleNext = () => setJokeId(jokeId + 1);

  if (error) {
    return <p>Error</p>;
  }

  const jokeData = data && data.value;

  return (
    <div className="Comments">
      {loading && <p>Loading...</p>}
      {!loading && jokeData && (
        <div>
          <p>Joke ID: {jokeData.id}</p>
          <p>{jokeData.joke}</p>
        </div>
      )}
      {!loading && jokeData && !jokeData.joke && <p>{jokeData}</p>}
      <button disabled={loading} onClick={handleNext}>
        Next Joke
      </button>
    </div>
  );
};
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

1.  Fork it!
2.  Create your feature branch: `git checkout -b my-new-feature`
3.  Add your changes: `git add .`
4.  Commit your changes: `git commit -am 'Add some feature'`
5.  Push to the branch: `git push origin my-new-feature`
6.  Submit a pull request :sunglasses:

## Credits

TODO: Write credits

## Built With

* Dropwizard - Bla bla bla
* Maven - Maybe
* Atom - ergaerga
* Love

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags).

## Authors

* **John Doe** - *Initial work* - [JohnDoe](https://github.com/JohnDoe)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

[MIT License](https://andreasonny.mit-license.org/2019) © Andrea SonnY
