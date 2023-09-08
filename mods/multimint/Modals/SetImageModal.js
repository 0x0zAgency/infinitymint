import React, { Component, useEffect, useRef, useState } from 'react';
import { Modal, Form, Button, Col, Row, Alert, Card } from 'react-bootstrap';
import StorageController from 'infinitymint-client/dist/src/classic/storageController';
import ipfsController from 'infinitymint-client/dist/src/classic/ipfs/web3Storage';

export default function SetImageModal({
    show,
    onHide,
    fileName,
    onSetImage,
    savedValues,
}) {
    const web3StorageApiKey = useRef(null);
    const [loaded, setLoaded] = useState(true);
    const [hasWeb3StorageKey, setHasWeb3StorageKey] = useState(
        StorageController.getGlobalPreference('web3StorageApiKey') !==
            undefined &&
            StorageController.getGlobalPreference('web3StorageApiKey') !== null
    );

    const uploadToIPFS = async (blob, ext) => {
        let _fileName = fileName === null ? 'media' : fileName;
        ipfsController.createInstance(
            StorageController.getGlobalPreference('web3StorageApiKey')
        );
        let cid = await ipfsController.uploadFile(_fileName + '.' + ext, blob);
        let url = 'https://' + cid + '.ipfs.w3s.link/' + _fileName + '.' + ext;
        setLoaded(true);
        onSetImage(_fileName, url, {
            cid: cid,
            ext: ext,
            size: new Blob([blob]).size,
            fileName: _fileName + '.' + ext,
            url: url,
        });
    };

    return (
        <Modal size="xl" show={show} onHide={onHide}>
            <Modal.Body>
                {!loaded ? (
                    <></>
                ) : (
                    <>
                        <Row>{/** do error box */}</Row>
                        <Row className="justify-content-center mb-2">
                            <Col lg={8}>
                                {hasWeb3StorageKey ? (
                                    <Form.Group
                                        className="mt-2 text-center"
                                        controlId="formSVGFile"
                                    >
                                        <Form.Label className="fs-3">
                                            📁 Upload an Image/Vector/Movie/Song
                                        </Form.Label>
                                        <Form.Control
                                            size="lg"
                                            type="file"
                                            className="m-2"
                                            onChange={(e) => {
                                                setLoaded(false);

                                                const fileReader =
                                                    new FileReader();
                                                fileReader.addEventListener(
                                                    'load',
                                                    () => {
                                                        uploadToIPFS(
                                                            fileReader.result,
                                                            e.target.files[0].name
                                                                ?.split('.')
                                                                ?.pop() || 'bin'
                                                        ).catch((error) => {
                                                            console.error(
                                                                error
                                                            );
                                                        });
                                                    }
                                                );

                                                fileReader.readAsArrayBuffer(
                                                    e.target.files[0]
                                                );
                                            }}
                                        />
                                    </Form.Group>
                                ) : (
                                    <div className="d-grid gy-2 gap-2">
                                        <p className="display-5 zombieTextRed  text-white">
                                            🛸 IPFS - InterPlanetary File System
                                        </p>
                                        <Row>
                                            <Col>
                                                <div className="d-grid gap-2 mx-2 mb-2">
                                                    <Button
                                                        size="lg"
                                                        variant="success"
                                                        onClick={() => {
                                                            window.open(
                                                                'https://web3.storage'
                                                            );
                                                        }}
                                                    >
                                                        Get 'Web3.storage' API
                                                        Key{' '}
                                                        <span className="badge bg-dark">
                                                            External Site
                                                        </span>
                                                    </Button>

                                                    <Form.Control
                                                        type="text"
                                                        size="md"
                                                        placeholder="web3.storage API Key"
                                                        ref={web3StorageApiKey}
                                                    />
                                                    <Button
                                                        variant="success"
                                                        onClick={() => {
                                                            if (
                                                                web3StorageApiKey
                                                                    ?.current
                                                                    ?.value
                                                                    ?.length ===
                                                                0
                                                            )
                                                                return;

                                                            StorageController.setGlobalPreference(
                                                                'web3StorageApiKey',
                                                                web3StorageApiKey
                                                                    .current
                                                                    ?.value
                                                            );
                                                            StorageController.saveData();
                                                            setHasWeb3StorageKey(
                                                                true
                                                            );
                                                        }}
                                                    >
                                                        Save
                                                    </Button>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>
                                )}
                            </Col>
                        </Row>
                    </>
                )}
            </Modal.Body>
        </Modal>
    );
}
