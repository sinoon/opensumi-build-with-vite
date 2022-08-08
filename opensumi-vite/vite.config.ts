import { resolve } from 'path'
import { defineConfig } from 'vite'

const moduleEntryList: string[] = [
    'browser',
    'common',
    'dialog',
    'editor',
    'message',
    'mobx',
    'output',
]

const buildModuleEntry = () =>
    moduleEntryList.reduce((allEntry, entry) => {
        allEntry[`modules/${entry}`] = resolve(
            __dirname,
            `./src/modules/${entry}/index.ts`,
        )

        return allEntry
    }, {})

export default defineConfig({
    build: {
        rollupOptions: {
            preserveEntrySignatures: 'strict',
            input: {
                ...buildModuleEntry(),
                index: resolve(__dirname, 'src/index.ts'),
            },
            output: {
                entryFileNames: '[name].js',
            },
            external: ['react', 'react-dom', 'core-js'],
        },
        minify: false,
    },
    resolve: {
        alias: {
            // 使用同一个 di
            '@opensumi/di': require.resolve('@opensumi/di'),

            '~@opensumi': resolve(__dirname, 'node_modules/@opensumi'),
            '~react-perfect-scrollbar': resolve(
                __dirname,
                'node_modules/react-perfect-scrollbar',
            ),
            buffer: require.resolve('buffer'),
            path: require.resolve('path-browserify'),
            process: 'process/browser.js',

            // 使用同一个 Domain
            '@opensumi/ide-core-browser$': require.resolve(
                '@opensumi/ide-core-browser',
            ),

            assert: require.resolve('assert'),
            console: require.resolve('console-browserify'),
            // constants: require.resolve('constants-browserify'),
            // crypto: require.resolve('crypto-browserify'),
            domain: require.resolve('domain-browser'),
            events: require.resolve('events'),
            http: require.resolve('stream-http'),
            https: require.resolve('https-browserify'),
            os: require.resolve('os-browserify/browser'),
            // path: require.resolve('path-browserify'),
            punycode: require.resolve('punycode'),
            // process: require.resolve('process/browser'),
            querystring: require.resolve('querystring-es3'),
            stream: require.resolve('stream-browserify'),
            string_decoder: require.resolve('string_decoder'),
            sys: require.resolve('util'),
            timers: require.resolve('timers-browserify'),
            tty: require.resolve('tty-browserify'),
            url: require.resolve('url'),
            util: require.resolve('util'),
            vm: require.resolve('vm-browserify'),
            zlib: require.resolve('browserify-zlib'),
            // buffer: require.resolve('buffer/'),
        },
    },
})
