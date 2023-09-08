import React, { Component } from "react";
import { Container, Row, Col } from "react-bootstrap";

class SimpleWhitelist extends Component {
    render() {
        return <Container className="mb-5"></Container>;
    }
}

SimpleWhitelist.url = "/admin/whitelist";
SimpleWhitelist.id = "SimpleWhitelist";
SimpleWhitelist.settings = {
    requireWallet: true,
    requireAdmin: true,
    requireWeb3: true,
    dropdown: {
        admin: "➕ Simple Whitelist",
    },
};

export default SimpleWhitelist;
