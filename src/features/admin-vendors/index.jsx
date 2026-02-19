import domReady from '@wordpress/dom-ready';
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { registerPlugin } from '@wordpress/plugins';
import { Fill } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { SimpleInput } from '@getdokan/dokan-ui';
import './admin-vendors.scss';

const VENDOR_STORE = 'dokan/vendors';

const PassportNumberField = () => {
    const vendor = useSelect(
        ( select ) => select( VENDOR_STORE ).getCreateOrEditVendor(),
        []
    );
    const { setCreateOrEditVendor } = useDispatch( VENDOR_STORE );

    return (
        <div>
            <SimpleInput
                label={ __( 'Passport Number', 'dokan-react-boilerplate' ) }
                value={ vendor?.passport_number ?? '' }
                onChange={ ( e ) => {
                    setCreateOrEditVendor( {
                        ...vendor,
                        passport_number: e.target.value,
                    } );
                } }
                input={ {
                    placeholder: __( 'Enter passport number', 'dokan-react-boilerplate' ),
                    id: 'passport-number',
                    type: 'text',
                } }
            />
        </div>
    );
};

domReady( () => {
    addFilter(
        'dokan-admin-vendors-list-column-fields',
        'dokan-react-boilerplate/admin-vendors-featured-column',
        ( fields, loadingClass, isLoading ) => {

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

            const passportField = {
                id: 'passport_number',
                label: __( 'Passport Number', 'dokan-react-boilerplate' ),
                enableSorting: false,
                render: ( { item } ) => {
                    if ( isLoading ) {
                        return (
                            <span className={ loadingClass }>
                                { __( 'Loading', 'dokan-react-boilerplate' ) }
                            </span>
                        );
                    }

                    return (
                        <span>{ item?.passport_number || '—' }</span>
                    );
                },
            };

            const updated = [ ...fields ];

            const phoneIndex = updated.findIndex( ( f ) => f.id === 'phone' );
            if ( phoneIndex !== -1 ) {
                updated.splice( phoneIndex + 1, 0, passportField, featuredField );
            } else {
                updated.push( passportField, featuredField );
            }

            return updated;
        }
    );

    addFilter(
        'dokan_dokan_admin_vendors_table_dataviews_view',
        'dokan-react-boilerplate/admin-vendors-custom-view',
        ( view ) => {
            if ( ! view?.fields ) {
                return view;
            }

            const newFields = [];
            if ( ! view.fields.includes( 'passport_number' ) ) {
                newFields.push( 'passport_number' );
            }
            if ( ! view.fields.includes( 'featured' ) ) {
                newFields.push( 'featured' );
            }

            if ( newFields.length ) {
                const phoneIndex = view.fields.indexOf( 'phone' );
                if ( phoneIndex !== -1 ) {
                    view.fields.splice( phoneIndex + 1, 0, ...newFields );
                } else {
                    view.fields.push( ...newFields );
                }
            }

            return view;
        }
    );

    registerPlugin( 'dokan-react-boilerplate-vendor-passport-create', {
        render: () => (
            <Fill name="dokan-create-new-vendor-after-phone-store-information">
                <PassportNumberField />
            </Fill>
        ),
        scope: 'dokan-admin-dashboard-vendor-form-dokan-create-new-vendor',
    } );

    registerPlugin( 'dokan-react-boilerplate-vendor-passport-edit', {
        render: () => (
            <Fill name="dokan-edit-vendor-after-phone-store-information">
                <PassportNumberField />
            </Fill>
        ),
        scope: 'dokan-admin-dashboard-vendor-form-dokan-edit-vendor',
    } );
} );
