import domReady from '@wordpress/dom-ready';
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import './admin-vendors.scss';

domReady( () => {
    addFilter(
        'dokan-admin-vendors-list-column-fields',
        'dokan-react-boilerplate/admin-vendors-featured-column',
        ( fields, loadingClass, isLoading ) => {
            const statusIndex = fields.findIndex( ( f ) => f.id === 'status' );

            const featuredField = {
                id: 'featured',
                label: __( 'Featured', 'dokan-react-boilerplate' ),
                enableSorting: false,
                render: ( { item } ) => {
                    if ( isLoading ) {
                        return (
                            <span className={ loadingClass }>
                                { __( 'Loading', 'dokan-react-boilerplate' ) }
                            </span>
                        );
                    }

                    return item?.featured ? (
                        <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#D4FBEF] text-[#00563F]">
                            { __( 'Yes', 'dokan-react-boilerplate' ) }
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#FDE8E8] text-[#9B1C1C]">
                            { __( 'No', 'dokan-react-boilerplate' ) }
                        </span>
                    );
                },
            };

            const updated = [ ...fields ];

            if ( statusIndex !== -1 ) {
                updated.splice( statusIndex, 0, featuredField );
            } else {
                updated.push( featuredField );
            }

            return updated;
        }
    );

    addFilter(
        'dokan_dokan_admin_vendors_table_dataviews_view',
        'dokan-react-boilerplate/admin-vendors-featured-view',
        ( view ) => {
            if ( view?.fields && ! view.fields.includes( 'featured' ) ) {
                const statusIndex = view.fields.indexOf( 'status' );

                if ( statusIndex !== -1 ) {
                    view.fields.splice( statusIndex, 0, 'featured' );
                } else {
                    view.fields.push( 'featured' );
                }
            }

            return view;
        }
    );
} );
