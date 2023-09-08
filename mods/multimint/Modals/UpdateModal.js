import React, { Component } from 'react';
import { Modal, Form, Button, Col, Row, Alert, Card } from 'react-bootstrap';
import PropTypes from 'prop-types';
import storageController from 'infinitymint-client/dist/src/classic/storageController.js';
import controller from 'infinitymint-client/dist/src/classic/controller.js';

class UpdateModal extends Component {
    installUpdate() {
        if (storageController.getGlobalPreference('needsPathReset')) {
            storageController.values.paths = {};
            storageController.values.preload = {};
            storageController.saveData();
            storageController.setGlobalPreference('needsPathReset', false);
        }

        if (storageController.getGlobalPreference('needsFullReset')) {
            storageController.values.paths = {};
            storageController.values.preload = {};
            storageController.values.tokens = {};
            storageController.values.tokenURI = {};
            storageController.values.deployments = {};
            storageController.values.previews = {};
            storageController.values.requests = {};
            storageController.saveData();
            storageController.setGlobalPreference('needsFullReset', false);
            storageController.setGlobalPreference('needsPathReset', false); // Since it counts
        }

        storageController.setGlobalPreference('lastTag', undefined);
        storageController.setGlobalPreference('lastVersion', undefined);

        window.location.reload();
    }

    render() {
        const projectSettings = controller.getProjectSettings();
        return (
            <Modal show={this.props.show} size="lg" onHide={this.props.onHide}>
                <Modal.Body>
                    <p className="fs-2 text-center rainbow-text-animated">
                        Update Detected!
                    </p>
                    {storageController.getGlobalPreference('lastVersion') <
                    storageController.getGlobalPreference('previousVersion') ? (
                        <Alert variant="danger" className="text-center">
                            Rollback by deployer detected
                        </Alert>
                    ) : (
                        <></>
                    )}
                    <Row>
                        <Col>
                            <Card className="border-danger">
                                <Card.Header>
                                    (Current) Previous Version
                                </Card.Header>
                                <Card.Body className="text-centexr">
                                    <p className="fs-1 mt-3">
                                        {projectSettings.project}{' '}
                                        <span className="badge bg-danger fs-6">
                                            v
                                            {storageController.getGlobalPreference(
                                                'previousVersion'
                                            ) || 0}
                                        </span>
                                        <br />
                                        <span className="badge bg-danger">
                                            {storageController.getGlobalPreference(
                                                'previousTag'
                                            ) || 'initial'}
                                        </span>
                                    </p>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <Card className="border-success">
                                <Card.Header>New Version</Card.Header>
                                <Card.Body>
                                    <p
                                        className="fs-1 mt-3"
                                        style={{
                                            textAlign: 'right',
                                        }}
                                    >
                                        {projectSettings.project}{' '}
                                        <span className="badge bg-danger fs-6">
                                            v
                                            {storageController.getGlobalPreference(
                                                'lastVersion'
                                            ) || 'unknown'}
                                        </span>
                                        <br />
                                        <span className="badge bg-success">
                                            {storageController.getGlobalPreference(
                                                'lastTag'
                                            ) || 'unknown'}
                                        </span>
                                    </p>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                    <p className="text-center mt-3">
                        Please click the button below to install the update.
                    </p>
                    <div className="d-grid">
                        <Button
                            variant="success"
                            onClick={() => {
                                this.installUpdate();
                            }}
                        >
                            Install Update
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        );
    }
}

// Types
UpdateModal.propTypes = {
    show: PropTypes.bool,
    onHide: PropTypes.func,
};

export default UpdateModal;
