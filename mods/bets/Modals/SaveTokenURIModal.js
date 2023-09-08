import React, { Component, useRef, useState } from "react";
import {
    Modal,
    Form,
    Button,
    Col,
    Row,
    Alert,
    ListGroup,
} from "react-bootstrap";
import StorageController from "infinitymint-client/dist/src/classic/storageController";
export default function SaveTokenURIModal({
    show,
    onHide,
    savedValues,
    onShowCreateURIModal,
}) {
    const name = useRef(null);

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Body>
                <Form
                    onSubmit={(e) => {
                        e.preventDefault();

                        if (!name || !name.current?.value) return;

                        let previousURI =
                            StorageController.getGlobalPreference("uri") || {};

                        let _savedValues = {
                            ...savedValues,
                            data: {
                                ...savedValues.data,
                                key: name?.current?.value,
                            },
                        };
                        StorageController.setGlobalPreference("uri", {
                            ...previousURI,
                            [name?.current?.value]: _savedValues,
                        });
                        StorageController.saveData();
                        onShowCreateURIModal();
                    }}
                >
                    <Form.Group className="mb-3" controlId="minterName">
                        <Form.Label className="fs-5">
                            Please Specify A Name
                        </Form.Label>
                        <Form.Control
                            type="text"
                            size="sm"
                            ref={name}
                            placeholder={"my uri"}
                            required
                        />
                        {/** Do a select box here so they can overwrite previous saves */}
                    </Form.Group>
                    <p>
                        Previous Filenames{" "}
                        <span className="badge bg-danger">will overwrite</span>
                    </p>
                    <ListGroup className="mt-2">
                        {Object.keys(
                            StorageController.getGlobalPreference("uri") || {}
                        ).map((key) => {
                            return <ListGroup.Item>{key}</ListGroup.Item>;
                        })}
                    </ListGroup>
                    <div className="d-grid mt-2 gap-2">
                        <Button variant="success" type="submit">
                            Save Token URI
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                onShowCreateURIModal(savedValues);
                            }}
                        >
                            Back To TokenURI Creator
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
}
