import React, { Component } from 'react';
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
import Controller from 'infinitymint-client/dist/src/classic/controller';

import NavigationLink from '../../../../Components/NavigationLink';
import StorageController from 'infinitymint-client/dist/src/classic/storageController';
import Loading from '../../../../Components/Loading';
import Header from '../../../../Components/Micro/Header';
import Resources from 'infinitymint-client/dist/src/classic/resources';

//gets the config
const Config = Controller.getConfig();
class Audio extends Component {
    constructor(props) {
        super(props);

        this.state = {
            tokenId: this?.props?.match?.params?.tokenId || 0,
            tokenData: {},
            token: {
                pathSize: 13,
                colours: [],
            },
            playingKey: 'track1',
            playing: false,
            loading: false,
            selectedContentKey: 'track1',
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
        let trackNames = {
            track1: 'Track 1',
            track2: 'Track 2',
            track3: 'Track 3',
            track4: 'Track 4',
            track5: 'Track 5',
            track6: 'Track 6',
        };

        let tracks;
        let selectedTrack = {
            trackName: 'none',
            key: 'track1',
        };
        if (this.state.isValid && !this.state.loading) {
            let trackNamesKeys = Object.keys(trackNames);
            let contentValues =
                Controller.getPathSettings(this.state.token.pathId).content ||
                {};
            let contentKeys = Object.keys(contentValues);

            tracks = contentKeys
                .filter(
                    (key) =>
                        trackNamesKeys.filter((thatKey) => thatKey === key)
                            .length !== 0
                )
                .map((key) => {
                    if (this.state.selectedContentKey === key)
                        selectedTrack = {
                            ...Controller.getPathSettings(
                                this.state.token.pathId
                            ).content[key],
                            key: key,
                            trackName: trackNames[key],
                        };

                    return {
                        ...Controller.getPathSettings(this.state.token.pathId)
                            .content[key],
                        key: key,
                        trackName: trackNames[key],
                    };
                });
        }

        return (
            <>
                {this.state.loading || !this.state.isValid ? (
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
                    <>
                        <Header
                            title={'∞Audio'}
                            subtitle={'Listen To The Tunes Inside the NFT'}
                            hideExtra={true}
                            hideFaucet={true}
                            headerSize={420}
                            background={Config.getImage(
                                'contentAudioHeaderBackground'
                            )}
                        >
                            <Row className="mt-2">
                                <Col className="mt-4">
                                    <Card
                                        hidden={!this.state.playing}
                                        body
                                        className="border-0"
                                        style={{ zIndex: 99 }}
                                    >
                                        <div className="d-grid">
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: 200,
                                                    border: '2px solid black',
                                                    padding: 15,
                                                    backgroundSize: 'cover',
                                                    backgroundImage: `url(${Config.getImage(
                                                        'contentAudioPlayerBackground'
                                                    )})`,
                                                }}
                                            >
                                                <p
                                                    className="fs-2 text-center p-1"
                                                    style={{ zIndex: 200 }}
                                                >
                                                    <span
                                                        className="me-2 display-2 text-white"
                                                        style={{
                                                            textShadow:
                                                                '1px 1px black',
                                                        }}
                                                    >
                                                        {Resources.projectName() ||
                                                            'InfinityMint'}
                                                    </span>
                                                    <span
                                                        className="nikeboiAltText"
                                                        style={{
                                                            fontSize: 50,
                                                            color: 'gold',
                                                            textShadow:
                                                                '1px 1px black',
                                                        }}
                                                    >
                                                        {trackNames[
                                                            this.state
                                                                .playingKey
                                                        ] ||
                                                            selectedTrack.trackName}
                                                    </span>
                                                </p>
                                                <audio
                                                    id="audio-player"
                                                    controls
                                                    style={{
                                                        width: '100%',
                                                        marginTop: '-26px',
                                                    }}
                                                >
                                                    <source
                                                        src={
                                                            selectedTrack.paths
                                                                ?.localStorage
                                                                ? selectedTrack
                                                                      .paths
                                                                      ?.data
                                                                : selectedTrack
                                                                      .paths
                                                                      ?.ipfsURL
                                                        }
                                                        type="audio/mpeg"
                                                    />
                                                    Your browser does not
                                                    support the audio element.
                                                </audio>
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                            </Row>
                        </Header>
                        <Container fluid>
                            <Row className="bg-light pt-4">
                                <Col>
                                    <Card body className="bg-light p-2 m-2">
                                        <Row>
                                            <Col>
                                                <p className="display-3 mt-3">
                                                    💿 Tracks{' '}
                                                    <span className="badge bg-dark ms-2 fs-2 p-1 m-0">
                                                        {
                                                            Object.keys(
                                                                trackNames
                                                            ).length
                                                        }{' '}
                                                        Tracks
                                                    </span>
                                                </p>
                                            </Col>
                                        </Row>
                                        <Row className="justify-content-center">
                                            <Col lg={10}>
                                                {tracks.map((track, index) => (
                                                    <Row className="justify-content-center mt-2">
                                                        <Col lg={10}>
                                                            <Row className="gy-2 justify-content-cente">
                                                                <div
                                                                    className="nikeboiAltText fs-2 text-white"
                                                                    style={{
                                                                        marginTop:
                                                                            -28,
                                                                        marginLeft:
                                                                            -16,
                                                                        position:
                                                                            'absolute',
                                                                    }}
                                                                >
                                                                    #{index}
                                                                </div>
                                                                <Col lg={3}>
                                                                    <div className="d-grid">
                                                                        {selectedTrack.key ===
                                                                        track.key ? (
                                                                            <>
                                                                                {this
                                                                                    .state
                                                                                    .playing &&
                                                                                this
                                                                                    .state
                                                                                    .playingKey ===
                                                                                    track.key ? (
                                                                                    <Button
                                                                                        variant="danger"
                                                                                        onClick={() => {
                                                                                            document
                                                                                                .getElementById(
                                                                                                    'audio-player'
                                                                                                )
                                                                                                .pause();
                                                                                            this.setState(
                                                                                                {
                                                                                                    playing: false,
                                                                                                }
                                                                                            );
                                                                                        }}
                                                                                    >
                                                                                        PAUSE
                                                                                    </Button>
                                                                                ) : (
                                                                                    <Button
                                                                                        variant="success"
                                                                                        onClick={() => {
                                                                                            this.setState(
                                                                                                {
                                                                                                    loading: true,
                                                                                                },
                                                                                                () => {
                                                                                                    this.setState(
                                                                                                        {
                                                                                                            loading: false,
                                                                                                        },
                                                                                                        () => {
                                                                                                            this.setState(
                                                                                                                {
                                                                                                                    playingKey:
                                                                                                                        track.key,
                                                                                                                    playing: true,
                                                                                                                }
                                                                                                            );

                                                                                                            document
                                                                                                                .getElementById(
                                                                                                                    'audio-player'
                                                                                                                )
                                                                                                                .play();
                                                                                                        }
                                                                                                    );
                                                                                                }
                                                                                            );
                                                                                        }}
                                                                                    >
                                                                                        PLAY
                                                                                    </Button>
                                                                                )}
                                                                            </>
                                                                        ) : (
                                                                            <Button
                                                                                variant="dark"
                                                                                onClick={() => {
                                                                                    this.setState(
                                                                                        {
                                                                                            selectedContentKey:
                                                                                                track.key,
                                                                                        }
                                                                                    );
                                                                                }}
                                                                            >
                                                                                SELECT
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </Col>
                                                                <Col lg={2}>
                                                                    <div className="d-grid">
                                                                        <Button
                                                                            variant="light"
                                                                            href={
                                                                                selectedTrack
                                                                                    .paths
                                                                                    ?.localStorage
                                                                                    ? selectedTrack
                                                                                          .paths
                                                                                          ?.data
                                                                                    : selectedTrack
                                                                                          .paths
                                                                                          ?.ipfsURL
                                                                            }
                                                                        >
                                                                            DOWNLOAD
                                                                        </Button>
                                                                    </div>
                                                                </Col>
                                                                <Col>
                                                                    <p
                                                                        style={{
                                                                            marginTop:
                                                                                -16,
                                                                            position:
                                                                                'absolute',
                                                                        }}
                                                                        className="ms-4 d-none d-xl-block d-xxl-block"
                                                                    >
                                                                        NIKEBOI{' '}
                                                                        {selectedTrack.key ===
                                                                        track.key ? (
                                                                            <span className="badge bg-success">
                                                                                SELECTED
                                                                            </span>
                                                                        ) : (
                                                                            <>

                                                                            </>
                                                                        )}
                                                                        {this
                                                                            .state
                                                                            .playing &&
                                                                        track.key ===
                                                                            this
                                                                                .state
                                                                                .playingKey ? (
                                                                            <span className="badge ms-2 bg-success">
                                                                                🔊
                                                                                PLAYING
                                                                            </span>
                                                                        ) : (
                                                                            <>

                                                                            </>
                                                                        )}
                                                                    </p>
                                                                    <p className="display-5 mt-1 ms-4">
                                                                        {
                                                                            track.trackName
                                                                        }
                                                                    </p>
                                                                </Col>
                                                            </Row>
                                                        </Col>
                                                    </Row>
                                                ))}
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col>
                                                <Card body className="bg-dark">
                                                    <div className="d-grid">
                                                        <Button
                                                            variant="light"
                                                            href="https://music.apple.com/us/album/to-the-moon-and-back-ep/1654036746"
                                                        >
                                                            Itunes ↗️
                                                        </Button>
                                                    </div>
                                                </Card>
                                            </Col>
                                            <Col>
                                                <Card body className="bg-dark">
                                                    <div className="d-grid">
                                                        <Button
                                                            variant="light"
                                                            href="https://open.spotify.com/album/1ZjDXCbjcVeYlw77r4S1oa?si=eu9s3SBlRqK1nQfvrTvg9g"
                                                        >
                                                            Spotify ↗️
                                                        </Button>
                                                    </div>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </Card>
                                </Col>
                            </Row>

                            <Row className="mt-4">
                                <Col>
                                    <div className="d-grid gap-2">
                                        <NavigationLink
                                            location={
                                                '/view/' + this.state.tokenId
                                            }
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
                                            text={
                                                Resources.$.UI.Action.AllTokens
                                            }
                                        />
                                    </div>
                                </Col>
                            </Row>
                        </Container>
                        <br />
                        <br />
                        <br />
                    </>
                )}
            </>
        );
    }
}

Audio.id = 'Audio';
Audio.url = '/view/:tokenId/audio';
Audio.settings = {
    requireWallet: true,
};

export default Audio;
