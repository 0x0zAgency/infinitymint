import React, { Component, useEffect, useRef, useState } from "react";
import { Modal, Form, Button, Col, Row, Alert, Card } from "react-bootstrap";

export default function CreateURIModal({
    show,
    onHide,
    onSave,
    onLoad,
    onSetImage,
    onSetTokenURI,
    savedValues,
}) {
    const keyElement = useRef(null);

    let _initialValues = {
        name: "",
        image: "",
        description: "",
        content: {},
        data: {},
        ...savedValues,
    };
    const [values, setValues] = useState(_initialValues);
    const [images, setImages] = useState(
        _initialValues?.data?.images || ["image"]
    );

    let foundImages = [...images].map((val) => {
        return { key: val, value: values[val] };
    });

    useEffect(() => {
        setValues((v) => {
            return { ...v, ...savedValues };
        });

        let i = savedValues?.data?.images || ["image"];
        let obj = {};

        i.forEach((member) => {
            if (!obj[member]) obj[member] = member;
        });

        setImages(Object.values(obj));
    }, [savedValues]);

    return (
        <Modal size="xl" show={show} onHide={onHide}>
            <Modal.Body>
                <div className="d-grid gap-2">
                    <Alert hidden={values.image?.length !== 0}>
                        <p>
                            Your token is going to need an image in order to
                            look fancy and stuff.
                        </p>
                        <Button
                            varaint="success"
                            onClick={() => {
                                onSetImage("image", values);
                            }}
                        >
                            Set Token URI Image
                        </Button>
                    </Alert>
                    {values?.data?.key ? (
                        <p className="display-2 neonText">
                            {values?.data?.key}
                        </p>
                    ) : (
                        <></>
                    )}

                    <Button
                        variant="secondary"
                        onClick={() => {
                            onLoad();
                        }}
                    >
                        Load
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            let _values = { ...values };
                            _values.data.images = images;
                            onSave(_values);
                        }}
                    >
                        Save
                    </Button>
                    <Form.Group className="mb-2" controlId="minterName">
                        <Form.Label className="fs-5">Element Key</Form.Label>
                        <Form.Control ref={keyElement} />
                    </Form.Group>
                    <Button
                        variant="success"
                        onClick={() => {
                            if (
                                keyElement.current === null ||
                                !keyElement.current?.value ||
                                keyElement.current?.value?.length === 0 ||
                                images.filter(
                                    (thatImage) =>
                                        thatImage === keyElement.current?.value
                                ).length !== 0
                            )
                                return;

                            setValues({
                                ...values,
                                [keyElement.current?.value]: "",
                            });
                        }}
                    >
                        Add Element
                    </Button>
                    <Button
                        variant="success"
                        onClick={() => {
                            if (
                                keyElement.current === null ||
                                !keyElement.current?.value ||
                                keyElement.current?.value?.length === 0 ||
                                images.filter(
                                    (thatImage) =>
                                        thatImage === keyElement.current?.value
                                ).length !== 0
                            )
                                return;

                            setImages([...images, keyElement.current?.value]);
                            setValues({
                                ...values,
                                [keyElement.current?.value]: "",
                                data: {
                                    ...values.data,
                                    images: [
                                        ...images,
                                        keyElement.current?.value,
                                    ],
                                },
                            });
                        }}
                    >
                        Add Image
                    </Button>
                </div>
                <Row className="row-cols-3 mt-2">
                    {foundImages.map((image) => {
                        return (
                            <Col>
                                <Card body>
                                    <p>{image?.key}</p>
                                    <img
                                        className="img-fluid"
                                        alt="a thing"
                                        src={
                                            image?.value?.length === 0
                                                ? "https://www.nicepng.com/png/detail/133-1334707_lost-icon-png-missing-icon-png.png"
                                                : image.value
                                        }
                                    ></img>
                                    <div className="mt-2">
                                        <Button
                                            variant="dark"
                                            onClick={() => {
                                                onSetImage(image?.key, values);
                                            }}
                                        >
                                            Set
                                        </Button>
                                        <Button
                                            className="ms-2"
                                            variant="danger"
                                            onClick={() => {
                                                let _values = { ...values };
                                                delete _values[image?.key];
                                                setValues(_values);
                                                setImages(
                                                    images.filter(
                                                        (i) => i !== image?.key
                                                    )
                                                );
                                            }}
                                            hidden={image?.key === "image"}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
                <Form className="mt-2">
                    {Object.keys(values)
                        .filter(
                            (key) =>
                                typeof values[key] === "string" ||
                                typeof values[key] === "number"
                        )
                        .map((key) => {
                            if (
                                images.filter((thatImage) => thatImage === key)
                                    .length !== 0
                            )
                                return <></>;

                            return (
                                <Form.Group
                                    className="mb-1"
                                    controlId="minterName"
                                >
                                    <Form.Label className="fs-5">
                                        {key}
                                    </Form.Label>
                                    <Form.Control
                                        type={
                                            typeof values[key] === "string"
                                                ? "text"
                                                : "number"
                                        }
                                        size="sm"
                                        onChange={(e) => {
                                            setValues({
                                                ...values,
                                                [key]: e.target.value,
                                            });
                                        }}
                                        value={values[key]}
                                        required
                                    />
                                </Form.Group>
                            );
                        })}
                    <Button
                        variant="success"
                        className="mt-2"
                        disabled={values.image?.length === 0}
                        onClick={() => {
                            onSetTokenURI(values);
                        }}
                    >
                        Create New Token URI
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
}
