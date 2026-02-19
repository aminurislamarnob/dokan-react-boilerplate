<?php

namespace WeLabs\DokanReactBoilerplate;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Script and style registration and enqueue.
 */
class Assets {

    /**
     * The constructor.
     */
    public function __construct() {
        add_action( 'init', [ $this, 'register_all_scripts' ], 10 );

        if ( is_admin() ) {
            add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_admin_scripts' ], 10 );
        } else {
            add_action( 'wp_enqueue_scripts', [ $this, 'register_react_assets' ], 5 );
            add_action( 'dokan_enqueue_scripts', [ $this, 'enqueue_dashboard_scripts' ], 15 );
        }
    }

    /**
     * Register all Dokan scripts and styles.
     *
     * @return void
     */
    public function register_all_scripts() {
        $this->register_styles();
        $this->register_scripts();
    }

    /**
     * Register scripts.
     *
     * @return void
     */
    public function register_scripts() {
        $admin_script    = DOKAN_REACT_BOILERPLATE_PLUGIN_ADMIN_ASSET . '/js/script.js';
        $frontend_script = DOKAN_REACT_BOILERPLATE_PLUGIN_PUBLIC_ASSET . '/js/script.js';

        wp_register_script( 'dokan_react_boilerplate_admin_script', $admin_script, [], DOKAN_REACT_BOILERPLATE_PLUGIN_VERSION, true );
        wp_register_script( 'dokan_react_boilerplate_script', $frontend_script, [], DOKAN_REACT_BOILERPLATE_PLUGIN_VERSION, true );
    }

    /**
     * Register styles.
     *
     * @return void
     */
    public function register_styles() {
        $admin_style    = DOKAN_REACT_BOILERPLATE_PLUGIN_ADMIN_ASSET . '/css/style.css';
        $frontend_style = DOKAN_REACT_BOILERPLATE_PLUGIN_PUBLIC_ASSET . '/css/style.css';

        wp_register_style( 'dokan_react_boilerplate_admin_style', $admin_style, [], DOKAN_REACT_BOILERPLATE_PLUGIN_VERSION );
        wp_register_style( 'dokan_react_boilerplate_style', $frontend_style, [], DOKAN_REACT_BOILERPLATE_PLUGIN_VERSION );
    }

    /**
     * Register React-built assets for the vendor dashboard.
     *
     * @return void
     */
    public function register_react_assets(): void {
        $this->register_customers_assets();
        $this->register_withdraw_assets();
        $this->register_store_seo_assets();
    }

    /**
     * Register customers script and style.
     */
    private function register_customers_assets(): void {
        $asset_file = DOKAN_REACT_BOILERPLATE_DIR . '/assets/js/customers.asset.php';

        if ( ! file_exists( $asset_file ) ) {
            return;
        }

        $asset = include $asset_file; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable
        $deps  = array_merge( $asset['dependencies'] ?? [], [ 'dokan-react-components' ] );

        wp_register_script(
            'dokan-react-boilerplate-customers',
            DOKAN_REACT_BOILERPLATE_PLUGIN_ASSET . '/js/customers.js',
            $deps,
            $asset['version'] ?? DOKAN_REACT_BOILERPLATE_PLUGIN_VERSION,
            true
        );

        $css_file = DOKAN_REACT_BOILERPLATE_DIR . '/assets/js/customers.css';
        if ( file_exists( $css_file ) ) {
            wp_register_style(
                'dokan-react-boilerplate-customers',
                DOKAN_REACT_BOILERPLATE_PLUGIN_ASSET . '/js/customers.css',
                [ 'dokan-react-components' ],
                $asset['version'] ?? DOKAN_REACT_BOILERPLATE_PLUGIN_VERSION
            );
        }
    }

    /**
     * Register withdraw Balance override script and style.
     */
    private function register_withdraw_assets(): void {
        $asset_file = DOKAN_REACT_BOILERPLATE_DIR . '/assets/js/withdraw.asset.php';

        if ( ! file_exists( $asset_file ) ) {
            return;
        }

        $asset = include $asset_file; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable
        $deps  = array_merge( $asset['dependencies'] ?? [], [ 'dokan-react-components', 'dokan-react-frontend' ] );

        wp_register_script(
            'dokan-react-boilerplate-withdraw',
            DOKAN_REACT_BOILERPLATE_PLUGIN_ASSET . '/js/withdraw.js',
            $deps,
            $asset['version'] ?? DOKAN_REACT_BOILERPLATE_PLUGIN_VERSION,
            true
        );

        $css_file = DOKAN_REACT_BOILERPLATE_DIR . '/assets/js/withdraw.css';
        if ( file_exists( $css_file ) ) {
            wp_register_style(
                'dokan-react-boilerplate-withdraw',
                DOKAN_REACT_BOILERPLATE_PLUGIN_ASSET . '/js/withdraw.css',
                [ 'dokan-react-components' ],
                $asset['version'] ?? DOKAN_REACT_BOILERPLATE_PLUGIN_VERSION
            );
        }
    }

