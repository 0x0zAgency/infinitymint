import React, { Component } from 'react';
import { Container, Row, Col } from 'react-bootstrap';

class CloneMachine extends Component {
    render() {
        return <Container className="mb-5"></Container>;
    }
}

CloneMachine.url = '/admin/cloner';
CloneMachine.id = 'CloneMachine';
CloneMachine.settings = {
    requireWallet: true,
    requireWeb3: true,
    requireAdmin: true,
    dropdown: {
        admin: '🔗 Clone Machine',
    },
};

export default CloneMachine;
