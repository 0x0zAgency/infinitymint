import tinySVG from 'tinysvg-js';
import { Button } from 'react-bootstrap';
import Config from './../../config';

//Register the pattern tag
tinySVG.registerTag(
    {
        pattern: (properties) => {
            let obj = {
                tag: 'pattern',
                properties: {
                    style: properties['style'] || '*',
                },
            };

            return tinySVG.insertIfPresent(obj, properties, [
                'id',
                'width',
                'height',
                'patternUnits',
            ]);
        },
    },
    {
        pattern: (properties) => {
            return ['pattern', tinySVG.collapseProperties(properties)];
        },
    }
);

tinySVG.registerTag(
    {
        image: (properties) => {
            let obj = {
                tag: 'img',
                properties: {
                    style: properties['style'] || '*',
                },
            };

            return tinySVG.insertIfPresent(obj, properties, [
                'id',
                'width',
                'height',
                'x',
                'y',
            ]);
        },
    },
    {
        img: (properties) => {
            return ['image', tinySVG.collapseProperties(properties)];
        },
    }
);

const tokenToSVG = (controller, token, stickers = [], options = {}) => {
    if (typeof token !== 'object') throw new Error('token must be an object');

    let pathSettings = controller.getPathSettings(token.pathId);
    let paths = controller.getPaths(token.pathId);

    if (paths === undefined) {
        controller.log('invalid path for path id: ' + token.pathId);
        console.log(controller.paths);
        throw new Error('bad path');
    }

    let map;
    try {
        if (
            paths.substring(0, 4) === '<svg' ||
            paths.substring(0, 5) === '<?xml' ||
            pathSettings?.paths?.extension === 'svg'
        )
            paths = tinySVG.toTinySVG(paths)[0];

        map = Object.values(tinySVG.readTinySVG(paths));
    } catch (error) {
        console.log(
            'BAD PATH GIVEN: Probably not been loaded before trying to be rendered ' +
                token.pathId
        );
        console.log(error);
        throw error;
    }

    let groupCount = 0;
    let stickerCount = 0;
    let renderedColours = 0;

    let colours = [...token.colours].reverse();

    if (map.length === 0) throw new Error('token map is invalid');

    /**
     * Token
     */

    //replace colours & do ids
    map = map.map((value, index) => {
        if (value.properties === undefined) value.properties = {};

        //heading tag
        if (value.tag === 'h') {
            value.properties.id =
                'token_' + (token.tokenId || token.previewId || 1337);

            //add style options from path settings

            /**
            value.properties.style =
                controller.getCSSProperties({
                    //no padding on tokenURI as it can break
                    padding: !options.isTokenURI
                        ? pathSettings.padding || 0
                        : 0,
                    "background-color": controller.getTokenExtraColour(
                        token,
                        "background"
                    ),
                    "font-family": pathSettings.fontFamily || "sans-serif",
                    "box-shadow": `1px 0px 0px ${pathSettings.borderThickness || "4px"
                        } ${controller.getTokenExtraColour(token, "border_1")}`,
                }) + (value.properties.style || "");
            **/
            if (pathSettings.viewbox !== undefined)
                value.properties.viewbox = pathSettings.viewbox;
        }

        let split = (value.properties.style || '').split(';');
        let newStyle = value.properties.style;
        split.forEach((key) =>
            key.indexOf('fill:') !== -1 ? (newStyle += key + ';') : ''
        );
        value.properties.style = newStyle;

        if (
            (value.properties.style || '').trim().indexOf('fill:url(#') ===
                -1 &&
            tinySVG.isColourTag(value.tag) &&
            value.properties.fill === undefined &&
            renderedColours++ < pathSettings.pathSize
        )
            value.properties.fill =
                colours.length > 0
                    ? !isNaN(colours[colours.length - 1])
                        ? tinySVG.toHexFromDecimal(colours.pop())
                        : colours.pop()
                    : 'none';

        if (
            tinySVG.isPathTag(value.tag) &&
            value.properties.stroke === undefined &&
            pathSettings.hideStroke !== true
        )
            value.properties.stroke = '#000';

        if (
            value.tag !== 'g' &&
            value.tag !== 'h' &&
            value.properties.id === undefined
        )
            value.properties.id =
                'token_' +
                (token.tokenId || token.previewId || 1337) +
                '_path_' +
                index;
        else if (value.tag === 'g' && value.properties.id === undefined)
            value.properties.id =
                'token_' +
                (token.tokenId || token.previewId || 1337) +
                '_group_' +
                groupCount++;

        if (
            value.properties.style === undefined ||
            value.properties.style === 'undefined'
        )
            delete value.properties.style;

        return value;
    });

    /**
     * Stickers
     */
    let func = (sticker, index) => {
        sticker = sticker.sticker || sticker;

        return [
            {
                ...tinySVG.createElement('g', {
                    ...(sticker?.properties?.group || {}),
                    onclick: `window.open('${
                        token?.metadata?.brandURL || sticker?.url
                    }')`,
                    stickerIndex: index,
                    class: 'svgHover',
                    id:
                        'token_' +
                        (token.tokenId || token.previewId || 1337) +
                        '_sticker_' +
                        stickerCount++,
                    style: `transform: scale(${
                        sticker?.properties.scale
                    }) translate(${
                        sticker?.properties.x / sticker?.properties.scale
                    }px, ${
                        sticker?.properties.y / sticker?.properties.scale
                    }px); transform-origin: center center;`,
                }),
                startTag: true,
            },
            ...tinySVG.toSVG(
                sticker.paths,
                true,
                [...(sticker.colours || colours)],
                false,
                false,
                true
            )[3],
            {
                ...tinySVG.createElement('g', {
                    ...(sticker?.properties?.group || {}),
                }),
                endTag: true,
            },
        ];
    };

    //bottom stickers below the token
    stickers.map(func).forEach((sticker) => {
        map = tinySVG.insertMap(sticker, map, false);
    });

    /**
     * Text and text positioning
     */
    //map = renderTokenSVGText(map.pathSettings, token);

    /**
         * Finally any css styles / imports

        map.push(
            tinySVG.createElement(
                "style",
                {},
                `
                    ${map[0].properties.id !== undefined ? `#${map[0].properties.id}` : ".token"}{

                    }
                `
            )
        );
            */

    let innerPadding = !options.isTokenURI ? pathSettings.innerPadding || 0 : 0;

    let number = innerPadding.replace(/%/g, '').replace(/px/g, '');
    number = parseFloat(number);

    let isPercentage =
        typeof innerPadding === 'string'
            ? innerPadding.indexOf('%') !== -1
            : false;
    let x = isPercentage ? number / 2 + '%' : number / 2 + 'px';
    let y = x;
    if (pathSettings.translate !== undefined) {
        x = pathSettings.translate.x || x;
        y = pathSettings.translate.y || y;

        if (pathSettings.includeInnerPadding) {
            x = `calc(${x} + ${
                isPercentage ? number / 2 + '%' : number / 2 + 'px'
            })`;
            y = `calc(${y} + ${
                isPercentage ? number / 2 + '%' : number / 2 + 'px'
            })`;
        }
    }

    let element = tinySVG.createElement('g', {
        style: controller.getCSSProperties({
            //no padding on tokenURI as it can break
            transform: `translate(${x}, ${y}) scale(${
                pathSettings?.scale || '1.0'
            })`,
            'font-family': pathSettings.fontFamily || 'sans-serif',
            'box-shadow': `1px 0px 0px ${
                pathSettings.borderThickness || '4px'
            } ${controller.getTokenExtraColour(token, 'border_1')}`,
        }),
    });

    let background = tinySVG.createElement('rect', {
        fill: controller.getTokenExtraColour(token, 'background'),
        style: `transform: translate(${
            isPercentage ? number / 2 + '%' : number / 2 + 'px'
        }, ${isPercentage ? number / 2 + '%' : number / 2 + 'px'})`,
        width: 'calc(100% - ' + innerPadding + ')',
        height: 'calc(100% - ' + innerPadding + ')',
    });
    let border_2 = tinySVG.createElement('rect', {
        fill: controller.getTokenExtraColour(token, 'border_2'),
        width: '100%',
        height: '100%',
    });

    let tempMap = [];
    if (pathSettings?.content?.background !== undefined) {
        let backgroundSettings = {
            patternWidth: 100,
            patternHeight: 100,
            usePattern: true,
            x: 0,
            y: 0,
            ...(pathSettings?.background || {}),
        };

        let tempEl = tinySVG.createElement('defs', {});
        let pattern = tinySVG.createElement('pattern', {
            id: 'background_' + (token.tokenId || token.previewId || 1337),
            width: backgroundSettings.usePattern
                ? backgroundSettings.patternWidth
                : '100%',
            height: backgroundSettings.usePattern
                ? backgroundSettings.patternHeight
                : '100%',
            patternUnits: 'userSpaceOnUse',
        });

        let image = pathSettings.content.background.paths.data;

        if (pathSettings.content.background.paths.ipfs)
            image = pathSettings.content.background.paths.ipfsURL;
        else if (pathSettings.content.background.paths.projectStorage)
            image = 'data:image/png;base64,' + image;

        tempMap.push({ ...tempEl, startTag: true });
        tempMap.push({ ...pattern, startTag: true });
        tempMap.push({
            ...tinySVG.createElement('img', {
                href: image,
                x: backgroundSettings.x,
                y: backgroundSettings.y,
                width: backgroundSettings.usePattern
                    ? backgroundSettings.patternWidth
                    : '250px',
                height: backgroundSettings.usePattern
                    ? backgroundSettings.patternHeight
                    : '100%',
            }),
        });
        tempMap.push({ ...pattern, endTag: true });
        tempMap.push({ ...tempEl, endTag: true });
        tempMap.push({
            ...tinySVG.createElement('rect', {
                width: 'calc(100% - ' + innerPadding + ')',
                height: 'calc(100% - ' + innerPadding + ')',
                style: `transform: translate(${
                    isPercentage ? number / 2 + '%' : number / 2 + 'px'
                }, ${isPercentage ? number / 2 + '%' : number / 2 + 'px'})`,
                fill:
                    'url(#background_' +
                    (token.tokenId || token.previewId || 1337) +
                    ')',
            }),
        });
    }

    map = [
        map[0],
        border_2,
        background,
        ...tempMap,
        { ...element, startTag: true },
        ...map.slice(1, -2),
        { ...element, endTag: true },
        map[map.length - 1],
    ];

    //finally output the svg
    if (options.isHeaderless) map = map.slice(1, -2);

    return tinySVG.toSVG(map, true)[0];
};

