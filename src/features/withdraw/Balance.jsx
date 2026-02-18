import { __ } from '@wordpress/i18n';
import { PriceHtml } from '@dokan/components';
import { Card } from '@getdokan/dokan-ui';
import { useBalance } from './hooks/useBalance';
import { useWithdrawRequests } from './hooks/useWithdrawRequests';
import { useEffect } from '@wordpress/element';
import { useCurrentUser } from '@dokan/hooks';

const Loader = () => (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                </div>
                <div className="h-10 w-32 animate-pulse rounded bg-gray-200" />
            </div>
        </div>
    </div>
);

function Balance() {
    const balance = useBalance();
    const withdrawRequests = useWithdrawRequests( true );
    const currentUser = useCurrentUser();

    useEffect( () => {
        if ( currentUser ) {
            withdrawRequests.fetchWithdrawRequests( {
                per_page: 10,
                page: 1,
                status: 'pending',
                user_id: currentUser?.id ?? 0,
            } );
        }
    }, [ currentUser ] );

    const masterLoading = withdrawRequests.isLoading;
    const bodyData = balance;

    if (
        ! bodyData ||
        ! Object.prototype.hasOwnProperty.call( bodyData, 'isLoading' ) ||
        bodyData.isLoading ||
        masterLoading
    ) {
        return <Loader />;
    }

    return (
        <Card className="dokan-withdraw-style-reset dokan-layout">
            <Card.Header>
                <Card.Title className="p-0 m-0">
                    { __( 'Current Balance', 'dokan-react-boilerplate' ) }
                </Card.Title>
            </Card.Header>
            <Card.Body>
                <div className="flex flex-col md:!flex-row sm:!items-center justify-between">
                    <div className="flex flex-col">
                        <div className="text-gray-700 md:mb-4 sm:mb-0 flex">
                            <span>{ __( 'Your Available Balance:', 'dokan-react-boilerplate' ) }</span>
                            &nbsp;
                            <span className="font-semibold">
                                <PriceHtml
                                    price={ bodyData?.data?.current_balance ?? '' }
                                />
                            </span>
                        </div>
                        <div className="text-gray-700 md:mb-4 sm:mb-0 flex">
                            <span>
                                { __(
                                    'Minimum Withdraw Amount: ',
                                    'dokan-react-boilerplate'
                                ) }
                            </span>
                            &nbsp;
                            <span className="font-semibold">
                                <PriceHtml
                                    price={ bodyData?.data?.withdraw_limit ?? '' }
                                />
                            </span>
                        </div>
                    </div>
                    { window?.dokanFrontend?.withdraw?.isManualWithdrawEnable && (
                        <RequestWithdrawBtnPlaceholder />
                    ) }
                </div>
            </Card.Body>
        </Card>
    );
}

function RequestWithdrawBtnPlaceholder() {
    return (
        <a
            href={ window?.dokanFrontend?.withdraw?.paymentSettingUrl ?? '#' }
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
            { __( 'Request Withdraw', 'dokan-react-boilerplate' ) }
        </a>
    );
}

export default Balance;
