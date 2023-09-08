import React, { Component } from 'react';
import { Col, Row, Container, Card, Button, Alert, Form } from 'react-bootstrap';
import Controller from 'infinitymint-client/dist/src/classic/controller';
import {
    loadPath,
    waitSetState,
    unpackColours,
} from 'infinitymint-client/dist/src/classic/helpers';
import Loading from '../../../../Components/Loading';
import { Redirect } from 'react-router-dom';
import GasMachine from '../../../../Components/GasMachine';
import AnimatedNumber from '../../../../Components/AnimatedNumber.js';
import resources from 'infinitymint-client/dist/src/classic/resources.js';
import controller from 'infinitymint-client/dist/src/classic/controller.js';

const Config = Controller.getConfig();
class SelectiveMint extends Component {
    constructor(props) {
        super(props);
        this.state = {
            fakeToken: {
                names: [],
                previewId: 0,
                colours: [],
                mintData: {},
                name: Controller.getDescription().token,
                pathId: 0,
                pathSize: 0,
                assets: [],
                owner: Controller.accounts[0],
            },
            loadingReason:
                'We are downloading all of the ♾️Mint paths from IPFS...',
            stickers: [],
            loading: false,
            paths: [],
            error: undefined,
            mintDataValue: '',
            isReady: false,
            location: '',
        };
    }


    async mint(pathId) {
        this.setState({
            loadingReason: 'Minting your InfinityMint token...',
            loading: true,
        });

        let tokenId = await Controller.callMethod(
            Controller.accounts[0],
            'InfinityMintApi',
            'totalMints'
        );
        tokenId = parseInt(tokenId.toString());
        await Controller.sendMethod(
            Controller.accounts[0],
            'Mod_SelectiveMint',
            'mint',
            {
                filter: {
                    sender: Controller.accounts[0],
                },
                parameters: [pathId, [], 0x0],
                gasPrice: Config.getGasPrices().fast,
            },
            !Controller.isAdmin
                ? Controller.web3.utils.toWei(
                      String(Controller.getContractValue('getPrice')),
                      'ether'
                  )
                : 0
        );
        // Redirect
        await waitSetState(this, {
            showOverlay: false,
            success: true,
            loading: false,
            location: `/view/${tokenId}`,
        });
    }

    async componentDidMount() {
        const project = Controller.getProjectSettings();

        if (project.paths !== undefined) {
            let vals = Object.values(project.paths);
            for (let i = 0; i < vals.length; i++) {
                await loadPath(project, i);
            }

            this.setState({
                // Remove default fro mthe paths
                paths: Object.keys(project.paths)
                    .filter((key) => key !== 'default')
                    .map((key) => project.paths[key]),
            });
        }

        this.setState({
            isReady: true,
        });
    }

    render() {
        if (this.state.location !== '') {
            return <Redirect to={this.state.location} />;
        }
        const count =
        controller.getContractValue('totalSupply') -
        controller.getContractValue('totalMints');

        return (
            <>
                {this.state.isReady && !this.state.loading ? (
                    <Container className="p-2 lg: w-75 xl: w-75 sm: p-0 sm: w-100">
                        <Card className="mt-4 pt-2">
                            <Row>
                            <Col className="text-center justify-content-center">
                            <h1 className="display-3 text-danger px-4">
                                {resources.$.Pages.Mint.Title}
                            </h1>
                            
                            <Alert variant="primary" className="text-center p-4">
                            <p className='display-7'>{resources.$.Pages.Mint.SubTitle}</p>
                                    {count > 0 ? (
                                        <AnimatedNumber
                                            className="display-5 text-danger"
                                            slowness={1}
                                            reach={count}
                                            delay={0}
                                        /> 
                                    ) : (
                                        <span className="fs-1">0</span>
                                    )}  {resources.tokenPlural()} Remaining
                                </Alert>
                                
                            </Col>
                            </Row>  
                            <Row className="mx-2">
                                {this.state.paths.map((path, index) => (
                                    <>
                                        <Col xl={3} sm={12} md={3} lg={3}>
                                            <Card
                                            body
                                            className="d-grid"
                                            >
                                                <Card.Body>
                                                    <Card.Title className='text-center'>
                                                       
                                                        <Button
                                                            className="w-100"
                                                            variant="secondary"
                                                            size='sm'
                                                            onClick={async () => {
                                                                await this.mint(
                                                                    index
                                                                );
                                                            }}
                                                        >
                                                            Mint {path.name}
                                                        </Button>
                                                    
                                                    </Card.Title>
                                                   
                                                    <img
                                                        alt={path.name}
                                                        className="img-fluid w-100"
                                                        src={path.paths.data}
                                                    ></img>
                                                    
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </>
                                ))}
                            </Row>
                        </Card>
                        <Row>
                            <Col>
                                <GasMachine />
                            </Col>
                        </Row>
                    </Container>
                ) : (
                    <Loading
                        showLoadingBar={true}
                        loadingReason={this.state.loadingReason}
                    />
                )}
                <br />
                <br />
                <br />
            </>
        );
    }
}

SelectiveMint.url = '/mint/select';
SelectiveMint.id = 'SelectiveMint';
SelectiveMint.settings = {

        //navbarEnd: '$.UI.Navbar.Mint',
    
};
export default SelectiveMint;
