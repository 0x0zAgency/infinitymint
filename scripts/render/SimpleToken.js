const SimpleToken = {
    //
    interface: {
        type: 'html',
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
     * @param {bool} isTokenURI
     * @param {bool} isHeaderless
     */
    renderToken: (controller, token, stickers, isTokenURI, isHeaderless) => {
        //controller | class (is the site wide instance of https://github.com/0x0zAgency/InfinityMint/blob/master/src/controller.js_
        //token | object (the token from the blockchain)
        //stickers | Array (list of InfinityMint stickers as objects)
        //isTokenURI | bool (true when renddering for tokenURI)
        //isHeaderless | bool (for some react components, asks for headers tags not to be included, for instance no <svg></svg> or no <div></div> no genesis tags)
        return (
            <p style={{ textAlign: 'center', fontFamily: 'sans-serif' }}>
                {token.name}
            </p>
        );
    },

    //controller | class (is the site wide instance of https://github.com/0x0zAgency/InfinityMint/blob/master/src/controller.js_
    //renderedToken | string (the token in HTML form)
    //token | object (the token from the blockchain)
    //stickers | Array (list of InfinityMint stickers as objects)
    /**
     * Called by react after the token has been rendered
     * @param {object} controller
     * @param {string} renderedToken
     * @param {object} token
     * @param {Array} stickers
     */
    postRenderToken: (controller, renderedToken, token, stickers) => {},

    /**
     * Called by react before the token is unmounted
     * @param {object} controller
     * @param {string} renderedToken
     * @param {object} token
     * @param {Array} stickers
     */
    tokenUnmount: (controller, renderedToken, token, stickers) => {},

    //controller | class (is the site wide instance of https://github.com/0x0zAgency/InfinityMint/blob/master/src/controller.js_
    //renderedToken | string (the token in HTML form)
    //token | object (the token from the blockchain)
    //stickers | Array (list of InfinityMint stickers as objects)
    /**
     *
     * @param {object} controller
     * @param {string} renderedToken
     * @param {object} token
     * @param {Array} stickers
     */
    createTokenURI: (controller, renderedToken, token, stickers) => {
        return {
            name: token.name,
            image: renderedToken,
            description: 'InfinityMint Token',
        };
    },
};

//must be an ES6 module
export default SimpleToken;
