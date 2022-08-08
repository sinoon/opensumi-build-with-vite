const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')
const FriendlyErrorsWebpackPlugin = require('@soda/friendly-errors-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const baseConfig = require('./webpack.config')
const { merge, mergeWithCustomize, customizeObject } = require('webpack-merge')

const port = 8080

const isDevelopment =
    process.env['NODE_ENV'] === undefined ||
    process.env['NODE_ENV'] === 'development' ||
    process.env['NODE_ENV'] === 'dev'

if (isDevelopment) {
    require('dotenv').config()
}

const isInSCM = process.env.TASK_FROM === 'SCM'
const publicPath = isInSCM
    ? 'https://cdn-tos-cn.bytedance.net/obj/archi/liteide/'
    : isDevelopment
    ? '/'
    : 'auto'

const config = mergeWithCustomize({
    customizeObject: customizeObject({
        output: 'replace',
        experiments: 'replace',
    }),
})(baseConfig, {
    output: {
        filename: '[name].[contenthash].js',
        clean: true,
        publicPath,
        path: path.resolve(__dirname, 'dist'),
    },
    experiments: {},
    optimization: {
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                },
            },
        },
    },
    devtool: 'source-map',
    plugins: [
        new MiniCssExtractPlugin(),
        new HtmlWebpackPlugin({
            template: __dirname + '/index.html',
            inject: true,
            publicPath,
        }),
        new FriendlyErrorsWebpackPlugin(),
    ],
    devServer: {
        port,
        hot: true,
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'credentialless',
            'Access-Control-Allow-Origin': '*',
            'Cross-Origin-Resource-Policy': 'cross-origin',
        },
        proxy: {
            '/extensions': {
                target: 'https://ide.byted.org',
                changeOrigin: true,
                secure: false,
            },
        },
        historyApiFallback: true,
        static: {
            directory: path.join(__dirname, 'public'),
        },
    },
})

module.exports = config
