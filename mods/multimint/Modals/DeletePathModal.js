import React, { useState, useRef } from 'react';
import { Modal, Form, Button, Col, Row, Alert } from 'react-bootstrap';

export default function DeletePathModal({
    show,
    onHide,
    currentKey,
    onSetImage,
    savedValues,
}) {
    return <Modal show={show} onHide={onHide}></Modal>;
}
