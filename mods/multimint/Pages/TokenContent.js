import React, { useState, useEffect } from 'react';
import controller from 'infinitymint-client/dist/src/classic/controller';
import storageController from 'infinitymint-client/dist/src/classic/storageController';
import {
    Row,
    Col,
    Stack,
    Alert,
    Container,
    Card,
    Button,
} from 'react-bootstrap';
import { loadPath } from 'infinitymint-client/dist/src/classic/helpers';
import Token from '../../../../Components/Token';
import NavigationLink from '../../../../Components/NavigationLink';
import resources from 'infinitymint-client/dist/src/classic/resources';
import SetContentDataModal from '../Modals/SetContentDataModal';

const Config = controller.getConfig();

function TokenContent() {
    const [isValid, setIsValid] = useState(false);
    const [tokens, setTokens] = useState([]);
    const [error, setError] = useState('');
    const [primaryWallet, setPrimaryWallet] = useState(controller.accounts[0]);
    const [showContentDataModal, setShowContentDataModal] = useState(false);
    const [selectedToken, setSelectedToken] = useState({});

    const getTokens = async (page = 0) => {
        try {
            let tokens = await controller.getTokens(
                Config.settings.maxTokenCount,
                page,
                controller.accounts[0]
            );

            const projectURI = controller.getProjectSettings();
            for (const token of tokens) {
                if (token.token.token.pathId !== undefined) {
                    // eslint-disable-next-line no-await-in-loop
                    await loadPath(projectURI, token.token.token.pathId);
                }
            }

            tokens = tokens.filter(
                (value) => value.token.token.owner === primaryWallet
            );

            setTokens(tokens);
            setIsValid(tokens.length > 0);
        } catch (error) {
            controller.log('[😞] Error', 'error');
            controller.log(error);
            setError(error);
        }
    };

    useEffect(() => {
      getTokens()
    }, [])
    
    return (
        <Container fluid>
            <Row className="mt-2">
                <Col>
                    <Card body hidden={!Config.settings.showHim}>
                        <Alert variant="info" className="text-center p-2">
                            <p className="display-2">🧌</p>
                            <p className="fs-4">
                                Welcome to Multi-Dimensional Opertunties
                            </p>
                        </Alert>
                        <Col>
                            <Row>
                              <div className='d-grid grid-cols-3'>
                                {isValid && controller.isWalletValid ? (
                                    <div className='w-50'>
                                        {tokens.map((value, index) => (
                                          <>
                                            <Token
                                                theToken={value.token}
                                                maxHeight={true}
                                                key={index}
                                                style={{
                                                    cursor: 'pointer',
                                                    minWidth: '256px',
                                                    maxWidth: '450px',
                                                }}
                                                settings={{
                                                    hidePathName: true,
                                                    extraPathNameBadge: true,
                                                    showEditButton: true,
                                                    enableThreeJS: false,
                                                    downsampleRate3D: 1.6,
                                                    selectable3D: true,
                                                    disableFloor3D: true,
                                                    // ForceBackground: ModelBackground,
                                                    showHelpers3D: false,
                                                    lightIntensity3D: 100,
                                                    lightColour3D: 0xff_ff_ff,
                                                    ambientLightIntensity3D: 50,
                                                    ambientLightColour3D: 0xff_ff_ff,
                                                    rotationSpeed3D: 0.001,
                                                }}
                                                onClick={() => {
                                                    setSelectedToken(value.token)
                                                    setShowContentDataModal(true)
                                                }}
                                                onEditClick={() => {}}
                                            />
                                            <Button
                                              onClick={() => {setShowContentDataModal(true)}}
                                              className='btn btn-success'>
                                              Edit Content
                                            </Button>
                                          </>
                                        ))}

                                        {tokens.length > Config.settings.maxTokenCount - 1 ? (
                                            <Col className="d-grid">
                                                <Card body>
                                                    <div className="d-grid gap-2">
                                                        <Alert
                                                            variant="light"
                                                            className="text-center"
                                                        >
                                                            Looks like you have
                                                            quite the
                                                            collection.
                                                        </Alert>
                                                    </div>
                                                </Card>
                                            </Col>
                                        ) : (
                                            <></>
                                        )}
                                    </div>
                                ) : (
                                    <Col>
                                        <Card body>
                                            <div className="d-grid">
                                                <Alert
                                                    variant="danger"
                                                    className="text-center"
                                                >
                                                    You have yet to mint any{' '}
                                                    {resources.tokenPlural()},
                                                    why dont you?
                                                </Alert>
                                                <NavigationLink
                                                    variant="light"
                                                    location={'/mint'}
                                                    text={
                                                        resources.$.UI.Action
                                                            .MintToken
                                                    }
                                                />
                                            </div>
                                        </Card>
                                    </Col>
                                )}
                              </div>
                            </Row>
                        </Col>
                    </Card>
                </Col>
            </Row>
            <SetContentDataModal
              show={showContentDataModal}
              currentKey={selectedToken}
              onHide={() => setShowContentDataModal(false)}
            />
        </Container>
    );
}

TokenContent.id = 'contenttoken';
TokenContent.url = '/contenttoken';
TokenContent.settings = {};

export default TokenContent;