    /**
     * Enqueue admin scripts.
     *
     * @param string $hook The current admin page hook.
     *
     * @return void
     */
    public function enqueue_admin_scripts( $hook ) {
        wp_enqueue_script( 'dokan_react_boilerplate_admin_script' );
        wp_localize_script(
            'dokan_react_boilerplate_admin_script',
            'Dokan_React_Boilerplate_Admin',
            []
        );

        if ( 'toplevel_page_dokan' === $hook || 'dokan_page_dokan-dashboard' === $hook ) {
            $this->register_admin_vendors_assets();
            wp_enqueue_script( 'dokan-react-boilerplate-admin-vendors' );

            if ( wp_style_is( 'dokan-react-boilerplate-admin-vendors', 'registered' ) ) {
                wp_enqueue_style( 'dokan-react-boilerplate-admin-vendors' );
            }
        }
    }

    /**
     * Register store-seo override script and style.
     */
    private function register_store_seo_assets(): void {
        $asset_file = DOKAN_REACT_BOILERPLATE_DIR . '/assets/js/store-seo.asset.php';

        if ( ! file_exists( $asset_file ) ) {
            return;
        }

        $asset = include $asset_file; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable
        $deps  = array_merge(
            $asset['dependencies'] ?? [],
            [ 'dokan-react-components', 'dokan-pro-store-seo' ]
        );

        wp_register_script(
            'dokan-react-boilerplate-store-seo',
            DOKAN_REACT_BOILERPLATE_PLUGIN_ASSET . '/js/store-seo.js',
            $deps,
            $asset['version'] ?? DOKAN_REACT_BOILERPLATE_PLUGIN_VERSION,
            true
        );

        $css_file = DOKAN_REACT_BOILERPLATE_DIR . '/assets/js/store-seo.css';
        if ( file_exists( $css_file ) ) {
            wp_register_style(
                'dokan-react-boilerplate-store-seo',
                DOKAN_REACT_BOILERPLATE_PLUGIN_ASSET . '/js/store-seo.css',
                [ 'dokan-pro-store-seo' ],
                $asset['version'] ?? DOKAN_REACT_BOILERPLATE_PLUGIN_VERSION
            );
        }
    }

    /**
     * Register admin vendors override script and style.
     */
    private function register_admin_vendors_assets(): void {
        $asset_file = DOKAN_REACT_BOILERPLATE_DIR . '/assets/js/admin-vendors.asset.php';

        if ( ! file_exists( $asset_file ) ) {
            return;
        }

        $asset = include $asset_file; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable
        $deps  = array_merge( $asset['dependencies'] ?? [], [ 'dokan-admin-dashboard' ] );

        wp_register_script(
            'dokan-react-boilerplate-admin-vendors',
            DOKAN_REACT_BOILERPLATE_PLUGIN_ASSET . '/js/admin-vendors.js',
            $deps,
            $asset['version'] ?? DOKAN_REACT_BOILERPLATE_PLUGIN_VERSION,
            true
        );

        $css_file = DOKAN_REACT_BOILERPLATE_DIR . '/assets/js/admin-vendors.css';
        if ( file_exists( $css_file ) ) {
            wp_register_style(
                'dokan-react-boilerplate-admin-vendors',
                DOKAN_REACT_BOILERPLATE_PLUGIN_ASSET . '/js/admin-vendors.css',
                [ 'dokan-admin-dashboard' ],
                $asset['version'] ?? DOKAN_REACT_BOILERPLATE_PLUGIN_VERSION
            );
        }
    }

    /**
     * Enqueue vendor dashboard scripts.
     *
     * @return void
     */
    public function enqueue_dashboard_scripts(): void {
        if ( ! dokan_is_seller_dashboard() ) {
            return;
        }

        if ( wp_style_is( 'dokan-react-boilerplate-customers', 'registered' ) ) {
            wp_enqueue_style( 'dokan-react-boilerplate-customers' );
        }
        wp_enqueue_script( 'dokan-react-boilerplate-customers' );

        if ( wp_style_is( 'dokan-react-boilerplate-withdraw', 'registered' ) ) {
            wp_enqueue_style( 'dokan-react-boilerplate-withdraw' );
        }
        wp_enqueue_script( 'dokan-react-boilerplate-withdraw' );

        if ( wp_script_is( 'dokan-pro-store-seo', 'registered' ) && wp_style_is( 'dokan-react-boilerplate-store-seo', 'registered' ) ) {
            wp_enqueue_style( 'dokan-react-boilerplate-store-seo' );
        }
        if ( wp_script_is( 'dokan-pro-store-seo', 'registered' ) && wp_script_is( 'dokan-react-boilerplate-store-seo', 'registered' ) ) {
            wp_enqueue_script( 'dokan-react-boilerplate-store-seo' );
        }

        wp_localize_script(
            'dokan-react-boilerplate-customers',
            'dokanReactBoilerplateCustomers',
            [
                'api_namespace' => 'dokan-react-boilerplate/v1',
                'nonce'         => wp_create_nonce( 'wp_rest' ),
            ]
        );
    }
}
