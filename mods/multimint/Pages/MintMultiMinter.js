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

function ViewMultiMinter({ match }) {
    const [loading, setLoading] = useState(false);
    const [tokenUri, setTokenURI] = useState({});
    const [valid, setValid] = useState(false);

    useEffect(() => {
        setLoading(true);
        setValid(false);
        if (
            !match?.params?.multiMinterContract ||
            !match?.params?.multiMinterContract.tokenId
        )
            return;

        Controller.initializeContract(
            match?.params?.multiMinterContract,
            'Mod_MultiMinter',
            true,
            Mod_MultiMinter
        );

        (async () => {})().catch((err) => {
            console.error(err);
            setValid(false);
            setLoading(false);
        });
    }, [match]);

    return (
        <>
            <Container>
                <Row>
                    <Col>
                        {!valid ? (
                            <Alert className="mt-4">
                                Sorry! But that minter is invalid. Please try
                                another address
                            </Alert>
                        ) : (
                            <>
                                <Card body></Card>
                            </>
                        )}
                    </Col>
                </Row>
            </Container>
        </>
    );
}

ViewMultiMinter.id = 'MintMultiMinter';
ViewMultiMinter.url = '/multiminter/:multiMinterContract/';
ViewMultiMinter.settings = {};
export default ViewMultiMinter;
