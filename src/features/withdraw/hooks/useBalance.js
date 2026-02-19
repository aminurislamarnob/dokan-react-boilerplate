import { useState, useEffect, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

export const useBalance = () => {
    const [ data, setData ] = useState( null );
    const [ isLoading, setIsLoading ] = useState( true );
    const [ error, setError ] = useState( null );

    const fetchBalance = useCallback( async () => {
        try {
            setIsLoading( true );
            setError( null );
            const response = await apiFetch( {
                path: '/dokan/v1/withdraw/balance',
                method: 'GET',
            } );
            setData( response );
        } catch ( err ) {
            setError(
                err instanceof Error ? err : new Error( 'Failed to fetch balance' )
            );
        } finally {
            setIsLoading( false );
        }
    }, [] );

    useEffect( () => {
        fetchBalance();
    }, [ fetchBalance ] );

    const refresh = useCallback( () => fetchBalance(), [ fetchBalance ] );

    return { data, isLoading, error, refresh };
};
