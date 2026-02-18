<?php
/**
 * Plugin Name: Dokan React Boilerplate
 * Plugin URI:  https://welabs.dev
 * Description: This will help you understand how to extend and override features in the Dokan React implementation.
 * Version: 0.0.1
 * Author: WeLabs
 * Author URI: https://welabs.dev
 * Text Domain: dokan-react-boilerplate
 * WC requires at least: 5.0.0
 * Domain Path: /languages/
 * Requires Plugins: woocommerce, dokan-lite
 * License: GPL2
 */
use WeLabs\DokanReactBoilerplate\DokanReactBoilerplate;

// don't call the file directly
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! defined( 'DOKAN_REACT_BOILERPLATE_FILE' ) ) {
    define( 'DOKAN_REACT_BOILERPLATE_FILE', __FILE__ );
}

if ( ! defined( 'DOKAN_REACT_BOILERPLATE_BASENAME' ) ) {
    define( 'DOKAN_REACT_BOILERPLATE_BASENAME', plugin_basename( __FILE__ ) );
}

require_once __DIR__ . '/vendor/autoload.php';

/**
 * Load Dokan_React_Boilerplate Plugin when all plugins loaded
 *
 * @return \WeLabs\DokanReactBoilerplate\DokanReactBoilerplate
 */
function welabs_dokan_react_boilerplate() {
    return DokanReactBoilerplate::init();
}

// Lets Go....
welabs_dokan_react_boilerplate();
