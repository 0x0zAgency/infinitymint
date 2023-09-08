import React, { Component } from 'react';
import {
    Container,
    Row,
    Col,
    Card,
    Alert,
    Button,
    Form,
    ListGroup,
} from 'react-bootstrap';
import NavigationLink from '../../../../Components/NavigationLink';
import FindTokenModal from '../../../../Modals/FindTokenModal';
import Resources from 'infinitymint-client/dist/src/classic/resources.js';
import StorageController from 'infinitymint-client/dist/src/classic/storageController.js';
import Controller from 'infinitymint-client/dist/src/classic/controller.js';
import Transaction from '../../../../Components/Transaction';
import GasMachine from '../../../../Components/GasMachine';
import ShowTokensModal from '../../../../Modals/ShowTokensModal';
import Loading from '../../../../Components/Loading';
import {
    cutLongString,
    decideRowClass,
    waitSetState,
    enycrptString,
    getHost,
    delay,
} from 'infinitymint-client/dist/src/classic/helpers.js';
import PreviewTokenModal from '../../../../Modals/PreviewTokenModal';
import GeneratePhraseSetModal from '../Modals/GeneratePhraseSetModal';
import ShowPhraseModal from '../Modals/ShowPhraseModal';
import ResultModal from '../../../../Modals/ResultModal';
import LoadPhraseSetModal from '../Modals/LoadPhraseSetModal';
import ValidateRequestModal from '../Modals/ValidateRequestModal';

let _errorTimeout;
let blockSize = 16;

const Config = Controller.getConfig();
class RedemptionControls extends Component {
    constructor(props) {
        super(props);

        let transfers = StorageController.getPagePreference('transfers') || {};
        let transfersLength = Object.values(transfers).length;

        this.state = {
            showFindTokenModal: false,
            showPreviewTokenModal: false,
            selectedPreview: {},
            selectedToken: {},
            transfers: transfers,
            awaitingTransfer: transfersLength !== 0,
            showOverlay: false,
            showShowTokensModal: false,
            hasChanges: false,
            page: 0,
            checks: {},
            showGeneratePhraseSetModal: false,
            showValidateRequestModal: false,
            selectedRequest: {},
            actualPhrase: {},
            phraseSet: [],
            showShowPhraseModal: false,
            unmounted: true,
            loading: true,
            blocksLeft: 0,
            showLoadPhraseSetModal: false,
            phrases: StorageController.getPagePreference('phrases') || {},
            phraseId:
                StorageController.getPagePreference('phraseId') || 'Set 1',
            unlinkedPhrases: Object.values(
                StorageController.getPagePreference('unlinkedPhrases') || {}
            ),
            redeemable: StorageController.getPagePreference('redeemable') || {},
            redeemed: StorageController.getPagePreference('redeemed') || {},
            rowClass: decideRowClass(),
            totalBlocks: Math.round(transfersLength / blockSize),
            hasTokens: false,
            requests: StorageController.getPagePreference('requests') || {},
            tokens: [],
            cypherKey: StorageController.getPagePreference('cypherKey') || '',
            currentCypherKey:
                StorageController.getPagePreference('cypherKey') || '',
            deploymentAddress: Controller.nullAddress,
        };
    }

    async checkForRequests() {
        let requests = {};

        for (let i = 0; i < this.state.tokens.length; i++) {
            let tokenId = this.state.tokens[i].tokenId;
            let result = this.state.checks[tokenId][2];

            if (result) {
                let obj = await Controller.callMethod(
                    Controller.accounts[0],
                    'Mod_Redemption',
                    'getRequest',
                    [tokenId]
                );
                requests[tokenId] = {
                    sender: obj.sender,
                    redemption: obj.redemption,
                    key: obj.key,
                    valid: obj.valid,
                    tokenId: tokenId,
                };
            }
        }

        StorageController.setPagePreference('requests', requests);
        this.setState({
            hasRequests: Object.values(requests).length !== 0,
            requests: requests,
        });
    }

    async checkRedeemable() {
        let redeemables = { ...this.state.redeeemables };
        let redeemed = { ...this.state.redeemed };

        for (let i = 0; i < this.state.tokens.length; i++) {
            let tokenId = this.state.tokens[i].tokenId;
                console.log('tokenId: ', tokenId);
            let result = this.state.checks[tokenId][0] === true;
                console.log('result: ', result);
            if (result) {
                let redemptionCode = await Controller.callMethod(
                    Controller.accounts[0],
                    'Mod_Redemption',
                    'getActiveRedemption',
                    [tokenId]
                );

                redeemables[tokenId] = redemptionCode;
                console.log('redeemables: ', redeemables[tokenId]);
            }

            result = this.state.checks[tokenId][1] === true;

            if (result) {
                let redemption = await Controller.callMethod(
                    Controller.accounts[0],
                    'Mod_Redemption',
                    'getRedemptionProof',
                    [tokenId]
                );

                redeemed[tokenId] = redemption;
            }
        }

        StorageController.setPagePreference('redeemable', redeemables);
        StorageController.setPagePreference('redeemed', redeemed);
        this.setState({
            redeemable: redeemables,
            redeemed: redeemed,
        });
    }

    async getChecks(tokenId) {
        return await Controller.callMethod(
            Controller.accounts[0],
            'Mod_Redemption',
            'getChecks',
            [tokenId]
        );
    }

    async getTokens(page = 0) {
        this.setState({
            tokens: {},
            hasTokens: false,
        });

        let results = await Controller.getTokens(
            50,
            page,
            this.state.deploymentAddress
        );

        let checks = {};
        for (let i = 0; i < results.length; i++) {
            let result = results[i];
            checks[result.token.tokenId] = await this.getChecks(
                result.token.tokenId
            );
        }

        results = results.map((result) => {
            let token = {
                ...(result.token || {}),
                noPhrase: false,
                notRedeemable: checks[result.token.tokenId][0] !== true,
            };

            if (this.state.phrases[result.token.tokenId] === undefined) {
                token.noPhrase = true;
            } else
                token.phrase = this.state.phrases[result.token.tokenId].phrase;

            return token;
        });

        if (results.length !== 0) {
            this.setState({
                hasTokens: true,
                tokens: results,
            });

            let transfers = { ...this.state.transfers };

            results.forEach((result) => {
                if (transfers[result.token.tokenId] !== undefined)
                    delete transfers[result.token.tokenId];
            });

            this.setState({
                transfers: transfers,
            });
            StorageController.setPagePreference('transfers', transfers);
        }

        await waitSetState(this, {
            checks: checks,
        });
    }

