const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Get the Dokan Lite installation path.
 * Checks for either 'dokan-lite' or 'dokan' directory in the parent folder.
 *
 * @return {string} The path to Dokan Lite (directory name)
 * @throws {Error} If neither dokan-lite nor dokan directory exists
 */
function getDokanLitePath() {
    let liteLocation = 'dokan-lite';

    try {
        if (
            ! fs.existsSync(
                path.resolve( __dirname, '../../..', liteLocation )
            )
        ) {
            liteLocation = 'dokan';
        }

        if (
            ! fs.existsSync(
                path.resolve( __dirname, '../../..', liteLocation )
            )
        ) {
            throw new Error( 'Dokan or Dokan Lite not found' );
        }

        return liteLocation;
    } catch ( err ) {
        throw err;
    }
}

module.exports = { getDokanLitePath };
