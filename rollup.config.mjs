import { babel } from "@rollup/plugin-babel";
import ts from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import cjs from "@rollup/plugin-commonjs";
import { wasm } from "@rollup/plugin-wasm";
import iife from "rollup-plugin-iife";
import esbuild from "rollup-plugin-esbuild";
import htmlPlugin from "@chialab/esbuild-plugin-html";
import { buildSpinnerPlugin } from "@theoparis/esbuild-plugins";
import html from "@rollup/plugin-html";

/**
 * @type {import("rollup").RollupOptions}
 */
const config = {
    input: "src/index.ts",
    output: {
        dir: "dist",
        format: "iife",
        name: "Game",
        sourcemap: true,
        globals: {
            "@math.gl/core": "math_core",
            "@babel/runtime/regenerator": "regeneratorRuntime"
        }
    },
    plugins: [
        ts(),
        cjs({
            include: /node_modules/
        }),
        resolve({
            browser: true
        }) /* 
        esbuild({
            entryPoints: ["src/index.html"],
            bundle: true,
            assetNames: "[dir]/[name]",
            watch: process.env.NODE_ENV !== "production",
            minify: process.env.NODE_ENV === "production",
            outdir: "dist",
            format: "esm",
            plugins: [
                htmlPlugin(),
                // process.env.NODE_ENV !== "production" && httpServerPlugin({}),
                buildSpinnerPlugin
            ]
        }), */,
        html(),
        wasm({}),
        babel({
            babelrc: true,
            configFile: "babel.config.js",
            babelHelpers: "runtime",
            compact: true
        }),
        iife()
    ]
};

export default config;