/**
 *
 * @param {*} map
 * @param {*} pathSettings
 * @param {*} token
 * @returns
 */
const renderTokenSVGText = (map, pathSettings, token) => {
    let text = [{ ...tinySVG.createElement('t'), startTag: true }];

    //first we check if we are doing paths but only do them if custom is not defined
    if (
        pathSettings.text?.path !== undefined &&
        pathSettings.text?.path !== null &&
        (pathSettings.text?.custom === undefined ||
            pathSettings.text?.custom === null)
    ) {
        let id =
            typeof pathSettings.text?.path !== 'object'
                ? pathSettings.text?.path
                : pathSettings.text?.path.id; //should throw if Id does not exist
        token.names.forEach((name) => {
            let properties = {
                href:
                    '#token_' +
                    (token.tokenId || token.previewId || 1337) +
                    '_path_' +
                    id,
                spacing: 'auto',
                startOffset: pathSettings.text?.path?.offset || 5,
            };

            if (pathSettings.text?.settings?.capitalizeName === true)
                name =
                    name.substring(0, 1).toUpperCase() +
                    name.substring(1, name.length - 1);

            text.push(tinySVG.createElement('tp', properties, name));
        });
    } else if (
        pathSettings.text?.custom !== undefined &&
        pathSettings.text?.custom === null
    ) {
    } else {
        //default to inline
    }

    text.push([{ ...tinySVG.createElement('t'), endTag: true }]);
    //add to the map at the end
    return tinySVG.insertMap(text, map, false);
};

