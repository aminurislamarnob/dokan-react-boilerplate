<?php
/**
 * Customers template fallback for non-React dashboard.
 * The React app handles the route on the new dashboard layout.
 *
 * @package DokanReactBoilerplate
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
?>
<div id="dokan-vendor-customers">
    <p><?php esc_html_e( 'Loading customers...', 'dokan-react-boilerplate' ); ?></p>
</div>
