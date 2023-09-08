import React, { Component, useRef, useState } from 'react';
import { Modal, Form, Button, Col, Row, Alert } from 'react-bootstrap';
import Controller from 'infinitymint-client/dist/src/classic/controller';

const Config = Controller.getConfig();
export default function CreateMinterModal({ show, onHide, onCreateMinter }) {
    const name = useRef(null);
    const price = useRef(null);
    const symbol = useRef(null);
    const [error, setError] = useState(false);

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Body>
                <div className="d-grid">
                    <Alert variant="danger" hidden={!error}>
                        One or more form elements are invalid. Please check your
                        stuff.
                    </Alert>
                </div>
                <Form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        setError(false);

                        if (
                            name.current?.value?.length === 0 ||
                            price.current?.value?.length === 0 ||
                            symbol.current?.value?.length === 0
                        ) {
                            setError(true);
                            return;
                        }

                        onCreateMinter({
                            name: name.current.value,
                            price: parseFloat(price.current.value),
                            symbol: symbol.current.value,
                            deployer: Controller.accounts[0],
                            address: Config.nullAddress,
                            receipt: {},
                            hasDeployed: false,
                        });
                    }}
                >
                    <Form.Group className="mb-3" controlId="minterName">
                        <Form.Label className="fs-5">Token Name</Form.Label>
                        <Form.Control
                            type="text"
                            size="sm"
                            ref={name}
                            placeholder={'VIP Ticket'}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="minterSymbol">
                        <Form.Label className="fs-5">Token Symbol</Form.Label>
                        <Form.Control
                            type="text"
                            size="sm"
                            ref={symbol}
                            placeholder={'🎫'}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="minterPrice">
                        <Form.Label className="fs-5">
                            Token Price{' '}
                            <span className="badge bg-warning">
                                in {Config.getNetwork().token}
                            </span>
                        </Form.Label>
                        <Form.Control
                            type="float"
                            size="sm"
                            ref={price}
                            placeholder={'0.0069'}
                            required
                        />
                    </Form.Group>
                    <div className="d-grid">
                        <Button variant="success" type="submit">
                            Create Minter
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
}
