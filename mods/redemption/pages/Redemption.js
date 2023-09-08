import React, { Component } from 'react';
import {
    Container,
    Row,
    Col,
    Form,
    Button,
    Card,
    Alert,
} from 'react-bootstrap';
import Token from '../../../../Components/Token';
import Controller from 'infinitymint-client/dist/src/classic/controller.js';
import {
    connectWallet,
    waitSetState,
} from 'infinitymint-client/dist/src/classic/helpers.js';
import Resources from 'infinitymint-client/dist/src/classic/resources.js';
import Loading from '../../../../Components/Loading';
import StorageController from 'infinitymint-client/dist/src/classic/storageController.js';
import CryptoJS from 'crypto-js';
import { Redirect } from 'react-router-dom';

import Metamask from '../../../../Resources/crapymask.png';
import Rainbow from '../../../../Resources/rainbow.png';
import Brave from '../../../../Resources/brave.png';
import Chrome from '../../../../Resources/chrome.png';

const Config = Controller.getConfig();
let _errorTimeout;
class Redemption extends Component {
    constructor(props) {
        super(props);
        this.state = {
            token: Controller.makeFakeToken(0),
            loaded: false,
            link: this?.props?.match?.params?.link || null,
            tokenId: 0,
            location: '',
            error: null,
            hasRedemption: false,
            checks: {},
            isRedemptionOwner: false,
            productKey: '',
            phraseId: Config.settings.defaultSet,
            isRedeemable: false,
            redemption: {},
        };
    }

    cleanupError(seconds = 90) {
        clearTimeout(_errorTimeout);
        return new Promise((resolve, reject) => {
            _errorTimeout = setTimeout(() => {
                this.setState({
                    error: undefined,
                });
            }, seconds * 10000);
        });
    }

    async componentDidMount() {
        if (Controller.isWeb3Valid) {
            await this.attemptDisplayOfToken();
        }

        await this.getURIParameters(this.state.link !== null);
    }

    setError(error) {
        Controller.log(error);
        console.log(error);
        this.setState({
            error: error.message || error.error || error,
        });
        this.cleanupError(90);
    }

    async getURIParameters(useMatch = false) {
        let paramString = window.location.href.split('?')[1];
        let queryString = new URLSearchParams(paramString);

        if (useMatch) {
            try {
                let result = Controller.Base64.decode(this.state.link);
                result = result.split('|');

                if (result.length < 3) throw new Error('bad key');

                await waitSetState(this, {
                    tokenId: parseInt(result[0]),
                    productKey: result[1],
                    phraseId: result[2],
                    linkMode: true,
                });

                try {
                    await this.redirectIfRedeemed();
                } catch (error) {
                    Controller.log(error);
                }

                await this.attemptDisplayOfToken();
            } catch (error) {
                Controller.log(error);
                this.setState({
                    linkMode: false,
                });
            }
        } else
            for (let [key, value] of queryString.entries()) {

                console.log('key: ' + key);
                console.log('value: ' + value);

                if (typeof value !== 'string' || value.length === 0) continue;
                if (key === 'key') {
                    try {
                        let result = Controller.Base64.decode(value);
                        result = result.split('|');

                        if (result.length < 3) throw new Error('bad key');

                        window.location.href = '/redemption/' + value;
                        return;
                    } catch (error) {
                        Controller.log(error);
                        this.setState({
                            linkMode: false,
                        });
                    }
                }
                if (
                    key.toLowerCase() === 'tokenid' &&
                    this.state.linkMode !== true &&
                    !isNaN(value)
                ) {
                    await waitSetState(this, {
                        tokenId: Math.abs(parseInt(value)),
                    });

                    try {
                        await this.redirectIfRedeemed();
                    } catch (error) {
                        Controller.log(error);
                    }

                    await this.attemptDisplayOfToken();
                }
            }
    }

