import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { TABLE_FIELDS } from './constants';
import { useCustomerData } from './hooks/useCustomerData';
import { DataViews } from '@dokan/components';

const defaultLayouts = {
    table: {},
    list: {},
    density: 'comfortable',
};

const CustomersDataView = ( { navigate, location } ) => {
    const [ selection, setSelection ] = useState( [] );

    const [ view, setView ] = useState( {
        perPage: 10,
        page: 1,
        type: 'table',
        titleField: 'customer',
        layout: { ...defaultLayouts },
        fields: TABLE_FIELDS.map( ( f ) => f.id ).filter( ( id ) => id !== 'customer' ),
        search: '',
    } );

    const { data, isLoading, totalItems } = useCustomerData( view );

    const handleClickItem = ( item ) => {
        navigate( `/customers/${ item.id }` );
    };

    const actions = [
        {
            id: 'customer-view',
            label: '',
            isPrimary: true,
            icon: () => (
                <span className="dokan-link mr-3.5">
                    { __( 'View', 'dokan-react-boilerplate' ) }
                </span>
            ),
            callback: ( items ) => {
                const customer = items[ 0 ];
                navigate( `/customers/${ customer.id }` );
            },
        },
    ];

    return (
        <div className="dokan-react-boilerplate-customers-table">
            <DataViews
                data={ data }
                namespace="dokan-react-boilerplate-customers"
                defaultLayouts={ defaultLayouts }
                fields={ TABLE_FIELDS }
                search={ true }
                getItemId={ ( item ) => String( item.id ) }
                onChangeView={ setView }
                paginationInfo={ {
                    totalItems,
                    totalPages: Math.ceil( totalItems / view.perPage ) || 1,
                } }
                view={ view }
                selection={ selection }
                onChangeSelection={ setSelection }
                actions={ actions }
                isLoading={ isLoading }
                onClickItem={ handleClickItem }
                isItemClickable={ () => true }
            />
        </div>
    );
};

export default CustomersDataView;
