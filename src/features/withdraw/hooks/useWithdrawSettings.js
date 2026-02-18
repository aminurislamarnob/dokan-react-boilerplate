import { useState, useEffect, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

export const useWithdrawSettings = () => {
    const [ data, setData ] = useState( null );
    const [ isLoading, setIsLoading ] = useState( true );
    const [ error, setError ] = useState( null );

    const fetchSettings = useCallback( async () => {
        try {
            setIsLoading( true );
            setError( null );
            const response = await apiFetch( {
                path: '/dokan/v2/withdraw/settings',
                method: 'GET',
            } );
            setData( response );
        } catch ( err ) {
            setError(
                err instanceof Error
                    ? err
                    : new Error( 'Failed to fetch withdraw settings' )
            );
        } finally {
            setIsLoading( false );
        }
    }, [] );

    useEffect( () => {
        fetchSettings();
    }, [ fetchSettings ] );

    const refresh = useCallback( () => fetchSettings(), [ fetchSettings ] );

    return { data, setData, isLoading, error, refresh };
};
