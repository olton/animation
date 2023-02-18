import {nodeResolve as resolve} from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import {terser} from "rollup-plugin-terser"

const
    dev = (process.env.NODE_ENV !== 'production'),
    sourcemap = dev ? 'inline' : false

export default [
    {
        input: './src/browser.js',
        watch: { clearScreen: false },
        plugins: [
            resolve({
                browser: true
            }),
            commonjs(),
        ],
        output: {
            file: './lib/animation.js',
            format: 'iife',
        }
    },
    {
        input: './lib/animation.js',
        plugins: [
            terser()
        ],
        output: {
            file: './lib/animation.min.js',
            format: 'iife',
            sourcemap
        }
    }
];