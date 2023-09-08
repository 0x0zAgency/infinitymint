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

export default function LoadTokenURIModal({
    show,
    onHide,
    savedValues,
    onLoad,
}) {
    const name = useRef(null);

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Body>
                <ListGroup className="mt-2">
                    {Object.keys(
                        StorageController.getGlobalPreference("uri") || {}
                    ).map((key) => {
                        return (
                            <ListGroup.Item
                                onClick={() => {
                                    onLoad(
                                        StorageController.getGlobalPreference(
                                            "uri"
                                        )[key]
                                    );
                                }}
                            >
                                {key}
                            </ListGroup.Item>
                        );
                    })}
                </ListGroup>
            </Modal.Body>
        </Modal>
    );
}