    async redirectIfRedeemed() {
        if (
            this.state.checks[this.state.tokenId] !== undefined &&
            this.state.checks[this.state.tokenId][1]
        )
            this.setState({
                location: '/view/' + this.state.tokenId,
            });
    }

    async requestToken() {
        this.setState({
            success: false,
        });
        let cypherKey = Config.sets[this.state.phraseId] || 'imnotacypherkey';
        
        console.log('🔑 ' + cypherKey);

        if (cypherKey === undefined) cypherKey = Config.sets[Config.defaultSet];

        let part1 = CryptoJS.AES.encrypt(
            this.state.productKey,
            this.state.productKey + cypherKey
        ).toString();
        
        console.log('Parts: ' + part1);
        
        let encoded = Controller.web3.utils.encodePacked({
            value: `${this.state.tokenId}|${this.state.productKey.length}|${
                Config.defaultSet || this.state.phraseId
            }`,
            type: 'string',
        });
        
        console.log('Encoded: ' + encoded);
        
        let encodedKey = Controller.web3.utils.encodePacked({
            value: part1,
            type: 'string',
        });
        
        console.log('Encoded Key: ' + part1);

        console.log("gas:" + (encoded.length + encodedKey.length) * 100000);

        await Controller.sendMethod(
            Controller.accounts[0],
            'Mod_Redemption',
            'requestToken',
            {
                parameters: [this.state.tokenId, encoded, encodedKey],
                gasUsage: (encoded.length + encodedKey.length) * 100000,
            }
        );

        let obj = {
            time: Date.now(),
            token: this.state.tokenId,
            address: Controller.accounts[0],
            request: encoded,
        };
        StorageController.values.redemptionRequests[this.state.tokenId] = obj;
        StorageController.saveData();

        this.setState({
            hasRedemption: true,
            isRedemptionOwner: true,
            redemption: obj,
            success: true,
        });
    }

    async getChecks() {
        return await Controller.callMethod(
            Controller.accounts[0],
            'Mod_Redemption',
            'getChecks',
            [this.state.tokenId]
        );
    }

    async checkIsRedeemable() {
        console.log(this.state.checks);
        let result =
            this.state.checks[this.state.tokenId] !== undefined &&
            this.state.checks[this.state.tokenId][0] === true &&
            this.state.checks[this.state.tokenId][1] !== true;

        this.setState({
            isRedeemable: result,
        });

        return result;
    }

    async checkForRedemptionRequest() {
        let result =
            this.state.checks[this.state.tokenId] !== undefined &&
            this.state.checks[this.state.tokenId][2];
        if (
            result &&
            StorageController.values.redemptionRequests[this.state.tokenId] !==
                undefined
        ) {
            let obj =
                StorageController.values.redemptionRequests[this.state.tokenId];
            this.setState({
                hasRedemption: true,
                isRedemptionOwner: obj.address === Controller.accounts[0],
                actualOwner: obj.address,
                redemption: obj,
            });
            return;
        }

        if (result) {
            let result = await Controller.callMethod(
                Controller.accounts[0],
                'Mod_Redemption',
                'getRequestOwner',
                [this.state.tokenId]
            );
            let isOwner = result === Controller.accounts[0];
            this.setState({
                hasRedemption: true,
                actualOwner: result,
                isRedemptionOwner: isOwner,
                redemption: {},
            });

            if (isOwner) {
                let request = await Controller.callMethod(
                    Controller.accounts[0],
                    'Mod_Redemption',
                    'getRequest',
                    [this.state.tokenId]
                );
                let obj = {
                    time: Date.now(),
                    tokenId: this.state.tokenId,
                    address: Controller.accounts[0],
                    request: request,
                };
                StorageController.values.redemptionRequests[
                    this.state.tokenId
                ] = obj;
                this.setState({
                    redemption: obj,
                });
                StorageController.saveData();
            }
        } else
            this.setState({
                hasRedemption: false,
                isRedemptionOwner: false,
                redemption: {},
            });
    }

