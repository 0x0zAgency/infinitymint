import storageController from 'infinitymint-client/dist/src/classic/storageController';
import React, { useState } from 'react';
import { Modal, Row, Col, Alert, Button, Card } from 'react-bootstrap';

export default function UpdateProjectModal({
    show,
    onHide,
    setCurrentProject,
}) {
    const tempProjects =
        storageController.getGlobalPreference('_projects') || {};
    const [selectedProject, setSelectedProject] = useState(null);

    return (
        <Modal size="xl" show={show} onHide={onHide}>
            <Modal.Body>
                <Row>
                    <Col>
                        <Alert variant="success">
                            <p className="fs-3">Update your project!</p>
                            <p>
                                You can update your project by selecting a
                                project from the list below. Once selected you
                                will be able to set it as the current project.
                            </p>
                        </Alert>
                        <div className="d-grid">
                            {Object.keys(tempProjects || {}).map((key) => {
                                let project = tempProjects[key];

                                return (
                                    <Button
                                        variant={
                                            selectedProject === key
                                                ? 'success'
                                                : 'secondary'
                                        }
                                        className="mb-2"
                                        onClick={() => {
                                            setSelectedProject(key);
                                        }}
                                    >
                                        {key}{' '}
                                        <span className="badge bg-dark">
                                            {project.name}
                                        </span>
                                    </Button>
                                );
                            })}
                        </div>
                    </Col>
                    <Col lg={8}>
                        <Card body className="mt-0">
                            {selectedProject === null ? (
                                <Alert variant="danger">
                                    You need to actually select a project in
                                    order to do stuff.
                                </Alert>
                            ) : (
                                <>
                                    <p className="fs-3">
                                        {selectedProject}{' '}
                                        <span className="badge bg-success">
                                            {
                                                tempProjects[selectedProject]
                                                    .project
                                            }
                                        </span>
                                    </p>
                                    <div className="d-grid">
                                        <Button
                                            variant="success"
                                            onClick={() => {
                                                setCurrentProject(
                                                    selectedProject,
                                                    tempProjects[
                                                        selectedProject
                                                    ]
                                                );
                                            }}
                                        >
                                            Set as current project
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Card>
                    </Col>
                </Row>
            </Modal.Body>
        </Modal>
    );
}
