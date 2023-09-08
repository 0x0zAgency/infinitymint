import React, { Component } from 'react';
import Controller from 'infinitymint-client/dist/src/classic/controller';
import {
    Card,
    Container,
    Row,
    Col,
    Button,
    Alert,
    Form,
} from 'react-bootstrap';
import {
    loadStickers,
    loadToken,
    connectWallet,
} from 'infinitymint-client/dist/src/classic/helpers';
import NavigationLink from '../../../../Components/NavigationLink';
import StorageController from 'infinitymint-client/dist/src/classic/storageController';
import Loading from '../../../../Components/Loading';
import Resources from 'infinitymint-client/dist/src/classic/resources';

const Config = Controller.getConfig();

class Audiocover extends Component {
    constructor(props) {
        super(props);

        this.state = {
            tokenId: this?.props?.match?.params?.tokenId || 0,
            tokenData: {},
            token: {
                pathSize: 13,
                colours: [],
            },
            loading: false,
            selectedContentKey: '3d',
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
        let tokenId = this.props.match?.params?.tokenId || 0;
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
                                <h1 className="display-1 force-white mb-4 mt-3 text-center">
                                    <span className="nikeboiAltText text-white">
                                        Audiocover
                                    </span>
                                </h1>
                            </Col>
                        </Row>
                        <Row className="justify-content-center">
                            <Col lg={8}>
                                <iframe
                                    src="https://audiocover.io/play/4f4887f3de890daff9a905965188ccd6"
                                    title="audiocover"
                                    allowFullScreen={true}
                                    seamless={true}
                                    style={{
                                        width: '100%',
                                        height: '600px',
                                        overflowX: 'hidden',
                                        overflowY: 'hidden',
                                        backgroundImage:
                                            "url('https://ipfs.io/ipfs/QmZedXaBa61RL9FP1efzN86ZSVDKjWuDR6dYKdDqfv4e8a/0x0z%20-%20The%20%F0%9F%AA%84%20of%20Web3%207eddcab7163040e4aec7ec948757bd85/0x0z_-_Deck__Ask.pptx_Page_01.png')",
                                        border: '1px solid black',
                                        padding: 4,
                                    }}
                                />
                            </Col>
                        </Row>
                        <Row className="mt-4">
                            <Col>
                                <div className="d-grid gap-2">
                                    <NavigationLink
                                        location={'/view/' + tokenId}
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

Audiocover.url = '/view/:tokenId/audiocover';
Audiocover.id = 'Audiocover';
Audiocover.settings = {};
export default Audiocover;
