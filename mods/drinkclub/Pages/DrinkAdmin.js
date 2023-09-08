import React, { Component } from 'react';
import { Container } from 'react-bootstrap';

class DrinkAdmin extends Component {
    render() {
        return <Container></Container>;
    }
}

DrinkAdmin.url = '/admin/drink';
DrinkAdmin.id = 'DrinkAdmin';
DrinkAdmin.settings = {
    requireWallet: true,
    requireWeb3: true,
    requireAdmin: true,
    dropdown: {
        admin: '🖥 Manage 🥃Club',
    },
};

export default DrinkAdmin;
