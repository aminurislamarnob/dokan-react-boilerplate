import CustomersDataView from './CustomerTable';
import { RouterProps } from './types';

const CustomersContainer = ( { navigate, location }: RouterProps ) => {
    return (
        <div id="dokan-vendor-customers">
            <CustomersDataView navigate={ navigate } location={ location } />
        </div>
    );
};

export default CustomersContainer;
