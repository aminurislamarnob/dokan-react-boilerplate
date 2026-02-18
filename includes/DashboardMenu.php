<?php

namespace WeLabs\DokanReactBoilerplate;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Add Customers menu to Dokan vendor dashboard.
 */
class DashboardMenu {

    /**
     * Constructor.
     */
    public function __construct() {
        add_filter( 'dokan_get_dashboard_nav', [ $this, 'add_customers_menu' ], 20 );
        add_filter( 'dokan_query_var_filter', [ $this, 'add_customers_query_var' ] );
        add_filter( 'dokan_load_custom_template', [ $this, 'load_customers_template' ], 20, 1 );
    }

    /**
     * Add Customers to dashboard nav.
     *
     * @param array $menus Existing menus.
     * @return array
     */
    public function add_customers_menu( array $menus ): array {
        $menus['customers'] = [
            'title'       => __( 'Customers', 'dokan-react-boilerplate' ),
            'icon'        => '<i class="fas fa-users"></i>',
            'url'         => dokan_get_navigation_url( 'customers' ),
            'pos'         => 55,
            'permission'  => 'dokandar',
            'react_route' => 'customers',
        ];

        return $menus;
    }

    /**
     * Add customers query var.
     *
     * @param array $vars Query vars.
     * @return array
     */
    public function add_customers_query_var( array $vars ): array {
        $vars[] = 'customers';
        return $vars;
    }

    /**
     * Load template for legacy (non-React) fallback; React handles the route.
     *
     * @param array $query_vars Query vars.
     * @return string|null Template path or null.
     */
    public function load_customers_template( $query_vars ) {
        if ( ! isset( $query_vars['customers'] ) ) {
            return null;
        }

        if ( ! current_user_can( 'dokandar' ) ) {
            return null;
        }

        return DOKAN_REACT_BOILERPLATE_DIR . '/templates/customers.php';
    }
}
