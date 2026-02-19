import domReady from '@wordpress/dom-ready';
import { __ } from '@wordpress/i18n';
import CustomersContainer from './CustomersContainer';
import CustomerDetails from './CustomerDetails';
import './customers.scss';

domReady( () => {
    wp.hooks.addFilter(
        'dokan-dashboard-routes',
        'dokan-react-boilerplate-customers',
        ( routes ) => {
            routes.push(
                {
                    id: 'dokan-react-boilerplate-customers',
                    title: __( 'Customers', 'dokan-react-boilerplate' ),
                    element: <CustomersContainer />,
                    path: 'customers',
                    exact: true,
                    capabilities: [ 'dokandar' ],
                    order: 10,
                    parent: '',
                },
                {
                    id: 'dokan-react-boilerplate-customer-details',
                    title: __( 'Customer Details', 'dokan-react-boilerplate' ),
                    element: <CustomerDetails />,
                    path: 'customers/:id',
                    exact: true,
                    capabilities: [ 'dokandar' ],
                    backUrl: '/customers',
                    parent: '',
                }
            );
            return routes;
        }
    );
} );