    async componentDidUpdate() {
        if (
            this.state.currentCypherKey !== undefined &&
            this.state.currentCypherKey.length !== 0 &&
            this.state.currentCypherKey !==
                StorageController.getPagePreference('cypherKey', null, false)
        )
            StorageController.setPagePreference(
                'cypherKey',
                this.state.cypherKey
            );
    }

    async componentDidMount() {
        let transfers = StorageController.getPagePreference('transfers') || {};
        let deployment = Config.getDeployment('Mod_Redemption');
        //start row interval interval
        let interval = setInterval(() => {
            this.setState({
                rowClass: decideRowClass(
                    Object.values(this.state.tokens).length
                ),
            });
        }, 1000);
        let transferLength = Object.values(transfers).length;

        //set state
        await waitSetState(this, {
            transfers: transfers,
            deploymentAddress: deployment.address,
            awaitingTransfer: transferLength !== 0,
            rowInterval: interval,
            phraseSet: this.state.unlinkedPhrases,
        });

        //get tokens
        await this.getTokens();
        //check redeemables
        await this.checkRedeemable();
        await this.checkForRequests();

        this.setState({
            rowClass: decideRowClass(Object.values(this.state.tokens).length),
            loading: false,
        });
    }

    async componentWillUnmount() {
        clearInterval(this.state.rowInterval);
    }

    async transferTokens() {
        let tokenIds = Object.values(this.state.transfers).map(
            (tokens) => tokens.token.tokenId
        );

        await waitSetState(this, {
            blocksLeft: this.state.totalBlocks,
        });

        while (tokenIds.length > 0) {
            let selection = tokenIds.slice(0, blockSize);
            if (tokenIds.length >= blockSize)
                tokenIds = tokenIds.slice(blockSize);
            else tokenIds = [];

            await Controller.sendMethod(
                Controller.accounts[0],
                'InfinityMint',
                'transferBatch',
                {
                    parameters: [selection, this.state.deploymentAddress],
                    gasUsage: selection.length * 195000,
                }
            );

            let transfers = { ...this.state.transfers };
            selection.forEach((tokenId) =>
                transfers[tokenId] !== undefined
                    ? delete transfers[tokenId]
                    : ''
            );
            await waitSetState(this, {
                transfers: transfers,
                blocksLeft: this.state.blocksLeft - 1,
                awaitingTransfer: Object.values(transfers).length !== 0,
            });
            StorageController.setPagePreference('transfers', transfers);
        }

        if (!this.state.awaitingTransfer)
            StorageController.setPagePreference('transfers', {});

        //get tokens
        await this.getTokens();

        this.setState({
            showOverlay: false,
            success: true,
        });
    }

    async makeRedeemable(tokens = {}) {
        this.setState({
            loading: true,
        });
        let keys = Object.keys(tokens);
        let bytes = {};
        let changedTokens = {};

        for (let i = 0; i < keys.length; i++) {
            let value = tokens[keys[i]];

            if (
                value.notRedeemable === false ||
                this.state.redeemable[value.tokenId]
            )
                continue;

            let phrase = value.phrase || this.state.phrases[value.tokenId];

            if (phrase === undefined)
                throw new Error('bad phrase for: ' + value.tokenId);

            let encoded = Controller.web3.utils.encodePacked({
                value: `${value.tokenId}|${phrase.length}|${this.state.phraseId}`,
                type: 'string',
            });

            bytes[value.tokenId] = encoded;
            changedTokens[value.tokenId] = value;
        }

        let redeemable = { ...this.state.redeemable };

        let batches = {};
        let entries = Object.entries(bytes);
        let count = 0;
        let batch = 0;
        for (let [key, value] of entries) {
            if (count > 16) {
                batch++;
                count = 0;
            }

            if (batches[batch] === undefined) batches[batch] = {};

            batches[batch][key] = value;
            count++;
        }

        for (let [_, bytesValue] of Object.entries(batches)) {
            let values = Object.values(bytesValue);
            let keys = Object.keys(bytesValue);

            try {
                await Controller.sendMethod(
                    Controller.accounts[0],
                    'Mod_Redemption',
                    'addRedemptions',
                    [keys, values]
                );

                Object.keys(bytesValue).forEach((key) => {
                    redeemable[key] = values[key];
                    changedTokens[key].notRedeemable = false;
                });

                StorageController.setPagePreference('redeemable', redeemable);
            } catch (error) {
                Controller.log(error);
            }

            this.setState({
                redeemable: redeemable,
            });
        }

        let finalTokens = [...this.state.tokens].map(
            (token) =>
                Object.values(changedTokens).filter(
                    (thatToken) => token.tokenId === thatToken.tokenId
                )[0] || token
        );
        StorageController.setPagePreference('redeemable', redeemable);
        this.setState({
            tokens: finalTokens,
            redeemable: redeemable,
            loading: false,
        });

        await this.checkRedeemable();
    }

    linkTokenToPhrases(
        unlinkedPhrases = {},
        tokens = {},
        useKeysOfPhrases = false
    ) {
        let orderedTokens = {};

        Object.values(tokens).forEach((token) => {
            orderedTokens[token.tokenId] = { ...token };
        });

        if (Object.values(orderedTokens).length === 0) return;

        let keys = Object.keys(unlinkedPhrases);
        let actualUnlinkedPhrases = { ...this.state.unlinkedPhrases };
        let tokenKeys = Object.keys(orderedTokens);
        let currentLinkedPhrases = { ...this.state.phrases };

        for (let i = 0; i < tokenKeys.length; i++) {
            let id = useKeysOfPhrases ? keys[i] : tokenKeys[i];

            let phrase = unlinkedPhrases[id];
            if (currentLinkedPhrases[id] !== undefined) continue;

            orderedTokens[id].phrase = phrase;
            orderedTokens[id].noPhrase = false;
            currentLinkedPhrases[id] = {
                tokenId: orderedTokens[id].tokenId,
                phraseId: this.state.phraseId,
                phrase: phrase,
            };
            delete actualUnlinkedPhrases[i];
        }

        actualUnlinkedPhrases = Object.values(actualUnlinkedPhrases).filter(
            (value) => value !== null
        );

        StorageController.setPagePreference('phrases', currentLinkedPhrases);
        StorageController.setPagePreference(
            'unlinkedPhrases',
            actualUnlinkedPhrases
        );

        let finalTokens = [...this.state.tokens].map(
            (token) =>
                Object.values(orderedTokens).filter(
                    (thatToken) => token.tokenId === thatToken.tokenId
                )[0] || token
        );

        this.setState({
            phrases: currentLinkedPhrases,
            unlinkedPhrases: actualUnlinkedPhrases,
            tokens: finalTokens,
        });
    }

