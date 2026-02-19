<?php

namespace WeLabs\DokanReactBoilerplate;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class AdminVendors {

    private const META_KEY = 'dokan_passport_number';

    public function __construct() {
        add_filter( 'dokan_rest_store_additional_fields', [ $this, 'add_passport_to_response' ], 10, 4 );
        add_action( 'dokan_update_vendor', [ $this, 'save_passport_number' ], 10, 2 );
        add_action( 'dokan_rest_stores_create_store', [ $this, 'save_passport_on_create' ], 10, 2 );
    }

    /**
     * Include passport_number in the vendor REST API response.
     *
     * @param array                $additional_fields
     * @param \WeDevs\Dokan\Vendor\Vendor $store
     * @param \WP_REST_Request     $request
     * @param bool                 $is_authorized
     *
     * @return array
     */
    public function add_passport_to_response( array $additional_fields, $store, $request, $is_authorized ): array {
        $additional_fields['passport_number'] = get_user_meta( $store->get_id(), self::META_KEY, true );

        return $additional_fields;
    }

    /**
     * Save passport_number when a vendor is updated.
     *
     * Fires on `dokan_update_vendor` which provides $vendor_id and $data.
     *
     * @param int   $vendor_id
     * @param array $data
     *
     * @return void
     */
    public function save_passport_number( int $vendor_id, array $data ): void {
        if ( ! isset( $data['passport_number'] ) ) {
            return;
        }

        update_user_meta( $vendor_id, self::META_KEY, sanitize_text_field( $data['passport_number'] ) );
    }

    /**
     * Save passport_number when a vendor is created via REST API.
     *
     * Fires on `dokan_rest_stores_create_store` which provides $store and $request.
     *
     * @param \WeDevs\Dokan\Vendor\Vendor $store
     * @param \WP_REST_Request            $request
     *
     * @return void
     */
    public function save_passport_on_create( $store, $request ): void {
        $passport_number = $request->get_param( 'passport_number' );

        if ( empty( $passport_number ) ) {
            return;
        }

        update_user_meta( $store->get_id(), self::META_KEY, sanitize_text_field( $passport_number ) );
    }
}
