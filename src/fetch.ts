import { createRequestHandler } from "@remix-run/server-runtime";
import type { ServerBuild } from "@remix-run/server-runtime";
import type { Options as KvAssetHandlerOptions } from "@cloudflare/kv-asset-handler";
import {
  getAssetFromKV,
  MethodNotAllowedError,
  NotFoundError,
} from "@cloudflare/kv-asset-handler";

interface Env {
  __STATIC_CONTENT: any;
}

interface Context {
  waitUntil: (a: Promise<any>) => void;
}

export type Mode = "development" | "production" | "test";

const createAssetHandler = (
  build: ServerBuild,
  assetManifest: any,
  mode?: Mode,
  options?: Partial<KvAssetHandlerOptions>
) => {
  return async (request: Request, env: Env, { waitUntil }: Context) => {
    try {
      const event = {
        request,
        waitUntil,
      };

      if (mode === "development") {
        return await getAssetFromKV(event, {
          cacheControl: {
            bypassCache: true,
          },
          ...options,
        });
      }

      let cacheControl = {};
      const url = new URL(request.url);
      const assetpath = build.assets.url.split("/").slice(0, -1).join("/");
      const requestpath = url.pathname.split("/").slice(0, -1).join("/");

      if (requestpath.startsWith(assetpath)) {
        cacheControl = {
          bypassCache: false,
          edgeTTL: 31536000,
          browserTTL: 31536000,
        };
      } else {
        cacheControl = {
          bypassCache: false,
          edgeTTL: 31536000,
        };
      }

      const opts = {
        ASSET_NAMESPACE: env.__STATIC_CONTENT,
        ASSET_MANIFEST: assetManifest,
        cacheControl,
        ...options,
      };

      return await getAssetFromKV(event, opts);
    } catch (error) {
      if (
        error instanceof MethodNotAllowedError ||
        error instanceof NotFoundError
      ) {
        return null;
      }

      throw error;
    }
  };
};

interface createFetchArgs {
  build: ServerBuild;
  assetJson: string;
  mode?: Mode;
  options?: Partial<KvAssetHandlerOptions>;
}

/**
 * Returns a fetch function for cloudflare worker module.
 */
export const createFetch = ({
  build,
  assetJson,
  mode,
  options,
}: createFetchArgs) => {
  const assetManifest = JSON.parse(assetJson);
  const handleAsset = createAssetHandler(build, assetManifest, mode, options);
  const handleRequest = createRequestHandler(build, mode);

  return async (request: Request, env: any, ctx: Context) => {
    try {
      let response = await handleAsset(request, env, ctx);
      if (!response) {
        response = await handleRequest(request, env);
      }
      return response;
    } catch (e: any) {
      if (mode === "development") {
        return new Response(e.message || e.toString(), {
          status: 500,
        });
      }

      return new Response("Internal Error", { status: 500 });
    }
  };
};
