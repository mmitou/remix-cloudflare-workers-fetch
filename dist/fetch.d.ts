/// <reference types="@cloudflare/workers-types" />
import type { ServerBuild } from "@remix-run/server-runtime";
import type { Options as KvAssetHandlerOptions } from "@cloudflare/kv-asset-handler";
interface Context {
    waitUntil: (a: Promise<any>) => void;
}
export declare type Mode = "development" | "production" | "test";
interface createFetchArgs {
    build: ServerBuild;
    assetJson: string;
    mode?: Mode;
    options?: Partial<KvAssetHandlerOptions>;
}
/**
 * Returns a fetch function for cloudflare worker module.
 */
export declare const createFetch: ({ build, assetJson, mode, options, }: createFetchArgs) => (request: Request, env: any, ctx: Context) => Promise<Response>;
export {};
