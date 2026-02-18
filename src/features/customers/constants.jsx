import { __ } from '@wordpress/i18n';

export const TABLE_FIELDS = [
    {
        id: 'customer',
        label: __( 'Customer', 'dokan-react-boilerplate' ),
        render: ( { item } ) => (
            <div>
                <div className="text-sm font-medium">{ item.display_name }</div>
                <small className="text-xs text-gray-500">{ item.email }</small>
            </div>
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        id: 'orders',
        label: __( 'Orders', 'dokan-react-boilerplate' ),
        render: ( { item } ) => (
            <span>{ item.order_count }</span>
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        id: 'total_spent',
        label: __( 'Total Spent', 'dokan-react-boilerplate' ),
        render: ( { item } ) => {
            const code = window?.dokanFrontend?.currency?.code || 'USD';
            const formatted = new Intl.NumberFormat( undefined, {
                style: 'currency',
                currency: code,
            } ).format( item.total_spent );
            return <span>{ formatted }</span>;
        },
        enableSorting: false,
        enableHiding: false,
    },
    {
        id: 'last_order',
        label: __( 'Last Order', 'dokan-react-boilerplate' ),
        render: ( { item } ) =>
            item.last_order_at ? (
                <span>
                    { new Date( item.last_order_at ).toLocaleDateString() }
                </span>
            ) : (
                <span className="text-gray-400">—</span>
            ),
        enableSorting: false,
        enableHiding: false,
    },
];
