const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')
const path = require('path')
const darkTheme = require('@ant-design/dark-theme')
const FriendlyErrorsWebpackPlugin = require('@soda/friendly-errors-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const dir = path.resolve('.')

const isDevelopment =
    process.env['NODE_ENV'] === undefined ||
    process.env['NODE_ENV'] === 'development' ||
    process.env['NODE_ENV'] === 'dev'

if (isDevelopment) {
    require('dotenv').config()
}

const isInSCM = process.env.TASK_FROM === 'SCM'
const styleLoader = isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader
const publicPath = isInSCM
    ? 'https://cdn-tos-cn.bytedance.net/obj/archi/liteide/'
    : isDevelopment
    ? '/'
    : 'auto'

module.exports = {
    entry: path.resolve(dir, '/src/index.ts'),
    output: {
        // filename: '[name].[contenthash].js',
        path: dir + '/dist',
        clean: true,
        // publicPath,
        library: {
            type: 'module',
        },
        environment: { module: true },
    },
    experiments: {
        outputModule: true,
    },
    // externals: ['react', 'react-dom', 'lodash'],
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json', '.less'],
    },
    bail: true,
    devtool: 'source-map',
    module: {
        unknownContextCritical: false,
        // https://github.com/webpack/webpack/issues/196#issuecomment-397606728
        exprContextCritical: false,
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            plugins: [
                                [
                                    'import',
                                    { libraryName: 'antd', style: 'css' },
                                ],
                            ],
                            presets: ['@babel/preset-react'],
                        },
                    },
                ],
            },
            {
                test: /\.png$/,
                use: 'file-loader',
            },
            {
                test: /\.css$/,
                use: [styleLoader, 'css-loader'],
            },
            {
                test: /\.module.less$/,
                use: [
                    styleLoader,
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: true,
                            modules: {
                                exportLocalsConvention: 'camelCase',
                                localIdentHashSalt: 'lite-ide',
                                localIdentName:
                                    '[path][name]__[local]--[hash:base64:5]',
                            },
                            importLoaders: 2,
                        },
                    },
                    {
                        loader: 'postcss-loader',
                    },
                    {
                        loader: 'less-loader',
                    },
                ],
            },
            {
                test: /^((?!\.module).)*less$/,
                use: [
                    styleLoader,
                    {
                        loader: 'css-loader',
                    },
                    {
                        loader: 'postcss-loader',
                    },
                    {
                        loader: 'less-loader',
                        options: {
                            javascriptEnabled: true,
                            modifyVars: darkTheme.default,
                        },
                    },
                ],
            },
            {
                test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'fonts/',
                            publicPath:
                                // TODO 自动发到公司内 cdn 资源上
                                'https://g.alicdn.com/tao-ide/ide-front/0.0.8/fonts', //"http://localhost:8080/fonts"
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        new MiniCssExtractPlugin(),
        new FriendlyErrorsWebpackPlugin(),
    ],
}
