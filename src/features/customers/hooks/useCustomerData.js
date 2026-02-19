import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';

const API_BASE = window.dokanReactBoilerplateCustomers?.api_namespace || 'dokan-react-boilerplate/v1';

export function useCustomerData( view ) {
    const [ data, setData ] = useState( [] );
    const [ isLoading, setIsLoading ] = useState( true );
    const [ totalItems, setTotalItems ] = useState( 0 );
    const [ error, setError ] = useState( null );

    useEffect( () => {
        let cancelled = false;

        const fetchCustomers = async () => {
            setError( null );
            setIsLoading( true );

            try {
                const queryArgs = {
                    per_page: view.perPage ?? 10,
                    page: view.page ?? 1,
                };
                if ( view.search?.trim() ) {
                    queryArgs.search = view.search.trim();
                }

                const response = await apiFetch( {
                    path: addQueryArgs( `/${ API_BASE }/customers`, queryArgs ),
                    parse: false,
                } );

                if ( cancelled ) {
                    return;
                }

                const total = parseInt(
                    response.headers.get( 'X-WP-Total' ) ?? '0',
                    10
                );
                const json = await response.json();
                setTotalItems( total );
                setData( Array.isArray( json ) ? json : [] );
            } catch ( err ) {
                if ( ! cancelled ) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : __( 'Error fetching customers', 'dokan-react-boilerplate' )
                    );
                    setData( [] );
                }
            } finally {
                if ( ! cancelled ) {
                    setIsLoading( false );
                }
            }
        };

        void fetchCustomers();
        return () => {
            cancelled = true;
        };
    }, [ view.perPage, view.page, view.search ] );

    return {
        data,
        isLoading,
        totalItems,
        error,
    };
}
