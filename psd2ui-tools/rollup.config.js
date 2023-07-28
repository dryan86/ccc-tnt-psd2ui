

let path = require("path");
const commonjs = require('@rollup/plugin-commonjs')
const typescript = require('rollup-plugin-typescript2')
let resolve = require('@rollup/plugin-node-resolve').default;
let json = require("@rollup/plugin-json").default;
let terser = require("rollup-plugin-terser").terser;


const override = { compilerOptions: { module: 'ESNext' } }
module.exports = {
    input: "./src/export.ts",

    output: {
        file: path.resolve(__dirname, "./dist/index.js"),
        sourcemap: false,
        format: "umd",
    },

    plugins: [
        typescript({ tsconfig: './tsconfig.json', tsconfigOverride: override }),
        json(),
        // resolve(),
        commonjs(),
        terser()
    ]
}
