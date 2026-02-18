const path = require( 'path' );
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const { getDokanLitePath } = require( './src/utils/dokan-path' );

const liteLocation = getDokanLitePath();

const { requestToExternal, requestToHandle } = require(
    `../${ liteLocation }/webpack-dependency-mapping`
);

const updatedConfig = {
    ...defaultConfig,
    entry: {
        customers: './src/features/customers/index.jsx',
        withdraw: './src/features/withdraw/index.jsx',
        'store-seo': './src/features/store-seo/index.jsx',
    },
    output: {
        ...defaultConfig.output,
        path: path.resolve( __dirname, './assets/js' ),
        filename: '[name].js',
        clean: true,
    },
    externals: {
        jquery: 'jQuery',
        '@woocommerce/blocks-registry': [ 'wc', 'wcBlocksRegistry' ],
        '@woocommerce/settings': [ 'wc', 'wcSettings' ],
        '@woocommerce/block-data': [ 'wc', 'wcBlocksData' ],
        '@woocommerce/shared-context': [ 'wc', 'wcSharedContext' ],
        '@woocommerce/shared-hocs': [ 'wc', 'wcSharedHocs' ],
        '@woocommerce/price-format': [ 'wc', 'priceFormat' ],
        '@woocommerce/blocks-checkout': [ 'wc', 'blocksCheckout' ],
    },
    plugins: [
        ...defaultConfig.plugins.filter(
            ( plugin ) =>
                plugin.constructor.name !== 'DependencyExtractionWebpackPlugin'
        ),
        new DependencyExtractionWebpackPlugin( {
            requestToExternal,
            requestToHandle,
        } ),
    ],
};

module.exports = updatedConfig;
