import React, { Component } from 'react';
import {
    loadToken,
    loadStickers,
    waitSetState,
    cutLongString,
} from 'infinitymint-client/dist/src/classic/helpers';
import {
    Card,
    Container,
    Row,
    Col,
    Button,
    Alert,
    Form,
} from 'react-bootstrap';
import Controller from 'infinitymint-client/dist/src/classic/controller';
import Resources from 'infinitymint-client/dist/src/classic/resources';
import { connectWallet } from 'infinitymint-client/dist/src/classic/helpers';
import StorageController from 'infinitymint-client/dist/src/classic/storageController';
import NavigationLink from '../../../../Components/NavigationLink';
import Loading from '../../../../Components/Loading';
import Token from '../../../../Components/Token';

class ViewContent extends Component {
    constructor(props) {
        super(props);

        this.state = {
            tokenId: this?.props?.match?.params?.tokenId || 0,
            tokenData: {},
            token: {
                pathSize: 64,
                colours: [],
            },
            selectedContentKey: 'first',
            isValid: true,
            error: undefined,
        };
    }

    async componentDidMount() {
        try {
            await loadStickers(this);
            await loadToken(this);

            if (this.state.token.owner !== Controller.accounts[0])
                throw new Error('must be owner of token');
        } catch (error) {
            Controller.log('[😞] Error', 'error');
            Controller.log(error);
            this.setState({
                isValid: false,
            });
        }
    }