    async attemptDisplayOfToken() {
        let result = await Controller.tryGetToken(this.state.tokenId || 0);

        try {
            if (result)
                await waitSetState(this, {
                    token: Controller.getStoredToken(this.state.tokenId).token
                        .token,
                });
        } catch (error) {
            console.log(error);
        }

        let check = await this.getChecks();
        await waitSetState(this, {
            checks: { [this.state.tokenId]: check },
        });
        await this.checkForRedemptionRequest();
        await this.checkIsRedeemable();
        this.setState({
            loaded: true,
        });
    }

    render() {
        if (this.state.location !== '')
            return <Redirect to={this.state.location}></Redirect>;

        return (
            <>
                {Controller.isWalletValid && Controller.isWeb3Valid ? (
                    <Container className="p-3">
                        {this.state.success ? (
                            <Row className="mt-4">
                                <Col>
                                    <Alert variant="success">
                                        <p className="fs-2">😺</p>
                                        Success! Please wait for changes to
                                        appear. Do not resend the transaction.
                                    </Alert>
                                </Col>
                            </Row>
                        ) : (
                            <></>
                        )}
                        {!this.state.loaded ? (
                            <Loading />
                        ) : (
                            <Row className="mt-2">
                                <Col sm className="p-2">
                                    <Card body className="bg-light shadow mt-3">
                                        {this.state.loaded ? (
                                            <Token
                                                theToken={this.state.token}
                                                settings={{
                                                    useFresh: true,
                                                    noPadding: true,
                                                    noBorder: true,
                                                    renderOnUpdate: true,
                                                    hideModBadges: true,
                                                    hideLinkBadges: true,
                                                    hideDescription: true,
                                                    id: 'redeem',
                                                    enableThreeJS: true,
                                                    downsampleRate3D: 1,
                                                    cameraFOV: 100,
                                                    cameraPositionZ: 100,
                                                    cameraPositionX: 0,
                                                    cameraPositionY: 180,
                                                    selectable3D: false,
                                                    disableFloor3D: true,
                                                    //ForceBackground: ModelBackground,
                                                    showHelpers3D: false,
                                                    lightIntensity3D: 30,
                                                    lightColour3D: 0xff_ff_ff,
                                                    ambientLightIntensity3D: 90,
                                                    ambientLightColour3D: 0xff_ff_e2,
                                                    rotationSpeed3D: 0.005,
                                                }}
                                            />
                                        ) : (
                                            <></>
                                        )}
                                    </Card>
                                </Col>
                                <Col lg>
                                    <h1 className="mt-3 nikeboiAltText text-white">
                                        🏷️ Redeem a {Resources.token()}
                                    </h1>
                                    <p className="fs-5 text-white">
                                        Enter your Product Key to redeem your {' '}
                                        {Resources.projectToken()} here!
                                    </p>
                                    {/* <Card body>
                                        <Card.Title></Card.Title>
                                    </Card> */}
                                    {this.state.error !== undefined &&
                                    this.state.error !== null ? (
                                        <Row className="mt-2">
                                            <Col>
                                                <Alert
                                                    variant="danger"
                                                    className="text-center"
                                                >
                                                    <p className="display-2">
                                                        😨
                                                    </p>
                                                    {this.state.error
                                                        ?.message ||
                                                        this.state.error}
                                                </Alert>
                                            </Col>
                                        </Row>
                                    ) : (
                                        <></>
                                    )}
                                    <Row>
                                        <Col lg>
                                            <Card body>
                                                {this.state.isRedeemable ? (
                                                    <Form
                                                        onSubmit={(e) => {
                                                            e.preventDefault();
                                                            this.setState({
                                                                loaded: false,
                                                            });
                                                            this.requestToken()
                                                                .catch(
                                                                    (error) =>
                                                                        this.setError(
                                                                            error
                                                                        )
                                                                )
                                                                .finally(() => {
                                                                    this.setState(
                                                                        {
                                                                            loaded: true,
                                                                        }
                                                                    );
                                                                });
                                                        }}
                                                    >
                                                        {this.state
                                                            .hasRedemption ? (
                                                            <Alert
                                                                variant="danger"
                                                                className="text-center"
                                                            >
                                                                This token has
                                                                received a
                                                                request for
                                                                redemption and
                                                                is awaiting an
                                                                admins approval.
                                                            </Alert>
                                                        ) : (
                                                            <></>
                                                        )}
                                                        {this.state.linkMode &&
                                                        !this.state
                                                            .hasRedemption ? (
                                                            <Alert
                                                                variant="success"
                                                                className="text-center"
                                                            >
                                                                Your token is
                                                                ready for you to
                                                                redeem!
                                                            </Alert>
                                                        ) : (
                                                            <></>
                                                        )}
                                                        <Form.Group
                                                            className="mb-3"
                                                            controlId="key"
                                                        >
                                                            <Form.Label className="fs-2 mb-2">
                                                                Current Token Id{' '}
                                                                <span className="badge ms-2 bg-success">
                                                                    {
                                                                        this
                                                                            .state
                                                                            .tokenId
                                                                    }
                                                                </span>
                                                            </Form.Label>
                                                            <div className="d-grid gap-2">
                                                                <Button
                                                                    variant="info"
                                                                    onClick={() => {
                                                                        this.setState(
                                                                            {
                                                                                productKey:
                                                                                    '',
                                                                                isRedeemable: false,
                                                                                tokenId:
                                                                                    this
                                                                                        .state
                                                                                        .tokenId +
                                                                                    1,
                                                                            }
                                                                        );
                                                                        this.attemptDisplayOfToken();
                                                                    }}
                                                                >
                                                                    Goto Token 🆔{' '}
                                                                    {this.state
                                                                        .tokenId +
                                                                        1}
                                                                </Button>
                                                                <Button
                                                                    variant="info"
                                                                    onClick={() => {
                                                                        this.setState(
                                                                            {
                                                                                productKey:
                                                                                    '',
                                                                                isRedeemable: false,
                                                                                tokenId:
                                                                                    this
                                                                                        .state
                                                                                        .tokenId -
                                                                                        1 <=
                                                                                    0
                                                                                        ? 0
                                                                                        : this
                                                                                              .state
                                                                                              .tokenId -
                                                                                          1,
                                                                            }
                                                                        );
                                                                        this.attemptDisplayOfToken();
                                                                    }}
                                                                >
                                                                    Goto Token 🆔{' '}
                                                                    {this.state
                                                                        .tokenId -
                                                                        1 <=
                                                                    0
                                                                        ? 0
                                                                        : this
                                                                              .state
                                                                              .tokenId -
                                                                          1}
                                                                </Button>
                                                            </div>
                                                        </Form.Group>
                                                        <Form.Group
                                                            className="mb-3"
                                                            controlId="name"
                                                            hidden={
                                                                this.state
                                                                    .hasRedemption
                                                            }
                                                        >
                                                            <Form.Label className="fs-5">
                                                                Product Key
                                                            </Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                size="md"
                                                                onChange={(
                                                                    e
                                                                ) => {
                                                                    this.setState(
                                                                        {
                                                                            productKey:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        }
                                                                    );
                                                                }}
                                                                value={
                                                                    this.state
                                                                        .productKey
                                                                }
                                                                disabled={
                                                                    this.state
                                                                        .hasRedemption ||
                                                                    this.state
                                                                        .linkMode
                                                                }
                                                                placeholder="xxxx-xxxx"
                                                            />
                                                        </Form.Group>
                                                        <div className="d-grid">
                                                            <Button
                                                                variant="success"
                                                                type="submit"
                                                                disabled={
                                                                    this.state
                                                                        .hasRedemption ||
                                                                    this.state
                                                                        .productKey
                                                                        ?.length ===
                                                                        0
                                                                }
                                                            >
                                                                Redeem
                                                            </Button>
                                                        </div>
                                                    </Form>
                                                ) : (
                                                    <Alert
                                                        variant="warning"
                                                        className="text-center"
                                                    >
                                                        Sorry! This token is not
                                                        currently redeemable.
                                                        Please press the button
                                                        below to try again.
                                                        <div className="d-grid mt-2 gap-2 justify-content-center">
                                                            <Form.Control
                                                                type="number"
                                                                maxLength={2}
                                                                max={50}
                                                                value={
                                                                    this.state
                                                                        .tokenId
                                                                }
                                                                readOnly
                                                                disabled={true}
                                                                size="md"
                                                                onChange={async (
                                                                    e
                                                                ) => {
                                                                    if (
                                                                        e.target
                                                                            .value !==
                                                                        this
                                                                            .state
                                                                            .tokenId
                                                                    ) {
                                                                        await waitSetState(
                                                                            this,
                                                                            {
                                                                                tokenId:
                                                                                    Math.abs(
                                                                                        e
                                                                                            .target
                                                                                            .value
                                                                                    ),
                                                                            }
                                                                        );
                                                                        await this.attemptDisplayOfToken();
                                                                    }
                                                                }}
                                                                placeholder="0"
                                                            />
                                                            <div className="d-grid gap-2">
                                                                <Button
                                                                    variant="success"
                                                                    onClick={() => {
                                                                        this.setState(
                                                                            {
                                                                                productKey:
                                                                                    '',
                                                                                isRedeemable: false,
                                                                                tokenId:
                                                                                    this
                                                                                        .state
                                                                                        .tokenId +
                                                                                    1,
                                                                            }
                                                                        );
                                                                        this.attemptDisplayOfToken();
                                                                    }}
                                                                >
                                                                    +1
                                                                </Button>
                                                                <Button
                                                                    variant="danger"
                                                                    onClick={() => {
                                                                        this.setState(
                                                                            {
                                                                                productKey:
                                                                                    '',
                                                                                isRedeemable: false,
                                                                                tokenId:
                                                                                    this
                                                                                        .state
                                                                                        .tokenId -
                                                                                        1 <=
                                                                                    0
                                                                                        ? 0
                                                                                        : this
                                                                                              .state
                                                                                              .tokenId -
                                                                                          1,
                                                                            }
                                                                        );
                                                                        this.attemptDisplayOfToken();
                                                                    }}
                                                                >
                                                                    -1
                                                                </Button>
                                                                <Button
                                                                    variant="info"
                                                                    onClick={async () => {
                                                                        await waitSetState(
                                                                            this,
                                                                            {
                                                                                loading: true,
                                                                                tokenId: 0,
                                                                            }
                                                                        );

                                                                        await this.attemptDisplayOfToken();
                                                                    }}
                                                                >
                                                                    Try Again
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </Alert>
                                                )}
                                            </Card>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        )}
                        <Row className="text-white mt-2">
                            <Col>
                                <h1 className="text-white nikeboiAltText">
                                    🏷️ Your Redemption Requests
                                </h1>
                                <p className="fs-5">
                                    Check on your redemption requests here!
                                </p>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                {!this.state.hasRedemption ? (
                                    <Alert
                                        variant="danger"
                                        className="text-center"
                                    >
                                        <p className="fs-2">❓</p>
                                        There is not a redemption request open
                                        for this token.
                                    </Alert>
                                ) : (
                                    <>
                                        <Alert
                                            variant="success"
                                            className="text-center"
                                            hidden={
                                                !this.state.isRedemptionOwner
                                            }
                                        >
                                            <p className="fs-2">😊</p>
                                            You made your request from{' '}
                                            {this.state.redemption.sender ||
                                                this.state.redemption
                                                    .address}{' '}
                                            on{' '}
                                            {new Date(
                                                this.state.redemption.time
                                            ).toString()}{' '}
                                            for tokenId {this.state.tokenId}, it
                                            can take up to 24 hours for your
                                            token to be transfered.
                                        </Alert>
                                        <Alert
                                            variant="danger"
                                            className="text-center"
                                            hidden={
                                                this.state.isRedemptionOwner
                                            }
                                        >
                                            <p className="fs-2">❓</p>
                                            {this.state.actualOwner} has a
                                            request open to claim this token.
                                        </Alert>
                                    </>
                                )}
                            </Col>
                        </Row>
                    </Container>
                ) : (
                    <>
                        <Container className="p-1">
                            <Row>
                                <Col>
                                    <Card body>
                                        <h1 className="display-3 mb-2 text-center">
                                            WELCOME
                                        </h1>
                                        <h1 className="fs-4 mb-2 text-center">
                                            You need to acquire some upgrades
                                            before you can access this page.
                                        </h1>
                                        <Row
                                            className={
                                                window.innerWidth < 765
                                                    ? 'mt-2'
                                                    : 'mt-2'
                                            }
                                        >
                                            <Col>
                                                <div className="d-grid">
                                                    <Button
                                                        variant="success"
                                                        onClick={async () => {
                                                            await connectWallet();
                                                        }}
                                                    >
                                                        Connect Your Web3 Wallet
                                                        Now
                                                    </Button>
                                                </div>
                                            </Col>
                                        </Row>
                                        <h1 className="text-center bg-dark text-white p-2 border-2 mt-2">
                                            DOWNLOAD A WALLET APP NOW
                                        </h1>
                                        <Row className="gy-2">
                                            <Col lg>
                                                <div className="d-grid gap-2">
                                                    <Button variant="success">
                                                        <img
                                                            src={Metamask}
                                                            alt="buggy app"
                                                            className="img-fluid p-2"
                                                            style={{
                                                                height: 220,
                                                            }}
                                                        />
                                                        (Android) Metamask
                                                    </Button>
                                                </div>
                                            </Col>
                                            <Col lg>
                                                <div className="d-grid">
                                                    <Button variant="success">
                                                        <img
                                                            src={Rainbow}
                                                            alt="an ok app"
                                                            className="img-fluid p-2"
                                                            style={{
                                                                height: 220,
                                                            }}
                                                        />
                                                        (IPhone) Rainbow
                                                    </Button>
                                                </div>
                                            </Col>
                                        </Row>
                                        <h1 className="text-center bg-dark text-white p-2 border-2 mt-2">
                                            DOWNLOAD A DESKTOP WALLET APP NOW
                                        </h1>
                                        <Row className="gy-2">
                                            <Col lg>
                                                <div className="d-grid gap-2">
                                                    <Button variant="success">
                                                        <img
                                                            src={Chrome}
                                                            alt="buggy app"
                                                            className="img-fluid p-4"
                                                            style={{
                                                                height: 240,
                                                            }}
                                                        />
                                                        (Chrome) Metamask
                                                    </Button>
                                                </div>
                                            </Col>
                                            <Col lg>
                                                <div className="d-grid">
                                                    <Button variant="success">
                                                        <img
                                                            src={Brave}
                                                            alt="an ok app"
                                                            className="img-fluid p-0"
                                                            style={{
                                                                height: 240,
                                                            }}
                                                        />
                                                        Brave
                                                    </Button>
                                                </div>
                                            </Col>
                                        </Row>
                                    </Card>
                                </Col>
                            </Row>
                        </Container>
                    </>
                )}
                <br />
                <br />
                <br />
            </>
        );
    }
}

Redemption.url = '/redemption';
Redemption.id = 'Redemption';
Redemption.settings = {
    alternatives: ['/redemption/:link'],
    /*dropdown: {
        user: '🏷️ Redeem Token',
    },
    navbarStart: '🏷️ Redeem ',*/
};

export default Redemption;
