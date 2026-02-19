<?php

namespace WeLabs\DokanReactBoilerplate;

/**
 * DokanReactBoilerplate class
 *
 * @class DokanReactBoilerplate The class that holds the entire DokanReactBoilerplate plugin
 */
final class DokanReactBoilerplate {

    /**
     * Plugin version
     *
     * @var string
     */
    public $version = '0.0.1';

    /**
     * Instance of self
     *
     * @var DokanReactBoilerplate
     */
    private static $instance = null;

    /**
     * Holds various class instances
     *
     * @var array
     */
    private $container = [];

    /**
     * Constructor for the DokanReactBoilerplate class
     *
     * Sets up all the appropriate hooks and actions
     * within our plugin.
     */
    private function __construct() {
        $this->define_constants();

        register_activation_hook( DOKAN_REACT_BOILERPLATE_FILE, [ $this, 'activate' ] );
        register_deactivation_hook( DOKAN_REACT_BOILERPLATE_FILE, [ $this, 'deactivate' ] );

        add_action( 'plugins_loaded', [ $this, 'init_plugin' ] );
        add_action( 'rest_api_init', [ $this, 'register_rest_route' ] );
    }

    /**
     * Initializes the DokanReactBoilerplate() class
     *
     * Checks for an existing DokanReactBoilerplate instance
     * and if it doesn't find one then create a new one.
     *
     * @return DokanReactBoilerplate
     */
    public static function init() {
        if ( self::$instance === null ) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    /**
     * Magic getter to bypass referencing objects
     *
     * @param string $prop
     *
     * @return mixed
     */
    public function __get( $prop ) {
        if ( array_key_exists( $prop, $this->container ) ) {
            return $this->container[ $prop ];
        }
    }

    /**
     * Placeholder for activation function.
     */
    public function activate() {
        if ( $this->has_woocommerce() ) {
            $this->flush_rewrite_rules();
        }
    }

    /**
     * Register plugin REST routes.
     *
     * @return void
     */
    public function register_rest_route() {
        $customers = new REST\CustomersController();
        $customers->register_routes();
    }

    /**
     * Placeholder for deactivation function.
     */
    public function deactivate() {
    }

    /**
     * Define all constants.
     *
     * @return void
     */
    public function define_constants() {
        defined( 'DOKAN_REACT_BOILERPLATE_PLUGIN_VERSION' ) || define( 'DOKAN_REACT_BOILERPLATE_PLUGIN_VERSION', $this->version );
        defined( 'DOKAN_REACT_BOILERPLATE_DIR' ) || define( 'DOKAN_REACT_BOILERPLATE_DIR', dirname( DOKAN_REACT_BOILERPLATE_FILE ) );
        defined( 'DOKAN_REACT_BOILERPLATE_INC_DIR' ) || define( 'DOKAN_REACT_BOILERPLATE_INC_DIR', DOKAN_REACT_BOILERPLATE_DIR . '/includes' );
        defined( 'DOKAN_REACT_BOILERPLATE_TEMPLATE_DIR' ) || define( 'DOKAN_REACT_BOILERPLATE_TEMPLATE_DIR', DOKAN_REACT_BOILERPLATE_DIR . '/templates' );
        defined( 'DOKAN_REACT_BOILERPLATE_PLUGIN_ASSET' ) || define( 'DOKAN_REACT_BOILERPLATE_PLUGIN_ASSET', plugins_url( 'assets', DOKAN_REACT_BOILERPLATE_FILE ) );
        defined( 'DOKAN_REACT_BOILERPLATE_PLUGIN_ADMIN_ASSET' ) || define( 'DOKAN_REACT_BOILERPLATE_PLUGIN_ADMIN_ASSET', DOKAN_REACT_BOILERPLATE_PLUGIN_ASSET . '/admin' );
        defined( 'DOKAN_REACT_BOILERPLATE_PLUGIN_PUBLIC_ASSET' ) || define( 'DOKAN_REACT_BOILERPLATE_PLUGIN_PUBLIC_ASSET', DOKAN_REACT_BOILERPLATE_PLUGIN_ASSET . '/public' );
        defined( 'DOKAN_REACT_BOILERPLATE_LOAD_STYLE' ) || define( 'DOKAN_REACT_BOILERPLATE_LOAD_STYLE', true );
        defined( 'DOKAN_REACT_BOILERPLATE_LOAD_SCRIPTS' ) || define( 'DOKAN_REACT_BOILERPLATE_LOAD_SCRIPTS', true );
    }

    /**
     * Load the plugin after WP User Frontend is loaded.
     *
     * @return void
     */
    public function init_plugin() {
        $this->init_hooks();

        do_action( 'dokan_react_boilerplate_loaded' );
    }

    /**
     * Initialize the actions.
     *
     * @return void
     */
    public function init_hooks() {
        add_action( 'init', [ $this, 'init_classes' ], 4 );
    }

    /**
     * Init all the classes.
     *
     * @return void
     */
    public function init_classes() {
        $this->container['scripts']        = new Assets();
        $this->container['dashboard_menu'] = new DashboardMenu();
        $this->container['admin_vendors']  = new AdminVendors();
        if ( class_exists( 'WeDevs\DokanPro\StoreSeo' ) ) {
            $this->container['store_seo'] = new StoreSeo();
        }
    }

    /**
     * Check whether woocommerce is installed and active.
     *
     * @return bool
     */
    public function has_woocommerce() {
        return class_exists( 'WooCommerce' );
    }

    /**
     * Get the plugin url.
     *
     * @return string
     */
    public function plugin_url() {
        return untrailingslashit( plugins_url( '/', DOKAN_REACT_BOILERPLATE_FILE ) );
    }

    /**
     * Get the template file path to require or include.
     *
     * @param string $name
     * @return string
     */
    public function get_template_path( $name ) {
        $template = untrailingslashit( DOKAN_REACT_BOILERPLATE_TEMPLATE_DIR ) . '/' . untrailingslashit( $name );

        return apply_filters( 'dokan-react-boilerplate_template', $template, $name );
    }

    /**
     * Get templates passing attributes and including the file.
     *
     * @param mixed $template_name
     * @param array $args (default: array())
     *
     * @return void
     */
    public function get_template( $template_name, $args = [] ) {
        if ( $args && is_array( $args ) ) {
            extract( $args ); // phpcs:ignore
        }

        $template_path = $this->get_template_path( $template_name );

        if ( ! file_exists( $template_path ) ) {
            _doing_it_wrong( __FUNCTION__, sprintf( '<code>%s</code> does not exist.', esc_html( $template_path ) ), esc_html( DOKAN_REACT_BOILERPLATE_PLUGIN_VERSION ) );

            return;
        }

        do_action( 'dokan_react_boilerplate_before_template_part', $template_name, $args );

        include $this->get_template_path( $template_name ); // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable

        do_action( 'dokan_react_boilerplate_after_template_part', $template_name, $args );
    }
}
