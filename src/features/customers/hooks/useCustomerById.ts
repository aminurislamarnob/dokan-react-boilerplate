import { useCallback, useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { Customer } from '../types';

declare global {
    interface Window {
        dokanReactBoilerplateCustomers?: {
            api_namespace: string;
        };
    }
}

const API_BASE = window.dokanReactBoilerplateCustomers?.api_namespace || 'dokan-react-boilerplate/v1';

export function useCustomerById( id: number | null ) {
    const [ customer, setCustomer ] = useState<Customer | null>( null );
    const [ isLoading, setIsLoading ] = useState( false );
    const [ error, setError ] = useState<string | null>( null );

    const fetchCustomer = useCallback( async ( customerId: number ) => {
        setError( null );
        setIsLoading( true );
        try {
            const data = await apiFetch<Customer>( {
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
