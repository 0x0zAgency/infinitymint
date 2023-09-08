import { fabric } from 'fabric';
//our config
import Config from '../../config';
//infinity mint logo
import InfinityMintLogo from '../../Resources/watermark.png';
//import three js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
//error model
import Error from '../../Resources/error.glb';

//spawned ids
const SpawnedIds = {};
const SpawnedInstances = {};
const CompleteRenders = {};
const Tokens = {};
const Renderers = {};
const BaseMeshes = {};
const Elements = {};
const SavedModels = {};

/**
 * Loads an image url and returns a fabric image instance
 * @param {string} data
 * @returns {fabric.Image}
 */
const getImage = async (data) => {
    return new Promise((resolve, reject) => {
        fabric.Image.fromURL(
            data,
            (img) => {
                img.selectable = false;
                resolve(img);
            },
            {
                crossOrigin: 'Anonymous',
            }
        );
    });
};

/**
 *
 * @param {HTMLElement} sizeElement
 * @param {*} settings
 * @returns
 */
const getContainerRect = (sizeElement, settings) => {
    let computedStyle = getComputedStyle(sizeElement);
    let canvasWidth =
        settings.width ||
        sizeElement.clientWidth -
            (parseFloat(computedStyle.paddingLeft) +
                parseFloat(computedStyle.paddingRight));

    let canvasHeight;

    if (settings.height) canvasHeight = settings.height;
    if (settings.heightScale)
        canvasHeight =
            canvasWidth * parseFloat(settings.heightScale.toString());

    if (!canvasHeight) canvasHeight = canvasWidth;

    return { canvasHeight, canvasWidth };
};

const setSource = (image, src) => {
    return new Promise((resolve, reject) => {
        image.setSrc(src, (img) => {
            resolve(img);
        });
    });
};

const setElementPadding = (element, pathId, controller, canvas) => {
    let padding = getPadding(controller, canvas, pathId);

    element.set('padding', padding);
    element.scaleToHeight(canvas.height);
    element.scaleToWidth(canvas.width);
    element.set('top', padding);
    element.set('left', padding);
    element.setCoords();
};

const getPadding = (controller, canvas, pathId, value = null) => {
    let pathSettings = controller.getPathSettings(pathId);
    let padding = value || pathSettings?.innerPadding;

    //do percentage math
    if (padding.indexOf('%') !== -1) {
        padding =
            canvas.width * (1.0 + parseFloat(padding.split('%')[0]) / 100) -
            canvas.width;
    } else padding = parseFloat(padding.replace(/[A-Za-z]/g, ''));

    return padding;
};

const registerElement = (id, element, options) => {
    if (Elements[id] === undefined) Elements[id] = [];

    Elements[id].push({ element: element, ...options });
};

const loadGLTFModel = (file, controller) => {
    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => {
        try {
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath(
                'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/libs/draco/'
            );
            loader.setDRACOLoader(dracoLoader);
        } catch (error) {
            console.log(error);
        }

        loader.load(
            file,
            resolve,
            (xhr) => {
                controller.log(
                    (xhr.loaded / xhr.total) * 100 + '% loaded',
                    'token method'
                );
            },
            reject
        );
    });
};

const loadFBXModel = (file, controller) => {
    const loader = new FBXLoader();
    return new Promise((resolve, reject) => {
        loader.load(
            file,
            resolve,
            (xhr) => {
                controller.log(
                    (xhr.loaded / xhr.total) * 100 + '% loaded',
                    'token method'
                );
            },
            reject
        );
    });
};

const loadModel = async (file, controller, extension = 'gltf') => {
    console.log(file);

    switch (extension.toLowerCase()) {
        case 'usdz':
        case 'glb':
        case 'gltf':
            return await loadGLTFModel(file, controller);
        case 'fbx':
            return await loadFBXModel(file, controller);
        default:
            throw new Error('unsupported: ' + extension);
    }
};

const getModel = (pathSettings) => {
    if (pathSettings.content === undefined) return false;

    let paths;
    if (pathSettings.content['3d']) paths = pathSettings.content['3d'].paths;
    else if (pathSettings.content['3d_gltf'])
        paths = pathSettings.content['3d_gltf'].paths;
    else if (pathSettings.content['3d_glb'])
        paths = pathSettings.content['3d_glb'].paths;
    else return false;

    if (paths.ipfs === false || paths.localStorage === true) return paths.data;

    if (paths.ipfs) return paths.ipfsURL;
};

