import React, { Component } from 'react';
import {
    loadStickers,
    loadToken,
} from 'infinitymint-client/dist/src/classic/helpers';
import Controller from 'infinitymint-client/dist/src/classic/controller';
import Loading from '../../../../Components/Loading';
import { Container, Row, Col, Card, Alert, Button } from 'react-bootstrap';
import NavigationLink from '../../../../Components/NavigationLink.js';
import resources from 'infinitymint-client/dist/src/classic/resources.js';

class Drink extends Component {
    constructor(props) {
        super(props);

        this.state = {
            tokenId: this?.props?.match?.params?.tokenId || 0,
            token: {
                pathSize: 13,
                colours: [],
            },
            hasDrink: false,
            hasRequest: false,
            isFull: false,
            error: undefined,
        };
    }

    async getIsFull() {
        let isFull = Controller.callMethod(
            Controller.accounts[0],
            'Mod_Drink',
            'isDrinkFull',
            [this.state.tokenId]
        );

        this.setState({
            isFull: isFull,
        });
    }

    async getHasDrink() {
        let hasDrink = Controller.callMethod(
            Controller.accounts[0],
            'Mod_Drink',
            'hasDrink',
            [this.state.tokenId]
        );

        this.setState({
            hasDrink: hasDrink,
        });
    }

    async getHasRequest() {
        let result = Controller.callMethod(
            Controller.accounts[0],
            'Mod_Drink',
            'hasRequest',
            [this.state.tokenId]
        );

        this.setState({
            hasRequest: result,
        });
    }

    async generateDrinkCode() {
        return Controller.Base64.encode(Math.floor(Math.random() * 1000));
    }

    async requestDrink() {
        await Controller.sendMethod(
            Controller.accounts[0],
            'Mod_Drink',
            'requestDrink',
            [this.state.tokenId, this.generateDrinkCode()]
        );

        this.setState({
            hasRequest: true,
        });
    }

    async componentDidMount() {
        try {
            await loadStickers(this);
            await loadToken(this);

            if (this.state.token.owner !== Controller.accounts[0])
                throw new Error('must be owner of token');

            await this.getHasDrink();
            await this.getHasRequest();
            await this.getIsFull();
        } catch (error) {
            Controller.log('[😞] Error', 'error');
            Controller.log(error);
            this.setState({
                isValid: false,
            });
        }
    }

    render() {
        if (this.state.loading)
            return (
                <Container>
                    <Loading />
                </Container>
            );

        return (
            <Container>
                <Row>
                    <Col xs={10} sm={10} lg={11} xl={11}>
                        <h1 className="mt-3 rainbow-text-animatedGold hover:rainbow-text-animated">
                            🥃CLUB.eth
                        </h1>
                        <p className="fs-5 text-white">
                            Join the 🥃 club and get the next drink is on the house! 
                        </p>
                        
                    </Col>
                    <Col xs={2} sm={2} lg={1} xl={1} className='align-self-center align-right'>
                        <NavigationLink
                        location={
                            '/view/' + this.state.tokenId
                        }
                        variant="light"
                        size="lg"
                        text={resources.$.UI.Action.Back}
                        
                    /></Col>
                </Row>
                <Row>
                    <Col>
                        {this.state.hasRequest ? (
                            <Alert>
                                <Alert.Heading>Drink Requested</Alert.Heading>
                                <p>
                                    Your drink has been requested. Please wait
                                    for the bartender to fill it.
                                </p>
                            </Alert>
                        ) : (
                            <></>
                        )}
                    </Col>
                </Row>
                <Row>
                    <Col lg>
                        <Card body>
                            <p>Request Drink</p>
                            <div className="d-grid">
                                <Button
                                    variant="success"
                                    disabled={
                                        this.state.hasDrink ||
                                        this.state.hasRequest
                                    }
                                >
                                    Request Drink
                                </Button>
                            </div>
                        </Card>
                    </Col>
                    <Col lg>
                        <Card body>
                            <p>Refill Drink</p>
                            {this.state.isFull ? (
                                <>
                                    <Alert variant="danger">
                                        <Alert.Heading>
                                            Drink is Full
                                        </Alert.Heading>
                                        <p>
                                            Your drink is full. Please drink it!
                                        </p>
                                    </Alert>
                                </>
                            ) : (
                                <></>
                            )}
                            <div className="d-grid">
                                <Button
                                    variant="success"
                                    disabled={
                                        !this.state.hasDrink ||
                                        this.state.isFull
                                    }
                                >
                                    Refill Drink
                                </Button>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Container>
        );
    }
}

Drink.url = '/view/:tokenId/drink';
Drink.id = 'Drink';
Drink.settings = {
    requireWallet: true,
    requireWeb3: true,
};

export default Drink;