    cleanupError(seconds = 5) {
        clearTimeout(_errorTimeout);
        return new Promise((resolve, reject) => {
            _errorTimeout = setTimeout(() => {
                this.setState({
                    error: undefined,
                });
            }, seconds * 1000);
        });
    }

    setError(error) {
        this.setState({
            error: error.message || error.error || error,
        });
        this.cleanupError(5);
    }

    render() {
        let fowardPage = () => {
            let page = this.state.page + 1;
            this.setState({
                loading: true,
                page: page,
            });
            this.getTokens(page).finally(() => {
                this.setState({
                    loading: false,
                });
            });
        };

        let backPage = () => {
            let page = Math.max(0, this.state.page - 1);
            this.setState({
                loading: true,
                page: page,
            });
            this.getTokens(page).finally(() => {
                this.setState({
                    loading: false,
                });
            });
        };

        //for transaction element
        let element = (
            <>
                {this.state.error !== undefined && this.state.error !== null ? (
                    <Row className="mt-2">
                        <Col>
                            <Alert variant="danger" className="text-center">
                                <p className="display-2">😨</p>
                                {this.state.error?.message || this.state.error}
                            </Alert>
                        </Col>
                    </Row>
                ) : (
                    <></>
                )}
                <p className="fs-3 mb-1">✈️ From</p>
                <div className="d-grid">
                    <Form.Control
                        type="text"
                        size="sm"
                        placeholder={Controller.accounts[0]}
                        readOnly
                    />
                </div>
                <p className="fs-3 mt-2 mb-1">✈️ To</p>
                <div className="d-grid">
                    <Form.Control
                        type="text"
                        size="sm"
                        placeholder={this.state.deploymentAddress}
                        readOnly
                    />
                </div>
                <p className="fs-3 mt-2 mb-1">
                    {Resources.tokenPlural()}{' '}
                    <span className="badge bg-dark">
                        {Object.values(this.state.transfers).length}
                    </span>
                </p>
                <ListGroup className="mb-4">
                    {Object.values(this.state.transfers).map(
                        (transfer, index) => {
                            if (index > 8) return <></>;
                            if (index === 8)
                                return (
                                    <ListGroup.Item
                                        key={index}
                                        className="text-center"
                                    >
                                        {Object.values(this.state.transfers)
                                            .length - index}{' '}
                                        more tokens...
                                    </ListGroup.Item>
                                );

                            return (
                                <ListGroup.Item key={index}>
                                    <span className="badge bg-light">
                                        #{transfer.token.tokenId}
                                    </span>{' '}
                                    {transfer.token.token.name}{' '}
                                    <span className="badge bg-dark">
                                        {
                                            Controller.getPathSettings(
                                                transfer.token.token.pathId
                                            ).name
                                        }
                                    </span>
                                </ListGroup.Item>
                            );
                        }
                    )}
                </ListGroup>
                <GasMachine
                    gasUsage={
                        Object.values(this.state.transfers).length * 105000
                    }
                />
                <p
                    className="text-center mt-4"
                    style={{ textDecoration: 'underline' }}
                >
                    Will send a total of {Math.max(this.state.totalBlocks, 1)}{' '}
                    transactions
                </p>
            </>
        );

        let withOutPhrase = Object.values(this.state.tokens).filter(
            (token) => token.noPhrase && token.notRedeemable
        ).length;
        let nonRedeemable = Object.values(this.state.tokens).filter(
            (token) => !token.noPhrase && token.notRedeemable
        ).length;

        return (
            <Container fluid>
                <p className="display-5 neonText mt-4">🎟 Redemption Controls</p>
                <Alert variant="success">
                    Here you can make redeemable tokens. You can give them out
                    using a CD key. You can also whitelist addresses to receive
                    free tokens via the simple whitelist page.
                </Alert>
                <Row className="mt-2">
                    <Col>
                        <div className="d-grid">
                            <Button
                                variant="light"
                                onClick={async () => {
                                    this.setState({
                                        loading: true,
                                    });
                                    await this.componentDidMount();
                                    this.setState({
                                        loading: false,
                                    });
                                }}
                            >
                                {Resources.$.UI.Action.Refresh}
                            </Button>
                        </div>
                    </Col>
                </Row>
                {this.state.success ? (
                    <Row className="mt-4">
                        <Col>
                            <Alert variant="success">
                                <p className="fs-2">😺</p>
                                Success! Please wait for the tokens to appear
                                below. Please do not try and re-transfer the
                                same tokens. They will appear! Just give them
                                time.
                            </Alert>
                        </Col>
                    </Row>
                ) : (
                    <></>
                )}
                {!this.state.loading ? (
                    <>
                        {this.state.error !== undefined &&
                        this.state.error !== null ? (
                            <Row className="mt-2">
                                <Col>
                                    <Alert
                                        variant="danger"
                                        className="text-center"
                                    >
                                        <p className="display-2">😨</p>
                                        {this.state.error?.message ||
                                            this.state.error}
                                    </Alert>
                                </Col>
                            </Row>
                        ) : (
                            <></>
                        )}
                        <Row className="mt-1">
                            <Col lg={3}>
                                <Row>
                                    <Col>
                                        <Card>
                                            <Card.Header>
                                                {
                                                    Resources.$.UI.Action
                                                        .AddTokens
                                                }
                                            </Card.Header>
                                            <Card.Body>
                                                <div className="d-grid gap-2">
                                                    <Button
                                                        variant="success"
                                                        disabled={
                                                            this.state
                                                                .showFindTokenModal
                                                        }
                                                        hidden={
                                                            !this.state
                                                                .awaitingTransfer ||
                                                            Object.values(
                                                                this.state
                                                                    .transfers
                                                            ).length === 0
                                                        }
                                                        onClick={() => {
                                                            this.setState({
                                                                showOverlay: true,
                                                            });
                                                        }}
                                                    >
                                                        {
                                                            Resources.$.UI
                                                                .Action
                                                                .TransferTokens
                                                        }{' '}
                                                        <span className="badge bg-dark">
                                                            {
                                                                Object.values(
                                                                    this.state
                                                                        .transfers
                                                                ).length
                                                            }
                                                        </span>
                                                    </Button>
                                                    <Button
                                                        variant="warning"
                                                        disabled={
                                                            this.state
                                                                .showFindTokenModal
                                                        }
                                                        hidden={
                                                            !this.state
                                                                .awaitingTransfer
                                                        }
                                                        onClick={() => {
                                                            this.setState({
                                                                awaitingTransfer: false,
                                                                transfers: {},
                                                                showFindTokenModal: true,
                                                            });
                                                        }}
                                                    >
                                                        Change Selection{' '}
                                                        <span className="badge bg-dark">
                                                            {
                                                                Object.values(
                                                                    this.state
                                                                        .transfers
                                                                ).length
                                                            }
                                                        </span>
                                                    </Button>
                                                    <Button
                                                        variant="light"
                                                        disabled={
                                                            this.state
                                                                .showFindTokenModal
                                                        }
                                                        hidden={
                                                            !this.state
                                                                .awaitingTransfer
                                                        }
                                                        onClick={() => {
                                                            this.setState({
                                                                showShowTokensModal: true,
                                                            });
                                                        }}
                                                    >
                                                        Inspect Selection{' '}
                                                        <span className="badge bg-dark">
                                                            {
                                                                Object.values(
                                                                    this.state
                                                                        .transfers
                                                                ).length
                                                            }
                                                        </span>
                                                    </Button>
                                                    <Button
                                                        variant="dark"
                                                        disabled={
                                                            this.state
                                                                .showFindTokenModal
                                                        }
                                                        hidden={
                                                            this.state
                                                                .awaitingTransfer ||
                                                            Object.values(
                                                                this.state
                                                                    .transfers
                                                            ).length !== 0
                                                        }
                                                        onClick={() => {
                                                            this.setState({
                                                                showFindTokenModal: true,
                                                            });
                                                        }}
                                                    >
                                                        {
                                                            Resources.$.UI
                                                                .Action
                                                                .AddTokens
                                                        }
                                                    </Button>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col>
                                        <Card>
                                            <Card.Header>
                                                Cypher Key
                                            </Card.Header>
                                            <Card.Body>
                                                <div className="d-grid mt-2 mb-2 gap-2">
                                                    <Form.Control
                                                        type="text"
                                                        size="lg"
                                                        className="text-center"
                                                        onChange={(e) => {
                                                            this.setState({
                                                                hasChanges: true,
                                                                cypherKey:
                                                                    e.target
                                                                        .value,
                                                            });
                                                        }}
                                                        value={
                                                            this.state.cypherKey
                                                        }
                                                    />
                                                    <Button
                                                        variant="success"
                                                        hidden={
                                                            !this.state
                                                                .hasChanges
                                                        }
                                                        onClick={() => {
                                                            this.setState({
                                                                hasChanges: false,
                                                                currentCypherKey:
                                                                    this.state
                                                                        .cypherKey,
                                                            });
                                                        }}
                                                    >
                                                        Set As Cypher Key
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        hidden={
                                                            !this.state
                                                                .hasChanges ||
                                                            this.state
                                                                .currentCypherKey
                                                                .length === 0
                                                        }
                                                        onClick={() => {
                                                            this.setState({
                                                                hasChanges: false,
                                                                cypherKey:
                                                                    this.state
                                                                        .currentCypherKey,
                                                            });
                                                        }}
                                                    >
                                                        Revert Back To Previous
                                                        Key
                                                    </Button>
                                                    <Button
                                                        variant="light"
                                                        hidden={
                                                            this.state
                                                                .hasChanges
                                                        }
                                                        onClick={() => {
                                                            this.setState({
                                                                cypherKey:
                                                                    Controller.Base64.encode(
                                                                        (
                                                                            Math.random() *
                                                                                1200000000 +
                                                                            Date.now()
                                                                        ).toString()
                                                                    ),
                                                                hasChanges: true,
                                                            });
                                                        }}
                                                    >
                                                        Generate Key
                                                    </Button>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col>
                                        <Card>
                                            <Card.Header>Options</Card.Header>
                                            <Card.Body>
                                                <div className="d-grid gap-2">
                                                    <Button
                                                        variant="light"
                                                        hidden={
                                                            Object.values(
                                                                this.state
                                                                    .phrases
                                                            ).length !== 0 ||
                                                            this.state
                                                                .unlinkedPhrases
                                                                .length !== 0
                                                        }
                                                        onClick={() => {
                                                            this.setState({
                                                                showGeneratePhraseSetModal: true,
                                                            });
                                                        }}
                                                    >
                                                        Generate Phrase Set
                                                    </Button>
                                                    <Button
                                                        variant="light"
                                                        disabled={
                                                            this.state
                                                                .unlinkedPhrases
                                                                .length !== 0
                                                        }
                                                        onClick={() => {
                                                            this.setState({
                                                                showLoadPhraseSetModal: true,
                                                            });
                                                        }}
                                                    >
                                                        Import Phrase Set
                                                    </Button>
                                                    <Button
                                                        variant="light"
                                                        disabled={
                                                            this.state
                                                                .unlinkedPhrases
                                                                .length === 0 &&
                                                            Object.values(
                                                                this.state
                                                                    .phrases
                                                            ).length
                                                        }
                                                        onClick={() => {
                                                            let obj = {
                                                                phrases:
                                                                    this.state
                                                                        .phrases,
                                                                unlinkedPhrases:
                                                                    this.state
                                                                        .unlinkedPhrases,
                                                                cypherKey:
                                                                    this.state
                                                                        .currentCypherKey,
                                                                phraseId:
                                                                    this.state
                                                                        .phraseId,
                                                                redeemable:
                                                                    this.state
                                                                        .redeemable,
                                                            };

                                                            let final = {
                                                                _: Controller.Base64.encode(
                                                                    JSON.stringify(
                                                                        obj
                                                                    )
                                                                ),
                                                            };

                                                            this.setState({
                                                                resultModalValue:
                                                                    final,
                                                                showResultModal: true,
                                                            });
                                                        }}
                                                    >
                                                        Save Phrase Set
                                                    </Button>
                                                    {this.state.unlinkedPhrases
                                                        .length !== 0 ? (
                                                        <hr />
                                                    ) : (
                                                        <></>
                                                    )}

                                                    <Button
                                                        variant="danger"
                                                        hidden={
                                                            this.state
                                                                .unlinkedPhrases
                                                                .length === 0
                                                        }
                                                        onClick={() => {
                                                            this.setState({
                                                                phrases: {},
                                                                unlinkedPhrases:
                                                                    {},
                                                                cypherKey: '',
                                                                currentCypherKey:
                                                                    '',
                                                                phraseId: '',
                                                                redeemable: {},
                                                            });

                                                            StorageController.setPagePreference(
                                                                'phrases',
                                                                {}
                                                            );
                                                            StorageController.setPagePreference(
                                                                'unlinkedPhrases',
                                                                {}
                                                            );
                                                            StorageController.setPagePreference(
                                                                'cypherKey',
                                                                ''
                                                            );
                                                            StorageController.setPagePreference(
                                                                'currentCypherKey',
                                                                ''
                                                            );
                                                            StorageController.setPagePreference(
                                                                'phraseId',
                                                                ''
                                                            );
                                                            StorageController.setPagePreference(
                                                                'redeemable',
                                                                {}
                                                            );

                                                            delay(1).then(
                                                                () => {
                                                                    window.location.reload();
                                                                }
                                                            );
                                                        }}
                                                    >
                                                        Eject Phrase Set
                                                    </Button>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Col>
                            <Col lg>
                                <Row>
                                    <Col>
                                        <Card>
                                            <Card.Header>
                                                Redeemable{' '}
                                                {Resources.tokenPlural()}{' '}
                                                <span className="badge bg-dark">
                                                    {this.state.tokens.length}
                                                </span>
                                            </Card.Header>
                                            <Card.Body>
                                                <Row className="mb-2">
                                                    <Col className="text-center">
                                                        <p
                                                            className="small force-black"
                                                            style={{
                                                                textDecoration:
                                                                    'underline',
                                                            }}
                                                        >
                                                            Showing Page{' '}
                                                            {this.state.page}
                                                        </p>
                                                        <div className="d-grid gap-2">
                                                            {this.state.tokens
                                                                .length >
                                                            Config.settings
                                                                .maxTokenCount -
                                                                1 ? (
                                                                <Button
                                                                    variant="light"
                                                                    onClick={
                                                                        fowardPage
                                                                    }
                                                                >
                                                                    Advance To
                                                                    Page{' '}
                                                                    {this.state
                                                                        .page +
                                                                        1}
                                                                </Button>
                                                            ) : (
                                                                <></>
                                                            )}
                                                            {this.state.page -
                                                                2 >=
                                                            0 ? (
                                                                <Button
                                                                    variant="light"
                                                                    onClick={
                                                                        backPage
                                                                    }
                                                                >
                                                                    Back To Page{' '}
                                                                    {this.state
                                                                        .page -
                                                                        1}
                                                                </Button>
                                                            ) : (
                                                                <></>
                                                            )}
                                                            {this.state.page >
                                                            0 ? (
                                                                <Button
                                                                    variant="light"
                                                                    onClick={() => {
                                                                        this.setState(
                                                                            {
                                                                                page: 0,
                                                                            }
                                                                        );
                                                                        this.getTokens(
                                                                            0
                                                                        );
                                                                    }}
                                                                >
                                                                    Back To Page
                                                                    Zero
                                                                </Button>
                                                            ) : (
                                                                <></>
                                                            )}
                                                        </div>
                                                    </Col>
                                                </Row>
                                                {!this.state.hasTokens ? (
                                                    <Alert
                                                        variant="danger"
                                                        className="mt-2 text-center"
                                                    >
                                                        <p className="fs-2">
                                                            😔
                                                        </p>
                                                        You have no tokens
                                                        inside of the redemption
                                                        contract. Once you add
                                                        tokens to the contract,
                                                        you can then{' '}
                                                        <u>
                                                            make them redeemable
                                                            through a passcode
                                                        </u>
                                                    </Alert>
                                                ) : (
                                                    <>
                                                        <Row>
                                                            <Col>
                                                                <div className="d-grid gap-2">
                                                                    {this.state
                                                                        .unlinkedPhrases
                                                                        .length !==
                                                                    0 ? (
                                                                        <Button
                                                                            variant="warning"
                                                                            disabled={
                                                                                withOutPhrase ===
                                                                                0
                                                                            }
                                                                            onClick={() => {
                                                                                this.linkTokenToPhrases(
                                                                                    Object.values(
                                                                                        this
                                                                                            .state
                                                                                            .unlinkedPhrases
                                                                                    ),
                                                                                    Object.values(
                                                                                        this
                                                                                            .state
                                                                                            .tokens
                                                                                    ).filter(
                                                                                        (
                                                                                            token
                                                                                        ) =>
                                                                                            token.noPhrase &&
                                                                                            token.notRedeemable
                                                                                    )
                                                                                );
                                                                            }}
                                                                        >
                                                                            Link
                                                                            All
                                                                            Tokens{' '}
                                                                            <span className="badge bg-dark">
                                                                                {
                                                                                    this
                                                                                        .state
                                                                                        .unlinkedPhrases
                                                                                        .length
                                                                                }{' '}
                                                                                -{' '}
                                                                                {
                                                                                    withOutPhrase
                                                                                }
                                                                            </span>
                                                                        </Button>
                                                                    ) : (
                                                                        <></>
                                                                    )}
                                                                    {this.state
                                                                        .unlinkedPhrases
                                                                        .length !==
                                                                    0 ? (
                                                                        <Button
                                                                            variant="light"
                                                                            onClick={() => {
                                                                                this.setState(
                                                                                    {
                                                                                        showShowPhraseModal: true,
                                                                                        phraseSet:
                                                                                            Object.values(
                                                                                                this
                                                                                                    .state
                                                                                                    .unlinkedPhrases
                                                                                            ),
                                                                                    }
                                                                                );
                                                                            }}
                                                                        >
                                                                            View
                                                                            Unlinked
                                                                            Phrases{' '}
                                                                            <span className="badge bg-dark">
                                                                                {
                                                                                    this
                                                                                        .state
                                                                                        .unlinkedPhrases
                                                                                        .length
                                                                                }
                                                                            </span>
                                                                        </Button>
                                                                    ) : (
                                                                        <></>
                                                                    )}
                                                                    {this.state
                                                                        .unlinkedPhrases
                                                                        .length !==
                                                                    0 ? (
                                                                        <Button
                                                                            variant="light"
                                                                            onClick={() => {
                                                                                this.setState(
                                                                                    {
                                                                                        showShowPhraseModal: true,
                                                                                        phraseSet:
                                                                                            Object.values(
                                                                                                this
                                                                                                    .state
                                                                                                    .phrases
                                                                                            ),
                                                                                    }
                                                                                );
                                                                            }}
                                                                        >
                                                                            View
                                                                            Linked
                                                                            Phrases{' '}
                                                                            <span className="badge bg-dark">
                                                                                {
                                                                                    Object.values(
                                                                                        this
                                                                                            .state
                                                                                            .phrases
                                                                                    )
                                                                                        .length
                                                                                }
                                                                            </span>
                                                                        </Button>
                                                                    ) : (
                                                                        <></>
                                                                    )}
                                                                    <Button
                                                                        variant="success"
                                                                        hidden={
                                                                            nonRedeemable ===
                                                                                0 ||
                                                                            Object.values(
                                                                                this
                                                                                    .state
                                                                                    .phrases
                                                                            )
                                                                                .length ===
                                                                                0
                                                                        }
                                                                        onClick={() => {
                                                                            this.makeRedeemable(
                                                                                Object.values(
                                                                                    this
                                                                                        .state
                                                                                        .tokens
                                                                                ).filter(
                                                                                    (
                                                                                        token
                                                                                    ) =>
                                                                                        token.notRedeemable ===
                                                                                            true &&
                                                                                        token.noPhrase !==
                                                                                            true
                                                                                )
                                                                            );
                                                                        }}
                                                                    >
                                                                        Make All
                                                                        Redeemable{' '}
                                                                        <span className="badge bg-dark">
                                                                            {
                                                                                nonRedeemable
                                                                            }
                                                                        </span>
                                                                    </Button>
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                        <Row
                                                            className={
                                                                this.state
                                                                    .rowClass +
                                                                ' gy-2 mt-2'
                                                            }
                                                        >
                                                            {Object.values(
                                                                this.state
                                                                    .tokens
                                                            ).map(
                                                                (
                                                                    token,
                                                                    index
                                                                ) => (
                                                                    <Col
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="h-100"
                                                                    >
                                                                        <Card className="h-100">
                                                                            <Card.Header>
                                                                                <span className="badge bg-dark me-2">
                                                                                    #
                                                                                    {
                                                                                        token.tokenId
                                                                                    }
                                                                                </span>{' '}
                                                                                {cutLongString(
                                                                                    token
                                                                                        .token
                                                                                        .name,
                                                                                    24
                                                                                )}
                                                                                <span
                                                                                    className="badge bg-danger"
                                                                                    style={{
                                                                                        float: 'right',
                                                                                        textAlign:
                                                                                            'right',
                                                                                        textDecoration:
                                                                                            'underline',
                                                                                        cursor: 'pointer',
                                                                                    }}
                                                                                >
                                                                                    ❌
                                                                                    Remove
                                                                                </span>
                                                                                <span
                                                                                    className="badge bg-dark ms-3"
                                                                                    onClick={() => {
                                                                                        this.setState(
                                                                                            {
                                                                                                selectedPreview:
                                                                                                    token,
                                                                                                showPreviewTokenModal: true,
                                                                                            }
                                                                                        );
                                                                                    }}
                                                                                    style={{
                                                                                        float: 'right',
                                                                                        marginRight: 12,
                                                                                        textAlign:
                                                                                            'right',
                                                                                        textDecoration:
                                                                                            'underline',
                                                                                        cursor: 'pointer',
                                                                                    }}
                                                                                >
                                                                                    🖱️
                                                                                    View
                                                                                </span>
                                                                            </Card.Header>
                                                                            <Card.Body>
                                                                                <Row className="gy-2">
                                                                                    <Col>
                                                                                        <div className="gap-2 mt-2 h-100">
                                                                                            <Alert
                                                                                                variant={
                                                                                                    token.notRedeemable ===
                                                                                                        false &&
                                                                                                    token.noPhrase ===
                                                                                                        true
                                                                                                        ? 'warning'
                                                                                                        : token.noPhrase ||
                                                                                                          token.notRedeemable
                                                                                                        ? 'danger'
                                                                                                        : 'success'
                                                                                                }
                                                                                            >
                                                                                                {token?.noPhrase ===
                                                                                                true
                                                                                                    ? '❌ No Phrase'
                                                                                                    : '✔️ Phrase'}
                                                                                                <br />
                                                                                                {token?.notRedeemable ===
                                                                                                true
                                                                                                    ? '❌ Not Redeemable'
                                                                                                    : '✔️ Redeemable'}
                                                                                                <br />
                                                                                                {this
                                                                                                    .state
                                                                                                    .cypherKey
                                                                                                    .length ===
                                                                                                0
                                                                                                    ? '❌ No Cypher Key'
                                                                                                    : ''}
                                                                                                <p
                                                                                                    hidden={
                                                                                                        token.noPhrase
                                                                                                    }
                                                                                                >
                                                                                                    🔗{' '}
                                                                                                    {Config
                                                                                                        .settings
                                                                                                        .url +
                                                                                                        '/redemption?key=' +
                                                                                                        Controller.Base64.encode(
                                                                                                            `${token.tokenId}|${token.phrase}|${this.state.phraseId}`
                                                                                                        )}
                                                                                                </p>
                                                                                                {this
                                                                                                    .state
                                                                                                    .redeemed[
                                                                                                    token
                                                                                                        .tokenId
                                                                                                ] ===
                                                                                                undefined ? (
                                                                                                    <div className="d-grid gap-1 mt-2">
                                                                                                        {/**
                                                                                    <Button variant="danger" hidden={!token?.noPhrase || this.state.unlinkedPhrases.length === 0 || token.notRedeemable === false} onClick={() => {
                                                                                        this.linkTokenToPhrases({ 0: this.state.unlinkedPhrases[0] }, { [token.tokenId]: token })
                                                                                    }}>Link Phrase</Button>
                                                                                    */}
                                                                                                        {this
                                                                                                            .state
                                                                                                            .requests[
                                                                                                            token
                                                                                                                .tokenId
                                                                                                        ] !==
                                                                                                        undefined ? (
                                                                                                            <Button
                                                                                                                variant="warning"
                                                                                                                onClick={() => {
                                                                                                                    this.setState(
                                                                                                                        {
                                                                                                                            selectedRequest:
                                                                                                                                this
                                                                                                                                    .state
                                                                                                                                    .requests[
                                                                                                                                    token
                                                                                                                                        .tokenId
                                                                                                                                ],
                                                                                                                            selectedToken:
                                                                                                                                token,
                                                                                                                            actualPhrase:
                                                                                                                                token.phrase,
                                                                                                                            showValidateRequestModal: true,
                                                                                                                        }
                                                                                                                    );
                                                                                                                }}
                                                                                                            >
                                                                                                                Validate
                                                                                                                Request
                                                                                                                From{' '}
                                                                                                                {cutLongString(
                                                                                                                    this
                                                                                                                        .state
                                                                                                                        .requests[
                                                                                                                        token
                                                                                                                            .tokenId
                                                                                                                    ]
                                                                                                                        ?.sender,
                                                                                                                    16
                                                                                                                )}
                                                                                                            </Button>
                                                                                                        ) : (
                                                                                                            <>

                                                                                                            </>
                                                                                                        )}
                                                                                                        <Button
                                                                                                            variant="danger"
                                                                                                            hidden={
                                                                                                                !token?.notRedeemable
                                                                                                            }
                                                                                                            disabled={
                                                                                                                token?.noPhrase ||
                                                                                                                this
                                                                                                                    .state
                                                                                                                    .cypherKey
                                                                                                                    .length ===
                                                                                                                    0 ||
                                                                                                                this
                                                                                                                    .state
                                                                                                                    .unlinkedPhrases
                                                                                                                    .length ===
                                                                                                                    0 ||
                                                                                                                Object.values(
                                                                                                                    this
                                                                                                                        .state
                                                                                                                        .phrases
                                                                                                                )
                                                                                                                    .length ===
                                                                                                                    0
                                                                                                            }
                                                                                                            onClick={() => {
                                                                                                                this.makeRedeemable(
                                                                                                                    {
                                                                                                                        0: token,
                                                                                                                    }
                                                                                                                );
                                                                                                            }}
                                                                                                        >
                                                                                                            Make
                                                                                                            Redeemable
                                                                                                        </Button>
                                                                                                        <Button
                                                                                                            variant="light"
                                                                                                            hidden={
                                                                                                                token?.notRedeemable
                                                                                                            }
                                                                                                            onClick={() => {
                                                                                                                window.location.href =
                                                                                                                    '/redemption?key=' +
                                                                                                                    Controller.Base64.encode(
                                                                                                                        `${token.tokenId}|${token.phrase}|${this.state.phraseId}`
                                                                                                                    );
                                                                                                            }}
                                                                                                        >
                                                                                                            Redeem
                                                                                                        </Button>
                                                                                                    </div>
                                                                                                ) : (
                                                                                                    <div className="d-grid gap-2 text-center">
                                                                                                        <h3>
                                                                                                            Token
                                                                                                            has
                                                                                                            been
                                                                                                            redeemed
                                                                                                            and
                                                                                                            will
                                                                                                            be
                                                                                                            disappear
                                                                                                            from
                                                                                                            here
                                                                                                            soon
                                                                                                        </h3>
                                                                                                        <NavigationLink
                                                                                                            location={
                                                                                                                '/view/' +
                                                                                                                token.tokenId + ''
                                                                                                            }
                                                                                                            variant="success"
                                                                                                        >
                                                                                                            {
                                                                                                                Resources
                                                                                                                    .$
                                                                                                                    .UI
                                                                                                                    .Action
                                                                                                                    .ViewToken
                                                                                                            }
                                                                                                        </NavigationLink>
                                                                                                    </div>
                                                                                                )}
                                                                                            </Alert>
                                                                                        </div>
                                                                                    </Col>
                                                                                </Row>
                                                                            </Card.Body>
                                                                        </Card>
                                                                    </Col>
                                                                )
                                                            )}
                                                        </Row>
                                                    </>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col>
                                        <Card>
                                            <Card.Header>
                                                Requests To Redeem{' '}
                                                <span className="badge bg-dark">
                                                    {
                                                        Object.values(
                                                            this.state.requests
                                                        ).length
                                                    }
                                                </span>
                                            </Card.Header>
                                            <Card.Body>
                                                {!this.state.hasRequests ? (
                                                    <Alert
                                                        variant="warning"
                                                        className="mt-2 text-center"
                                                    >
                                                        <p className="fs-2">
                                                            🏝️
                                                        </p>
                                                        Once you have set up
                                                        some redeemable tokens
                                                        and given out the
                                                        passcodes. You will need
                                                        to verify the redemption
                                                        requests that pop up
                                                        here. This will create a
                                                        log of who, what, when
                                                        and how which can be
                                                        used as proof of
                                                        redemption.
                                                    </Alert>
                                                ) : (
                                                    <>
                                                        <ListGroup>
                                                            {Object.values(
                                                                this.state
                                                                    .requests
                                                            )
                                                                .filter(
                                                                    (request) =>
                                                                        this
                                                                            .state
                                                                            .redeemed[
                                                                            request
                                                                                .tokenId
                                                                        ] ===
                                                                        undefined
                                                                )
                                                                .map(
                                                                    (
                                                                        request,
                                                                        index
                                                                    ) => (
                                                                        <ListGroup.Item>
                                                                            <span className="badge bg-dark">
                                                                                tokenId{' '}
                                                                                {
                                                                                    request.tokenId
                                                                                }
                                                                            </span>{' '}
                                                                            from{' '}
                                                                            {
                                                                                request.sender
                                                                            }{' '}
                                                                            <span
                                                                                className="badge bg-success"
                                                                                style={{
                                                                                    textDecoration:
                                                                                        'underline',
                                                                                    cursor: 'pointer',
                                                                                }}
                                                                            >
                                                                                VERIFY/APPROVE
                                                                            </span>
                                                                        </ListGroup.Item>
                                                                    )
                                                                )}
                                                        </ListGroup>
                                                    </>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col>
                                        <Card>
                                            <Card.Header>
                                                Successful Redemptions{' '}
                                                <span className="badge bg-dark">
                                                    {
                                                        Object.values(
                                                            this.state.redeemed
                                                        ).length
                                                    }
                                                </span>
                                            </Card.Header>
                                            <Card.Body>
                                                {Object.values(
                                                    this.state.redeemed
                                                ).length === 0 ? (
                                                    <Alert
                                                        variant="success"
                                                        className="mt-2 text-center"
                                                    >
                                                        <p className="fs-2">
                                                            🌌
                                                        </p>
                                                        Once you or any of your
                                                        approved admins accept a
                                                        redemption request it
                                                        shall appear here!
                                                    </Alert>
                                                ) : (
                                                    <Row>
                                                        <Col>
                                                            <ListGroup>
                                                                {Object.values(
                                                                    this.state
                                                                        .redeemed
                                                                ).map(
                                                                    (
                                                                        request,
                                                                        index
                                                                    ) => (
                                                                        <ListGroup.Item>
                                                                            <span className="badge bg-dark">
                                                                                tokenId{' '}
                                                                                {request.tokenId ||
                                                                                    request[3]}
                                                                            </span>{' '}
                                                                            receiver{' '}
                                                                            {request.receiver ||
                                                                                request[0]}{' '}
                                                                            at{' '}
                                                                            {new Date(
                                                                                (request.time ||
                                                                                    request[2]) *
                                                                                    1000
                                                                            ).toString()}{' '}
                                                                            <span
                                                                                className="badge bg-success"
                                                                                style={{
                                                                                    textDecoration:
                                                                                        'underline',
                                                                                    cursor: 'pointer',
                                                                                }}
                                                                            >
                                                                                approved
                                                                                by{' '}
                                                                                {request.admin ||
                                                                                    request[1]}
                                                                            </span>
                                                                        </ListGroup.Item>
                                                                    )
                                                                )}
                                                            </ListGroup>
                                                        </Col>
                                                    </Row>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <Card body>
                                    <div className="d-grid gap-2">
                                        <NavigationLink
                                            location={'/mytokens'}
                                            size="md"
                                            text={
                                                Resources.$.UI.Action.MyTokens
                                            }
                                        />
                                        <NavigationLink
                                            location={'/alltokens'}
                                            size="md"
                                            text={
                                                Resources.$.UI.Action.AllTokens
                                            }
                                        />
                                        <NavigationLink
                                            location={'/admin/mint'}
                                            size="md"
                                            text={
                                                Resources.$.UI.Navbar.AdminMint
                                            }
                                        />
                                    </div>
                                </Card>
                            </Col>
                        </Row>
                    </>
                ) : (
                    <Loading />
                )}
                <ShowTokensModal
                    show={this.state.showShowTokensModal}
                    tokens={this.state.transfers}
                    onHide={() => {
                        this.setState({
                            showShowTokensModal: false,
                        });
                    }}
                />
                <ResultModal
                    show={this.state.showResultModal}
                    result={this.state.resultModalValue}
                    onHide={() => {
                        this.setState({
                            showResultModal: false,
                        });
                    }}
                />
                <FindTokenModal
                    show={this.state.showFindTokenModal}
                    allowMultiple={true}
                    checkSelection={true}
                    onAcceptedSet={(tokens) => {
                        if (typeof tokens === 'object') {
                            StorageController.setPagePreference(
                                'transfers',
                                tokens
                            );
                            this.setState({
                                transfers: tokens,
                                totalBlocks: Math.round(
                                    Object.values(tokens).length / blockSize
                                ),
                                awaitingTransfer: true,
                                showFindTokenModal: false,
                            });
                        } else
                            this.setState({
                                showFindTokenModal: false,
                                awaitingTransfer: false,
                                transfers: {},
                            });
                    }}
                    onHide={() => {
                        this.setState({
                            showFindTokenModal: false,
                        });
                    }}
                />
                <PreviewTokenModal
                    tokenSettings={{
                        hideLinkBadges: true,
                        hideDescription: true,
                    }}
                    show={this.state.showPreviewTokenModal}
                    hideMintButton={true}
                    selectedPreview={this.state.selectedPreview}
                    onHide={() => {
                        this.setState({
                            showPreviewTokenModal: false,
                        });
                    }}
                />
                <ValidateRequestModal
                    show={this.state.showValidateRequestModal}
                    currentCypherKey={this.state.currentCypherKey}
                    selectedRequest={this.state.selectedRequest}
                    actualPhrase={this.state.actualPhrase}
                    onValid={async () => {
                        try {
                            this.setState({
                                showValidateRequestModal: false,
                                loading: true,
                            });
                            await Controller.sendMethod(
                                Controller.accounts[0],
                                'Mod_Redemption',
                                'approveRedeem',
                                [
                                    this.state.selectedToken.tokenId,
                                    this.state.selectedRequest.redemption,
                                ]
                            );

                            let redeemed = { ...this.state.redeemed };
                            redeemed[this.state.selectedToken.tokenId] =
                                await Controller.callMethod(
                                    Controller.accounts[0],
                                    'Mod_Redemption',
                                    'getRedemptionProof',
                                    [this.state.selectedToken.tokenId]
                                );

                            StorageController.setPagePreference(
                                'redeemed',
                                redeemed
                            );
                            this.setState({
                                redeemed: redeemed,
                                loading: false,
                                success: true,
                            });
                        } catch (error) {
                            Controller.log(error);
                        }
                    }}
                    onInvalid={() => {}}
                    onHide={() => {
                        this.setState({
                            showValidateRequestModal: false,
                        });
                    }}
                />
                <GeneratePhraseSetModal
                    show={this.state.showGeneratePhraseSetModal}
                    recommendedPhraseCount={withOutPhrase}
                    onHide={() => {
                        this.setState({
                            showGeneratePhraseSetModal: false,
                        });
                    }}
                    onFinalizedPhrases={(phrases, phraseId) => {
                        StorageController.setPagePreference(
                            'unlinkedPhrases',
                            phrases
                        );
                        StorageController.setPagePreference('phrases', {});
                        StorageController.setPagePreference(
                            'phraseId',
                            phraseId
                        );
                        this.setState({
                            phrases: {},
                            unlinkedPhrases: phrases,
                            phraseId: phraseId,
                            showGeneratePhraseSetModal: false,
                        });
                    }}
                />
                <LoadPhraseSetModal
                    onHide={() => {
                        this.setState({
                            showLoadPhraseSetModal: false,
                        });
                    }}
                    show={this.state.showLoadPhraseSetModal}
                    onSubmit={(result) => {
                        this.setState({
                            phrases: result.phrases,
                            unlinkedPhrases: result.unlinkedPhrases,
                            cypherKey: result.cypherKey,
                            phraseId: result.phraseId,
                            currentCypherKey: result.currentCypherKey,
                            redeemable: result.redeemable,
                            showLoadPhraseSetModal: false,
                        });

                        StorageController.setPagePreference(
                            'phrases',
                            result.phrases
                        );
                        StorageController.setPagePreference(
                            'unlinkedPhrases',
                            result.unlinkedPhrases
                        );
                        StorageController.setPagePreference(
                            'cypherKey',
                            result.cypherKey
                        );
                        StorageController.setPagePreference(
                            'currentCypherKey',
                            result.currentCypherKey
                        );
                        StorageController.setPagePreference(
                            'phraseId',
                            result.phraseId
                        );
                        StorageController.setPagePreference(
                            'redeemable',
                            result.redeemable
                        );

                        delay(1).then(() => {
                            window.location.reload();
                        });
                    }}
                />
                <ShowPhraseModal
                    show={this.state.showShowPhraseModal}
                    onHide={() => {
                        this.setState({
                            showShowPhraseModal: false,
                        });
                    }}
                    phrases={this.state.phraseSet}
                    phraseId={this.state.phraseId}
                />
                <Transaction
                    element={element}
                    show={this.state.showOverlay}
                    title={'ERC721 Multi-Transfer'}
                    onHide={() => {
                        this.setState({
                            showOverlay: false,
                        });
                    }}
                    onClick={async () => {
                        this.setState({
                            loading: true,
                        });
                        try {
                            await this.transferTokens();
                        } catch (error) {
                            this.setError(error);
                        } finally {
                            this.setState({
                                loading: false,
                            });
                        }
                    }}
                />
                <br />
                <br />
                <br />
            </Container>
        );
    }
}

RedemptionControls.url = '/admin/redemption';
RedemptionControls.id = 'RedemptionControls';
RedemptionControls.settings = {
    requireWallet: true,
    requireAdmin: true,
    requireWeb3: true,
    dropdown: {
        admin: '🎟 Redemption Controls',
    },
};

export default RedemptionControls;
