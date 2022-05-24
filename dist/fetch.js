import { createRequestHandler as createRemixRequestHandler } from "@remix-run/server-runtime";
import { getAssetFromKV, MethodNotAllowedError, NotFoundError, } from "@cloudflare/kv-asset-handler";
const createRequestHandler = ({ build, getLoadContext, mode, }) => {
    const handleRequest = createRemixRequestHandler(build, mode);
    let loader = (_, env, ctx) => {
        return { ...env, ...ctx };
    };
    if (getLoadContext) {
        loader = getLoadContext;
    }
    return (request, env, ctx) => {
        const loadContext = loader(request, env, ctx);
        return handleRequest(request, loadContext);
    };
};
const createAssetHandler = (build, assetManifest, mode, options) => {
    return async (request, env, { waitUntil }) => {
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
            }
            else {
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
        }
        catch (error) {
            if (error instanceof MethodNotAllowedError ||
                error instanceof NotFoundError) {
                return null;
            }
            throw error;
        }
    };
};
/**
 * Returns a fetch function for cloudflare worker module.
 */
export const createFetch = ({ build, assetJson, mode, options, getLoadContext, }) => {
    const assetManifest = JSON.parse(assetJson);
    const handleAsset = createAssetHandler(build, assetManifest, mode, options);
    const handleRequest = createRequestHandler({ build, getLoadContext, mode });
    return async (request, env, ctx) => {
        try {
            let response = await handleAsset(request, env, ctx);
            if (!response) {
                response = await handleRequest(request, env, ctx);
            }
            return response;
        }
        catch (e) {
            if (mode === "development") {
                return new Response(e.message || e.toString(), {
                    status: 500,
                });
            }
            return new Response("Internal Error", { status: 500 });
        }
    };
};