let handler;
const registerThreeJSFramework = async (
    canvas,
    controller,
    token,
    id,
    settings
) => {
    const framework = {
        camera: null,
        renderer: null,
        lights: {},
    };

    const setMesh = (mesh) => {
        if (mesh !== undefined && mesh !== null) {
            if (settings.meshRotation3D !== undefined) {
                mesh.rotation.x = settings.meshRotation3D?.x || 0;
                mesh.rotation.y = settings.meshRotation3D?.y || 0;
                mesh.rotation.z = settings.meshRotation3D?.z || 0;
            }

            if (settings.meshPosition3D !== undefined) {
                mesh.position.x = settings.meshPosition3D?.x || 0;
                mesh.position.y = settings.meshPosition3D?.y || 0;
                mesh.position.z = settings.meshPosition3D?.z || 0;
            }
        }
    };

    registerElement(id, await getImage(''), {
        onRender: (element) => {
            let renderer = Renderers[id];
            if (renderer !== undefined && renderer !== null) {
                renderer.setSize(
                    canvas.width / (settings.downsampleRate3D || 2),
                    canvas.height / (settings.downsampleRate3D || 1)
                );
                renderer.setClearColor(0xffffff, 0);
            }

            let mesh = BaseMeshes[id];
            setMesh(mesh);
            setElementPadding(element, token.pathId, controller, canvas);
        },
        onInitialize: (element) => {
            let camera, scene, renderer;
            let mesh;

            let setLightProperties = (light) => {
                light.castShadow = true;
                light.shadow.camera.near = 0.1;
                light.shadow.camera.far = 1000;
            };

            document.getElementById(id).classList.add('loading-token');

            let width = canvas.width / (settings.downsampleRate3D || 2);
            let height = canvas.height / (settings.downsampleRate3D || 1);
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(
                settings.cameraFOV || 65,
                width / height,
                1,
                4000
            );
            camera.position.z = settings.cameraPositionZ || 0;
            camera.position.x = settings.cameraPositionX || 0;
            camera.position.y = settings.cameraPositionY || 0;

            camera.rotation.z = settings.cameraRotationZ || 0;
            camera.rotation.x = settings.cameraRotationX || 0;
            camera.rotation.y = settings.cameraRotationY || 0;

            //var renderer = new THREE.WebGLRenderer();
            if (Renderers[id] === undefined) {
                renderer = new THREE.WebGLRenderer({
                    preserveDrawingBuffer: true,
                    antialias: true,
                });
                renderer.setSize(width, height);
                renderer.setClearColor(0xffffff, 0);
                renderer.setPixelRatio(window.devicePixelRatio);
                // SHADOW
                renderer.shadowMap.enabled = true;
                renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                Renderers[id] = renderer;
            } else renderer = Renderers[id];

            let colour = controller.getTokenExtraColour(token, 'shadow');
            let colourSecondary = controller.getTokenExtraColour(
                token,
                'stroke'
            );
            let colourThird =
                settings?.floorColour3D ||
                controller.getTokenExtraColour(token, 'background');

            scene = new THREE.Scene();

            let pointlight = new THREE.PointLight(
                settings?.lightColour3D || 0xffffff,
                0.01 * (settings?.lightIntensity3D || 10)
            );
            pointlight.position.set(0, 105, 0);
            setLightProperties(pointlight);

            let pointlightSecondary = new THREE.PointLight(colour, 0.36);
            pointlightSecondary.position.set(20, 55, 0);
            setLightProperties(pointlightSecondary);

            let pointlightThird = new THREE.PointLight(colourSecondary, 0.666);
            pointlightThird.position.set(-20, 55, 15);
            setLightProperties(pointlightThird);

            let pointlightAmbient = new THREE.AmbientLight(
                settings?.ambientLightColour3D || 0xffffff,
                0.01 * (settings?.ambientLightIntensity3D || 10)
            );

            if (settings.showHelpers3D === true) {
                scene.add(new THREE.CameraHelper(pointlight.shadow.camera));
                scene.add(
                    new THREE.CameraHelper(pointlightSecondary.shadow.camera)
                );
                scene.add(
                    new THREE.CameraHelper(pointlightThird.shadow.camera)
                );
            }

            scene.add(pointlight);
            scene.add(pointlightSecondary);
            scene.add(pointlightThird);
            scene.add(pointlightAmbient);

            if (settings.disableFloor3D !== true) {
                let plane = new THREE.Mesh(
                    new THREE.PlaneGeometry(1000, 500, 16, 1),
                    new THREE.MeshPhongMaterial({
                        color: colourThird,
                        depthWrite: false,
                        flatShading: true,
                    })
                );
                plane.position.set(0, -45, 0);
                plane.rotation.x = -Math.PI / 2;
                plane.receiveShadow = true;
                scene.add(plane);
            }

            let model =
                settings.model3D ||
                getModel(controller.getPathSettings(token.tokenId)) ||
                Error;

            let once = (obj) => {
                mesh = obj.scene || obj;
                mesh.position.y = 1;
                mesh.castShadow = true;
                mesh.receiveShadow = true;

                if (model === Error) {
                    mesh.scale.set(10, 10, 10);
                    mesh.position.set(0, -10, 0);
                } else {
                    mesh.scale.set(3.25, 3.25, 3.25);
                    mesh.position.set(0, 5, 0);
                }

                setMesh(mesh);
                scene.add(mesh);
                BaseMeshes[id] = mesh;
                SavedModels[model] = mesh;
                try {
                    document
                        .getElementById(id)
                        .classList.remove('loading-token');
                } catch (error) {
                    console.log(error);
                }
            };

            document.getElementById(id).classList.add('loading-token');
            if (SavedModels[model] !== undefined) {
                controller.log('using saved model: ' + model);
                once(SavedModels[model]);
            } else
                loadModel(model, controller, model.split('.').pop()).then(once);

            let img;
            var render = async () => {
                if (renderer === undefined || renderer === null) {
                    cancelAnimationFrame(handler);
                    return;
                }
                if (settings.static3D !== true)
                    handler = requestAnimationFrame(render);

                if (mesh !== null && mesh !== undefined) {
                    let speed = settings.rotationSpeed3D || 0.002;

                    if (settings.dontRotate3D === true) return;

                    if (settings.bothAxisRotation3D === true) {
                        mesh.rotation.x += speed;
                        mesh.rotation.y += speed;
                    } else if (settings.horizontalRotation3D === true)
                        mesh.rotation.x += speed;
                    else mesh.rotation.y += speed;
                }

                renderer.render(scene, camera);
            };
            cancelAnimationFrame(handler);
            render();
            //to update
            let repeat = () => {
                setTimeout(async () => {
                    //has probably unmounted
                    if (
                        canvas === null ||
                        canvas === undefined ||
                        renderer === null ||
                        renderer === undefined ||
                        renderer.domElement === null ||
                        renderer.domElement === undefined
                    ) {
                        cancelAnimationFrame(handler);
                        return;
                    }

                    try {
                        let lastImage = renderer.domElement.toDataURL(
                            'image/png',
                            settings.Quality3D || 1
                        );
                        if (img === undefined) {
                            img = await getImage(lastImage);
                            canvas.add(img);
                            setElementPadding(
                                img,
                                token.pathId,
                                controller,
                                canvas
                            );
                        } else if (settings.dontSet3DSource !== true)
                            setSource(img, lastImage);

                        img.selectable = settings.selectable3D === true;
                        repeat();
                        canvas.requestRenderAll();
                    } catch (error) {}
                }, settings.interval3D || 33);
            };
            repeat();
        },
    });
};

