import { createRequestHandler as createRemixRequestHandler } from "@remix-run/server-runtime";
import type { ServerBuild } from "@remix-run/server-runtime";
import type { Options as KvAssetHandlerOptions } from "@cloudflare/kv-asset-handler";
import {
  getAssetFromKV,
  MethodNotAllowedError,
  NotFoundError,
} from "@cloudflare/kv-asset-handler";

interface StaticContentEnv {
  __STATIC_CONTENT: any;
}

export interface GetLoadContextFunction<Env = unknown> {
  (request: Request, env: Env, ctx: ExecutionContext): Record<string, any>;
}

export type Mode = "development" | "production" | "test";

const createRequestHandler = <Env extends object>({
  build,
  getLoadContext,
  mode,
}: {
  build: ServerBuild;
  getLoadContext?: GetLoadContextFunction<Env>;
  mode?: Mode;
}): ExportedHandlerFetchHandler<Env> => {
  const handleRequest = createRemixRequestHandler(build, mode);

  return (request: Request, env: Env, ctx: ExecutionContext) => {
    if (getLoadContext) {
      const appLoadContext = getLoadContext(request, env, ctx);
      return handleRequest(request, { ...appLoadContext, ...env, ...ctx });
    }

    return handleRequest(request, { ...env, ...ctx });
  };
};

const createAssetHandler = (
  build: ServerBuild,
  assetManifest: any,
  mode?: Mode,
  options?: Partial<KvAssetHandlerOptions>
) => {
  return async <Env extends StaticContentEnv>(
    request: Request,
    env: Env,
    { waitUntil }: ExecutionContext
  ) => {
    try {
      const event = {
        request,
        waitUntil,
      };

      if (mode === "development") {
        return await getAssetFromKV(event, {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: assetManifest,
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

      return await getAssetFromKV(event, {
        ASSET_NAMESPACE: env.__STATIC_CONTENT,
        ASSET_MANIFEST: assetManifest,
        cacheControl,
        ...options,
      });
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

/**
 * Returns a fetch function for cloudflare worker module.
 */
export const createFetch = ({
  build,
  assetJson,
  mode,
  options,
  getLoadContext,
}: {
  build: ServerBuild;
  assetJson: string;
  mode?: Mode;
  options?: Partial<KvAssetHandlerOptions>;
  getLoadContext?: GetLoadContextFunction;
}) => {
  const assetManifest = JSON.parse(assetJson);
  const handleAsset = createAssetHandler(build, assetManifest, mode, options);
  const handleRequest = createRequestHandler({ build, getLoadContext, mode });

  return async <Env extends StaticContentEnv>(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ) => {
    try {
      let response = await handleAsset(request, env, ctx);
      if (!response) {
        response = await handleRequest(request, env, ctx);
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
