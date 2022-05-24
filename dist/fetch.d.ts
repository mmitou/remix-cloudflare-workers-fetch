/// <reference types="@cloudflare/workers-types" />
import type { AppLoadContext, ServerBuild } from "@remix-run/server-runtime";
import type { Options as KvAssetHandlerOptions } from "@cloudflare/kv-asset-handler";
interface StaticContentEnv {
    __STATIC_CONTENT: any;
}
export interface GetLoadContextFunction<Env = unknown> {
    (request: Request, env: Env, ctx: ExecutionContext): AppLoadContext;
}
export declare type Mode = "development" | "production" | "test";
/**
 * Returns a fetch function for cloudflare worker module.
 */
export declare const createFetch: ({ build, assetJson, mode, options, getLoadContext, }: {
    build: ServerBuild;
    assetJson: string;
    mode?: Mode | undefined;
    options?: Partial<KvAssetHandlerOptions> | undefined;
    getLoadContext?: GetLoadContextFunction<unknown> | undefined;
}) => <Env extends StaticContentEnv>(request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>;
export {};
