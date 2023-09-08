import React, { Component } from 'react';
import {
    Container,
    Row,
    Col,
    Alert,
    Card,
    Form,
    Button,
} from 'react-bootstrap';
import Token from './../../../../Components/Token';
import GasMachine from './../../../../Components/GasMachine';
import NavigationLink from './../../../../Components/NavigationLink';
import { Redirect } from 'react-router-dom';
import {
    cutLongString,
    loadToken,
    loadStickers,
    waitSetState,
} from './../../../../helpers';
import Resources from 'infinitymint-client/dist/src/classic/resources';
import StorageController from 'infinitymint-client/dist/src/classic/storageController';
import Controller from 'infinitymint-client/dist/src/classic/controller';

const Config = Controller.getConfig();

class Offer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            tokenId: this?.props?.match?.params?.tokenId || 0,
            tokenData: {},
            token: {
                pathSize: 13,
                colours: [],
            },
            offers: [],
            tags: {},
            isValid: false,
            offerPrice: 1,
            location: '',
            stickers: [],
            success: false,
            hasStickers: false,
            hasOffer: false,
            transferTo: '',
            awaitingTransfer: false,
            awaitingCollection: false,
        };
    }

    async makeOffer() {
        this.setState({
            success: false,
        });

        if (this.state.offerPrice <= 0) throw new Error('invalid offer price');

        await Controller.sendAndWaitForEvent(
            Controller.accounts[0],
            'Mod_Marketplace',
            'makeOffer',
            'Offer',
            {
                parameters: [this.state.tokenId],
                gasPrice: Config.getGasPrice(
                    StorageController.getGlobalPreference('gasSetting')
                ),
            },
            Controller.web3.utils.toWei(this.state.offerPrice + '', 'ether')
        );

        StorageController.values.offers[this.state.tokenId] = {
            tokenId: this.state.tokenId,
            offerPrice: Controller.web3.utils.toWei(
                this.state.offerPrice + '',
                'ether'
            ),
            sender: Controller.accounts[0],
        };
        StorageController.saveData();

        await this.getOffers();
        if (
            this.state.offers.filter((v) => v.sender === Controller.accounts[0])
                .length === 0
        )
            this.setState({
                offers: [
                    ...this.state.offers,
                    {
                        sender: Controller.accounts[0],
                        value: Controller.web3.utils.toWei(
                            this.state.offerPrice + '',
                            'ether'
                        ),
                    },
                ],
                success: true,
            });
    }

    async componentDidMount() {
        if (StorageController.values.awaitingCollection[this.state.tokenId])
            this.setState({
                awaitingCollection: true,
            });

        try {
            //load the token and return the flags
            await loadToken(this, true, true);

            if (this.state.isValid)
                //load the stickers
                await loadStickers(this);
        } catch (error) {
            console.log(error);
        }

        if (!Config.settings.marketplaceEnabled)
            this.setState({
                location: '/',
            });
        else {
            try {
                if (!this.state.isValid)
                    throw new Error('Token does not exist');

                Controller.initializeContract(
                    Config.getDeployment('Mod_Marketplace').address,
                    'Mod_Marketplace',
                    true
                );
                Controller.setupEvents('Mod_Marketplace');

                await this.getOffers();
                await this.checkTransfer();
            } catch (error) {
                this.setState({
                    error: error,
                });
            }
        }
    }

    async checkTransfer() {
        let result = await Controller.callMethod(
            Controller.accounts[0],
            'Mod_Marketplace',
            'awaitingTransfer',
            {
                parameters: [this.state.tokenId],
            }
        );

        if (!result)
            this.setState({
                awaitingTransfer: false,
            });
        else {
            result = await Controller.callMethod(
                Controller.accounts[0],
                'Mod_Marketplace',
                'awaitingTransferTo',
                {
                    parameters: [this.state.tokenId],
                }
            );

            this.setState({
                transferTo: result,
                awaitingTransfer: true,
            });
        }
    }

    async acceptOffer(offerSender) {
        this.setState({
            success: false,
        });

        let result = await Controller.sendAndWaitForEvent(
            Controller.accounts[0],
            'Mod_Marketplace',
            'acceptOffer',
            'AwaitingTransfer',
            {
                parameters: [this.state.tokenId, offerSender],
            }
        );

        StorageController.values.transfers[offerSender] = result;
        //done! now refresh the offers
        this.setState({
            offers: [],
        });

        //if it was made in this browsers storage
        if (StorageController.values.offers[this.state.tokenId] !== undefined)
            delete StorageController.values.offers[this.state.tokenId];

        //save our storage
        StorageController.saveData();

        await this.getOffers();
        this.setState({
            offers: this.state.offers.filter((v) => v.sender !== offerSender),
            awaitingTransfer: true,
            success: true,
        });
    }

    async revokeOffer() {
        this.setState({
            success: false,
        });

        if (!this.state.hasOffer) throw new Error('No offer to revoke');

        await Controller.sendMethod(
            Controller.accounts[0],
            'Mod_Marketplace',
            'revokeOffer',
            {
                parameters: [this.state.tokenId],
            }
        );

        await waitSetState(this, {
            offers: [],
            hasOffer: false,
        });

        if (StorageController.values.offers[this.state.tokenId] !== undefined)
            delete StorageController.values.offers[this.state.tokenId];

        StorageController.saveData();

        await this.getOffers();
        this.setState({
            offers: this.state.offers.filter(
                (v) => v.sender !== Controller.accounts[0]
            ),
            success: true,
        });
    }

    async getOffers() {
        let result = await Controller.callMethod(
            Controller.accounts[0],
            'Mod_Marketplace',
            'getOffers',
            {
                parameters: [this.state.tokenId],
            }
        );

        if (result.length !== 0) {
            let offers = [];
            for (let i = 0; i < result.length; i++) {
                if (result[i] === Controller.accounts[0]) {
                    this.setState({
                        hasOffer: true,
                    });
                }

                offers[i] = await Controller.callMethod(
                    Controller.accounts[0],
                    'Mod_Marketplace',
                    'getOffer',
                    {
                        parameters: [this.state.tokenId, result[i]],
                    }
                );

                if (
                    result[i] === Controller.accounts[0] &&
                    StorageController.values.offers[this.state.tokenId] ===
                        undefined
                ) {
                    StorageController.values.offers[this.state.tokenId] = {
                        tokenId: this.state.tokenId,
                        value: offers[i].value,
                        sender: offers[i].sender,
                    };
                    StorageController.saveData();
                }
            }

            await waitSetState(this, {
                offers: offers,
            });

            if (
                StorageController.values.tokens[this.state.tokenId] !==
                undefined
            ) {
                StorageController.values.tokens[this.state.tokenId].offers =
                    offers;
                StorageController.saveData();
            }
            return offers;
        } else {
            StorageController.values.tokens[this.state.tokenId].offers = [];
            StorageController.saveData();
        }
    }

    render() {
        if (this.state.location !== '')
            return <Redirect to={this.state.location} />;

        return (
            <>
                <Container className>
                    {!this.state.isValid ? (
                        <>
                            <Row className="mt-5">
                                <Col
                                    className="text-center"
                                    style={{ color: 'white' }}
                                >
                                    <h1 className="display-2 text-white nikeboiAltText">
                                        Cant Find That Token...
                                    </h1>
                                    <p className="fs-5 bg-danger text-white pb-2 pt-2">
                                        It might be loading or this{' '}
                                        {Resources.projectToken()} might not
                                        exists....
                                    </p>
                                    <img
                                        alt="#"
                                        src={Config.getImage('defaultImage')}
                                    />
                                    {!Controller.isWalletValid ? (
                                        <div className="d-grid mt-2 gap-2 text-center">
                                            <Alert variant="danger">
                                                You need to connect your wallet
                                                in order to put an offer on a a{' '}
                                                {Resources.projectToken().toLowerCase()}
                                            </Alert>
                                            <Button
                                                onClick={
                                                    Controller.onboardWallet
                                                }
                                                variant="light"
                                            >
                                                {
                                                    Resources.$.UI.Action
                                                        .ConnectWallet
                                                }
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="d-grid mt-2">
                                            <NavigationLink
                                                location="/"
                                                text={'🍓 Home'}
                                            />
                                        </div>
                                    )}
                                </Col>
                            </Row>
                        </>
                    ) : (
                        <>
                            <Row className="m-2">
                                <Col>
                                    <h1 className="text-center display-3 text-secondary">
                                        Marketplace Manager 
                                    </h1>
                                    <Alert variant="success" className='text-center'>
                                        Here you can manage marketplace things like any offers you have pending on this token. If this is not your token you can make an offer to buy it.
                                    </Alert>
                                </Col>
                            </Row>
                            {this.state.error !== undefined ? (
                                <Row>
                                    <Col>
                                        <Alert variant="danger">
                                            <p className="display-4">Error:</p>
                                            {this.state.error.message ||
                                                this.state.error[0].message ||
                                                this.state.error.toString()}
                                        </Alert>
                                    </Col>
                                </Row>
                            ) : (
                                <></>
                            )}
                            {this.state.success === true ? (
                                <Row>
                                    <Col>
                                        <Alert variant="success">
                                            <p className="display-4">
                                                Success:
                                            </p>
                                            Please wait a few minutes for your
                                            changes to be confirmed.
                                        </Alert>
                                    </Col>
                                </Row>
                            ) : (
                                <></>
                            )}
                            {StorageController.values.awaitingCollection[
                                this.state.tokenId
                            ] &&
                            (this.state.transferTo === '' ||
                                this.state.token.owner !==
                                    this.state.transferTo) ? (
                                <Row>
                                    <Col>
                                        <Alert variant="warning">
                                            <p className="display-4">Hey!</p>
                                            It can take a while for
                                            transfers to be registered by
                                            InfinityMint. Once the token is with
                                            the new holder, you will be able to
                                            withdraw your money.
                                        </Alert>
                                    </Col>
                                </Row>
                            ) : (
                                <></>
                            )}
                            <Row>
                                <Col>
                                    <div className="d-grid mt-2 gap-2">
                                        <Button
                                            variant="light"
                                            size="lg"
                                            onClick={() => {
                                                this.setState({
                                                    location:
                                                        '/view/' +
                                                        this.state.tokenId,
                                                });
                                            }}
                                        >
                                            {Resources.$.UI.Action.Back}
                                        </Button>
                                        <Button
                                            variant="light"
                                            size="lg"
                                            onClick={() => {
                                                window.location.reload();
                                            }}
                                        >
                                            {Resources.$.UI.Action.Refresh}
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                            <Row className="mt-4 gy-2">
                                <Col lg>
                                    {this.state.awaitingTransfer &&
                                    this.state.transferTo !==
                                        this.state.token.owner ? (
                                        <Alert variant="info">
                                            <p className="display-2">Sold!</p>
                                            <p>
                                                This token is awaiting transfer
                                                to its new proud owner,{' '}
                                                {this.state.transferTo === ''
                                                    ? 'Please wait for new owner to appear..'
                                                    : this.state.transferTo}
                                            </p>
                                            {this.state.token.owner ===
                                            Controller.accounts[0] ? (
                                                <>
                                                    <div className="d-grid">
                                                        <Button
                                                            variant="success"
                                                            disabled={
                                                                this.state
                                                                    .awaitingCollection ||
                                                                this.state
                                                                    .transferTo ===
                                                                    this.state
                                                                        .token
                                                                        .owner ||
                                                                this.state
                                                                    .transferTo ===
                                                                    ''
                                                            }
                                                            onClick={() => {
                                                                let func =
                                                                    async () => {
                                                                        await Controller.sendMethod(
                                                                            Controller
                                                                                .accounts[0],
                                                                            'InfinityMint',
                                                                            'safeTransferFrom',
                                                                            {
                                                                                parameters:
                                                                                    [
                                                                                        this
                                                                                            .state
                                                                                            .token
                                                                                            .owner,
                                                                                        this
                                                                                            .state
                                                                                            .transferTo,
                                                                                        this
                                                                                            .state
                                                                                            .tokenId,
                                                                                    ],
                                                                            }
                                                                        );

                                                                        StorageController.values.awaitingCollection[
                                                                            this.state.tokenId
                                                                        ] = true;
                                                                        StorageController.saveData();

                                                                        this.setState(
                                                                            {
                                                                                awaitingTransfer: false,
                                                                                success: true,
                                                                            }
                                                                        );
                                                                    };

                                                                func().catch(
                                                                    (error) =>
                                                                        this.setState(
                                                                            {
                                                                                error: error,
                                                                            }
                                                                        )
                                                                );
                                                            }}
                                                        >
                                                            Transfer To Owner
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <></>
                                            )}
                                        </Alert>
                                    ) : (
                                        <></>
                                    )}
                                    {this.state.awaitingCollection &&
                                    (this.state.awaitingTransfer !== true ||
                                        this.state.transferTo ===
                                            this.state.token.owner) ? (
                                        <Alert variant="success">
                                            <p className="display-2">Payday!</p>
                                            <p>
                                                Your money is ready to be
                                                collected.
                                            </p>
                                            <div className="d-grid">
                                                <Button
                                                    variant="success"
                                                    onClick={() => {
                                                        let func = async () => {
                                                            await Controller.sendMethod(
                                                                Controller
                                                                    .accounts[0],
                                                                'Mod_Marketplace',
                                                                'confirmTransfer',
                                                                {
                                                                    parameters:
                                                                        [
                                                                            this
                                                                                .state
                                                                                .tokenId,
                                                                        ],
                                                                }
                                                            );

                                                            StorageController.values.awaitingCollection[
                                                                this.state.tokenId
                                                            ] = false;
                                                            delete StorageController
                                                                .values.tokens[
                                                                this.state
                                                                    .tokenId
                                                            ];
                                                            delete StorageController
                                                                .values
                                                                .transfers[
                                                                this.state
                                                                    .transferTo
                                                            ];
                                                            StorageController.saveData();

                                                            this.setState({
                                                                awaitingCollection: false,
                                                                awaitingTransfer: false,
                                                                transferTo: '',
                                                            });
                                                        };
                                                        func().catch(
                                                            (error) => {
                                                                this.setState({
                                                                    error: error,
                                                                });
                                                            }
                                                        );
                                                    }}
                                                >
                                                    Collect Money
                                                </Button>
                                            </div>
                                        </Alert>
                                    ) : (
                                        <></>
                                    )}
                                    {this.state.offers.length === 0 ? (
                                        <Alert
                                            variant="danger"
                                            className="text-center"
                                        >
                                            There are currently no offers open
                                            for this token
                                        </Alert>
                                    ) : (
                                        <>
                                            {this.state.offers.map(
                                                (offer, index) => (
                                                    <Row
                                                        className="mt-2"
                                                        key={index}
                                                    >
                                                        <Col lg={12}>
                                                            <Card
                                                                body
                                                                className="pt-3"
                                                            >
                                                                <Row>
                                                                    <Col>
                                                                        <Row className="align-items-center h-100">
                                                                            <Col
                                                                                lg={
                                                                                    7
                                                                                }
                                                                            >
                                                                                <p className="fs-6 text-center">
                                                                                    {cutLongString(
                                                                                        offer.sender,
                                                                                        32
                                                                                    )}{' '}
                                                                                    <span className="badge bg-primary">
                                                                                        <a
                                                                                            href="?"
                                                                                            onClick={(
                                                                                                e
                                                                                            ) => {
                                                                                                e.preventDefault();
                                                                                                window.open(
                                                                                                    Config.getNetwork()
                                                                                                        .tokenscan +
                                                                                                        'address/' +
                                                                                                        offer.sender
                                                                                                );
                                                                                            }}
                                                                                            className="text-white"
                                                                                        >
                                                                                            Sleuth
                                                                                        </a>
                                                                                    </span>
                                                                                </p>
                                                                            </Col>
                                                                            <Col>
                                                                                <Alert
                                                                                    variant="success"
                                                                                    className="w-100"
                                                                                >
                                                                                    💰{' '}
                                                                                    {Controller.web3.utils.fromWei(
                                                                                        offer.value
                                                                                    ) +
                                                                                        ' ' +
                                                                                        Config.getNetwork()
                                                                                            .token}
                                                                                </Alert>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>
                                                                {offer.sender ===
                                                                Controller
                                                                    .accounts[0] ? (
                                                                    <div className="d-grid gy-2">
                                                                        <Button
                                                                            variant="danger"
                                                                            onClick={() => {
                                                                                this.setState(
                                                                                    {
                                                                                        error: undefined,
                                                                                    }
                                                                                );
                                                                                this.revokeOffer().catch(
                                                                                    (
                                                                                        error
                                                                                    ) =>
                                                                                        this.setState(
                                                                                            {
                                                                                                error: error,
                                                                                            }
                                                                                        )
                                                                                );
                                                                            }}
                                                                        >
                                                                            Revoke
                                                                            Offer
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <></>
                                                                )}
                                                                {this.state
                                                                    .token
                                                                    .owner ===
                                                                Controller
                                                                    .accounts[0] ? (
                                                                    <div className="d-grid gy-2">
                                                                        <Button
                                                                            variant="success"
                                                                            disabled={
                                                                                this
                                                                                    .state
                                                                                    .awaitingTransfer ||
                                                                                this
                                                                                    .state
                                                                                    .awaitingCollection
                                                                            }
                                                                            onClick={() => {
                                                                                this.setState(
                                                                                    {
                                                                                        error: undefined,
                                                                                    }
                                                                                );
                                                                                this.acceptOffer(
                                                                                    offer.sender
                                                                                ).catch(
                                                                                    (
                                                                                        error
                                                                                    ) =>
                                                                                        this.setState(
                                                                                            {
                                                                                                error: error,
                                                                                            }
                                                                                        )
                                                                                );
                                                                            }}
                                                                        >
                                                                            Accept
                                                                            Offer
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <></>
                                                                )}
                                                            </Card>
                                                        </Col>
                                                    </Row>
                                                )
                                            )}
                                        </>
                                    )}
                                    <Row className="mt-4">
                                        <Col>
                                            <Card body>
                                                <div className="d-grid mt-2 mb-2 gap-2">
                                                    
                                                    {this.state.hasOffer ? (
                                                        <>
                                                            <Alert
                                                                variant="warning"
                                                                className="text-center"
                                                            >
                                                                You currently
                                                                have an offer
                                                                open. Close it
                                                                down before
                                                                opening up
                                                                another one.
                                                                You'll get your
                                                                money back if
                                                                you decide to
                                                                shut it down.
                                                            </Alert>
                                                        </>
                                                    ) : (
                                                        <></>
                                                    )}
                                                    <p className="text-center text-secondary display-6">
                                                        Make Offer
                                                    </p>
                                                    <div className="d-sm-inline-flex">
                                                        <Form.Control
                                                            type="number"
                                                            size="lg"
                                                            disabled={
                                                                this.state
                                                                    .hasOffer ||
                                                                this.state.token
                                                                    .owner ===
                                                                    Controller
                                                                        .accounts[0] ||
                                                                this.state
                                                                    .awaitingTransfer
                                                            }
                                                            min="0"
                                                            step="0.1"
                                                            className={
                                                                this.state
                                                                    .hasOffer ||
                                                                this.state
                                                                    .awaitingTransfer ||
                                                                this.state.token
                                                                    .owner ===
                                                                    Controller
                                                                        .accounts[0]
                                                                    ? 'text-center border-2 bg-black border-dark'
                                                                    : 'text-center border-2 bg-black border-success'
                                                            }
                                                            onChange={(e) => {
                                                                this.setState({
                                                                    offerPrice:
                                                                        e.target
                                                                            .value,
                                                                });
                                                            }}
                                                            value={
                                                                this.state
                                                                    .offerPrice
                                                            }
                                                        />
                                                    </div>

                                                    {this.state.token.owner ===
                                                    Controller.accounts[0] ? (
                                                        <Alert
                                                            variant="warning"
                                                            className="text-center"
                                                        >
                                                            You cannot place an
                                                            offer on your own
                                                            Token
                                                        </Alert>
                                                    ) : (
                                                        <></>
                                                    )}
                                                    <Button
                                                        variant="success"
                                                        disabled={
                                                            this.state.token
                                                                .owner ===
                                                                Controller
                                                                    .accounts[0] ||
                                                            this.state
                                                                .offerPrice <=
                                                                0 ||
                                                            this.state
                                                                .hasOffer ||
                                                            this.state
                                                                .awaitingTransfer
                                                        }
                                                        onClick={() => {
                                                            this.setState({
                                                                error: undefined,
                                                            });
                                                            this.makeOffer().catch(
                                                                (error) =>
                                                                    this.setState(
                                                                        {
                                                                            error: error,
                                                                        }
                                                                    )
                                                            );
                                                        }}
                                                    >
                                                        Place Offer
                                                    </Button>
                                                </div>
                                                <GasMachine />
                                            </Card>
                                        </Col>
                                    </Row>
                                </Col>
                                <Col lg={6}>
                                    <Row className="justify-content-center">
                                        <Token
                                            theToken={this.state.token}
                                            width={12}
                                            stickers={this.state.stickers}
                                            settings={{
                                                useFresh: true,
                                            }}
                                        />
                                    </Row>
                                </Col>
                            </Row>
                        </>
                    )}
                    <br />
                    <br />
                    <br />
                </Container>
            </>
        );
    }
}

Offer.url = '/offers/:tokenId';
Offer.id = 'MyOffers';
Offer.settings = {
    requireWallet: true,
};

export default Offer;
