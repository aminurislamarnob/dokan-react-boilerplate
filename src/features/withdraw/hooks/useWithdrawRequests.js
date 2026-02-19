import { useState, useCallback, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

export const useWithdrawRequests = ( defaultLoader = false ) => {
    const [ data, setData ] = useState( null );
    const [ totalItems, setTotalItems ] = useState( 0 );
    const [ totalPages, setTotalPages ] = useState( 0 );
    const [ isLoading, setIsLoading ] = useState( defaultLoader );
    const [ error, setError ] = useState( null );
    const lastPayload = useRef( null );

    const fetchWithdrawRequests = useCallback( async ( payload ) => {
        try {
            setIsLoading( true );
            setError( null );
            lastPayload.current = lastPayload.current
                ? { ...lastPayload.current, ...payload }
                : payload;

            const url = addQueryArgs( '/dokan/v1/withdraw', payload );
            const response = await apiFetch( {
                path: url,
                parse: false,
            } );

            const responseData = await response.json();
            const headers = response.headers;
            setTotalItems( Number( headers.get( 'X-WP-Total' ) ) );
            setTotalPages( Number( headers.get( 'X-WP-TotalPages' ) ) );
            setData( Array.isArray( responseData ) ? responseData : [] );
        } catch ( err ) {
            setError(
                err instanceof Error
                    ? err
                    : new Error( 'Failed to fetch withdraw requests' )
            );
        } finally {
            setIsLoading( false );
        }
    }, [] );

    const refresh = useCallback( () => {
        if ( lastPayload.current ) {
            fetchWithdrawRequests( lastPayload.current );
        }
    }, [ fetchWithdrawRequests ] );

    return {
        data,
        isLoading,
        error,
        fetchWithdrawRequests,
        refresh,
        totalItems,
        totalPages,
    };
};
