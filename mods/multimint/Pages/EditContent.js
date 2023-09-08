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
} from 'react-bootstrap';
import controller from 'infinitymint-client/dist/src/classic/controller';
import TempProjectModal from '../../../../Modals/TempProjectModal.js';
import storageController from 'infinitymint-client/dist/src/classic/storageController';
import { createNewTempProject } from '../../../../helpers.js';
import SetImageModal from '../Modals/SetImageModal.js';

function EditContent({ match }) {
    const [project, setProject] = useState(controller.getProject());
    const [showTempProjectModal, setShowTempProjectModal] = useState(false);
    const [hasTempProject, setHasTempProject] = useState({});
    const [tempProject, setTempProject] = useState({});
    const [loading, setLoading] = useState(false);
    const [path, setPath] = useState({});
    const [valid, setValid] = useState(false);
    const [selectedKey, setSelectedKey] = useState(null);
    const [needsSaving, setNeedsSaving] = useState(false);
    const newContentKeyRef = useRef(null);
    const newContentMemberRef = useRef(null);
    const newContentMemberRefTwo = useRef(null);
    const newPathKeyRef = useRef({});
    const imageDataRef = useRef({});
    const [showSetImageModal, setShowSetImageModal] = useState(false);

    const defaultContent = () => {
        return {
            fileName: '',
            contentIndex: Object.keys(path.content).length,
            key: selectedKey,
            paths: {},
            ipfsFileName: '',
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
                    <span className="neonText">🧑🏼‍✈️ Edit Content</span>{' '}
                    {selectedKey !== null ? (
                        <span className="badge bg-dark fs-6 ms-2">
                            {selectedKey}
                        </span>
                    ) : (
                        ''
                    )}{' '}
                    <span className="badge bg-dark fs-6 ">
                        <a href="/admin/paths">All Paths</a>
                    </span>{' '}
                    <span className="badge bg-dark fs-6">
                        <a href="/admin/content">All Content</a>
                    </span>
                    <span
                        className="me-2 badge bg-primary"
                        hidden={
                            path?.pathId ===
                            Object.keys(project.paths).length - 2
                        }
                        onClick={() => {
                            window.location.href =
                                '/admin/paths/' +
                                (path.pathId + 1) +
                                '/content/edit';
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
                                '/admin/paths/' +
                                (path.pathId - 1) +
                                '/content/edit';
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
                        href={'/admin/paths/' + path?.pathId + '/edit'}
                        variant="secondary"
                    >
                        Edit Path 🪟
                    </Button>
                </div>
                <Alert variant="success">
                    Here you can edit the content inside of the currenth path.
                    Content can be viewed by the token owner and is stored on
                    IPFS. You can add new content or edit existing content. Note
                    that changes will only be reflected on the frontend after
                    you save the project.
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
                        <Card
                            body
                            className="mt-2"
                            hidden={!hasTempProject || selectedKey === null}
                        >
                            <Alert variant="success">
                                Here you can add new content keys to your path
                                content. Just enter the name of the key and if
                                you want it to be a normal key or an object.
                            </Alert>
                            <Form.Group>
                                <Form.Control
                                    type="text"
                                    placeholder="Please enter a name for the new key"
                                    ref={newContentMemberRefTwo}
                                />
                            </Form.Group>
                            <Stack gap={2} className="mt-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        if (
                                            !newContentMemberRefTwo.current
                                                .value ||
                                            newContentMemberRefTwo.current
                                                .value === '' ||
                                            path.content[selectedKey][
                                                newContentMemberRefTwo.current
                                                    .value
                                            ] !== undefined
                                        )
                                            return;

                                        setNeedsSaving(true);
                                        setPath({
                                            ...path,
                                            content: {
                                                ...path.content,
                                                [selectedKey]: {
                                                    ...path.content[
                                                        selectedKey
                                                    ],
                                                    [newContentMemberRefTwo
                                                        .current.value]: '',
                                                },
                                            },
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
                                            path.content[selectedKey][
                                                newContentMemberRefTwo.current
                                                    .value
                                            ] !== undefined
                                        )
                                            return;

                                        setNeedsSaving(true);
                                        setPath({
                                            ...path,
                                            content: {
                                                ...path.content,
                                                [selectedKey]: {
                                                    ...path.content[
                                                        selectedKey
                                                    ],
                                                    [newContentMemberRefTwo
                                                        .current.value]: {},
                                                },
                                            },
                                        });
                                    }}
                                >
                                    New Object
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        if (
                                            !newContentMemberRefTwo.current
                                                .value ||
                                            newContentMemberRefTwo.current
                                                .value === '' ||
                                            path.content[selectedKey][
                                                newContentMemberRefTwo.current
                                                    .value
                                            ] !== undefined
                                        )
                                            return;

                                        imageDataRef.current.key = selectedKey;
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
                                <Button
                                    variant="danger"
                                    onClick={() => {
                                        setNeedsSaving(true);
                                        let newContent = {
                                            ...path.content,
                                        };
                                        delete newContent[selectedKey];
                                        setPath({
                                            ...path,
                                            content: newContent,
                                        });
                                        setSelectedKey(null);
                                    }}
                                >
                                    Delete Content
                                </Button>
                            </Stack>
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
                                            You are currently editing the
                                            content for this path. You can add
                                            new content or edit existing
                                            content. Note that changes will only
                                            be reflected on the frontend after
                                            you save the project.
                                        </p>
                                    </Alert>
                                    {selectedKey !== null ? (
                                        <Form className="mt-2">
                                            {Object.keys(
                                                path?.content[selectedKey] || {}
                                            ).map((contentKey) => {
                                                if (
                                                    typeof path?.content[
                                                        selectedKey
                                                    ][contentKey] ===
                                                        'object' &&
                                                    !Array.isArray(
                                                        path?.content[
                                                            selectedKey
                                                        ][contentKey]
                                                    ) &&
                                                    path?.content[selectedKey][
                                                        contentKey
                                                    ] !== null
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
                                                                    path
                                                                        ?.content[
                                                                        selectedKey
                                                                    ]?.[
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
                                                                                            value={
                                                                                                path
                                                                                                    .content[
                                                                                                    selectedKey
                                                                                                ][
                                                                                                    contentKey
                                                                                                ][
                                                                                                    pathKey
                                                                                                ]
                                                                                            }
                                                                                            onChange={(
                                                                                                e
                                                                                            ) => {
                                                                                                setPath(
                                                                                                    {
                                                                                                        ...path,
                                                                                                        content:
                                                                                                            {
                                                                                                                ...path.content,
                                                                                                                [selectedKey]:
                                                                                                                    {
                                                                                                                        ...path
                                                                                                                            .content[
                                                                                                                            selectedKey
                                                                                                                        ],
                                                                                                                        paths: {
                                                                                                                            ...path
                                                                                                                                .content[
                                                                                                                                selectedKey
                                                                                                                            ][
                                                                                                                                contentKey
                                                                                                                            ],
                                                                                                                            [pathKey]:
                                                                                                                                e
                                                                                                                                    .target
                                                                                                                                    .value,
                                                                                                                        },
                                                                                                                    },
                                                                                                            },
                                                                                                    }
                                                                                                );
                                                                                            }}
                                                                                        />
                                                                                        <Button variant="success">
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

                                                                                                delete newPath
                                                                                                    .content[
                                                                                                    selectedKey
                                                                                                ][
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
                                                                <Form.Group>
                                                                    <Form.Label>
                                                                        Add New
                                                                        Member
                                                                    </Form.Label>
                                                                    <Form.Control
                                                                        hidden={
                                                                            contentKey ===
                                                                            'paths'
                                                                        }
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
                                                                        variant="secondary"
                                                                        disabled={
                                                                            contentKey ===
                                                                            'paths'
                                                                        }
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
                                                                                path
                                                                                    .content[
                                                                                    selectedKey
                                                                                ][
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
                                                                                    content:
                                                                                        {
                                                                                            ...path.content,
                                                                                            [selectedKey]:
                                                                                                {
                                                                                                    ...path
                                                                                                        .content[
                                                                                                        selectedKey
                                                                                                    ],
                                                                                                    [contentKey]:
                                                                                                        {
                                                                                                            ...path
                                                                                                                .content[
                                                                                                                selectedKey
                                                                                                            ][
                                                                                                                contentKey
                                                                                                            ],
                                                                                                            [newPathKeyRef
                                                                                                                .current[
                                                                                                                contentKey
                                                                                                            ]]:
                                                                                                                '',
                                                                                                        },
                                                                                                },
                                                                                        },
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
                                                                                path
                                                                                    .content[
                                                                                    selectedKey
                                                                                ][
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
                                                                                selectedKey;
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
                                                                            delete newPath
                                                                                .content[
                                                                                selectedKey
                                                                            ][
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
                                                                    path
                                                                        .content[
                                                                        selectedKey
                                                                    ][
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
                                                                        content:
                                                                            {
                                                                                ...path.content,
                                                                                [selectedKey]:
                                                                                    {
                                                                                        ...path
                                                                                            .content[
                                                                                            selectedKey
                                                                                        ],
                                                                                        [contentKey]:
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                    },
                                                                            },
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

                                                                    delete newPath
                                                                        .content[
                                                                        selectedKey
                                                                    ][
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
                                            })}
                                        </Form>
                                    ) : (
                                        <>
                                            <Alert variant="danger">
                                                <Alert.Heading>
                                                    No Content Selected
                                                </Alert.Heading>
                                                <p>
                                                    Select a content item from
                                                    the list on the left to edit
                                                    it.
                                                </p>
                                            </Alert>
                                        </>
                                    )}
                                </>
                            )}
                        </Card>
                        <Card
                            body
                            className="mt-2"
                            hidden={!hasTempProject || selectedKey === null}
                        >
                            <Form.Group>
                                <Form.Control
                                    type="text"
                                    placeholder="Please enter a name for the new key"
                                    ref={newContentMemberRef}
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
                                            !newContentMemberRef.current
                                                .value ||
                                            newContentMemberRef.current
                                                .value === '' ||
                                            path.content[selectedKey][
                                                newContentMemberRef.current
                                                    .value
                                            ] !== undefined
                                        )
                                            return;

                                        setNeedsSaving(true);
                                        setPath({
                                            ...path,
                                            content: {
                                                ...path.content,
                                                [selectedKey]: {
                                                    ...path.content[
                                                        selectedKey
                                                    ],
                                                    [newContentMemberRef.current
                                                        .value]: '',
                                                },
                                            },
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
                                            path.content[selectedKey][
                                                newContentMemberRef.current
                                                    .value
                                            ] !== undefined
                                        )
                                            return;

                                        imageDataRef.current.key = selectedKey;
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
                                            !newContentMemberRef.current
                                                .value ||
                                            newContentMemberRef.current
                                                .value === '' ||
                                            path.content[selectedKey][
                                                newContentMemberRef.current
                                                    .value
                                            ] !== undefined
                                        )
                                            return;

                                        setNeedsSaving(true);
                                        setPath({
                                            ...path,
                                            content: {
                                                ...path.content,
                                                [selectedKey]: {
                                                    ...path.content[
                                                        selectedKey
                                                    ],
                                                    [newContentMemberRef.current
                                                        .value]: {},
                                                },
                                            },
                                        });
                                    }}
                                >
                                    New Object
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={() => {
                                        setNeedsSaving(true);
                                        let newContent = {
                                            ...path.content,
                                        };
                                        delete newContent[selectedKey];
                                        setPath({
                                            ...path,
                                            content: newContent,
                                        });
                                    }}
                                >
                                    Delete
                                </Button>
                            </Stack>
                        </Card>
                        <Card
                            body
                            className="mt-2"
                            hidden={!hasTempProject || selectedKey === null}
                        >
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
                            {Object.keys(path.content || {}).length === 0 ? (
                                <>
                                    <Alert variant="danger">
                                        <Alert.Heading>
                                            Needs Initializing
                                        </Alert.Heading>
                                        <p>
                                            You will need to initialize the path
                                            for content before you can start
                                            modifying it. You can do this by
                                            clicking the button below.
                                        </p>
                                    </Alert>
                                    <div className="d-grid">
                                        <Button
                                            disabled={!hasTempProject}
                                            variant="success"
                                            onClick={() => {
                                                setNeedsSaving(true);
                                                setPath({
                                                    ...path,
                                                    content: {
                                                        default: {
                                                            ...defaultContent(),
                                                        },
                                                    },
                                                });
                                                setSelectedKey('default');
                                            }}
                                        >
                                            Initialize Content
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="d-grid">
                                        <Form.Group className="mb-2">
                                            <Form.Label>
                                                New Content Key
                                            </Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Enter Content Key"
                                                ref={newContentKeyRef}
                                            />
                                        </Form.Group>
                                        <Button
                                            variant="success"
                                            onClick={() => {
                                                if (
                                                    !newContentKeyRef.current
                                                        .value ||
                                                    newContentKeyRef.current
                                                        .value === '' ||
                                                    path.content[
                                                        newContentKeyRef.current
                                                            .value
                                                    ] !== undefined
                                                )
                                                    return;

                                                setNeedsSaving(true);
                                                setPath({
                                                    ...path,
                                                    content: {
                                                        ...path.content,
                                                        [newContentKeyRef
                                                            .current.value]: {
                                                            ...defaultContent(),
                                                        },
                                                    },
                                                });
                                            }}
                                        >
                                            Add New Content
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Card>
                        <Card body className="mt-2">
                            <div className="d-grid gap-2">
                                {Object.keys(path.content || {}).length ===
                                0 ? (
                                    <>
                                        <Alert variant="danger">
                                            <Alert.Heading>
                                                No Content
                                            </Alert.Heading>
                                            <p>
                                                There is no content in this
                                                path. You can add content using
                                                the form above.
                                            </p>
                                        </Alert>
                                    </>
                                ) : (
                                    <></>
                                )}
                                {Object.keys(path.content || {}).map(
                                    (contentKey) => {
                                        return (
                                            <Button
                                                variant={
                                                    contentKey === selectedKey
                                                        ? 'success'
                                                        : 'secondary'
                                                }
                                                onClick={() => {
                                                    setSelectedKey(contentKey);
                                                }}
                                            >
                                                {contentKey}
                                            </Button>
                                        );
                                    }
                                )}
                            </div>
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
                        let _defaultContent = defaultContent();
                        _defaultContent = {
                            ..._defaultContent,
                            ...path.content[selectedKey],
                        };
                        _defaultContent.paths.ipfsURL = cidLink;
                        _defaultContent.paths.data = '';
                        _defaultContent.paths.pathSize = 0;
                        _defaultContent.paths.cid = data.cid;
                        _defaultContent.paths.uploaded = Date.now();
                        _defaultContent.paths.size = (data.size / 1024).toFixed(
                            2
                        );
                        _defaultContent.paths.fileName = data.fileName;
                        _defaultContent.paths.checksum = '';
                        _defaultContent.paths.extension = data.ext;
                        _defaultContent.paths.colours = [];
                        _defaultContent.paths.ipfs = true;
                        _defaultContent.paths.localStorage = false;
                        _defaultContent.paths.projectStorage = false;
                        _defaultContent.key = selectedKey;
                        _defaultContent.name = selectedKey;
                        _defaultContent.fileName = data.fileName;
                        _defaultContent.ipfsFileName = data.fileName;
                        _defaultContent.extension = data.ext;
                        _defaultContent.type = data.ext;
                        _defaultContent.pathId = path.pathId;
                        setPath({
                            ...path,
                            content: {
                                ...path.content,
                                [selectedKey]: _defaultContent,
                            },
                        });
                        setNeedsSaving(true);
                    } else if (imageDataRef.current.key) {
                        if (imageDataRef.current.contentKey !== null)
                            setPath({
                                ...path,
                                content: {
                                    [imageDataRef.current.key]: {
                                        ...path.content[
                                            imageDataRef.current.key
                                        ],
                                        [imageDataRef.current.contentKey]:
                                            cidLink,
                                    },
                                },
                            });
                        else
                            setPath({
                                ...path,
                                content: {
                                    [imageDataRef.current.key]: cidLink,
                                },
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

EditContent.url = '/admin/paths/:pathId/content/edit';
EditContent.id = 'EditContent';
EditContent.settings = {
    requireAdmin: true,
    requireWeb3: true,
    requireWallet: true,
};
export default EditContent;
