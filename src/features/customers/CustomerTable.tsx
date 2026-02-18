import { Customer, RouterProps, ViewState } from './types';
import { useState } from '@wordpress/element';
import { TABLE_FIELDS } from './constants';
import { useCustomerData } from './hooks/useCustomerData';
import { DataViews } from '@dokan/components';

const defaultLayouts = {
    table: {},
    list: {},
    density: 'comfortable',
} as const;

const CustomersDataView = ( { navigate, location }: RouterProps ) => {
    const [ selection, setSelection ] = useState<Customer[]>( [] );

    const [ view, setView ] = useState<ViewState>( {
        perPage: 10,
        page: 1,
        type: 'table',
        titleField: 'customer',
        layout: { ...defaultLayouts },
        fields: TABLE_FIELDS.map( ( f ) => f.id ).filter( ( id ) => id !== 'customer' ),
        search: '',
    } );

    const { data, isLoading, totalItems } = useCustomerData( view );

    const handleClickItem = ( item: Customer ) => {
        navigate( `/customers/${ item.id }` );
    };

    return (
        <div className="dokan-react-boilerplate-customers-table">
            <DataViews
                data={ data }
                namespace="dokan-react-boilerplate-customers"
                defaultLayouts={ defaultLayouts }
                fields={ TABLE_FIELDS }
                search={ true }
                getItemId={ ( item: Customer ) => String( item.id ) }
                onChangeView={ setView }
                paginationInfo={ {
                    totalItems,
                    totalPages: Math.ceil( totalItems / view.perPage ) || 1,
                } }
                view={ view }
                selection={ selection }
                onChangeSelection={ setSelection }
                actions={ [] }
                isLoading={ isLoading }
                onClickItem={ handleClickItem }
                isItemClickable={ () => true }
            />
        </div>
    );
};

export default CustomersDataView;
