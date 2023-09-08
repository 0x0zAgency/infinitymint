import React, { Component } from "react";
import { Modal, Form, Button, Col, Row, Alert, Card } from "react-bootstrap";
import Controller from "infinitymint-client/dist/src/classic/controller";
import Config from "../../../../config";
import PropTypes from "prop-types";
import { getCodes } from "infinitymint-client/dist/src/classic/helpers";

class GeneratePhraseSetModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            phrases: [],
            phraseCount: this.props.phraseCount || 500,
            phraseId: "Default",
            phraseChunks: 2,
            phraseLength: 16,
        };
    }

    generatePhrases() {
        let result = getCodes(this.state.phraseCount, {
            id: this.state.phraseId,
            chunks: this.state.phraseChunks,
            length: this.state.phraseLength,
        });
        this.setState({
            phrases: result,
        });
    }

    render() {
        return (
            <Modal show={this.props.show} onHide={this.props.onHide} size="xl">
                <Modal.Header className="fs-2">
                    Generate Phrase Set
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col>
                            <Form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    this.props.onFinalizedPhrases(
                                        this.state.phrases,
                                        this.state.phraseId
                                    );
                                }}
                            >
                                <Form.Label>
                                    Set Identifier{" "}
                                    <span className="badge bg-info">
                                        Max Length:{" "}
                                        {Math.floor(
                                            this.state.phraseLength * 0.75
                                        )}
                                    </span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    maxLength={Math.floor(
                                        this.state.phraseLength * 0.75
                                    )}
                                    size="lg"
                                    onChange={(e) => {
                                        this.setState({
                                            phraseId: e.target.value,
                                        });
                                    }}
                                    value={this.state.phraseId}
                                    required
                                />
                                <Form.Label className="mt-2">
                                    Amount{" "}
                                    <span className="badge bg-info">
                                        Keys inside of set
                                    </span>
                                </Form.Label>
                                {this.props.recommendedPhraseCount !==
                                    undefined &&
                                this.props.recommendedPhraseCount !== 0 ? (
                                    <Alert variant="danger">
                                        It is recommended that you generate at
                                        least{" "}
                                        <u>
                                            {this.props.recommendedPhraseCount}
                                        </u>{" "}
                                        keys.
                                    </Alert>
                                ) : (
                                    <></>
                                )}
                                <Form.Control
                                    type="number"
                                    size="lg"
                                    onChange={(e) => {
                                        this.setState({
                                            phraseCount: e.target.value,
                                        });
                                    }}
                                    value={this.state.phraseCount}
                                    required
                                />
                                <Form.Label>Phrase Chunks</Form.Label>
                                <Form.Control
                                    type="number"
                                    size="lg"
                                    max={32}
                                    onChange={(e) => {
                                        this.setState({
                                            phraseChunks: e.target.value,
                                        });
                                    }}
                                    value={this.state.phraseChunks}
                                    required
                                />
                                <Form.Label>Phrase Length</Form.Label>
                                <Form.Control
                                    type="number"
                                    size="lg"
                                    max={32}
                                    onChange={(e) => {
                                        this.setState({
                                            phraseLength: e.target.value,
                                        });
                                    }}
                                    value={this.state.phraseLength}
                                    required
                                />
                                <div className="d-grid">
                                    <Button
                                        variant="dark"
                                        className="mt-2"
                                        onClick={() => {
                                            this.generatePhrases();
                                        }}
                                    >
                                        Generate Phrases
                                    </Button>
                                    <Button
                                        variant="success"
                                        className="mt-2"
                                        disabled={
                                            this.state.phrases.length === 0
                                        }
                                        type="submit"
                                    >
                                        Accept Phrases
                                    </Button>
                                </div>
                            </Form>
                        </Col>
                    </Row>
                    <hr />
                    <Row
                        className="mt-2"
                        hidden={this.state.phrases.length !== 0}
                    >
                        <Col>
                            <Alert variant="danger" className="text-center">
                                <p className="fs-2">😞</p>
                                No Phrases Generated
                            </Alert>
                        </Col>
                    </Row>
                    <Row className="row-cols-3 mt-2 gy-2 gx-2">
                        {this.state.phrases.map((phrase, index) => (
                            <Col key={index}>
                                <Card>
                                    <Card.Header>
                                        <span className="badge bg-dark">
                                            #{index}
                                        </span>
                                    </Card.Header>
                                    <Card.Body>{phrase}</Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                    <Row className="mt-2">
                        <Col>
                            <div className="d-grid">
                                <Button
                                    variant="success"
                                    disabled={this.state.phrases.length === 0}
                                    onClick={() => {
                                        this.props.onFinalizeSet(
                                            this.state.phrases,
                                            this.state.phraseId
                                        );
                                    }}
                                >
                                    Accept Phrases
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
GeneratePhraseSetModal.propTypes = {
    show: PropTypes.bool,
    onHide: PropTypes.func,
};

export default GeneratePhraseSetModal;
