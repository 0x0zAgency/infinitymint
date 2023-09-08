import React, { useState, useEffect } from 'react';
import {
    Container,
    Row,
    Col,
    Button,
    Card,
    Alert,
    ListGroup,
} from 'react-bootstrap';
import controller from 'infinitymint-client/dist/src/classic/controller';
import TempProjectModal from '../../../../Modals/TempProjectModal.js';
import storageController from 'infinitymint-client/dist/src/classic/storageController';
import { createNewTempProject, loadPath } from '../../../../helpers.js';
import Loading from '../../../../Components/Loading.js';

function AllPaths() {
    const project = controller.getProject();
    const [showTempProjectModal, setShowTempProjectModal] = useState(false);
    const [hasTempProject, setHasTempProject] = useState({});
    const [tempProject, setTempProject] = useState({});
    const [selected, setSelected] = useState(null);
    const [selectedValue, setSelectedValue] = useState({});
    const [loading, setLoading] = useState(false);

    const saveData = (_tempProject) => {
        setLoading(true);
        storageController.setGlobalPreference('_projects', {
            ...(storageController.getGlobalPreference('_projects') || {}),
            [storageController.getGlobalPreference('tempProject')]: {
                ..._tempProject,
            },
        });
        storageController.saveData();
        setLoading(false);
    };

    useEffect(() => {
        if (storageController.getGlobalPreference('tempProject')) {
            setHasTempProject(true);
            setTempProject(
                storageController.getGlobalPreference('_projects')[
                    storageController.getGlobalPreference('tempProject')
                ]
            );
        } else {
            setHasTempProject(false);
        }
    }, []);

    return (
        <>
            {loading ? (
                <Container>
                    <Loading />
                </Container>
            ) : (
                <Container fluid>
                    <p className="display-5 force-white glow mt-4">
                        🧙‍♂️ All Project Paths
                    </p>
                    <Alert variant="success">
                        Paths are the various mint variations inside of the
                        ERC721 minter. They can be images, sounds and more. Here
                        you can modify current paths or add new ones.
                    </Alert>
                    <Row>
                        <Col>
                            <Card body>
                                <div className="d-grid gap-2">
                                    <Alert
                                        variant={
                                            hasTempProject
                                                ? 'success'
                                                : 'danger'
                                        }
                                    >
                                        {hasTempProject ? (
                                            <>
                                                <Alert.Heading>
                                                    {storageController.getGlobalPreference(
                                                        'tempProject'
                                                    )}
                                                </Alert.Heading>
                                                <p>
                                                    Changes are being made to
                                                    your temporary project. When
                                                    you are done, you can save
                                                    it as a new project{' '}
                                                    <a href="/admin/project/">
                                                        here!
                                                    </a>
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <Alert.Heading>
                                                    No Temp Project
                                                </Alert.Heading>
                                                <p>
                                                    You do not have a temp
                                                    project set. You will need
                                                    to set one in order to make
                                                    changes.
                                                </p>
                                            </>
                                        )}
                                    </Alert>
                                    <Button
                                        variant={
                                            hasTempProject
                                                ? 'secondary'
                                                : 'success'
                                        }
                                        onClick={() => {
                                            setShowTempProjectModal(true);
                                        }}
                                    >
                                        Set Temp Project
                                    </Button>
                                    <Button
                                        variant="danger"
                                        hidden={!hasTempProject}
                                        onClick={() => {
                                            storageController.setGlobalPreference(
                                                'tempProject',
                                                null
                                            );
                                            storageController.saveData();
                                            window.location.reload();
                                        }}
                                    >
                                        Clear Temp Project
                                    </Button>
                                </div>
                            </Card>
                            <Card
                                body
                                className="mt-2"
                                hidden={!hasTempProject}
                            >
                                <div className="d-grid gap-2">
                                    {Object.keys(tempProject?.paths || {}).map(
                                        (key) => {
                                            if (key === 'default') return <></>;

                                            let path = tempProject.paths[key];
                                            return (
                                                <Button
                                                    variant={
                                                        key === selected
                                                            ? 'success'
                                                            : 'secondary'
                                                    }
                                                    onClick={async () => {
                                                        setSelected(key);
                                                        setSelectedValue(path);
                                                        setLoading(true);
                                                        await loadPath(
                                                            project,
                                                            path.pathId
                                                        );
                                                        setLoading(false);
                                                    }}
                                                >
                                                    {key}{' '}
                                                    <span className="badge bg-success">
                                                        {path.fileName}
                                                    </span>
                                                </Button>
                                            );
                                        }
                                    )}
                                </div>
                            </Card>
                        </Col>
                        <Col xl={8}>
                            <Card body>
                                {selected !== null ? (
                                    <>
                                        <Row>
                                            <Col lg={9}>
                                                <p>
                                                    <span className="fs-4 neonText">
                                                        {selectedValue.name}{' '}
                                                    </span>
                                                    <span className="badge fs-7 bg-success">
                                                        {selectedValue.fileName}
                                                    </span>
                                                </p>
                                                <ListGroup className="me-2">
                                                    {Object.keys(
                                                        selectedValue
                                                    ).map((key) => {
                                                        if (
                                                            key === 'name' ||
                                                            key === 'fileName'
                                                        )
                                                            return <></>;

                                                        if (
                                                            selectedValue[
                                                                key
                                                            ] === null ||
                                                            typeof selectedValue[
                                                                key
                                                            ] === 'object'
                                                        )
                                                            return (
                                                                <ListGroup.Item>
                                                                    <b>{key}</b>{' '}
                                                                    {key ===
                                                                    'content' ? (
                                                                        <span
                                                                            className="badge bg-success"
                                                                            onClick={() => {
                                                                                window.location.href = `/admin/paths/${selectedValue.pathId}/content/edit`;
                                                                            }}
                                                                            style={{
                                                                                float: 'right',
                                                                                cursor: 'pointer',
                                                                                textDecoration:
                                                                                    'underline',
                                                                            }}
                                                                        >
                                                                            Edit
                                                                        </span>
                                                                    ) : (
                                                                        <></>
                                                                    )}
                                                                    {key ===
                                                                    'paths' ? (
                                                                        <>
                                                                            <span
                                                                                className="badge bg-success"
                                                                                onClick={() => {
                                                                                    window.location.href = `/admin/paths/${selectedValue.pathId}/edit`;
                                                                                }}
                                                                                style={{
                                                                                    float: 'right',
                                                                                    cursor: 'pointer',
                                                                                    textDecoration:
                                                                                        'underline',
                                                                                }}
                                                                            >
                                                                                Edit
                                                                            </span>
                                                                        </>
                                                                    ) : (
                                                                        <></>
                                                                    )}
                                                                    <pre className="bg-black text-white p-2 mt-2">
                                                                        <code>
                                                                            {`${JSON.stringify(
                                                                                selectedValue[
                                                                                    key
                                                                                ],
                                                                                null,
                                                                                2
                                                                            )}`}
                                                                        </code>
                                                                    </pre>
                                                                </ListGroup.Item>
                                                            );

                                                        return (
                                                            <ListGroup.Item>
                                                                <b>{key}:</b>{' '}
                                                                {
                                                                    selectedValue[
                                                                        key
                                                                    ]
                                                                }
                                                            </ListGroup.Item>
                                                        );
                                                    })}
                                                </ListGroup>
                                            </Col>
                                            <Col>
                                                <div className="d-grid gap-2">
                                                    {selectedValue.fileName.includes(
                                                        '.svg'
                                                    ) ? (
                                                        <div
                                                            className="m-2 p-2"
                                                            style={{
                                                                maxWidth:
                                                                    '42rem',
                                                            }}
                                                            dangerouslySetInnerHTML={{
                                                                __html: controller.getPaths(
                                                                    selectedValue.pathId
                                                                ),
                                                            }}
                                                        ></div>
                                                    ) : (
                                                        <>
                                                            <img
                                                                src={
                                                                    selectedValue
                                                                        .paths
                                                                        .ipfs &&
                                                                    selectedValue
                                                                        .paths
                                                                        .extension !==
                                                                        'svg'
                                                                        ? 'https://' +
                                                                          selectedValue
                                                                              .paths
                                                                              .cid +
                                                                          '.ipfs.w3s.link/' +
                                                                          (selectedValue.ipfsFileName
                                                                              ? selectedValue.ipfsFileName
                                                                              : selectedValue.pathId +
                                                                                '.' +
                                                                                selectedValue
                                                                                    .paths
                                                                                    .extension)
                                                                        : controller.getPaths(
                                                                              selectedValue.pathId
                                                                          )
                                                                }
                                                                className="img-fluid"
                                                                alt="thing"
                                                            />
                                                        </>
                                                    )}
                                                    <Button
                                                        variant="secondary"
                                                        href={
                                                            selectedValue.paths
                                                                ?.ipfsURL
                                                        }
                                                    >
                                                        Inspect Path
                                                    </Button>
                                                    <Button
                                                        variant="warning"
                                                        onClick={() => {
                                                            window.location.href = `/admin/paths/${selectedValue.pathId}/edit`;
                                                        }}
                                                    >
                                                        Edit Path
                                                    </Button>
                                                </div>
                                            </Col>
                                        </Row>
                                    </>
                                ) : (
                                    <>
                                        <Alert variant="danger">
                                            Please select a path to edit
                                        </Alert>
                                    </>
                                )}
                            </Card>
                        </Col>
                    </Row>
                </Container>
            )}

            <TempProjectModal
                show={showTempProjectModal}
                onHide={() => {
                    setShowTempProjectModal(!showTempProjectModal);
                }}
                onSetTempProject={(projectName) => {
                    let temp = createNewTempProject(projectName);
                    saveData(temp);
                    setTempProject(temp);
                    setHasTempProject(true);
                    setShowTempProjectModal(false);
                }}
            />
        </>
    );
}

AllPaths.url = '/admin/paths/';
AllPaths.id = 'AllPaths';
AllPaths.settings = {
    requireAdmin: true,
    requireWeb3: true,
    requireWallet: true,
    dropdown: {
        admin: '🧙‍♂️ Paths',
    },
};
export default AllPaths;
