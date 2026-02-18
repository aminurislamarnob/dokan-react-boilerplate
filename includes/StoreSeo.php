<?php

namespace WeLabs\DokanReactBoilerplate;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Extends Dokan Pro Store SEO with LinkedIn fields.
 */
class StoreSeo {

    /**
     * Constructor.
     */
    public function __construct() {
        add_filter( 'dokan_vendor_settings_api_store_seo', [ $this, 'add_linkedin_fields' ] );
    }

    /**
     * Add LinkedIn Title, Description, and Image fields to Store SEO settings.
     *
     * @param array $store_seo Existing store SEO fields.
     * @return array
     */
    public function add_linkedin_fields( array $store_seo ): array {
        $linkedin_fields = [
            [
                'id'        => 'dokan-seo-linkedin-title',
                'title'     => __( 'LinkedIn Title', 'dokan-react-boilerplate' ),
                'desc'      => __( 'The LinkedIn title for your store', 'dokan-react-boilerplate' ),
                'info'      => [],
                'type'      => 'text',
                'card'      => 'store_seo_card',
                'tab'       => 'store_seo_general',
                'parent_id' => 'store_seo',
            ],
            [
                'id'        => 'dokan-seo-linkedin-desc',
                'title'     => __( 'LinkedIn Description', 'dokan-react-boilerplate' ),
                'desc'      => __( 'The LinkedIn description for your store', 'dokan-react-boilerplate' ),
                'info'      => [],
                'type'      => 'text',
                'card'      => 'store_seo_card',
                'tab'       => 'store_seo_general',
                'parent_id' => 'store_seo',
            ],
            [
                'id'        => 'dokan-seo-linkedin-image',
                'title'     => __( 'LinkedIn Image', 'dokan-react-boilerplate' ),
                'desc'      => __( 'The LinkedIn image for your store', 'dokan-react-boilerplate' ),
                'info'      => [],
                'type'      => 'image',
                'card'      => 'store_seo_card',
                'tab'       => 'store_seo_general',
                'parent_id' => 'store_seo',
            ],
        ];

        return array_merge( $store_seo, $linkedin_fields );
    }
}