/**
 *
 * @param {fabric.Canvas} canvas
 * @param {ControllerInterface} controller
 */
const registerElements = async (
    canvas,
    controller,
    token,
    id,
    settings,
    stickers
) => {
    let pathSettings = controller.getPathSettings(token.pathId);

    let image;

    if (settings.forceBackground !== undefined)
        image = await getImage(settings.forceBackground);
    else {
        //TODO: Replace with function that understands new ways
        //get the content path instead
        let path = settings.drawContentKey
            ? pathSettings.content[settings.drawContentKey]?.paths
            : pathSettings.paths;

        if (
            path.ipfs &&
            path.localStorage === false &&
            path.projectStorage === false
        ) {
            image = await getImage(
                pathSettings.ipfsFileName
                    ? 'https:/w3s.link/ipfs/' +
                          path.cid +
                          '/' +
                          pathSettings.ipfsFileName
                    : path.ipfsURL
            );
        } else
            image = await getImage(
                path.projectStorage
                    ? 'data:image/' + path.extension + ',' + path.data
                    : path.data
            );
    }

    if (settings.enableThreeJS) {
        await registerThreeJSFramework(canvas, controller, token, id, settings);
    }

    //Draws the background image
    registerElement(id, image, {
        onRender: (element, canvas) => {
            setElementPadding(element, token.pathId, controller, canvas);

            if (pathSettings.translate !== undefined) {
                element.set(
                    'left',
                    getPadding(controller, canvas, token.pathId) +
                        getPadding(
                            controller,
                            canvas,
                            token.pathId,
                            pathSettings.translate.x || null
                        )
                );
                element.set(
                    'top',
                    getPadding(controller, canvas, token.pathId) +
                        getPadding(
                            controller,
                            canvas,
                            token.pathId,
                            pathSettings.translate.y || null
                        )
                );
                element.setCoords();
            }

            if (
                settings.filter !== undefined ||
                pathSettings.filter !== undefined
            )
                element.filters[settings.filter || pathSettings.filter] = 100;
        },
        onInitialize: (element, canvas) => {
            setElementPadding(element, token.pathId, controller, canvas);
            canvas.setBackgroundImage(element);
        },
    });

    //you need to basically create an object here containing all the paths to pass as an argument to getImage
    let assets = {};
    let project = controller.getProjectSettings();

    if (
        token.assets !== undefined &&
        token.assets.length !== 0 &&
        project.assets
    ) {
        Object.values(token.assets).forEach((thisAssetId) =>
            Object.values(project.assets)
                .filter(
                    (asset) => parseInt(thisAssetId) === parseInt(asset.assetId)
                )
                .map((asset) => (assets[asset.assetId] = asset))
        );

        let assetKeys = Object.keys(assets);
        for (let i = 0; i < assetKeys.length; i++) {
            let asset = assets[assetKeys[i]];

            let assetImage;
            let assetPath = asset.paths;
            if (
                assetPath.ipfs &&
                assetPath.localStorage === false &&
                assetPath.projectStorage === false
            )
                assetImage = await getImage(assetPath.ipfsURL);
            else
                assetImage = await getImage(
                    assetPath.projectStorage
                        ? 'data:image/' +
                              assetPath.extension +
                              ',' +
                              assetPath.data
                        : assetPath.data
                );

            registerElement(id, assetImage, {
                onRender: (element, canvas) => {
                    setElementPadding(
                        element,
                        token.pathId,
                        controller,
                        canvas
                    );

                    if (pathSettings.translate !== undefined) {
                        element.set(
                            'left',
                            getPadding(controller, canvas, token.pathId) +
                                getPadding(
                                    controller,
                                    canvas,
                                    token.pathId,
                                    pathSettings.translate.x || null
                                )
                        );
                        element.set(
                            'top',
                            getPadding(controller, canvas, token.pathId) +
                                getPadding(
                                    controller,
                                    canvas,
                                    token.pathId,
                                    pathSettings.translate.y || null
                                )
                        );
                        element.setCoords();
                    }

                    if (
                        settings.filter !== undefined ||
                        pathSettings.filter !== undefined
                    )
                        element.filters[
                            settings.filter || pathSettings.filter
                        ] = 100;
                },
                onInitialize: (element, canvas) => {
                    setElementPadding(
                        element,
                        token.pathId,
                        controller,
                        canvas
                    );
                    canvas.setBackgroundImage(element);
                },
            });
        }
    }

    let selectedStickers = [];

    //now do stickers
    await Promise.all(
        Object.values(stickers || {}).map(async (sticker) => {
            registerElement(id, await getImage(sticker.paths), {
                onRender: (element, canvas) => {
                    //set the position origin
                    element.originX = 'center';
                    element.originY = 'center';

                    //lots of math based upon canvas width/height to keep everything aligned

                    let y = sticker.transform?.y || sticker.properties.y || 1;
                    let x = sticker.transform?.x || sticker.properties.x || 1;
                    let yPercent = ((y !== 0 ? y : 1) / 100) * canvas.height;
                    let xPercent = ((x !== 0 ? x : 1) / 100) * canvas.width;

                    element.selectable = settings.editableStickers === true;
                    element.top = canvas.height / 2 + yPercent;
                    element.left = canvas.width / 2 + xPercent;
                    element.set(
                        'scaleX',
                        canvas.width /
                            1000 /
                            parseInt(
                                sticker.transform?.scale * 10 ||
                                    sticker.properties.scale * 10 ||
                                    5
                            )
                    );
                    element.set(
                        'scaleY',
                        canvas.height /
                            1000 /
                            parseInt(
                                sticker.transform?.scale * 10 ||
                                    sticker.properties.scale * 10 ||
                                    5
                            )
                    );

                    element.on('mousedown', () => {
                        if (!selectedStickers.includes(element))
                            selectedStickers.push(element);

                        if (settings.onStickerMouseDown)
                            settings.onStickerMouseDown(
                                sticker,
                                element,
                                canvas
                            );
                    });

                    element.on('mouseup', () => {
                        if (settings.onStickerMouseUp)
                            settings.onStickerMouseUp(sticker, element, canvas);
                    });

                    //does stuff
                    element.setCoords();
                },
            });
        })
    );

    //draws the InfinityMint logo
    registerElement(id, await getImage(InfinityMintLogo), {
        onRender: (element) => {
            //set the position origin
            element.originX = 'center';
            element.originY = 'center';

            //lots of math based upon canvas width/height to keep everything aligned
            element.top = canvas.width / 2 + canvas.width * 0.37;
            element.left = canvas.height * 0.13;
            element.set('scaleX', canvas.width / 1000 / 5);
            element.set('scaleY', canvas.height / 1000 / 5);
            //set the opacity of the logo
            element.opacity = 0.25;
            //does stuff
            element.setCoords();
        },
        onInitialize: (element) => {},
    });
};

