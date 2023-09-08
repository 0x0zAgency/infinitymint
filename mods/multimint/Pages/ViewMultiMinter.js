import React, { useEffect, useState } from 'react';
import Controller from 'infinitymint-client/dist/src/classic/controller';
import {
    Container,
    Row,
    Col,
    Alert,
    Body,
    Card,
    Button,
} from 'react-bootstrap';
import Mod_MultiMinter from '../Resources/Mod_MultiMinter.json';
import Loading from '../../../../Components/Loading';

const Config = Controller.getConfig();
function ViewMultiMinter({ match }) {
    const [loading, setLoading] = useState(false);
    const [tokenUri, setTokenURI] = useState({});
    const [valid, setValid] = useState(false);
    const [owner, setOwner] = useState(null);
    const [project, setProject] = useState({});

    useEffect(() => {
        setProject(Controller.getProjectSettings());
    }, []);

    useEffect(() => {
        setLoading(true);
        setValid(false);

        if (!match?.params?.multiMinterContract || !match?.params?.tokenId)
            return;

        Controller.initializeContract(
            match?.params?.multiMinterContract,
            'Mod_MultiMinter',
            true,
            Mod_MultiMinter
        );

        (async () => {
            let result = await Controller.callMethod(
                Controller.accounts[0],
                'Mod_MultiMinter',
                'tokenURI',
                [match?.params?.tokenId]
            );

            let owner = await Controller.callMethod(
                Controller.accounts[0],
                'Mod_MultiMinter',
                'ownerOf',
                [match?.params?.tokenId]
            );

            setOwner(owner);

            if (result.length === 0)
                throw new Error('no token uri set by owner');

            let response = await fetch(result);
            setTokenURI(await response.json());
            setValid(true);
            setLoading(false);
        })().catch((err) => {
            console.error(err);
            setValid(false);
            setLoading(false);
        });
    }, [match]);

    return (
        <>
            {loading ? (
                <Container>
                    <Loading />
                </Container>
            ) : (
                <Container>
                    <Row>
                        <Col>
                            {!valid ? (
                                <Alert className="mt-4">
                                    Sorry! But that minter is invalid. Please
                                    try another address
                                </Alert>
                            ) : (
                                <>
                                    <Card body className="mt-4">
                                        <Row>
                                            <Col className="p-2">
                                                <p className="display-1">
                                                    {tokenUri?.name}{' '}
                                                    <span className="fs-3 badge bg-dark">
                                                        #
                                                        {match?.params
                                                            ?.tokenId || 0}
                                                    </span>
                                                </p>
                                                <p>{tokenUri?.description}</p>
                                                <p>
                                                    <span className="badge bg-success">
                                                        owned by{' '}
                                                        {owner !== null
                                                            ? owner
                                                            : Config.nullAddress}
                                                    </span>
                                                </p>
                                                {owner ===
                                                Controller.accounts[0] ? (
                                                    <Alert variant="success">
                                                        You are the proud owner
                                                        of this token!
                                                    </Alert>
                                                ) : (
                                                    <></>
                                                )}
                                            </Col>
                                            <Col lg={4}>
                                                <img
                                                    src={tokenUri?.image}
                                                    className="img-fluid"
                                                    alt="a pretty"
                                                ></img>
                                            </Col>
                                        </Row>
                                    </Card>
                                    {!match?.params?.multiMinterContract ||
                                    !project?.multiminter?.[
                                        match?.params?.multiMinterContract
                                    ] ? (
                                        <>
                                            <Alert>
                                                The owner of this Web3
                                                deployment has yet to update
                                                their InfinityMint project file
                                                about the existence of this
                                                MultiMinter. Please be patient
                                                as updates reach you!
                                            </Alert>
                                        </>
                                    ) : (
                                        <>
                                            <Card body className="mt-2">
                                                <Row>
                                                    <Col></Col>
                                                    <Col></Col>
                                                </Row>
                                            </Card>
                                        </>
                                    )}
                                </>
                            )}
                        </Col>
                    </Row>
                </Container>
            )}
        </>
    );
}

ViewMultiMinter.id = 'MintMultiMinter';
ViewMultiMinter.url = '/multiminter/:multiMinterContract/:tokenId';
ViewMultiMinter.settings = {
    requireWallet: true,
    requireWeb3: true,
};
export default ViewMultiMinter;
