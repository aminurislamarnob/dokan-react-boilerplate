import { __ } from '@wordpress/i18n';
import { RouterProps } from './types';
import { useCustomerById } from './hooks/useCustomerById';
import { DokanButton } from '@dokan/components';

const CustomerDetails = ( { params }: RouterProps ) => {
    const id = params?.id ? parseInt( params.id as string, 10 ) : null;
    const { customer, isLoading, error, refresh } = useCustomerById( id );

    if ( ! id ) {
        return (
            <div className="p-6 text-gray-500">
                { __( 'Invalid customer ID.', 'dokan-react-boilerplate' ) }
            </div>
        );
    }

    if ( error ) {
        return (
            <div className="p-6">
                <p className="text-red-600 mb-4">{ error }</p>
                <DokanButton variant="secondary" onClick={ refresh }>
                    { __( 'Retry', 'dokan-react-boilerplate' ) }
                </DokanButton>
            </div>
        );
    }

    if ( isLoading ) {
        return (
            <div className="p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
        );
    }

    if ( ! customer ) {
        return (
            <div className="p-6 text-gray-500">
                { __( 'Customer not found.', 'dokan-react-boilerplate' ) }
            </div>
        );
    }

    return (
        <div id="dokan-vendor-customer-details" className="p-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h4 className="text-lg font-semibold text-gray-800">
                        { customer.display_name }
                    </h4>
                    <p className="text-sm text-gray-500">{ customer.email }</p>
                </div>
                <dl className="px-6 py-4 divide-y divide-gray-100">
                    <DetailRow
                        label={ __( 'Orders', 'dokan-react-boilerplate' ) }
                        value={ String( customer.order_count ) }
                    />
                    <DetailRow
                        label={ __( 'Total Spent', 'dokan-react-boilerplate' ) }
                        value={ formatTotalSpent( customer.total_spent ) }
                    />
                    <DetailRow
                        label={ __( 'Last Order', 'dokan-react-boilerplate' ) }
                        value={
                            customer.last_order_at
                                ? new Date( customer.last_order_at ).toLocaleDateString()
                                : '—'
                        }
                    />
                </dl>
            </div>
        </div>
    );
};

function DetailRow( { label, value }: { label: string; value: string } ) {
    return (
        <div className="py-3 flex justify-between items-center">
            <dt className="text-sm font-medium text-gray-500">{ label }</dt>
            <dd className="text-sm text-gray-900">{ value }</dd>
        </div>
    );
}

function formatTotalSpent( amount: number ): string {
    const code = ( window as unknown as { dokanFrontend?: { currency?: { code?: string } } } )
        .dokanFrontend?.currency?.code || 'USD';
    return new Intl.NumberFormat( undefined, {
        style: 'currency',
        currency: code,
    } ).format( amount );
}

export default CustomerDetails;