/**
 * this is built into every omega web component framework by default, but this is just an example of how to multiple render token scripts to the same asset controler
 */

const Vector = {
    //
    interface: {
        type: 'svg',
        basicTokenURI: true,
        features: {
            stickers: true,
        },
    },

    /**
     *
     * @param {object} controller
     * @param {string} renderedToken
     * @param {object} token
     * @param {Array} stickers
     * @param {object} settings
     */
    renderToken: (controller, token, stickers, settings = {}) => {
        if (typeof token.token === 'object') token = token.token;
        try {
            return tokenToSVG(controller, token, stickers, {
                isTokenURI: settings.isTokenURI === true,
                isHeaderless: settings.isHeaderless === true,
            });
        } catch (error) {
            controller.log(
                '[❌] Drawing token ' +
                    (token.tokenId || token.previewId || 1337),
                'token'
            );
            controller.log(error);
            return (
                <div
                    style={{
                        width: '100%',
                        height: '472px',
                        background: 'black',
                        color: 'red',
                        padding: '15%',
                        textShadow: '5px 5px 15px red',
                    }}
                >
                    <p style={{ fontSize: 48 }}>Error</p>
                    <p>
                        No need to be sad. Its okay. Just clear your cache/local
                        storage and it will be okay.
                    </p>
                    <Button
                        variant="danger"
                        className="mt-4"
                        onClick={() => {
                            controller.StorageController.values.preload = {};
                            controller.StorageController.values.tokens = {};
                            controller.StorageController.values.tokenURI = {};
                            controller.StorageController.saveData();

                            setTimeout(() => {
                                window.location.reload();
                            }, 2500);
                        }}
                    >
                        Refresh InfinityMint
                    </Button>
                </div>
            );
        }
    },

    /**
     *
     * @param {object} controller
     * @param {object} token
     * @param {Array} stickers
     * @param {object} settings
     */
    updateToken: async (
        controller,
        renderedToken,
        token,
        stickers = [],
        settings
    ) => {
        let id = 'token_' + (token.tokenId || token.previewId || 1337);
        if (document.getElementById(id) !== null) {
            //rerender it
            document.getElementById(id).parentNode.innerHTML = tokenToSVG(
                controller,
                token,
                stickers,
                {
                    isTokenURI: settings.isTokenURI === true,
                    isHeaderless: settings.isHeaderless === true,
                }
            );
        }
    },

    /**
     * Called by react after the token has been rendered
     * @param {object} controller
     * @param {string} renderedToken
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
    ) => {},

    /**
     * Called by react before the token is unmounted
     * @param {object} controller
     * @param {string|object} renderedToken
     * @param {object} token
     * @param {Array} stickers
     */
    tokenUnmount: (
        controller,
        renderedToken,
        token,
        stickers,
        settings = {}
    ) => {},

    /**
     * Called when the window is redized
     * @param {object} controller
     * @returns
     */
    onWindowResize: (controller) => {},

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
        let svg = controller.Base64.encode(renderedToken);
        let obj = {
            name: token.name,
            external_url: `${Config.settings.url}/view/${token.tokenId}`,
            image: 'data:image/svg+xml;base64,' + svg,
            description: `This ${controller.getDescription().token}is #${
                token.tokenId
            } and is a ${
                controller.getPathSettings(token.pathId).name
            }. It is called the '${token.name} and it is currently owned by ${
                token.owner
            }. Find out more at ${Config.settings.url}/view/${token.tokenId}`,
            attributes: [
                {
                    trait_type: 'Type',
                    value: token.pathId,
                },
            ],
        };

        return obj;
    },
};

//must be an ES6 module
export default Vector;
