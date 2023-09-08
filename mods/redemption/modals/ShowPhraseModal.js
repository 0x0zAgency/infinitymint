import React, { Component } from "react";
import { Modal, Form, Button, Col, Row, Alert, Card } from "react-bootstrap";
import Controller from "infinitymint-client/dist/src/classic/controller";
import Config from "../../../../config";
import PropTypes from "prop-types";
import { getCodes } from "infinitymint-client/dist/src/classic/helpers";

class ShowPhraseModal extends Component {
    render() {
        return (
            <Modal show={this.props.show} onHide={this.props.onHide} size="xl">
                <Modal.Header className="fs-2">
                    Redemption Keys ({this.props.phraseId || "Default"}){" "}
                    <span className="badge bg-dark">
                        {this.props.phrases !== undefined
                            ? this.props.phrases.length
                            : 0}
                    </span>
                </Modal.Header>
                <Modal.Body>
                    <Row
                        className="mt-2"
                        hidden={
                            this.props.phrases === undefined
                                ? true
                                : this.props.phrases.length !== 0
                        }
                    >
                        <Col>
                            <Alert variant="danger" className="text-center">
                                <p className="fs-2">😞</p>
                                No Phrases
                            </Alert>
                        </Col>
                    </Row>
                    <Row className="mt-2">
                        <Col>
                            <div className="d-grid">
                                <Button
                                    variant="success"
                                    onClick={() => {
                                        this.props.onHide();
                                    }}
                                >
                                    Close
                                </Button>
                            </div>
                        </Col>
                    </Row>
                    <Row className="row-cols-3 mt-2 gy-2 gx-2">
                        {this.props.phrases !== undefined ? (
                            this.props.phrases.map((phrase, index) => (
                                <Col key={index}>
                                    <Card>
                                        <Card.Header>
                                            <span className="badge bg-dark">
                                                #{index}
                                            </span>{" "}
                                            {phrase?.tokenId === undefined ? (
                                                <span className="badge bg-danger">
                                                    Unlinked
                                                </span>
                                            ) : (
                                                <span className="badge bg-success">
                                                    Linked
                                                </span>
                                            )}
                                        </Card.Header>
                                        <Card.Body>
                                            {typeof phrase === "object"
                                                ? phrase.phrase
                                                : phrase.toString()}{" "}
                                            {phrase?.tokenId !== undefined ? (
                                                <span className="badge bg-dark me-2">
                                                    linked to tokenId{" "}
                                                    {phrase.tokenId}
                                                </span>
                                            ) : (
                                                <></>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))
                        ) : (
                            <></>
                        )}
                    </Row>
                    <Row className="mt-2">
                        <Col>
                            <div className="d-grid">
                                <Button
                                    variant="success"
                                    onClick={() => {
                                        this.props.onHide();
                                    }}
                                >
                                    Close
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Modal.Body>
            </Modal>
        );
    }
}

//types
ShowPhraseModal.propTypes = {
    show: PropTypes.bool,
    onHide: PropTypes.func,
};

export default ShowPhraseModal;
