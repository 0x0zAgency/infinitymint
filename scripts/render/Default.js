import tinySVG from 'tinysvg-js';
import Config from '../../config';

const Image = {
    //
    interface: {
        type: 'image',
        features: {
            stickers: false,
        },
    },

    /**
     * Called when the window is redized
     * @param {object} controller
     * @returns
     */
    onWindowResize: (controller) => {},

    /**
     *
     * @param {object} controller
     * @param {string} renderedToken
     * @param {object} token
     * @param {Array} stickers
     * @param {object} settings
     */
    renderToken: (controller, token, stickers, settings = {}) => {
        let path = controller.getPath(token.pathId);
        let paths = controller.getPaths(token.pathId);

        let data = paths;
        if (path.paths?.extension === 'tinysvg') data = tinySVG.toSVG(data);

        if (
            path.paths?.extension === 'svg' ||
            path.paths?.extension === 'tinysvg'
        )
            data =
                'data:image/svg+xml;base64,' + controller.Base64.encode(data);

        return (
            <img
                src={data}
                id={'token_' + token.tokenId}
                className={(settings.className || 'img-fluid') + ' content'}
            />
        );
    },

    /**
     *
     * @param {object} controller
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
        let path = controller.getPath(token.pathId);
        let paths = controller.getPaths(token.pathId);

        let data = paths;
        if (path.paths?.extension === 'tinysvg') data = tinySVG.toSVG(data);

        if (
            path.paths.extension === 'svg' ||
            path.paths.extension === 'tinysvg'
        )
            data = controller.Base64.encode(data);

        let id = settings.id || 'token_' + (token.previewId || token.tokenId);
        if (document.getElementById(id) !== null) {
            document.getElementById(id).setAttribute('src', data);
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
        let path = controller.getPath(token.pathId);
        let paths = controller.getPaths(token.pathId);

        let data = paths;
        if (path.paths?.extension === 'tinysvg') data = tinySVG.toSVG(data);

        if (
            path.paths?.extension === 'svg' ||
            path.paths?.extension === 'tinysvg'
        )
            data =
                'data:image/svg+xml;base64,' + controller.Base64.encode(data);

        return {
            name: token.name,
            image: data,
            external_url: `${Config.settings.url}/view/${token.tokenId}`,
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
    },
};

//must be an ES6 module
export default Image;
