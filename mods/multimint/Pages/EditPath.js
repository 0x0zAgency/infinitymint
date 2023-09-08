import React, { useState, useEffect, useRef } from 'react';
import {
    Container,
    Row,
    Col,
    Button,
    Card,
    Alert,
    Form,
    Stack,
    ListGroup,
} from 'react-bootstrap';
import controller from 'infinitymint-client/dist/src/classic/controller';
import TempProjectModal from '../../../../Modals/TempProjectModal.js';
import storageController from 'infinitymint-client/dist/src/classic/storageController';
import { createNewTempProject } from '../../../../helpers.js';
import SetImageModal from '../Modals/SetImageModal.js';

function EditPath({ match }) {
    const [project, setProject] = useState(controller.getProject());
    const [showTempProjectModal, setShowTempProjectModal] = useState(false);
    const [hasTempProject, setHasTempProject] = useState({});
    const [showSetImageModal, setShowSetImageModal] = useState(false);
    const [tempProject, setTempProject] = useState({});
    const [loading, setLoading] = useState(false);
    const [path, setPath] = useState({});
    const [valid, setValid] = useState(false);
    const [needsSaving, setNeedsSaving] = useState(false);
    const newContentKeyRef = useRef(null);
    const newContentMemberRef = useRef(null);
    const newContentMemberRefTwo = useRef(null);
    const newPathKeyRef = useRef({});
    const imageDataRef = useRef({});

    const defaultPath = () => {
        return {
            ...(project.paths['default'] || {}),
            ...path,
            paths: {
                ...path.paths,
            },
        };
    };
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
            setTempProject({
                ...storageController.getGlobalPreference('_projects')[
                    storageController.getGlobalPreference('tempProject')
                ],
            });
            setProject({
                ...storageController.getGlobalPreference('_projects')[
                    storageController.getGlobalPreference('tempProject')
                ],
            });
        } else {
            setHasTempProject(false);
        }
    }, []);

    useEffect(() => {
        setLoading(true);

        if (!project.paths[match?.params?.pathId]) setValid(false);
        else if (match?.params?.pathId) {
            setPath(project.paths[match.params.pathId]);
            setValid(true);
        }

        setLoading(false);
    }, [match, project]);

    return (
        <>
            <Container fluid>
                <p className="display-5 mt-4">
                    <span className="neonText">🧑🏼‍✈️ Edit Path</span>{' '}
                    {path.pathId !== null ? (
                        <span className="badge bg-dark fs-6 ms-2">
                            {path.pathId}
                        </span>
                    ) : (
                        ''
                    )}{' '}
                    <span className="badge bg-dark fs-6">
                        <a href="/admin/paths">All Paths</a>
                    </span>{' '}
                    <span className="badge bg-dark fs-6">
                        <a href="/admin/content">All Content</a>
                    </span>
                    <span
                        className="me-2 badge bg-primary"
                        hidden={
                            path?.pathId ===
                            Object.keys(project?.paths || {}).length - 2
                        }
                        onClick={() => {
                            window.location.href =
                                '/admin/paths/' + (path.pathId + 1) + '/edit';
                        }}
                        style={{
                            float: 'right',
                            cursor: 'pointer',
                        }}
                    >
                        <u>Path {path?.pathId + 1}</u>
                    </span>
                    <span
                        className="me-2 badge bg-secondary"
                        style={{
                            float: 'right',
                        }}
                    >
                        Path {path?.pathId}
                    </span>
                    <span
                        hidden={path?.pathId - 1 < 0}
                        className="me-2 badge bg-primary"
                        onClick={() => {
                            window.location.href =
                                '/admin/paths/' + (path.pathId - 1) + '/edit';
                        }}
                        style={{
                            float: 'right',
                            cursor: 'pointer',
                        }}
                    >
                        <u>Path {path?.pathId - 1}</u>
                    </span>
                </p>
                <Alert variant="warning" hidden={!needsSaving}>
                    <Alert.Heading>Warning</Alert.Heading>
                    <p>Your changes need saving!</p>
                </Alert>
                <div className="d-grid mb-2 mt-2">
                    <Button
                        disabled={needsSaving}
                        href={'/admin/paths/' + path?.pathId + '/content/edit'}
                        variant="secondary"
                    >
                        Edit Content 🪟
                    </Button>
                </div>
                <Alert variant="success">
                    Here you can edit the path aka the 'look'. This will be a
                    possible mint in your ERC721 minter. You can be creative as
                    you like.
                </Alert>
                <Row>
                    <Col>
                        <Card body>
                            <div className="d-grid gap-2">
                                <Alert
                                    variant={
                                        hasTempProject ? 'success' : 'danger'
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
                                                Changes are being made to your
                                                temporary project. When you are
                                                done, you can save it as a new
                                                project{' '}
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
                                                You do not have a temp project
                                                set. You will need to set one in
                                                order to make changes.
                                            </p>
                                        </>
                                    )}
                                </Alert>
                                <Button
                                    variant={
                                        hasTempProject ? 'secondary' : 'success'
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
                                {needsSaving ? (
                                    <>
                                        <Button
                                            variant="success"
                                            onClick={() => {
                                                let newTempProject = {
                                                    ...tempProject,
                                                };
                                                newTempProject.paths[
                                                    path.pathId
                                                ] = path;
                                                saveData(newTempProject);
                                                setTempProject(newTempProject);
                                                setProject(newTempProject);
                                                setNeedsSaving(false);
                                            }}
                                        >
                                            Save Project
                                        </Button>
                                        <Button
                                            variant="warning"
                                            onClick={() => {
                                                window.location.reload();
                                            }}
                                        >
                                            Undo Changes
                                        </Button>
                                    </>
                                ) : (
                                    <></>
                                )}
                            </div>
                        </Card>
                    </Col>
                    <Col xl={6}>
                        <Card body>
                            {!valid ? (
                                <>
                                    <Alert variant="danger">
                                        <Alert.Heading>
                                            Invalid Path
                                        </Alert.Heading>
                                        <p>
                                            The path you are trying to edit does
                                            not exist.
                                        </p>
                                    </Alert>
                                </>
                            ) : (
                                <>
                                    <Alert variant="success">
                                        <Alert.Heading>
                                            {path.name || 'Untitled Path'} (
                                            {path.pathId})
                                        </Alert.Heading>
                                        <p>
                                            You are currently editing the path
                                            directly. Note that changes will
                                            only be reflected on the frontend
                                            after you save the project.
                                        </p>
                                    </Alert>
                                    <Alert
                                        variant="danger"
                                        hidden={hasTempProject}
                                    >
                                        Please select or create a new temporary
                                        project
                                    </Alert>
                                    <Form
                                        className="mt-2"
                                        hidden={!hasTempProject}
                                    >
                                        {Object.keys(path || {}).map(
                                            (contentKey) => {
                                                if (contentKey === 'content')
                                                    return (
                                                        <>
                                                            <br />
                                                            <Card body>
                                                                <Alert variant="danger">
                                                                    Content is a
                                                                    special key
                                                                    that is used
                                                                    to store the
                                                                    content for
                                                                    the path.
                                                                    You must go
                                                                    to the
                                                                    content edit
                                                                    page to edit
                                                                    this!
                                                                </Alert>
                                                                <div className="d-grid">
                                                                    <Button
                                                                        variant="success"
                                                                        href={`/admin/paths/${path.pathId}/content/edit`}
                                                                    >
                                                                        Edit
                                                                        Content
                                                                    </Button>
                                                                </div>
                                                                <ListGroup className="mt-2">
                                                                    {Object.keys(
                                                                        path[
                                                                            contentKey
                                                                        ]
                                                                    ).map(
                                                                        (
                                                                            _key
                                                                        ) => {
                                                                            return (
                                                                                <>
                                                                                    <ListGroup.Item>
                                                                                        {
                                                                                            _key
                                                                                        }
                                                                                    </ListGroup.Item>
                                                                                </>
                                                                            );
                                                                        }
                                                                    )}
                                                                </ListGroup>
                                                            </Card>
                                                        </>
                                                    );

                                                if (
                                                    typeof path[contentKey] ===
                                                        'object' &&
                                                    !Array.isArray(
                                                        path[contentKey]
                                                    ) &&
                                                    path[contentKey] !== null
                                                )
                                                    return (
                                                        <>
                                                            <br />
                                                            <Card
                                                                body
                                                                className="pt-1"
                                                            >
                                                                <p className="fs-2">
                                                                    <strong>
                                                                        {contentKey ||
                                                                            'Untitled'}
                                                                    </strong>
                                                                </p>
                                                                {Object.keys(
                                                                    path[
                                                                        contentKey
                                                                    ] || {}
                                                                ).map(
                                                                    (
                                                                        pathKey
                                                                    ) => {
                                                                        return (
                                                                            <>
                                                                                <Form.Group className="mb-2">
                                                                                    <Form.Label>
                                                                                        {
                                                                                            pathKey
                                                                                        }
                                                                                    </Form.Label>
                                                                                    <Stack
                                                                                        gap={
                                                                                            2
                                                                                        }
                                                                                        direction="horizontal"
                                                                                    >
                                                                                        <Form.Control
                                                                                            type="text"
                                                                                            placeholder={`Enter ${pathKey}`}
                                                                                            disabled={
                                                                                                typeof path[
                                                                                                    contentKey
                                                                                                ][
                                                                                                    pathKey
                                                                                                ] ===
                                                                                                    'object' &&
                                                                                                path[
                                                                                                    contentKey
                                                                                                ][
                                                                                                    pathKey
                                                                                                ] !==
                                                                                                    null
                                                                                            }
                                                                                            value={
                                                                                                typeof path[
                                                                                                    contentKey
                                                                                                ][
                                                                                                    pathKey
                                                                                                ] ===
                                                                                                'object'
                                                                                                    ? JSON.stringify(
                                                                                                          path[
                                                                                                              contentKey
                                                                                                          ][
                                                                                                              pathKey
                                                                                                          ]
                                                                                                      )
                                                                                                    : path[
                                                                                                          contentKey
                                                                                                      ][
                                                                                                          pathKey
                                                                                                      ]
                                                                                            }
                                                                                            onChange={(
                                                                                                e
                                                                                            ) => {
                                                                                                setNeedsSaving(
                                                                                                    true
                                                                                                );
                                                                                                setPath(
                                                                                                    {
                                                                                                        ...path,
                                                                                                        [contentKey]:
                                                                                                            {
                                                                                                                ...path[
                                                                                                                    contentKey
                                                                                                                ],
                                                                                                                [pathKey]:
                                                                                                                    e
                                                                                                                        .target
                                                                                                                        .value,
                                                                                                            },
                                                                                                    }
                                                                                                );
                                                                                            }}
                                                                                        />
                                                                                        <Button
                                                                                            variant="success"
                                                                                            hidden={
                                                                                                contentKey ===
                                                                                                'paths'
                                                                                            }
                                                                                        >
                                                                                            Edit
                                                                                        </Button>
                                                                                        <Button
                                                                                            disabled={
                                                                                                contentKey ===
                                                                                                'paths'
                                                                                            }
                                                                                            variant="danger"
                                                                                            onClick={() => {
                                                                                                setNeedsSaving(
                                                                                                    true
                                                                                                );
                                                                                                let newPath =
                                                                                                    {
                                                                                                        ...path,
                                                                                                    };

                                                                                                delete newPath[
                                                                                                    contentKey
                                                                                                ][
                                                                                                    pathKey
                                                                                                ];
                                                                                                setPath(
                                                                                                    newPath
                                                                                                );
                                                                                            }}
                                                                                        >
                                                                                            Delete
                                                                                        </Button>
                                                                                    </Stack>
                                                                                </Form.Group>
                                                                            </>
                                                                        );
                                                                    }
                                                                )}
                                                                <hr />
                                                                <Form.Group
                                                                    hidden={
                                                                        contentKey ===
                                                                        'paths'
                                                                    }
                                                                >
                                                                    <Form.Label>
                                                                        Add New
                                                                        Member
                                                                    </Form.Label>
                                                                    <Form.Control
                                                                        type="text"
                                                                        placeholder="Enter name of new member"
                                                                        onChange={(
                                                                            e
                                                                        ) => {
                                                                            newPathKeyRef.current[
                                                                                contentKey
                                                                            ] =
                                                                                e.target.value;
                                                                        }}
                                                                    />
                                                                </Form.Group>
                                                                <Stack
                                                                    className="mt-2"
                                                                    direction="horizontal"
                                                                    gap={2}
                                                                >
                                                                    <Button
                                                                        disabled={
                                                                            contentKey ===
                                                                            'paths'
                                                                        }
                                                                        variant="secondary"
                                                                        onClick={() => {
                                                                            if (
                                                                                !newPathKeyRef
                                                                                    .current[
                                                                                    contentKey
                                                                                ] ||
                                                                                newPathKeyRef
                                                                                    .current[
                                                                                    contentKey
                                                                                ] ===
                                                                                    '' ||
                                                                                path[
                                                                                    contentKey
                                                                                ][
                                                                                    newPathKeyRef
                                                                                        .current[
                                                                                        contentKey
                                                                                    ]
                                                                                ] !==
                                                                                    undefined
                                                                            )
                                                                                return;

                                                                            setNeedsSaving(
                                                                                true
                                                                            );
                                                                            setPath(
                                                                                {
                                                                                    ...path,
                                                                                    [contentKey]:
                                                                                        '',
                                                                                }
                                                                            );
                                                                        }}
                                                                    >
                                                                        New Any
                                                                    </Button>
                                                                    <Button
                                                                        disabled={
                                                                            contentKey ===
                                                                            'paths'
                                                                        }
                                                                        variant="secondary"
                                                                        onClick={() => {
                                                                            if (
                                                                                !newPathKeyRef
                                                                                    .current[
                                                                                    contentKey
                                                                                ] ||
                                                                                newPathKeyRef
                                                                                    .current[
                                                                                    contentKey
                                                                                ] ===
                                                                                    '' ||
                                                                                path[
                                                                                    contentKey
                                                                                ][
                                                                                    newPathKeyRef
                                                                                        .current[
                                                                                        contentKey
                                                                                    ]
                                                                                ] !==
                                                                                    undefined
                                                                            )
                                                                                return;

                                                                            imageDataRef.current.key =
                                                                                newPathKeyRef.current[
                                                                                    contentKey
                                                                                ];
                                                                            imageDataRef.current.contentKey =
                                                                                contentKey;
                                                                            setShowSetImageModal(
                                                                                true
                                                                            );
                                                                        }}
                                                                    >
                                                                        New
                                                                        Image
                                                                    </Button>
                                                                    <Button
                                                                        variant="danger"
                                                                        disabled={
                                                                            contentKey ===
                                                                            'paths'
                                                                        }
                                                                        onClick={() => {
                                                                            let newPath =
                                                                                {
                                                                                    ...path,
                                                                                };
                                                                            delete newPath[
                                                                                contentKey
                                                                            ];
                                                                            setPath(
                                                                                newPath
                                                                            );
                                                                            setNeedsSaving(
                                                                                true
                                                                            );
                                                                        }}
                                                                    >
                                                                        Delete{' '}
                                                                        {
                                                                            contentKey
                                                                        }
                                                                    </Button>
                                                                    <Button
                                                                        hidden={
                                                                            !needsSaving
                                                                        }
                                                                        variant="success"
                                                                        onClick={() => {
                                                                            saveData(
                                                                                tempProject
                                                                            );
                                                                            setNeedsSaving(
                                                                                false
                                                                            );
                                                                        }}
                                                                    >
                                                                        Save
                                                                        Changes
                                                                    </Button>
                                                                </Stack>
                                                            </Card>
                                                        </>
                                                    );

                                                return (
                                                    <Form.Group className="mb-2">
                                                        <Form.Label>
                                                            {contentKey}
                                                        </Form.Label>
                                                        <Stack
                                                            direction="horizontal"
                                                            gap={2}
                                                        >
                                                            <Form.Control
                                                                type="text"
                                                                placeholder={`Enter ${contentKey}`}
                                                                value={
                                                                    typeof path[
                                                                        contentKey
                                                                    ] ===
                                                                    'object'
                                                                        ? JSON.stringify(
                                                                              path[
                                                                                  contentKey
                                                                              ]
                                                                          )
                                                                        : path[
                                                                              contentKey
                                                                          ]
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) => {
                                                                    setNeedsSaving(
                                                                        true
                                                                    );
                                                                    setPath({
                                                                        ...path,
                                                                        [contentKey]:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    });
                                                                }}
                                                            />
                                                            <Button
                                                                variant="danger"
                                                                onClick={() => {
                                                                    setNeedsSaving(
                                                                        true
                                                                    );
                                                                    let newPath =
                                                                        {
                                                                            ...path,
                                                                        };

                                                                    delete newPath[
                                                                        contentKey
                                                                    ];
                                                                    setPath(
                                                                        newPath
                                                                    );
                                                                }}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </Stack>
                                                    </Form.Group>
                                                );
                                            }
                                        )}
                                    </Form>
                                </>
                            )}
                        </Card>
                        <Card body className="mt-2" hidden={!hasTempProject}>
                            <p className="display-4 neonText">{path.name}</p>
                            <Form.Group>
                                <Form.Control
                                    type="text"
                                    placeholder="Please enter a name for the new key"
                                    ref={newContentMemberRefTwo}
                                />
                            </Form.Group>
                            <Stack
                                direction="horizontal"
                                gap={2}
                                className="mt-2"
                            >
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        if (
                                            !newContentMemberRefTwo.current
                                                .value ||
                                            newContentMemberRefTwo.current
                                                .value === '' ||
                                            path[
                                                newContentMemberRefTwo.current
                                                    .value
                                            ] !== undefined
                                        )
                                            return;

                                        setNeedsSaving(true);
                                        setPath({
                                            ...path,
                                            [newContentMemberRefTwo.value]: '',
                                        });
                                    }}
                                >
                                    New Any
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        if (
                                            !newContentMemberRefTwo.current
                                                .value ||
                                            newContentMemberRefTwo.current
                                                .value === '' ||
                                            path[
                                                newContentMemberRefTwo.current
                                                    .value
                                            ] !== undefined
                                        )
                                            return;

                                        imageDataRef.current.key =
                                            newContentMemberRefTwo.current.value;
                                        imageDataRef.current.contentKey = null;
                                        setShowSetImageModal(true);
                                    }}
                                >
                                    New Image
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        if (
                                            !newContentMemberRefTwo.current
                                                .value ||
                                            newContentMemberRefTwo.current
                                                .value === '' ||
                                            path[
                                                newContentMemberRefTwo.current
                                                    .value
                                            ] !== undefined
                                        )
                                            return;

                                        setNeedsSaving(true);
                                        setPath({
                                            ...path,
                                            [newContentMemberRefTwo.current
                                                .value]: {},
                                        });
                                    }}
                                >
                                    New Object
                                </Button>
                            </Stack>
                        </Card>
                        <Card body className="mt-2" hidden={!hasTempProject}>
                            <div className="d-grid gap-2">
                                <Button
                                    variant="success"
                                    onClick={() => {
                                        imageDataRef.current.key = null;
                                        imageDataRef.current.contentKey = null;
                                        setShowSetImageModal(true);
                                    }}
                                >
                                    Upload & Replace Content
                                </Button>
                                <Button variant="secondary">
                                    Preview Content
                                </Button>
                            </div>
                        </Card>
                        {needsSaving ? (
                            <>
                                <Card body className="mt-2" P>
                                    <div className="d-grid">
                                        <Button
                                            variant="success"
                                            onClick={() => {
                                                saveData(project);
                                                setNeedsSaving(false);
                                            }}
                                        >
                                            Save Changes To Temporary Project
                                        </Button>
                                    </div>
                                </Card>
                            </>
                        ) : (
                            <></>
                        )}
                    </Col>
                    <Col>
                        <Card body>
                            <Alert variant="success">
                                You can use the 'Upload & Replace Content'
                                button to upload a replacement image for this
                                current path.
                            </Alert>
                            <Form.Group hidden={!hasTempProject}>
                                <Form.Control
                                    type="text"
                                    placeholder="Please enter a name for the new key"
                                    ref={newContentMemberRef}
                                />
                            </Form.Group>
                            <Stack
                                gap={2}
                                className="mt-2"
                                hidden={!hasTempProject}
                            >
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        if (
                                            !newContentMemberRef.current
                                                .value ||
                                            newContentMemberRef.current
                                                .value === '' ||
                                            path[
                                                newContentMemberRef.current
                                                    .value
                                            ] !== undefined
                                        )
                                            return;

                                        setNeedsSaving(true);
                                        setPath({
                                            ...path,
                                            [newContentKeyRef.current]: '',
                                        });
                                    }}
                                >
                                    New Any
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        if (
                                            !newContentMemberRef.current
                                                .value ||
                                            newContentMemberRef.current
                                                .value === '' ||
                                            path[
                                                newContentMemberRef.current
                                                    .value
                                            ] !== undefined
                                        )
                                            return;

                                        setNeedsSaving(true);
                                        setPath({
                                            ...path,
                                            [newContentKeyRef.current]: {},
                                        });
                                    }}
                                >
                                    New Object
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        if (
                                            !newContentMemberRef.current
                                                .value ||
                                            newContentMemberRef.current
                                                .value === '' ||
                                            path[
                                                newContentMemberRef.current
                                                    .value
                                            ] !== undefined
                                        )
                                            return;

                                        imageDataRef.current.key =
                                            newContentMemberRef.current.value;
                                        imageDataRef.current.contentKey = null;
                                        setShowSetImageModal(true);
                                    }}
                                >
                                    New Image
                                </Button>
                                <Button
                                    variant="success"
                                    onClick={() => {
                                        imageDataRef.current.key = null;
                                        imageDataRef.current.contentKey = null;
                                        setShowSetImageModal(true);
                                    }}
                                >
                                    Upload & Replace Content
                                </Button>
                            </Stack>
                        </Card>
                    </Col>
                </Row>
            </Container>
            <SetImageModal
                fileName={imageDataRef.current.key}
                show={showSetImageModal}
                onSetImage={(fileName, cidLink, data) => {
                    if (
                        imageDataRef.current.key === null &&
                        imageDataRef.current.contentKey === null
                    ) {
                        let _defaultPath = defaultPath();
                        _defaultPath = { ..._defaultPath, ...path };
                        _defaultPath.paths.ipfsURL = cidLink;
                        _defaultPath.paths.data = '';
                        _defaultPath.paths.pathSize = 0;
                        _defaultPath.paths.cid = data.cid;
                        _defaultPath.paths.uploaded = Date.now();
                        _defaultPath.paths.size = (data.size / 1024).toFixed(2);
                        _defaultPath.paths.fileName = data.fileName;
                        _defaultPath.paths.checksum = '';
                        _defaultPath.paths.extension = data.ext;
                        _defaultPath.paths.colours = [];
                        _defaultPath.paths.ipfs = true;
                        _defaultPath.paths.localStorage = false;
                        _defaultPath.paths.projectStorage = false;
                        _defaultPath.name = fileName;
                        _defaultPath.fileName = data.fileName;
                        _defaultPath.ipfsFileName = data.fileName;
                        setPath(_defaultPath);
                        setNeedsSaving(true);
                    } else if (imageDataRef.current.key) {
                        if (imageDataRef.current.contentKey !== null)
                            setPath({
                                ...path,
                                [imageDataRef.current.key]: {
                                    [imageDataRef.current.contentKey]: cidLink,
                                },
                            });
                        else
                            setPath({
                                ...path,
                                [imageDataRef.current.key]: cidLink,
                            });
                    }

                    setNeedsSaving(true);
                    setShowSetImageModal(false);
                }}
                onHide={() => {
                    setShowSetImageModal(!showSetImageModal);
                }}
            />
            <TempProjectModal
                show={showTempProjectModal}
                onHide={() => {
                    setShowTempProjectModal(!showTempProjectModal);
                }}
                onSetTempProject={(projectName) => {
                    let temp = createNewTempProject(projectName);
                    setTempProject(temp);
                    setProject(temp);
                    setHasTempProject(true);
                    setShowTempProjectModal(false);
                }}
            />
            <br />
            <br />
            <br />
        </>
    );
}

EditPath.url = '/admin/paths/:pathId/edit';
EditPath.id = 'EditPath';
EditPath.settings = {
    requireAdmin: true,
    requireWeb3: true,
    requireWallet: true,
};
export default EditPath;
