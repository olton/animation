import {terser} from "rollup-plugin-terser"
import fs from "node:fs"
import pkg from "./package.json"

const production = (process.env.MODE === 'production')

const banner = `
/*!
 * Animation - Library for animating HTML elements.
 * Copyright ${new Date().getFullYear()} by Serhii Pimenov
 * Licensed under MIT
 !*/
`

let txt

txt = fs.readFileSync(`src/index.js`, 'utf8')
txt = txt.replace(/version = ".+"/g, `version = "${pkg.version}"`)
txt = txt.replace(/build_time = ".+"/g, `build_time = "${new Date().toLocaleString()}"`)
fs.writeFileSync(`src/index.js`, txt, { encoding: 'utf8', flag: 'w+' })


export default [
    {
        input: './src/browser.js',
        watch: { clearScreen: false },
        output: {
            file: './lib/animation.js',
            format: 'iife',
            sourcemap: false,
            // name: 'Animation',
            banner,
            plugins: [
                production && terser({
                    keep_classnames: true,
                    keep_fnames: true,
                })
            ],
        }
    },
    {
        input: './src/index.js',
        watch: { clearScreen: false },
        output: {
            file: './dist/animation.mjs',
            format: 'es',
            banner,
        }
    },
    {
        input: './src/index.js',
        watch: { clearScreen: false },
        output: {
            file: './dist/animation.cjs',
            format: 'cjs',
            banner,
        }
    },
];