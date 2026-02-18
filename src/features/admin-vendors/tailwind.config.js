const path = require( 'path' );
const { getDokanLitePath } = require( '../../utils/dokan-path' );

const liteLocation = getDokanLitePath();

const baseConfig = require(
    path.resolve( __dirname, '../../../..', liteLocation, 'base-tailwind.config' )
);

module.exports = {
    ...baseConfig,
    content: [ './src/features/admin-vendors/**/*.{js,jsx}' ],
};
