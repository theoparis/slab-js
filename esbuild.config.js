import fs from "fs";
import path from "path";
import htmlPlugin from "@chialab/esbuild-plugin-html";
import { buildSpinnerPlugin } from "@theoparis/esbuild-plugins";
import esbuild from "esbuild";
import { wasmLoader } from "esbuild-plugin-wasm";

let wasmPlugin = {
    name: "wasm",
    setup(build) {
        // Resolve ".wasm" files to a path with a namespace
        build.onResolve({ filter: /\.wasm$/ }, (args) => {
            // If this is the import inside the stub module, import the
            // binary itself. Put the path in the "wasm-binary" namespace
            // to tell our binary load callback to load the binary file.
            if (args.namespace === "wasm-stub") {
                return {
                    path: args.path,
                    namespace: "wasm-binary"
                };
            }

            // Otherwise, generate the JavaScript stub module for this
            // ".wasm" file. Put it in the "wasm-stub" namespace to tell
            // our stub load callback to fill it with JavaScript.
            //
            // Resolve relative paths to absolute paths here since this
            // resolve callback is given "resolveDir", the directory to
            // resolve imports against.
            if (args.resolveDir === "") {
                return; // Ignore unresolvable paths
            }
            return {
                path: path.isAbsolute(args.path)
                    ? args.path
                    : path.join(args.resolveDir, args.path),
                namespace: "wasm-stub"
            };
        });

        // Virtual modules in the "wasm-stub" namespace are filled with
        // the JavaScript code for compiling the WebAssembly binary. The
        // binary itself is imported from a second virtual module.
        build.onLoad(
            { filter: /.*/, namespace: "wasm-stub" },
            async (args) => ({
                contents: `import wasm from ${JSON.stringify(args.path)}
          export default (imports) =>
            WebAssembly.instantiate(wasm, imports).then(
              result => result.instance.exports)`
            })
        );

        // Virtual modules in the "wasm-binary" namespace contain the
        // actual bytes of the WebAssembly file. This uses esbuild's
        // built-in "binary" loader instead of manually embedding the
        // binary data inside JavaScript code ourselves.
        build.onLoad(
            { filter: /.*/, namespace: "wasm-binary" },
            async (args) => ({
                contents: await fs.promises.readFile(args.path),
                loader: "binary"
            })
        );
    }
};

esbuild
    .build({
        entryPoints: ["src/index.html"],
        bundle: true,
        assetNames: "[dir]/[name]",
        watch: process.env.NODE_ENV !== "production",
        minify: process.env.NODE_ENV === "production",
        outdir: "dist",
        format: "esm",
        plugins: [
            wasmLoader({
                mode: "deferred"
            }),
            htmlPlugin(),
            // process.env.NODE_ENV !== "production" && httpServerPlugin({}),
            buildSpinnerPlugin
        ]
    })
    .catch(() => process.exit(1));