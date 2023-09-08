/**
 * NOTE: Needs to be fetched from the react repo!
 */

const Helpers = {
    getContract: async (contractName, account = undefined) => {
        const { deployments, ethers } = require('hardhat');
        const controller = require('./Controller');
        const { get } = deployments;

        account = account || (await ethers.getSigners())[0];
        return new ethers.Contract(
            (await get(contractName)).address,
            controller.readInformation(
                './deployments/' +
                    controller.defaultNetwork +
                    '/' +
                    contractName +
                    '.json',
                true
            ).abi,
            account
        );
    },
    pickKeys: (params, set, returnObject = true, throwOnMiscount = false) => {
        if (params.length === 0 || params instanceof Array === false)
            throw new Error(
                'params must be valid array ore more than one of length'
            );

        let results = {};
        for (let [i, object] of Object.entries(set)) {
            params.forEach((key) => {
                if (results[key] === undefined) results[key] = [];
                if (object[key] !== undefined) results[key].push(object[key]);
            });
        }

        if (throwOnMiscount) {
            let first = results[params[0]].length;
            if (
                results.filter((object) => {
                    params.forEach((key) => {
                        if (object[key].length !== first)
                            throw new Error('miscount detected');
                    });
                })
            )
                throw new Error('miscount detected');
        }

        if (returnObject) return results;
        else return [...Object.values(results)];
    },

    getFullyQualifiedName: (contract, prefix = '') => {
        return 'contracts/' + prefix + contract + '.sol:' + contract;
    },

    /**
     *
     * @param {object} projectFile
     * @param {object} link
     */
    addLink(projectFile, link) {
        if (link.key === undefined)
            throw new Error('key must be a parameter in link');

        if (!projectFile.links) projectFile.links = {};

        if (
            projectFile.links instanceof Array &&
            projectFile.links.filter((thatLink) => thatLink.key === link.key)
                .length === 0
        )
            projectFile.links.push(link);
        else if (projectFile.links[link.key] === undefined)
            projectFile.links[link.key] = link;
    },

    getAbi: (file) => {
        let result = Controller.readInformation(
            './deployments/' +
                Controller.defaultNetwork +
                '/' +
                file.split('.')[0] +
                '.json'
        );
        return result.abi;
    },

    splitSet: (object, params = [], count = 5, throwOnMislength = false) => {
        if (params instanceof Array === false)
            throw new Error('params must be valid array');

        if (params.length === 0) params = Object.keys(object);

        params.forEach((key) => {
            if (object[key] === undefined)
                throw new Error(key + ' is undefined in object');

            if (object[key] instanceof Array === false)
                object[key] = Object.values(object[key]);
        });

        //will upload assets in lots of 10
        let left = [...object[params[0]]].reverse();
        let results = [];
        let index = 0;
        while (left.length !== 0) {
            let selection = {};

            for (let i = 0; i < count; i++) {
                if (left.length === 0) break;
                left.pop();

                params.forEach((key) => {
                    if (selection[key] === undefined) selection[key] = [];
                    selection[key].push(
                        object[key][index] || Object.values(object[key])[index]
                    );
                });

                index++;
            }

            results.push(selection);
        }

        if (throwOnMislength) {
            results.forEach((selection) => {
                let totalLength = Object.values(selection).length;
                let first = Object.values(selection)[0].length;
                if (
                    Object.values(selection).filter(
                        (object) => object.length === first
                    ).length !== totalLength
                )
                    throw new Error('miscount detected');
            });
        }

        return results;
    },

    tryDecodeURI: (value) => {
        try {
            return decodeURI(value);
        } catch (error) {
            return ''; //return no value
        }
    },
    /**
     * Slower than {...obj1, ...obj2}
     * @param {object} obj1
     * @param {object} obj2
     * @returns
     */
    combineObject(obj1, obj2) {
        let res = {
            ...obj1,
        };

        for (let [index, val] of Object.entries(obj2)) {
            res[index] = val;
        }

        return res;
    },
    toRealFormType: (type) => {
        switch (type) {
            case 'address':
            case 'string':
            case 'twitter':
                return 'text';
            default:
                return type;
        }
    },
    /**
     * All values inside of the array must be numerical
     * @param {object|Array} object
     * @returns
     */
    getHighestKey: (object) => {
        if (object instanceof Array) object = { ...object };

        let lastNumber = 0;
        let highestKey;
        Object.keys(object)
            .reverse()
            .forEach((value) => {
                if (isNaN(object[value]))
                    throw new Error(value + ' must be numerical');
                if (lastNumber < object[value]) {
                    lastNumber = object[value];
                    highestKey = value;
                }
            });

        return highestKey;
    },
    /**
     * All values inside of the array must be numerical
     * @param {object|Array} object
     * @returns
     */
    getLowestKey: (object) => {
        if (object instanceof Array) object = { ...object };

        let lastNumber = 0;
        let lowestKey;
        Object.keys(object).forEach((value) => {
            if (isNaN(object[value]))
                throw new Error(value + ' must be numerical');

            if (lastNumber > object[value]) {
                lowestKey = value;
            }

            lastNumber = object[value];
        });

        return lowestKey;
    },
    replaceColours: (colours) => {
        let colourGroups = [0, 0, 0, 0, 0, 0].map((value) =>
            Math.floor(Math.random() * 0xffffff)
        );

        return colours.map((value) => {
            if (value > 0xffffff)
                switch (value) {
                    case 'random_1':
                    case 0xffffff + 1: //random_1
                        return colourGroups[0];
                    case 'random_2':
                    case 0xffffff + 2: //random_2
                        return colourGroups[1];
                    case 'random_3':
                    case 0xffffff + 3: //random_3
                        return colourGroups[2];
                    case 'random_4':
                    case 0xffffff + 4: //random_4
                        return colourGroups[4];
                    case 'random_5':
                    case 0xffffff + 5: //random_5
                        return colourGroups[5];
                    case 'random_6':
                    case 0xffffff + 6: //random_6
                        return colourGroups[6];
                    case 'none':
                    case 0xffffff + 7: //none
                        return 0xffffff + 7;
                    default:
                        return 0xffffff;
                }
            else return value;
        });
    },

    fixColours: (array) => {
        return array.map((value) => {
            switch (value) {
                case 'random_1':
                case 0xffffff + 1:
                    return 0xffffff + 1;
                case 'random_2':
                case 0xffffff + 2:
                    return 0xffffff + 2;
                case 'random_3':
                case 0xffffff + 3:
                    return 0xffffff + 3;
                case 'random_4':
                case 0xffffff + 4:
                    return 0xffffff + 4;
                case 'random_5':
                case 0xffffff + 5:
                    return 0xffffff + 5;
                case 'random_6':
                case 0xffffff + 6:
                    return 0xffffff + 6;
                case 'none':
                case 0xffffff + 7:
                    return 0xffffff + 7;
                default:
                    if (typeof value === 'string') return 0;
                    else return value;
            }
        });
    },

    /**
     * Object must only contain numbers. Returns the most commonly appearing number (the number that appears the most)
     * @param {object|Array} object
     * @returns
     */
    getMostCommonNumber: (object) => {
        if (object instanceof Array) object = { ...object };

        //count occurances of paths and get the most common path
        let lastNumber = 0;
        let occurances = {};
        let mostCommon = 0;
        Object.values(object).forEach((value) => {
            if (occurances[value] === undefined) occurances[value] = 1;
            else occurances[value] += 1;
        });

        Object.keys(occurances)
            .reverse()
            .forEach((value) => {
                if (lastNumber < occurances[value]) {
                    lastNumber = occurances[value];
                    mostCommon = value;
                }
            });
        return mostCommon;
    },
    /**
     *
     * @param {number} seconds
     * @returns
     */
    delay: (seconds) => {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, seconds * 1000);
        });
    },
    /**
     *
     * @param {string} inputString
     * @returns
     */
    md5: (inputString) => {
        var hc = '0123456789abcdef';
        function rh(n) {
            var j,
                s = '';
            for (j = 0; j <= 3; j++)
                s +=
                    hc.charAt((n >> (j * 8 + 4)) & 0x0f) +
                    hc.charAt((n >> (j * 8)) & 0x0f);
            return s;
        }
        function ad(x, y) {
            var l = (x & 0xffff) + (y & 0xffff);
            var m = (x >> 16) + (y >> 16) + (l >> 16);
            return (m << 16) | (l & 0xffff);
        }
        function rl(n, c) {
            return (n << c) | (n >>> (32 - c));
        }
        function cm(q, a, b, x, s, t) {
            return ad(rl(ad(ad(a, q), ad(x, t)), s), b);
        }
        function ff(a, b, c, d, x, s, t) {
            return cm((b & c) | (~b & d), a, b, x, s, t);
        }
        function gg(a, b, c, d, x, s, t) {
            return cm((b & d) | (c & ~d), a, b, x, s, t);
        }
        function hh(a, b, c, d, x, s, t) {
            return cm(b ^ c ^ d, a, b, x, s, t);
        }
        function ii(a, b, c, d, x, s, t) {
            return cm(c ^ (b | ~d), a, b, x, s, t);
        }
        function sb(x) {
            var i;
            var nblk = ((x.length + 8) >> 6) + 1;
            var blks = new Array(nblk * 16);
            for (i = 0; i < nblk * 16; i++) blks[i] = 0;
            for (i = 0; i < x.length; i++)
                blks[i >> 2] |= x.charCodeAt(i) << ((i % 4) * 8);
            blks[i >> 2] |= 0x80 << ((i % 4) * 8);
            blks[nblk * 16 - 2] = x.length * 8;
            return blks;
        }
        var i,
            x = sb(inputString),
            a = 1732584193,
            b = -271733879,
            c = -1732584194,
            d = 271733878,
            olda,
            oldb,
            oldc,
            oldd;
        for (i = 0; i < x.length; i += 16) {
            olda = a;
            oldb = b;
            oldc = c;
            oldd = d;
            a = ff(a, b, c, d, x[i + 0], 7, -680876936);
            d = ff(d, a, b, c, x[i + 1], 12, -389564586);
            c = ff(c, d, a, b, x[i + 2], 17, 606105819);
            b = ff(b, c, d, a, x[i + 3], 22, -1044525330);
            a = ff(a, b, c, d, x[i + 4], 7, -176418897);
            d = ff(d, a, b, c, x[i + 5], 12, 1200080426);
            c = ff(c, d, a, b, x[i + 6], 17, -1473231341);
            b = ff(b, c, d, a, x[i + 7], 22, -45705983);
            a = ff(a, b, c, d, x[i + 8], 7, 1770035416);
            d = ff(d, a, b, c, x[i + 9], 12, -1958414417);
            c = ff(c, d, a, b, x[i + 10], 17, -42063);
            b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
            a = ff(a, b, c, d, x[i + 12], 7, 1804603682);
            d = ff(d, a, b, c, x[i + 13], 12, -40341101);
            c = ff(c, d, a, b, x[i + 14], 17, -1502002290);
            b = ff(b, c, d, a, x[i + 15], 22, 1236535329);
            a = gg(a, b, c, d, x[i + 1], 5, -165796510);
            d = gg(d, a, b, c, x[i + 6], 9, -1069501632);
            c = gg(c, d, a, b, x[i + 11], 14, 643717713);
            b = gg(b, c, d, a, x[i + 0], 20, -373897302);
            a = gg(a, b, c, d, x[i + 5], 5, -701558691);
            d = gg(d, a, b, c, x[i + 10], 9, 38016083);
            c = gg(c, d, a, b, x[i + 15], 14, -660478335);
            b = gg(b, c, d, a, x[i + 4], 20, -405537848);
            a = gg(a, b, c, d, x[i + 9], 5, 568446438);
            d = gg(d, a, b, c, x[i + 14], 9, -1019803690);
            c = gg(c, d, a, b, x[i + 3], 14, -187363961);
            b = gg(b, c, d, a, x[i + 8], 20, 1163531501);
            a = gg(a, b, c, d, x[i + 13], 5, -1444681467);
            d = gg(d, a, b, c, x[i + 2], 9, -51403784);
            c = gg(c, d, a, b, x[i + 7], 14, 1735328473);
            b = gg(b, c, d, a, x[i + 12], 20, -1926607734);
            a = hh(a, b, c, d, x[i + 5], 4, -378558);
            d = hh(d, a, b, c, x[i + 8], 11, -2022574463);
            c = hh(c, d, a, b, x[i + 11], 16, 1839030562);
            b = hh(b, c, d, a, x[i + 14], 23, -35309556);
            a = hh(a, b, c, d, x[i + 1], 4, -1530992060);
            d = hh(d, a, b, c, x[i + 4], 11, 1272893353);
            c = hh(c, d, a, b, x[i + 7], 16, -155497632);
            b = hh(b, c, d, a, x[i + 10], 23, -1094730640);
            a = hh(a, b, c, d, x[i + 13], 4, 681279174);
            d = hh(d, a, b, c, x[i + 0], 11, -358537222);
            c = hh(c, d, a, b, x[i + 3], 16, -722521979);
            b = hh(b, c, d, a, x[i + 6], 23, 76029189);
            a = hh(a, b, c, d, x[i + 9], 4, -640364487);
            d = hh(d, a, b, c, x[i + 12], 11, -421815835);
            c = hh(c, d, a, b, x[i + 15], 16, 530742520);
            b = hh(b, c, d, a, x[i + 2], 23, -995338651);
            a = ii(a, b, c, d, x[i + 0], 6, -198630844);
            d = ii(d, a, b, c, x[i + 7], 10, 1126891415);
            c = ii(c, d, a, b, x[i + 14], 15, -1416354905);
            b = ii(b, c, d, a, x[i + 5], 21, -57434055);
            a = ii(a, b, c, d, x[i + 12], 6, 1700485571);
            d = ii(d, a, b, c, x[i + 3], 10, -1894986606);
            c = ii(c, d, a, b, x[i + 10], 15, -1051523);
            b = ii(b, c, d, a, x[i + 1], 21, -2054922799);
            a = ii(a, b, c, d, x[i + 8], 6, 1873313359);
            d = ii(d, a, b, c, x[i + 15], 10, -30611744);
            c = ii(c, d, a, b, x[i + 6], 15, -1560198380);
            b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
            a = ii(a, b, c, d, x[i + 4], 6, -145523070);
            d = ii(d, a, b, c, x[i + 11], 10, -1120210379);
            c = ii(c, d, a, b, x[i + 2], 15, 718787259);
            b = ii(b, c, d, a, x[i + 9], 21, -343485551);
            a = ad(a, olda);
            b = ad(b, oldb);
            c = ad(c, oldc);
            d = ad(d, oldd);
        }
        return rh(a) + rh(b) + rh(c) + rh(d);
    },
    /**
     * Object must only contain numbers. Returns the most commonly appearing number (the number that appears the most)
     * @param {object|Array} object
     * @returns
     */
    getLeastCommonNumber: (object) => {
        if (object instanceof Array) object = { ...object };

        //count occurances of paths and get the most common path
        let lastNumber = 0;
        let occurances = {};
        let leastCommon = 0;
        Object.values(object).forEach((value) => {
            if (occurances[value] === undefined) occurances[value] = 1;
            else occurances[value] += 1;
        });

        Object.keys(occurances).forEach((value) => {
            if (lastNumber > occurances[value]) {
                leastCommon = value;
            }

            lastNumber = occurances[value];
        });

        return leastCommon;
    },
    uncompressColours: (colours) => {
        let extraColours = colours.pop();
        let seedNumber = colours.pop();
        let unpackedColours = [];
        //is a colour
        let lastColour;

        //get colour
        let getColour = (baseColour, i) => {
            let colour = parseInt(baseColour);
            let r = colour >> 16;
            let g = colour >> 8;
            let b = colour >> 24;
            let seedNumberR = seedNumber >> 8;
            let seedNumberG = seedNumber >> 16;
            let seedNumberB = seedNumber >> 24;
            let seedNumberN = (seedNumber >> 32) ^ i;

            let combination = parseInt(
                (r * seedNumberR + g * seedNumberG + b * seedNumberB) *
                    seedNumberN
            );
            return combination % 0xffffff;
        };

        colours.forEach((value, index) => {
            if (index === 0 || index % 2 === 0) {
                lastColour = value;
                return;
            }

            if (index % 2 === 1 && lastColour !== undefined) {
                for (let i = 0; i < parseInt(value); i++) {
                    unpackedColours.push(getColour(lastColour, i));
                }
            }
        });

        for (let i = 0; i < extraColours; i++) {
            unpackedColours.push(getColour(lastColour, i));
        }

        return unpackedColours;
    },
};
module.exports = { ...Helpers };
