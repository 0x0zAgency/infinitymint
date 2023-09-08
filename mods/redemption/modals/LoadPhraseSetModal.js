import React, { Component } from "react";
import { Modal, Form, Button, Col, Row, Alert } from "react-bootstrap";
import Controller from "infinitymint-client/dist/src/classic/controller";
import Config from "../../../../config";
import PropTypes from "prop-types";

class LoadPhraseSetModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            value: "",
            error: null,
        };
    }

    onSubmit() {
        if (this.state.value.length === 0) return;

        try {
            let result = JSON.parse(this.state.value);

            if (result._ === undefined) throw new Error("bad package");

            result = Controller.Base64.decode(result._);
            result = JSON.parse(result);

            if (!this.props.onSubmit)
                throw new Error("please tell a developer this modal is broken");

            this.props.onSubmit(result);
        } catch (error) {
            this.setState({
                error: error,
            });
        }
    }

    render() {
        return (
            <Modal show={this.props.show} onHide={this.props.onHide}>
                <Modal.Body>
                    <div className="d-grid">
                        <textarea
                            className="h-100 w-100"
                            onChange={(e) => {
                                this.setState({
                                    value: e.target.value,
                                });
                            }}
                        ></textarea>
                    </div>
                    <div className="d-grid gap-2 mt-2">
                        <Button variant="dark">Find</Button>
                        <Button
                            variant="success"
                            disabled={this.state.value?.length === 0}
                            onClick={this.onSubmit.bind(this)}
                        >
                            Submit
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        );
    }
}

//types
LoadPhraseSetModal.propTypes = {
    show: PropTypes.bool,
    onHide: PropTypes.func,
};

export default LoadPhraseSetModal;
