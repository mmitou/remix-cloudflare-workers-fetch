const esbuild = require("esbuild");

esbuild
  .build({
    entryPoints: ["./src/index.ts"],
    bundle: true,
    sourcemap: false,
    format: "esm",
    outfile: "dist/index.mjs",
    external: ["./node_modules"],
  })
  .catch(() => process.exit(1));
