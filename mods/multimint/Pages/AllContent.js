import React, { useState } from 'react';
import {
    Button,
    Card,
    Container,
    Stack,
    Row,
    Col,
    Alert,
} from 'react-bootstrap';
import controller from 'infinitymint-client/dist/src/classic/controller';
import InspectContentModal from '../Modals/InspectContentModal';
import { cutLongString } from 'infinitymint-client/dist/src/classic/helpers';
function AllContent() {
    const [showInspectContentModal, setShowInspectContentModal] =
        useState(false);
    const [selectedPath, setSelectedPath] = useState({});
    const project = controller.getProject();
    return (
        <>
            <Container>
                <p className="display-5 force-white glow mt-4">👁 All Content</p>
                <Alert variant="success">
                    Path content is extra content that can be added to a path.
                    This can be used to add extra information to a path, or to
                    add more media such as images and music to a path.
                </Alert>
                <Row>
                    <Col>
                        <Card body>
                            <div className="d-grid">
                                <Alert variant="success">
                                    Want to easily apply content to all (or a
                                    batch) of paths? Click the button below!
                                </Alert>
                                <Button variant="success">
                                    Apply Content To Paths
                                </Button>
                            </div>
                        </Card>
                    </Col>
                </Row>
                <Row className="row-cols-3">
                    {Object.keys(project.paths).map((key) => {
                        if (key === 'default') return <></>;
                        const path = project.paths[key];
                        return (
                            <Col>
                                <Card className="g-2">
                                    <Card.Header>
                                        <Stack direction="horizontal" gap={3}>
                                            <span className="fs-4">
                                                {path.pathId}
                                            </span>
                                        </Stack>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="d-grid gap-2">
                                            <p className="fs-2 text-center">
                                                {path.name} <br />
                                                <span className="badge fs-6 bg-success text-break">
                                                    {cutLongString(
                                                        path.fileName
                                                    )}
                                                </span>
                                            </p>
                                            <Button
                                                variant="secondary"
                                                onClick={async () => {
                                                    setSelectedPath(path);
                                                    setShowInspectContentModal(
                                                        true
                                                    );
                                                }}
                                            >
                                                Inspect
                                            </Button>
                                            {path.content &&
                                            Object.keys(path.content).length !==
                                                0 ? (
                                                <>
                                                    {Object.keys(
                                                        path.content
                                                    ).map((key) => {
                                                        let content =
                                                            path.content[key];
                                                        return (
                                                            <Button
                                                                variant="primary"
                                                                onClick={async () => {
                                                                    window.location.href =
                                                                        '/admin/paths/' +
                                                                        path.pathId +
                                                                        '/content/edit';
                                                                }}
                                                            >
                                                                Edit{' '}
                                                                {content.key}{' '}
                                                                <span className="badge bg-dark">
                                                                    {cutLongString(
                                                                        content.fileName
                                                                    )}
                                                                </span>
                                                            </Button>
                                                        );
                                                    })}
                                                </>
                                            ) : (
                                                <>
                                                    <Alert variant="warning">
                                                        This path does not have
                                                        any content.
                                                    </Alert>
                                                    <Button
                                                        variant="success"
                                                        onClick={async () => {
                                                            window.location.href =
                                                                '/admin/paths/' +
                                                                path.pathId +
                                                                '/content/edit';
                                                        }}
                                                    >
                                                        Add Content
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            </Container>
            <br />
            <InspectContentModal
                show={showInspectContentModal}
                onHide={() => setShowInspectContentModal(false)}
                path={selectedPath}
            />
            <br />
            <br />
        </>
    );
}

AllContent.url = '/admin/content/';
AllContent.id = 'AllContent';
AllContent.settings = {
    requireAdmin: true,
    requireWallet: true,
    dropdown: {
        admin: '🕶 Content',
    },
};

export default AllContent;
