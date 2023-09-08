import React, { useState, useRef } from 'react';
import { Modal, Form, Button, Col, Row, Alert } from 'react-bootstrap';
import ipfsController from 'infinitymint-client/dist/src/classic/ipfs/web3Storage';
import StorageController from 'infinitymint-client/dist/src/classic/storageController';

export default function EditImageModal({
    show,
    onHide,
    currentKey,
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
        ipfsController.createInstance(
            StorageController.getGlobalPreference('web3StorageApiKey')
        );
        let cid = await ipfsController.uploadFile(currentKey + '.' + ext, blob);
        setLoaded(true);
        onSetImage(
            currentKey,
            'https://dweb.link/ipfs/' + cid + '/' + currentKey + '.' + ext
        );
    };

    const handleFileChange = (event) => {
        const fileReader = new FileReader();
        fileReader.addEventListener('load', () => {
            uploadToIPFS(
                fileReader.result,
                event.target.files[0].name?.split('.')?.pop()
            ).catch((error) => {
                console.error(error);
            });
        });

        fileReader.readAsArrayBuffer(event.target.files[0]);
    };

    const handleSubmit = (event) => {
        if (web3StorageApiKey?.current?.value?.length === 0) return;

        StorageController.setGlobalPreference(
            'web3StorageApiKey',
            web3StorageApiKey.current?.value
        );
        StorageController.saveData();
        setHasWeb3StorageKey(true);
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Body>
                <Alert variant="success" className="text-center">
                    <p className="fs-2">Want to upload a file?</p>
                </Alert>

                <div className="d-grid">
                    <input type="file" onChange={handleFileChange} />
                </div>
                <input type="submit" onSubmit={handleSubmit} />
            </Modal.Body>
            <Button onClick={handleSubmit}>Submit</Button>
        </Modal>
    );
}
