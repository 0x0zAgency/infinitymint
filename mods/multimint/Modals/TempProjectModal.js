import React, { useState, useRef, useEffect } from 'react';
import { Modal, Form, Col, Row, Button, Alert } from 'react-bootstrap';
import PropTypes from 'prop-types';
import storageController from 'infinitymint-client/dist/src/classic/storageController';

function TempProjectModal({ show, onHide, onSetTempProject }) {
    const newProjectField = useRef(null);
    const oldProjectField = useRef(null);
    const [useTemporaryProject, setUseTemporaryProject] = useState(false);
    const [tempProjects, setTempProjects] = useState({});

    useEffect(() => {
        setTempProjects(
            storageController.getGlobalPreference('_projects') || {}
        );
    }, []);

    return (
        <Modal
            show={show}
            onHide={() => {
                setUseTemporaryProject(false);
                onHide();
            }}
        >
            <Modal.Header closeButton>
                <Modal.Title>Set your temporary project file</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert variant="success" hidden={useTemporaryProject}>
                    What would you like your project to be called?
                </Alert>
                <Row>
                    <Col>
                        <Form
                            onSubmit={(e) => {
                                e.preventDefault();

                                if (
                                    !newProjectField.current?.value ||
                                    newProjectField.current?.value.length <=
                                        0 ||
                                    (storageController.getGlobalPreference(
                                        '_projects'
                                    ) &&
                                        storageController.getGlobalPreference(
                                            '_projects'
                                        )[newProjectField.current.value])
                                )
                                    return;
                                setTempProjects(
                                    storageController.getGlobalPreference(
                                        '_projects'
                                    ) || {}
                                );
                                setUseTemporaryProject(false);
                                onSetTempProject(newProjectField.current.value);
                            }}
                        >
                            <Form.Group as={Row} controlId="formProjectName">
                                <Form.Label>New Project Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder={storageController.getGlobalPreference(
                                        'tempProject'
                                    )}
                                    onClick={() => {
                                        if (useTemporaryProject)
                                            setUseTemporaryProject(false);
                                    }}
                                    ref={newProjectField}
                                />
                            </Form.Group>
                            <Form.Group
                                className="mt-2"
                                controlId="formProjectName"
                            >
                                <Form.Label>
                                    Previous Temporary Projects
                                </Form.Label>
                                <Form.Select
                                    size="sm"
                                    ref={oldProjectField}
                                    onChange={(e) => {
                                        if (
                                            e.target.value &&
                                            e.target.value.length > 0
                                        ) {
                                            setUseTemporaryProject(true);
                                        } else setUseTemporaryProject(false);
                                    }}
                                >
                                    <option></option>
                                    {Object.keys(tempProjects).map(
                                        (key, index) => {
                                            return (
                                                <option key={index} value={key}>
                                                    {key}
                                                </option>
                                            );
                                        }
                                    )}
                                </Form.Select>
                            </Form.Group>
                            <div className="d-grid mt-2 gap-2">
                                <Button
                                    variant="success"
                                    hidden={!useTemporaryProject}
                                    onClick={() => {
                                        if (
                                            !oldProjectField.current?.value ||
                                            oldProjectField.current?.value
                                                .length <= 0
                                        )
                                            return;

                                        onSetTempProject(
                                            oldProjectField.current.value
                                        );
                                        setTempProjects(
                                            storageController.getGlobalPreference(
                                                '_projects'
                                            ) || {}
                                        );
                                    }}
                                >
                                    Use Previous Temporary Project
                                </Button>
                                <Button type="submit">
                                    Create New Temporary Project
                                </Button>
                            </div>
                        </Form>
                    </Col>
                </Row>
            </Modal.Body>
        </Modal>
    );
}

TempProjectModal.propTypes = {
    show: PropTypes.bool,
    onHide: PropTypes.func,
};

export default TempProjectModal;