const queue = [];
const exitQueue = {};
const waitForQueue = (id, timeOut = 120) => {
    return new Promise((resolve, reject) => {
        let timeout = () => {
            setTimeout(() => {
                if (exitQueue[id] !== undefined && exitQueue[id] === true) {
                    resolve(false);
                    return;
                }

                if (queue.length === 0) resolve(true);
                else {
                    if (timeOut-- < 0) reject(false);

                    timeout();
                }
            }, 1000);
        };
        timeout();
    });
};

const MagicMirror = {
    //
    interface: {
        type: 'png',
    },

    /**
     * Called when the window is redized
     * @param {ControllerInterface} controller
     * @returns
     */
    onWindowResize: (controller) => {
        let instances = Object.keys(SpawnedInstances);
        for (let i = 0; i < instances.length; i++) {
            try {
                let id = instances[i];
                let element = document.getElementById(id);
                let canvas = SpawnedInstances[id];
                let settings = controller.getPathSettings(
                    element.getAttribute('pathid')
                );
                let { canvasWidth, canvasHeight } = getContainerRect(
                    element.parentNode || element,
                    settings,
                    true
                );
                //update height
                canvas.setWidth(canvasWidth);
                canvas.setHeight(canvasHeight || canvasWidth);
                canvas.calcOffset();

                let elements = Object.values(Elements[id] || []);
                for (let i = 0; i < elements.length; i++) {
                    let element = elements[i];

                    try {
                        if (element.onRender)
                            element.onRender(elements[i].element, canvas);
                    } catch (error) {
                        console.log(error);
                    }
                }

                //remove styling from canvas-container element
                element.parentNode.style.width = '';
                element.parentNode.style.height = canvas.height;
                //render the canvas
                canvas.renderAll();
            } catch (error) {
                console.log('could not resize', 'warning');
                console.log(error);
            }
        }
    },
    /**
     *
     * @param {ControllerInterface} controller
     * @param {object} token
     * @param {Array} stickers
     * @param {object} settings
     */
    renderToken: (controller, token, stickers, settings = {}) => {
        //to handle more than one token of the same kind rendered at the same time
        let id = settings.id || token.tokenId || token.previewId;
        if (SpawnedIds[id] === undefined) SpawnedIds[id] = [];
        else SpawnedIds[id].push(true);

        id = 'fabric_canvas_' + id + '_' + SpawnedIds[id].length;
        Tokens[id] = token;
        return <canvas id={id} path={token.pathId}></canvas>;
    },

    /**
     * Called by react after the token has been rendered
     * @param {ControllerInterface} controller
     * @param {HTMLElement} renderedToken
     * @param {object} token
     * @param {Array} stickers
     * @param {object} settings
     */
    postRenderToken: async (
        controller,
        renderedToken,
        token,
        stickers,
        settings = {}
    ) => {
        if (!renderedToken.props.id)
            throw new Error('rendered token does not include prop id');

        let element = document.getElementById(renderedToken.props.id);
        if (element === null || element === undefined)
            throw new Error('canvas was deleted before post render was ran');

        //calculate how big the canvas should be and resize to fill, takes the canvas eleemnt
        let { canvasWidth, canvasHeight } = getContainerRect(
            element.parentNode || element,
            { ...settings, ...controller.getPathSettings(token.pathId) }
        );
        element.width = canvasWidth;
        element.height = canvasHeight || canvasWidth;

        let canvas;
        if (SpawnedInstances[renderedToken.props.id] !== undefined)
            canvas = SpawnedInstances[renderedToken.props.id];
        else canvas = new fabric.Canvas(renderedToken.props.id);

        canvas.renderOnAddRemove = false;

        document
            .getElementById(renderedToken.props.id)
            .classList.add('loading-token');

        canvas.setWidth(canvasWidth);
        canvas.setHeight(canvasHeight);
        canvas.calcOffset();

        let loadingImage = await getImage('magicmirrorLogo.jpg');
        loadingImage.scaleToHeight(canvas.height);
        loadingImage.scaleToWidth(canvas.width);
        loadingImage.bringToFront();

        canvas.setBackgroundImage(loadingImage);
        canvas.renderAll();

        //if (queue.length !== 0)
        //await waitForQueue();

        if (exitQueue[renderedToken.props.id]) {
            delete exitQueue[renderedToken.props.id];
            console.log(
                '- ' + renderedToken.props.id + ' abrubtly exited post render'
            );
            return;
        }

        //queue.push(renderedToken.props.id);

        if (canvas instanceof fabric.Canvas !== true) throw new Error('bad');

        //set the height
        canvas.setWidth(canvasWidth);
        canvas.setHeight(canvasHeight);
        canvas.calcOffset();

        if (
            settings.useFresh === true ||
            CompleteRenders[renderedToken.props.id] === undefined
        )
            try {
                if (SpawnedInstances[renderedToken.props.id] === undefined)
                    await registerElements(
                        canvas,
                        controller,
                        token,
                        renderedToken.props.id,
                        settings,
                        stickers
                    );

                let elements = Object.values(
                    Elements[renderedToken.props.id] || []
                );

                for (let i = 0; i < elements.length; i++) {
                    let element = elements[i];

                    if (element.onInitialize)
                        element.onInitialize(elements[i].element, canvas);

                    if (element.onRender)
                        element.onRender(elements[i].element, canvas);

                    canvas.add(element.element);
                }
            } catch (error) {
                controller.log('could not render token');
                controller.log(error);
            }
        else {
            //use pre-rendered
            let currentRender = await getImage(
                CompleteRenders[renderedToken.props.id]
            );
            currentRender.scaleToHeight(canvas.height);
            currentRender.scaleToWidth(canvas.width);
            //now lets set th background image
            canvas.setBackgroundImage(currentRender);
        }

        console.log(canvasHeight);

        //remove styling from canvas-container element
        element.parentNode.style.width = canvasWidth;
        element.parentNode.style.height = canvasHeight || canvasWidth;
        //render the canvas
        canvas.renderAll();
        //queue.pop();

        if (!settings.enableThreeJS)
            document
                .getElementById(renderedToken.props.id)
                .classList.remove('loading-token');

        SpawnedInstances[renderedToken.props.id] = canvas;

        try {
            CompleteRenders[renderedToken.props.id] = canvas.toDataURL(
                'image/png',
                1
            );
        } catch (error) {}
    },

    /**
     *
     * @param {ControllerInterface} controller
     * @param {object} token
     * @param {Array} stickers
     * @param {object} settings
     */
    updateToken: async (
        controller, //instance of src/Controller.js
        renderedToken,
        token,
        stickers = [],
        settings
    ) => {
        if (settings.static) return;

        if (SpawnedInstances[renderedToken.props.id] !== undefined) {
            let canvas = SpawnedInstances[renderedToken.props.id];
            let element = document.getElementById(renderedToken.props.id);

            //calculate how big the canvas should be and resize to fill, takes the canvas eleemnt
            let { canvasWidth, canvasHeight } = getContainerRect(
                element.parentNode || element,
                { ...settings, ...controller.getPathSettings(token.pathId) }
            );
            element.width = canvasWidth;
            element.height = canvasHeight || canvasWidth;

            //remove all old elemets
            canvas.clear();
            //render again
            await MagicMirror.postRenderToken(
                controller,
                renderedToken,
                token,
                stickers,
                { ...settings, useFresh: true }
            );
            //save to complete renders
            try {
                CompleteRenders[renderedToken.props.id] = canvas.toDataURL(
                    'image/png',
                    1
                );
            } catch (error) {}

            Tokens[renderedToken.props.id] = token;
        }
    },

    /**
     * Called by react before the token is unmounted
     * @param {ControllerInterface} controller
     * @param {HTMLElement} renderedToken
     * @param {object} token
     * @param {Array} stickers
     */
    tokenUnmount: (
        controller,
        renderedToken,
        token,
        stickers,
        settings = {}
    ) => {
        try {
            if (SpawnedIds[renderedToken.props.id] !== undefined)
                delete SpawnedIds[renderedToken.props.id][
                    Object.keys(SpawnedIds[renderedToken.props.id]).pop()
                ];

            if (CompleteRenders[renderedToken.props.id] !== undefined)
                delete CompleteRenders[renderedToken.props.id];

            if (Tokens[renderedToken.props.id] !== undefined)
                delete Tokens[renderedToken.props.id];

            if (BaseMeshes[renderedToken.props.id] !== undefined) {
                delete BaseMeshes[renderedToken.props.id];
            }

            if (Renderers[renderedToken.props.id] !== undefined) {
                Renderers[renderedToken.props.id].forceContextLoss();
                Renderers[renderedToken.props.id].context = null;
                Renderers[renderedToken.props.id].domElement = null;
                Renderers[renderedToken.props.id] = null;
                delete Renderers[renderedToken.props.id];
            }

            if (SpawnedInstances[renderedToken.props.id] !== undefined) {
                //clear canvas
                try {
                    SpawnedInstances[renderedToken.props.id].dispose();
                } catch (error) {
                    controller.log(error);
                }
                delete SpawnedInstances[renderedToken.props.id];
            }
            //exitQueue[renderedToken.props.id] = true;
        } catch (error) {
            controller.log(
                'could not clean up after self for token of id ' +
                    renderedToken.props.id
            );
        }
    },

    /**
     *
     * @param {object} controller
     * @param {string|object} renderedToken
     * @param {object} token
     * @param {Array} stickers
     * @param {object} settings
     * @returns
     */
    createTokenURI: async (
        controller,
        renderedToken,
        token,
        stickers,
        settings = {}
    ) => {
        //to handle more than one token of the same kind rendered at the same time
        let id = settings.id || token.tokenId || token.previewId;
        id = 'fabric_canvas_' + id + '_' + SpawnedIds[id].length;

        return {
            name: token.name,
            image: CompleteRenders[id],
            external_url: `${Config.settings.url}/view/${token.tokenId}`,
            description: `This ${controller.getDescription().token} is #${
                token.tokenId
            } and is a ${
                controller.getPathSettings(token.pathId).name
            }. It is called the '${token.name} and it is currently owned by ${
                token.owner
            }.
			Find out more at ${Config.settings.url}/view/${token.tokenId}`,
            attributes: [
                {
                    trait_type: 'Type',
                    value: token.pathId,
                },
            ],
        };
    },
};

//must be an ES6 module
export default MagicMirror;
