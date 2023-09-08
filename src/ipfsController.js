const { Web3Storage, File } = require('web3.storage');

const ipfsController = new (class {
    #instance;

    createInstance(apikey) {
        this.#instance = new Web3Storage({ token: apikey });
    }

    async uploadFile(filename, data, type = 'image/png') {
        if (this.#instance === undefined || this.#instance === null)
            throw new Error('create instance needs to be ran first');

        let file;

        if (type !== null)
            file = new File([data], filename, {
                type: type,
            });
        else file = new File([data], filename);

        return await this.#instance.put([file]);
    }

    getContentType(type) {
        type = type.toLowerCase();
        switch (type) {
            case 'png':
                return 'image/png';
            case 'vector':
            case 'svg':
                return 'image/svg+xml';
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            default:
                return 'text/plain';
        }
    }

    getContentExtension(type) {
        type = type.toLowerCase();
        switch (type) {
            case 'image/png':
            case 'png':
            case 'image':
                return 'png';
            case 'image/jpeg':
            case 'jpeg':
                return 'jpg';
            case 'vector':
            case 'image/svg+xml':
            case 'svg':
                return 'svg';
            case 'tinysvg':
            case 'image/tinysvg':
                return 'tinysvg';
            default:
                return 'bin';
        }
    }

    destroyInstance() {
        this.#instance = null;
    }
})();

module.exports = ipfsController;
