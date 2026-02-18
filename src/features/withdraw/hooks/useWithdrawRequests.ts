import { useState, useCallback, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

interface WithdrawRequestPayload {
    per_page: number;
    page: number;
    status: string;
    user_id: number;
}

export interface WithdrawRequest {
    id: number;
    user_id: number;
    amount: number;
    status: string;
    method: string;
    created_date: string;
}

export interface UseWithdrawRequestsReturn {
    data: WithdrawRequest[] | null;
    isLoading: boolean;
    error: Error | null;
    fetchWithdrawRequests: ( payload: WithdrawRequestPayload ) => void;
    refresh: () => void;
    totalItems: number;
    totalPages: number;
}

export const useWithdrawRequests = (
    defaultLoader = false
): UseWithdrawRequestsReturn => {
    const [ data, setData ] = useState< WithdrawRequest[] | null >( null );
    const [ totalItems, setTotalItems ] = useState( 0 );
    const [ totalPages, setTotalPages ] = useState( 0 );
    const [ isLoading, setIsLoading ] = useState( defaultLoader );
    const [ error, setError ] = useState< Error | null >( null );
    const lastPayload = useRef< WithdrawRequestPayload | null >( null );

    const fetchWithdrawRequests = useCallback(
        async ( payload: WithdrawRequestPayload ) => {
            try {
                setIsLoading( true );
                setError( null );
                lastPayload.current = lastPayload.current
                    ? { ...lastPayload.current, ...payload }
                    : payload;

                const url = addQueryArgs( '/dokan/v1/withdraw', payload );
                const response = await apiFetch< Response >( {
                    path: url,
                    parse: false,
                } );

                const responseData = await ( response as Response ).json();
                const headers = ( response as Response ).headers;
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
        },
        []
    );

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
