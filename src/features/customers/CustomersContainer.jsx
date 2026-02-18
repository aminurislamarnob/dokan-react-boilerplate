import CustomersDataView from './CustomerTable';

const CustomersContainer = ( { navigate, location } ) => {
    return (
        <div id="dokan-vendor-customers">
            <CustomersDataView navigate={ navigate } location={ location } />
        </div>
    );
};

export default CustomersContainer;
