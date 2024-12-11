import {build, context} from "esbuild";
import progress from "@olton/esbuild-plugin-progress";
import {replace} from "esbuild-plugin-replace";
import pkg from "./package.json" assert {type: "json"};

const production = process.env.MODE === "production";
const banner = `
/*!
 * Animation - Animate HTML elements with this simple, light-weight library.
 * Copyright ${new Date().getFullYear()} by Serhii Pimenov
 * Licensed under MIT
 !*/
`

const options = {
    entryPoints: ["./src/index.js"],
    bundle: true,
    minify: production,
    sourcemap: false,
    format: "esm",
    plugins: [
        progress(),
        replace({
            '__BUILD_TIME__': new Date().toLocaleString(),
            '__VERSION__': pkg.version,
            '__REGISTER_GLOBAL__': false
        })
    ],
    banner: {
        js: banner
    }
}

if (production) {
    await build({
        ...options,
        outfile: "./dist/animation.js",
    })
    await build({
        ...options,
        outfile: "./lib/animation.js",
        format: "iife",
        globalName: "Animation",
        plugins: [
            progress(), 
            replace({
                '__BUILD_TIME__': new Date().toLocaleString(),
                '__VERSION__': pkg.version,
                '__REGISTER_GLOBAL__': true
            })
        ]
    })
} else {
    let ctxDist = await context({
        ...options,
        outfile: "./dist/animation.js",
    })
    let ctxLib = await context({
        ...options,
        outfile: "./lib/animation.js",
        format: "iife",
        globalName: "Animation",
        plugins: [
            progress(),
            replace({
                '__BUILD_TIME__': new Date().toLocaleString(),
                '__VERSION__': pkg.version,
                '__REGISTER_GLOBAL__': true
            })
        ]
    })
    await Promise.all([
        ctxDist.watch(),
        ctxLib.watch()
    ])
}