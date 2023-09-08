import React, { useState, useRef } from 'react';
import { Modal, Form, Button, Col, Row, Alert } from 'react-bootstrap';
import StorageController from 'infinitymint-client/dist/src/classic/storageController';
import { send } from 'infinitymint-client/dist/src/classic/helpers';

export default function SetContentDataModal({
    show,
    onHide,
    currentKey,
    savedValues,
}) {
    const handleSubmit = (contentData) => {
        send('InfinityMintApi', '', [{ data: contentData }]);
    };

    const [twitterInput, setTwitterInput] = useState('');
    const [facebookInput, setFacebookInput] = useState('');
    const [ensInput, setEnsInput] = useState('');
    const [linkedinInput, setLinkedinInput] = useState('');

    const contentData = {
        ...twitterInput,
        facebookInput,
        ensInput,
        linkedinInput,
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Body>
                <Alert variant="success" className="text-center">
                    <p className="fs-3">Edit the data in your content field!</p>
                    <p>{currentKey.value}</p>
                </Alert>

                <div className="d-grid">
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-2">
                            <Form.Label controld="formBasicText">
                                Twitter
                            </Form.Label>
                            <Form.Control
                                type="text"
                                onChange={(event) =>
                                    setTwitterInput(event.target.value)
                                }
                                placeholder="@0x0zagency"
                            />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label controld="formBasicText">
                                Facebook
                            </Form.Label>
                            <Form.Control
                                type="text"
                                onChange={(event) =>
                                    setFacebookInput(event.target.value)
                                }
                                placeholder="@0x0z"
                            />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label controld="formBasicText">
                                ENS
                            </Form.Label>
                            <Form.Control
                                type="text"
                                onChange={(event) =>
                                    setEnsInput(event.target.value)
                                }
                                placeholder="jeffbeck.eth"
                            />
                        </Form.Group>
                    </Form>
                </div>
            </Modal.Body>
            <Button onClick={handleSubmit}>Submit</Button>
        </Modal>
    );
}