    render() {
        let contentKeys = [];
        let tracksNames = [];
        let content = {};
        if (this.state.isValid) {
            content =
                Controller.getPathSettings(this.state.token.pathId).content ||
                {};
            contentKeys = Object.keys(content);
        }

        let selected = content[this.state.selectedContentKey] || {
            paths: {},
        };

        return (
            <>
                {!this.state.isValid || this.state.loading ? (
                    <Container>
                        {this.state.loading ? (
                            <Loading />
                        ) : (
                            <Row className="mt-4">
                                <Col className="text-center text-white">
                                    {!Controller.isWalletValid ? (
                                        <div className="d-grid mt-2 gap-2 text-center">
                                            <Alert variant="danger">
                                                <h3>
                                                    Sorry to put a stop to your
                                                    travels....
                                                </h3>
                                                You need to connect your web3
                                                wallet in order to view a{' '}
                                                {Resources.projectToken().toLowerCase()}
                                            </Alert>
                                            <Button
                                                onClick={() => {
                                                    window.open(
                                                        Controller.getCollectionURL(
                                                            this.state.tokenId
                                                        )
                                                    );
                                                }}
                                                variant="succes`s"
                                            >
                                                View Token On Opensea
                                            </Button>
                                            <Button
                                                variant="dark"
                                                className="ms-2"
                                                onClick={async () => {
                                                    await connectWallet();
                                                }}
                                            >
                                                Connect Wallet
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <h1 className="display-2">
                                                <span className="badge bg-danger">
                                                    Invalid Token
                                                </span>
                                            </h1>
                                            <p className="fs-5">
                                                It might be loading or this{' '}
                                                {Resources.projectToken()}{' '}
                                                straight up might not exist.
                                            </p>
                                            <div className="d-grid mt-2 gap-2">
                                                <Button
                                                    variant="light"
                                                    size="lg"
                                                    onClick={async () => {
                                                        try {
                                                            delete StorageController
                                                                .values.tokens[
                                                                this.state
                                                                    .tokenId
                                                            ];
                                                            StorageController.saveData();

                                                            this.setState({
                                                                token: {
                                                                    pathSize: 0,
                                                                    colours: [],
                                                                    stickers:
                                                                        [],
                                                                },
                                                                error: null,
                                                                loading: true,
                                                                isValid: false,
                                                            });

                                                            await this.componentDidMount();
                                                        } catch (error) {
                                                            this.setError(
                                                                error
                                                            );
                                                        }
                                                    }}
                                                >
                                                    {
                                                        Resources.$.UI.Action
                                                            .Refresh
                                                    }
                                                </Button>
                                                <NavigationLink
                                                    location="/mint"
                                                    text={
                                                        Resources.$.UI.Action
                                                            .MintToken
                                                    }
                                                />
                                                <NavigationLink
                                                    location={'/mytokens'}
                                                    text={
                                                        Resources.$.UI.Action
                                                            .MyTokens
                                                    }
                                                />
                                            </div>
                                        </>
                                    )}
                                </Col>
                            </Row>
                        )}
                    </Container>
                ) : (
                    <Container className="mt-4">
                        <Row>
                            <Col>
                                <h1 className="d-flex text-center flex-column text-white display-5 mt-2">                  
                                        ♾Links & Content 
                                </h1>
                            </Col>
                        </Row>
                        <Row className="mt-4">
                            <Col className="gap-2 bg-dark" xxl={4} xl={4} lg={4} md={3} sm={12}>
                            {this.state.selectedContentKey === '3d' ? (
                                
                                <Card
                                    Body
                                    className='h-100 bg-dark p-0 m-0'
                                    
                                >
                                    <Container className="d-grid">
                                        <Row>
                                            <Token
                                                theToken={this.state.token}
                                                className="mx-auto img-fluid h-100"
                                                
                                                settings={{
                                                    
                                                    selectable3D: false,
                                                    disableFloor3D: true,
                                                    downsampleRate3D: 1.5,
                                                    lightIntensity3D: 100,
                                                    lightColour3D: 0xffffff,
                                                    useFresh: false,
                                                    renderOnUpdate: true,
                                                    ambientLightIntensity3D: 50,
                                                    ambientLightColour3D: 0xffffff,
                                                    cameraFOV: 69,
                                                cameraPositionZ: 0,
                                                cameraPositionX: 0,
                                                cameraPositionY: 0,
                                                    drawContextKey:
                                                    selected.type ===
                                                            'gif' ||    
                                                    selected.type ===
                                                            'png' ||
                                                        selected.type ===
                                                            'jpeg' ||
                                                        selected.type ===
                                                            'jpg' ||
                                                        selected.type === 'svg'
                                                            ? this.state
                                                                  .selectedContentKey
                                                            : false,
                                                    enableThreeJS: 
                                                        this.state.selectedContentKey === '3d',
                                                    hidePathName: true,
                                                    hideTokenId: true,
                                                    hideModBadges: true,
                                                    hideLinkBadges: true,
                                                    hideDescription: true,
                                                }}
                                            />
                                        </Row>
                                    </Container>
                                </Card>
                                ) : (
                                    <></>
                                )}
                                {selected !== undefined ? (
                                    <Card body className="h-100 bg-dark p-0 m-0">
                                        
                                        <></>
                                        <div className="d-grid">
                                            {
                                            selected.type === 'mp3' ||
                                            selected.type === 'wav' ? (
                                                <>
                                                    <audio
                                                        controls
                                                       
                                                    >
                                                        <source
                                                            src={
                                                                selected.paths
                                                                    .localStorage
                                                                    ? selected
                                                                          .paths
                                                                          .data
                                                                    : selected
                                                                          .paths
                                                                          .ipfsURL
                                                            }
                                                            type="audio/mpeg"
                                                        />
                                                        Your browser does not
                                                        support the audio
                                                        element.
                                                    </audio>
                                                </>
                                            ) : selected.type === 'mp4' ? (
                                                <>
                                                    <video
                                                        controls
                                                        
                                                    >
                                                        <source
                                                            src={
                                                                selected.paths
                                                                    .localStorage
                                                                    ? selected
                                                                          .paths
                                                                          .data
                                                                    : selected
                                                                          .paths
                                                                          .ipfsURL
                                                            }
                                                            type="video/mpeg"
                                                        />
                                                        Your browser does not
                                                        support the video
                                                        element.
                                                    </video>
                                                </>
                                            ) : selected.type === 'svg' ? (
                                                <iframe
                                                    title="some"
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        minHeight: '420px',
                                                    }}
                                                    src={selected.paths.data}
                                                >
                                                    {selected.paths.data}
                                                </iframe>
                                            ) : (
                                                <img
                                                    alt="onTokenContent"
                                                    src={
                                                        selected.paths
                                                            .localStorage
                                                            ? selected
                                                                  .paths
                                                                  .data
                                                            : selected
                                                                  .paths
                                                                  .ipfsURL || "../../../../magicmirrorLogo.jpg"
                                                    }
                                                    className="mx-auto img-fluid"
                                                ></img>
                                            ) 
                                            }
                                        </div>
                                    </Card>
                                ) : (
                                    <></>
                                )}
                            </Col>
                            <Col xxl={8} xl={8} lg={8} md={9} sm={12}>
                                <Card Body className="">
                                {selected !== undefined ? (
                                        <Row>
                                            <Col>
                                                <Card
                                                    body
                                                    className="bg-primary p-2 m-2"
                                                >
                                                    <p className="display-6 text-white">
                                                    👁️ Now Viewing:&nbsp;
                                                        {
                                                            this.state
                                                                .selectedContentKey
                                                        }
                                                        
                                                    </p><span className="badge bg-success">
                                                    {cutLongString(selected.fileName, 64)}
                                                        </span>
                                                    <p className="text-white"> 
                                                        {tracksNames[
                                                            this.state
                                                                .selectedContentKey
                                                        ] !== undefined
                                                            ? tracksNames[
                                                                  this.state
                                                                      .selectedContentKey
                                                              ]
                                                            : ''}
                                                    </p>
                                                </Card>
                                            </Col>
                                        </Row>
                                    ) : (
                                        <Row>
                                            <Col>
                                                <Alert
                                                    className="text-center"
                                                    variant="warning"
                                                >
                                                    Invalid Content Key
                                                </Alert>
                                            </Col>
                                        </Row>
                                    )}
                                    <Card.Subtitle className="p-2 text-white fs-2">
                                        Browse Token Bound Content
                                    </Card.Subtitle>
                                    
                                    <Row>
                                        <Col>
                                            <Form.Group className="p-2">
                                                <Form.Select
                                                    className='text-white display-7 bg-info'
                                                    size='lg'
                                                    onChange={(e) => {
                                                        waitSetState(this, {
                                                            loading: true,
                                                        }).then(() => {
                                                            this.setState(
                                                                {
                                                                    selectedContentKey:
                                                                        e.target
                                                                            .value,
                                                                },
                                                                () => {
                                                                    this.setState(
                                                                        {
                                                                            loading: false,
                                                                        }
                                                                    );
                                                                }
                                                            );
                                                        });
                                                    }}
                                                >
                                                    <option value="first">Select Token Bound Content Key</option>
                                                    {contentKeys.map((key) => (
                                                        <option
                                                            value={key}
                                                            selected={
                                                                this.state
                                                                    .selectedContentKey ===
                                                                key
                                                            }
                                                        >
                                                            {key}{' '}
                                                            {tracksNames[
                                                                key
                                                            ] !== undefined
                                                                ? tracksNames[
                                                                      key
                                                                  ]
                                                                : ''}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row className="m-2">
                                        <Col className="p-2 header-subtext  w-100">
                                        <a
                                            
                                            href={
                                                selected.paths.localStorage
                                                ? selected.paths.data
                                                : selected.paths.ipfsURL
                                            }
                                            download
                                            
                                            >⤵️</a> <a
                                            className='cool-link'
                                            href={
                                                selected.paths.localStorage
                                                ? selected.paths.data
                                                : selected.paths.ipfsURL
                                            }
                                            download
                                            
                                            >
                                             Download
                                            </a>

                                        
                                          
                                        </Col>
                                    </Row>
                                    
                                    
                                </Card>
                            </Col>
                        </Row>
                        <Row className="mt-4">
                            <Col>
                                <div className="d-grid gap-2">
                                    <NavigationLink
                                        location={'/view/' + this.state.tokenId}
                                        variant="dark"
                                        size="lg"
                                        text={Resources.$.UI.Action.Back}
                                    />
                                    <NavigationLink
                                        location={'/mytokens'}
                                        variant="dark"
                                        size="lg"
                                        text={
                                            'All ' +
                                            Resources.$.UI.Action.MyTokens
                                        }
                                    />
                                    <NavigationLink
                                        location={'/gallery'}
                                        variant="dark"
                                        size="lg"
                                        text={Resources.$.UI.Action.AllTokens}
                                    />
                                </div>
                            </Col>
                        </Row>
                    </Container>
                )}
               
            </>
        );
    }
}

ViewContent.url = '/view/:tokenId/content';
ViewContent.id = 'ViewContent';
ViewContent.settings = {
    requireWallet: true,
};

export default ViewContent;
