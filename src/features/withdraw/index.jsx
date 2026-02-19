import domReady from '@wordpress/dom-ready';
import { registerPlugin } from '@wordpress/plugins';
import { Fill } from '@wordpress/components';
import Balance from './Balance';
import './withdraw-override.scss';

const WithdrawBalanceOverride = () => (
    <Fill name="dokan-layout-content-area-before">
        <Balance />
    </Fill>
);

domReady( () => {
    registerPlugin( 'dokan-react-boilerplate-withdraw-balance', {
        render: WithdrawBalanceOverride,
        scope: 'dokan-withdraw',
    } );
} );
