import { useCallback, useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

const API_BASE = window.dokanReactBoilerplateCustomers?.api_namespace || 'dokan-react-boilerplate/v1';

export function useCustomerById( id ) {
    const [ customer, setCustomer ] = useState( null );
    const [ isLoading, setIsLoading ] = useState( false );
    const [ error, setError ] = useState( null );

    const fetchCustomer = useCallback( async ( customerId ) => {
        setError( null );
        setIsLoading( true );
        try {
            const data = await apiFetch( {
                path: `/${ API_BASE }/customers/${ customerId }`,
            } );
            setCustomer( data );
            return data;
        } catch ( err ) {
            const msg = err instanceof Error ? err.message : 'Failed to fetch customer';
            setError( msg );
            setCustomer( null );
        } finally {
            setIsLoading( false );
        }
    }, [] );

    useEffect( () => {
        if ( id ) {
            void fetchCustomer( id );
        } else {
            setCustomer( null );
            setError( null );
        }
    }, [ id, fetchCustomer ] );

    const refresh = useCallback( () => {
        if ( id ) {
            void fetchCustomer( id );
        }
    }, [ id, fetchCustomer ] );

    return { customer, isLoading, error, refresh };
}
