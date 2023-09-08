import React, { Component } from "react";
import {
    Modal,
    Form,
    Button,
    Col,
    Row,
    Alert,
    Container,
    Card,
    ListGroup,
} from "react-bootstrap";
import PropTypes from "prop-types";
import Controller from "infinitymint-client/dist/src/classic/controller";
import CryptoJS from "crypto-js";

class ValidateRequestModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isValid: null,
            decrypted: "",
        };
    }

    async validate() {
        this.setState({
            isValid: false,
        });

        let key = Controller.web3.utils.toAscii(this.props.selectedRequest.key);
        console.log(key);
        this.setState({
            decrypted: key,
        });

        try {
            let part1 = CryptoJS.AES.decrypt(
                key,
                this.props.actualPhrase + this.props.currentCypherKey
            );
            part1 = part1.toString(CryptoJS.enc.Utf8);

            if (part1.length === 0) throw new Error("bad key");

            this.setState({
                decrypted: part1,
                isValid: part1 === this.props.actualPhrase,
            });
        } catch (error) {
            console.log(error);
            this.setState({
                decrypted: "failed to decrypt",
                isValid: false,
            });
        }
    }

    render() {
        return (
            <Modal
                show={this.props.show}
                onHide={() => {
                    this.setState({
                        isValid: null,
                    });
                    this.props.onHide();
                }}
                size="xl"
            >
                <Modal.Body>
                    <Card body>
                        <Row>
                            <Col>
                                <p>🐻 You</p>
                                <Alert variant="dark">
                                    Your Key: <br />
                                    {this.props.actualPhrase}
                                </Alert>
                            </Col>
                            <Col>
                                <p>🐻 Them</p>
                                <ListGroup>
                                    <ListGroup.Item>
                                        from{" "}
                                        {this.props.selectedRequest?.sender}
                                    </ListGroup.Item>
                                    <ListGroup.Item>
                                        length of{" "}
                                        {
                                            this.props.selectedRequest?.key
                                                ?.length
                                        }
                                    </ListGroup.Item>
                                </ListGroup>
                            </Col>
                        </Row>
                        {this.state.isValid === false ? (
                            <Row className="mt-2">
                                <Col>
                                    <Alert variant="danger">
                                        KEY IS INVALID! DO NOT ACCEPT...
                                        <br />
                                        <u>Parsed Key</u>
                                        <br />
                                        {this.state.decrypted}
                                    </Alert>
                                </Col>
                            </Row>
                        ) : this.state.isValid === true ? (
                            <Row className="mt-2">
                                <Col>
                                    <Alert variant="success">
                                        IS VALID!
                                        <br />
                                        <u>Parsed Key</u>
                                        <br />
                                        {this.state.decrypted}
                                    </Alert>
                                </Col>
                            </Row>
                        ) : (
                            <></>
                        )}
                        <Row
                            className="mt-2"
                            hidden={this.state.isValid !== null}
                        >
                            <Col>
                                <div
                                    className="d-grid"
                                    onClick={() => {
                                        this.validate();
                                    }}
                                >
                                    <Button variant="success">Validate</Button>
                                </div>
                            </Col>
                        </Row>
                        <Row
                            className="mt-2"
                            hidden={
                                this.state.isValid === null ||
                                this.state.isValid === true
                            }
                        >
                            <Col>
                                <div
                                    className="d-grid"
                                    onClick={() => {
                                        this.props.onInvalid();
                                    }}
                                >
                                    <Button variant="danger">Reject</Button>
                                </div>
                            </Col>
                        </Row>
                        <Row
                            className="mt-2"
                            hidden={
                                this.state.isValid === null ||
                                this.state.isValid === false
                            }
                        >
                            <Col>
                                <div
                                    className="d-grid"
                                    onClick={() => {
                                        this.props.onValid();
                                    }}
                                >
                                    <Button variant="success">
                                        Approve Redemption
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Card>
                </Modal.Body>
            </Modal>
        );
    }
}

//types
ValidateRequestModal.propTypes = {
    show: PropTypes.bool,
    onHide: PropTypes.func,
};

export default ValidateRequestModal;
