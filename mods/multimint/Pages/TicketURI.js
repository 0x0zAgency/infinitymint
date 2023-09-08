import React from 'react';
import controller from 'infinitymint-client/dist/src/classic/controller';
import { send, call } from 'infinitymint-client/dist/src/classic/helpers';

const config = controller.getConfig();
function TicketURI() {
    const project = controller.getProject();

    /**
     * await call('InfinityMint', 'tokenURI', [tokenId])
     */

    return <div> PLAYER / SCORECARD</div>;
}

TicketURI.url = '/admin/ticket-uri';
TicketURI.id = 'TicketURI';
TicketURI.settings = {
    requireAdmin: true,
    requireWeb3: true,
    requireWallet: true,
    dropdown: {
        admin: '🕴🏻 Ticket URI',
    },
};

export default TicketURI;
