import React, { useEffect, useState } from 'react';
import {
    Container,
    Row,
    Col,
    Card,
    Alert,
    Button,
    ListGroup,
} from 'react-bootstrap';
import GasMachine from '../../../../Components/GasMachine';
import Loading from '../../../../Components/Loading';
import Controller from 'infinitymint-client/dist/src/classic/controller';
import { cutLongString } from 'infinitymint-client/dist/src/classic/helpers';
import ipfsController from 'infinitymint-client/dist/src/classic/ipfs/web3Storage';
import StorageController from 'infinitymint-client/dist/src/classic/storageController';
import CreateMinterModal from '../Modals/CreateMinterModal';
import CreateURIModal from '../Modals/CreateURIModal';
import LoadTokenURIModal from '../Modals/LoadTokenURIModal';
import SaveTokenURIModal from '../Modals/SaveTokenURIModal';
import UpdateProjectModal from '../Modals/UpdateProjectModal.js';
import SetImageModal from '../Modals/SetImageModal';
import Mod_MultiMinter from '../Resources/Mod_MultiMinter.json';

const Config = Controller.getConfig();
function MultiMinter() {
    const [minters, setMinters] = useState(
        StorageController.getGlobalPreference('minters') || {}
    );
    const [selectedMinter, setSelectedMinter] = useState(null);
    const [hasMinters, setHasMinters] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUpdateProjectModal, setShowUpdateProjectModal] = useState(false);
    const [showSetImageModal, setShowSetImageModal] = useState(false);
    const [showSaveTokenURIModal, setShowSaveTokenURIModal] = useState(false);
    const [showLoadURIModal, setShowLoadURIModal] = useState(false);
    const [project, setProject] = useState({});
    const [loading, setLoading] = useState(false);
    const [currentImageKey, setCurrentImageKey] = useState(null);
    const [currentTokenIndex, setCurrentTokenIndex] = useState(0);
    const [showCreateURIModal, setShowCreateURIModal] = useState(false);
    const [currentSavedValues, setCurrentSavedValues] = useState({});

    useEffect(() => {
        setLoading(true);
        if (StorageController.getGlobalPreference('minters')) {
            setHasMinters(true);
        }

        let project = Controller.getProjectSettings();
        setProject(project);

        if (
            !project.multiminter &&
            !StorageController.getGlobalPreference('minters')
        )
            setHasMinters(false);
        else {
            let minters = {};
            if (project.multiminter)
                minters = {
                    ...project.multiminter,
                };

            if (StorageController.getGlobalPreference('minters'))
                minters = {
                    ...StorageController.getGlobalPreference('minters'),
                };

            setMinters(minters);
            setHasMinters(Object.values(minters).length !== 0);
        }

        setLoading(false);
    }, []);

    const deployContract = async () => {
        setLoading(true);

        let result = await Controller.deployContract(
            'Mod_MultiMinter',
            [
                selectedMinter?.name,
                selectedMinter?.symbol,
                project.contracts['InfinityMint'],
                Controller.web3.utils.toWei(
                    selectedMinter.price.toString(),
                    'ether'
                ),
            ],
            {},
            Mod_MultiMinter
        );

        let newMinters = {
            ...minters,
            [selectedMinter?.name]: {
                ...selectedMinter,
                hasDeployed: true,
                address: result._address,
                hasAuthenticated: false,
            },
        };

        setMinters(newMinters);
        setSelectedMinter(newMinters[selectedMinter?.name]);

        StorageController.setGlobalPreference('minters', newMinters);
        StorageController.saveData();

        setLoading(false);
    };

    return (
        <>
            {loading ? (
                <Container fluid>
                    <Loading />
                </Container>
            ) : (
                <Container fluid>
                    <p className="display-5 text-white mt-4">
                        ♾️ Multi-Minter
                    </p>
                    <Alert variant="success">
                        Here you can create new ERC721 minters which have a list
                        of tokenURIs that you can either force onto your current Minter or allow the users to choose which Minter
                        to choose from. You can also set a price for each token.
                    </Alert>
                    <Row className="mb-2">
                        <Col lg={3}>
                            <div className="d-grid gap-2 pt-1">
                                <GasMachine />
                                {!hasMinters ? (
                                    <Alert variant="danger">
                                        <p>
                                            You currently have no sub minters.
                                            Go ahead and create one on the
                                            right.
                                        </p>
                                    </Alert>
                                ) : (
                                    Object.keys(minters || {}).map((key) => {
                                        let value = minters[key];
                                        let { address, name, deployer } = value;

                                        return (
                                            <Button
                                                variant={
                                                    selectedMinter?.name ===
                                                    name
                                                        ? 'success'
                                                        : 'light'
                                                }
                                                onClick={() => {
                                                    setSelectedMinter(value);
                                                }}
                                            >
                                                {name || 'Unknown MultiMinter'}
                                                <br />
                                                <span className="badge bg-success">
                                                    {address}
                                                </span>
                                                <span className="badge bg-dark">
                                                    Deployer:{' '}
                                                    {cutLongString(
                                                        deployer,
                                                        16
                                                    )}
                                                </span>
                                            </Button>
                                        );
                                    })
                                )}

                                <Button
                                    key="createMinter"
                                    variant="success"
                                    onClick={() => {
                                        setShowCreateModal(true);
                                    }}
                                >
                                    Create Minter
                                </Button>
                                <Button
                                    key="updateProject"
                                    variant="warning"
                                    onClick={() => {
                                        setShowUpdateProjectModal(true);
                                    }}
                                >
                                    Update Project
                                </Button>
                            </div>
                        </Col>
                        <Col className="p-1">
                            <Card body>
                                {selectedMinter === null ? (
                                    <Alert variant="danger">
                                        Please select a Minter to manage.
                                    </Alert>
                                ) : (
                                    <Row>
                                        <Col>
                                            <p className="display-3">
                                                <span className="">
                                                    {selectedMinter?.name ||
                                                        'UNKNOWN MINTER'}{' '}
                                                </span>

                                                <span className="badge bg-dark fs-3">
                                                    {selectedMinter?.price}{' '}
                                                    {Config.getNetwork()?.token}
                                                </span>
                                                {selectedMinter?.hasDeployed &&
                                                selectedMinter?.hasAuthenticated ? (
                                                    <span className="badge bg-success fs-3 ms-2">
                                                        ACTIVE
                                                    </span>
                                                ) : (
                                                    <></>
                                                )}
                                            </p>
                                            {!project?.multiminter ||
                                            !project?.multiminter[
                                                selectedMinter?.name
                                            ] ? (
                                                <Alert>
                                                    <b>
                                                        This MultiMinter is not
                                                        in your project file.
                                                        You should update the
                                                        infinitymint project so
                                                        this minter becomes
                                                        visible to your users.
                                                        You might not be able to
                                                        view your multiminter
                                                        until you do so.
                                                    </b>
                                                </Alert>
                                            ) : (
                                                <></>
                                            )}
                                            {!selectedMinter?.hasDeployed ? (
                                                <Alert>
                                                    <b>
                                                        This MultiMinter needs
                                                        deployment to the{' '}
                                                        {
                                                            Config.getNetwork()
                                                                .name
                                                        }{' '}
                                                        blockchain.
                                                    </b>
                                                </Alert>
                                            ) : (
                                                <></>
                                            )}
                                            {selectedMinter.hasDeployed &&
                                            !selectedMinter?.hasAuthenticated ? (
                                                <>
                                                    <Alert
                                                        onClick={async () => {
                                                            setLoading(true);
                                                            let result =
                                                                await Controller.callMethod(
                                                                    Controller
                                                                        .accounts[0],
                                                                    'InfinityMint',
                                                                    'isAuthenticated',
                                                                    {
                                                                        parameters:
                                                                            [
                                                                                selectedMinter?.address,
                                                                            ],
                                                                    }
                                                                );

                                                            let newMinters = {
                                                                ...minters,
                                                                [selectedMinter?.name]:
                                                                    {
                                                                        ...selectedMinter,
                                                                        hasAuthenticated:
                                                                            result,
                                                                    },
                                                            };

                                                            setSelectedMinter({
                                                                ...selectedMinter,
                                                                hasAuthenticated:
                                                                    result,
                                                            });
                                                            setMinters(
                                                                newMinters
                                                            );
                                                            StorageController.setGlobalPreference(
                                                                'minters',
                                                                newMinters
                                                            );
                                                            StorageController.saveData();
                                                            setLoading(false);
                                                        }}
                                                    >
                                                        <b>
                                                            Nearly all set! This
                                                            contract just needs
                                                            to be approved by
                                                            the deployer of this
                                                            project, which is
                                                            the address{' '}
                                                            <u>
                                                                {project?.deployer ||
                                                                    Config.nullAddress}
                                                            </u>
                                                        </b>
                                                    </Alert>
                                                    <Button
                                                        variant="danger"
                                                        hidden={
                                                            project.deployer ===
                                                            Controller
                                                                .accounts[0]
                                                        }
                                                    >
                                                        Check Approval Status
                                                    </Button>
                                                    <Button
                                                        variant="success"
                                                        hidden={
                                                            project.deployer !==
                                                            Controller
                                                                .accounts[0]
                                                        }
                                                        onClick={async () => {
                                                            setLoading(true);
                                                            await Controller.sendMethod(
                                                                Controller
                                                                    .accounts[0],
                                                                'InfinityMint',
                                                                'setPrivilages',
                                                                {
                                                                    parameters:
                                                                        [
                                                                            selectedMinter.address,
                                                                            true,
                                                                        ],
                                                                }
                                                            );
                                                            let newMinters = {
                                                                ...minters,
                                                                [selectedMinter?.name]:
                                                                    {
                                                                        ...selectedMinter,
                                                                        hasAuthenticated: true,
                                                                    },
                                                            };

                                                            setSelectedMinter({
                                                                ...selectedMinter,
                                                                hasAuthenticated: true,
                                                            });
                                                            setMinters(
                                                                newMinters
                                                            );
                                                            StorageController.setGlobalPreference(
                                                                'minters',
                                                                newMinters
                                                            );
                                                            StorageController.saveData();
                                                            setLoading(false);
                                                        }}
                                                    >
                                                        Approve Contract On
                                                        Your InfinityMint
                                                    </Button>
                                                </>
                                            ) : (
                                                <></>
                                            )}
                                            <Row
                                                hidden={
                                                    !selectedMinter.hasDeployed
                                                }
                                                className="mt-2"
                                            >
                                                <Col>
                                                    <p className="fs-2">
                                                        Token URIs{' '}
                                                        <span className="badge bg-dark">
                                                            {
                                                                Object.values(
                                                                    selectedMinter?.uris ||
                                                                        {}
                                                                ).length
                                                            }
                                                        </span>
                                                    </p>
                                                    <ListGroup>
                                                        {Object.values(
                                                            selectedMinter?.uris ||
                                                                {}
                                                        ).map((uri, index) => {
                                                            return (
                                                                <ListGroup.Item>
                                                                    {uri?.url ||
                                                                        'UNKNOWN URL'}{' '}
                                                                    <span className="badge bg-dark">
                                                                        #{index}
                                                                    </span>
                                                                </ListGroup.Item>
                                                            );
                                                        })}
                                                        {Object.values(
                                                            selectedMinter?.uris ||
                                                                {}
                                                        ).length === 0 ? (
                                                            <ListGroup.Item>
                                                                You don't have
                                                                any token uri,
                                                                you should
                                                                probably get
                                                                some because
                                                                nobody will be
                                                                able to mint
                                                                from this minter
                                                                until you do!
                                                            </ListGroup.Item>
                                                        ) : (
                                                            <></>
                                                        )}
                                                    </ListGroup>
                                                    <Button
                                                        variant="success"
                                                        className="mt-2"
                                                        onClick={() => {
                                                            setShowCreateURIModal(
                                                                true
                                                            );
                                                        }}
                                                    >
                                                        Create New Token URI
                                                    </Button>
                                                </Col>
                                            </Row>
                                            <Row
                                                className="mt-2"
                                                hidden={
                                                    !selectedMinter.hasDeployed &&
                                                    !selectedMinter.hasAuthenticated
                                                }
                                            >
                                                <Col>
                                                    <div className="d-grid gap-2">
                                                        <Button
                                                            variant="success"
                                                            onClick={async () => {
                                                                setLoading(
                                                                    true
                                                                );

                                                                Controller.initializeContract(
                                                                    selectedMinter?.address,
                                                                    'Mod_MultiMinter',
                                                                    true,
                                                                    Mod_MultiMinter
                                                                );

                                                                let tokenId =
                                                                    await Controller.callMethod(
                                                                        Controller
                                                                            .accounts[0],
                                                                        'Mod_MultiMinter',
                                                                        'totalMints'
                                                                    );
                                                                tokenId =
                                                                    parseInt(
                                                                        tokenId.toString()
                                                                    );

                                                                await Controller.sendMethod(
                                                                    Controller
                                                                        .accounts[0],
                                                                    'Mod_MultiMinter',
                                                                    'mint'
                                                                );

                                                                window.location.href =
                                                                    '/multiminter/' +
                                                                    selectedMinter?.address +
                                                                    '/' +
                                                                    tokenId;
                                                                setLoading(
                                                                    false
                                                                );
                                                            }}
                                                        >
                                                            Mint
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            onClick={() => {
                                                                window.location.href =
                                                                    '/multiminter/' +
                                                                    selectedMinter?.address;
                                                            }}
                                                        >
                                                            View
                                                        </Button>
                                                    </div>
                                                </Col>
                                            </Row>
                                            <Row
                                                hidden={
                                                    selectedMinter.hasDeployed
                                                }
                                            >
                                                <Col>
                                                    <div className="d-grid">
                                                        <Button
                                                            variant="danger"
                                                            onClick={() => {
                                                                deployContract().catch(
                                                                    (error) => {
                                                                        setLoading(
                                                                            false
                                                                        );
                                                                    }
                                                                );
                                                            }}
                                                        >
                                                            Deploy
                                                        </Button>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </Col>
                                    </Row>
                                )}
                            </Card>
                        </Col>
                    </Row>
                </Container>
            )}
            <CreateURIModal
                onSetImage={(key, values) => {
                    setCurrentSavedValues(values);
                    setCurrentImageKey(key);
                    setShowCreateURIModal(false);
                    setShowSetImageModal(true);
                }}
                onLoad={() => {
                    setShowCreateURIModal(false);
                    setShowLoadURIModal(true);
                }}
                onSave={(values) => {
                    setShowCreateURIModal(false);
                    setShowSaveTokenURIModal(true);
                    setCurrentSavedValues(values);
                }}
                onSetTokenURI={async (values) => {
                    ipfsController.createInstance(
                        StorageController.getGlobalPreference(
                            'web3StorageApiKey'
                        )
                    );

                    let final = { ...values };
                    if (final?.data) delete final.data;
                    let cid = await ipfsController.uploadFile(
                        'metadata.json',
                        JSON.stringify(final)
                    );

                    Controller.initializeContract(
                        selectedMinter?.address,
                        'Mod_MultiMinter',
                        true,
                        Mod_MultiMinter
                    );
                    await Controller.sendMethod(
                        Controller.accounts[0],
                        'Mod_MultiMinter',
                        'setTokenURI',
                        [
                            currentTokenIndex,
                            'https://w3s.link/ipfs/' + cid + '/metadata.json',
                        ]
                    );

                    selectedMinter.uris = {
                        ...(selectedMinter.uris || {}),
                        [currentTokenIndex]: {
                            url:
                                'https://w3s.link/ipfs/' +
                                cid +
                                '/metadata.json',
                        },
                    };

                    setMinters({
                        ...minters,
                        ...(StorageController.getGlobalPreference('minters') ||
                            {}),
                        [selectedMinter?.name]: selectedMinter,
                    });
                    StorageController.setGlobalPreference('minters', {
                        ...minters,
                        ...(StorageController.getGlobalPreference('minters') ||
                            {}),
                        [selectedMinter?.name]: selectedMinter,
                    });
                    StorageController.saveData();
                    setShowCreateURIModal(false);
                }}
                savedValues={currentSavedValues}
                show={showCreateURIModal}
                onHide={() => {
                    setShowCreateURIModal(false);
                }}
            />
            <LoadTokenURIModal
                show={showLoadURIModal}
                onHide={(returnToCreateURIModal) => {
                    if (returnToCreateURIModal) {
                        setShowLoadURIModal(false);
                        setShowCreateURIModal(true);
                    }
                }}
                onLoad={(values) => {
                    setCurrentSavedValues(values);
                    setShowLoadURIModal(false);
                    setShowCreateURIModal(true);
                }}
            />
            <SaveTokenURIModal
                savedValues={currentSavedValues}
                show={showSaveTokenURIModal}
                onShowCreateURIModal={(values) => {
                    setCurrentSavedValues(values);
                    setShowSaveTokenURIModal(false);
                    setShowCreateURIModal(true);
                }}
            />
            <SetImageModal
                fileName={currentImageKey}
                onSetImage={(fileName, imageLocation) => {
                    let _sv = {
                        ...currentSavedValues,
                        [fileName]: imageLocation,
                    };

                    if (_sv?.data?.images) _sv?.data?.images.push(fileName);

                    setCurrentSavedValues(_sv);
                    setShowSetImageModal(false);
                    setShowCreateURIModal(true);
                }}
                show={showSetImageModal}
                onHide={() => {
                    setShowSetImageModal(false);
                    setShowCreateURIModal(true);
                }}
            />
            <CreateMinterModal
                show={showCreateModal}
                onCreateMinter={(minter) => {
                    setMinters({
                        ...minters,
                        [minter.name]: minter,
                    });
                    setHasMinters(true);
                    StorageController.setGlobalPreference('minters', {
                        ...minters,
                        [minter.name]: minter,
                    });
                    StorageController.saveData();
                    setShowCreateModal(false);
                }}
                onHide={() => {
                    setShowCreateModal(false);
                }}
            />
        </>
    );
}

MultiMinter.url = '/admin/multiminter';
MultiMinter.id = 'MultiMinter';
MultiMinter.settings = {
    requireAdmin: true,
    requireWeb3: true,
    requireWallet: true,
    dropdown: {
        admin: '♾️ Multi-Minter',
    },
};
export default MultiMinter;
