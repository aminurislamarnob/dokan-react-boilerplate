<?php

namespace WeLabs\DokanReactBoilerplate\REST;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Customers REST controller.
 */
class CustomersController {

    /**
     * REST namespace.
     *
     * @var string
     */
    protected $namespace = 'dokan-react-boilerplate/v1';

    /**
     * REST base.
     *
     * @var string
     */
    protected $rest_base = 'customers';

    /**
     * Register routes.
     */
    public function register_routes(): void {
        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base,
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [ $this, 'get_customers' ],
                    'permission_callback' => [ $this, 'get_customers_permission_check' ],
                    'args'                => $this->get_collection_params(),
                ],
            ]
        );

        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base . '/(?P<id>[\d]+)',
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [ $this, 'get_customer' ],
                    'permission_callback' => [ $this, 'get_customers_permission_check' ],
                    'args'                => [
                        'id' => [
                            'description'       => __( 'Customer user ID.', 'dokan-react-boilerplate' ),
                            'type'              => 'integer',
                            'required'          => true,
                            'sanitize_callback' => 'absint',
                        ],
                    ],
                ],
            ]
        );
    }

    /**
     * Check permission for listing customers.
     *
     * @param WP_REST_Request $request Request.
     * @return bool
     */
    public function get_customers_permission_check( WP_REST_Request $request ): bool {
        return current_user_can( 'dokandar' );
    }

    /**
     * Get customers (unique buyers) for the current vendor.
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response
     */
    public function get_customers( WP_REST_Request $request ): WP_REST_Response {
        $seller_id = dokan_get_current_user_id();
        if ( ! $seller_id ) {
            return new WP_REST_Response( [ 'customers' => [], 'total' => 0 ], 200 );
        }

        $per_page = (int) $request->get_param( 'per_page' );
        $page     = (int) $request->get_param( 'page' );
        $search   = $request->get_param( 'search' );

        $per_page = max( 1, min( 100, $per_page ) );
        $page     = max( 1, $page );

        $order_ids = dokan()->order->all(
            [
                'seller_id' => $seller_id,
                'return'    => 'ids',
                'limit'     => 2000,
                'status'    => array_keys( wc_get_order_statuses() ),
            ]
        );

        if ( ! is_array( $order_ids ) ) {
            $order_ids = [];
        }

        $customers_map = [];
        foreach ( $order_ids as $order_id ) {
            $order = wc_get_order( $order_id );
            if ( ! $order ) {
                continue;
            }
            $customer_id = $order->get_customer_id();
            if ( ! $customer_id ) {
                continue;
            }
            if ( ! isset( $customers_map[ $customer_id ] ) ) {
                $customers_map[ $customer_id ] = [
                    'order_count'   => 0,
                    'total_spent'   => 0.0,
                    'last_order_at' => '',
                ];
            }
            $customers_map[ $customer_id ]['order_count']++;
            $customers_map[ $customer_id ]['total_spent'] += (float) $order->get_total();
            $date = $order->get_date_created();
            if ( $date ) {
                $date_str = $date->format( 'Y-m-d H:i:s' );
                if ( $date_str > ( $customers_map[ $customer_id ]['last_order_at'] ?? '' ) ) {
                    $customers_map[ $customer_id ]['last_order_at'] = $date_str;
                }
            }
        }

        $user_ids = array_keys( $customers_map );

        if ( ! empty( $search ) ) {
            $user_ids = array_filter( $user_ids, function ( $uid ) use ( $search ) {
                $u = get_userdata( $uid );
                return $u && (
                    stripos( $u->display_name, $search ) !== false ||
                    stripos( $u->user_email, $search ) !== false
                );
            } );
        }

        usort( $user_ids, function ( $a, $b ) use ( $customers_map ) {
            $cmp = $customers_map[ $b ]['order_count'] <=> $customers_map[ $a ]['order_count'];
            if ( $cmp !== 0 ) {
                return $cmp;
            }
            return $customers_map[ $b ]['last_order_at'] <=> $customers_map[ $a ]['last_order_at'];
        } );

        $user_ids = array_values( $user_ids );
        $total    = count( $user_ids );
        $user_ids = array_slice( $user_ids, ( $page - 1 ) * $per_page, $per_page );

        $customers = [];
        foreach ( $user_ids as $user_id ) {
            $user = get_userdata( $user_id );
            if ( ! $user ) {
                continue;
            }
            $agg          = $customers_map[ $user_id ];
            $customers[] = [
                'id'            => (int) $user_id,
                'display_name'  => $user->display_name,
                'email'         => $user->user_email,
                'order_count'   => (int) $agg['order_count'],
                'total_spent'   => (float) $agg['total_spent'],
                'last_order_at' => $agg['last_order_at'],
            ];
        }

        $response = new WP_REST_Response( $customers, 200 );
        $response->header( 'X-WP-Total', (string) $total );
        $response->header( 'X-WP-TotalPages', (string) ( (int) ceil( $total / $per_page ) ) );
        return $response;
    }

    /**
     * Get a single customer by ID for the current vendor.
     *
     * @param WP_REST_Request $request Request.
     * @return WP_REST_Response
     */
    public function get_customer( WP_REST_Request $request ): WP_REST_Response {
        $seller_id = dokan_get_current_user_id();
        if ( ! $seller_id ) {
            return new WP_REST_Response( [ 'code' => 'unauthorized' ], 401 );
        }

        $customer_id = (int) $request->get_param( 'id' );
        if ( ! $customer_id ) {
            return new WP_REST_Response( [ 'code' => 'invalid_id' ], 400 );
        }

        $order_ids = dokan()->order->all(
            [
                'seller_id' => $seller_id,
                'return'    => 'ids',
                'limit'     => 2000,
                'status'    => array_keys( wc_get_order_statuses() ),
            ]
        );

        if ( ! is_array( $order_ids ) ) {
            $order_ids = [];
        }

        $order_count   = 0;
        $total_spent   = 0.0;
        $last_order_at = '';

        foreach ( $order_ids as $order_id ) {
            $order = wc_get_order( $order_id );
            if ( ! $order ) {
                continue;
            }
            if ( (int) $order->get_customer_id() !== $customer_id ) {
                continue;
            }
            $order_count++;
            $total_spent += (float) $order->get_total();
            $date = $order->get_date_created();
            if ( $date ) {
                $date_str = $date->format( 'Y-m-d H:i:s' );
                if ( $date_str > $last_order_at ) {
                    $last_order_at = $date_str;
                }
            }
        }

        if ( $order_count === 0 ) {
            return new WP_REST_Response( [ 'code' => 'customer_not_found' ], 404 );
        }

        $user = get_userdata( $customer_id );
        if ( ! $user ) {
            return new WP_REST_Response( [ 'code' => 'customer_not_found' ], 404 );
        }

        $customer = [
            'id'            => (int) $customer_id,
            'display_name'  => $user->display_name,
            'email'         => $user->user_email,
            'order_count'   => $order_count,
            'total_spent'   => $total_spent,
            'last_order_at' => $last_order_at,
        ];

        return new WP_REST_Response( $customer, 200 );
    }

    /**
     * Get collection params.
     *
     * @return array
     */
    public function get_collection_params(): array {
        return [
            'page'     => [
                'description'       => __( 'Current page.', 'dokan-react-boilerplate' ),
                'type'              => 'integer',
                'minimum'           => 1,
                'default'           => 1,
                'sanitize_callback' => 'absint',
            ],
            'per_page' => [
                'description'       => __( 'Items per page.', 'dokan-react-boilerplate' ),
                'type'              => 'integer',
                'minimum'           => 1,
                'maximum'           => 100,
                'default'           => 10,
                'sanitize_callback' => 'absint',
            ],
            'search'   => [
                'description'       => __( 'Search by name or email.', 'dokan-react-boilerplate' ),
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ],
        ];
    }
}
