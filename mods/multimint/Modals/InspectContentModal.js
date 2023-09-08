import React, { useState, useRef } from 'react';
import {
    Modal,
    Form,
    Button,
    Col,
    Row,
    Alert,
    ListGroup,
} from 'react-bootstrap';

export default function InspectContentModal({ show, onHide, path }) {
    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Inspect Content</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {Object.values(path?.content || {}).length === 0 ? (
                    <>
                        <Alert variant="warning">
                            This path does not have any content.
                        </Alert>
                    </>
                ) : (
                    <></>
                )}
                <ListGroup>
                    {Object.keys(path?.content || {}).map((key) => {
                        let content = path.content[key];

                        return (
                            <ListGroup.Item>
                                <Row>
                                    <Col>
                                        <b>{content.key}</b>
                                    </Col>
                                    <Col className="text-center">
                                        <b>{content.fileName}</b>
                                    </Col>
                                    <Col className="text-center">
                                        <a
                                            onClick={(e) => {
                                                e.preventDefault();
                                                window.open(
                                                    content.paths.ipfsURL
                                                );
                                            }}
                                            href={'?'}
                                            style={{
                                                cursor: 'pointer',
                                            }}
                                        >
                                            View
                                        </a>
                                    </Col>
                                </Row>
                            </ListGroup.Item>
                        );
                    })}
                </ListGroup>
            </Modal.Body>
        </Modal>
    );
}
