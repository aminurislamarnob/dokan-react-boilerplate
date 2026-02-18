/**
 * Override Dokan Pro's Store SEO form to add LinkedIn fields.
 * Replaces the settings-store-seo route element with our extended form.
 */
import { __ } from '@wordpress/i18n';
import domReady from '@wordpress/dom-ready';
import { VisitStore } from '@dokan/components';
import StoreSeoForm from './components/StoreSeoForm';

domReady( () => {
    window.wp.hooks.addFilter(
        'dokan-dashboard-routes',
        'dokan-react-boilerplate-store-seo',
        ( routes ) => {
            const index = routes.findIndex( ( r ) => r.id === 'settings-store-seo' );
            if ( index !== -1 ) {
                routes[ index ] = {
                    ...routes[ index ],
                    title: <VisitStore>{ __( 'Store SEO', 'dokan-react-boilerplate' ) }</VisitStore>,
                    element: <StoreSeoForm />,
                };
            }
            return routes;
        },
        20 // Run after dokan-pro (priority 10)
    );
} );
