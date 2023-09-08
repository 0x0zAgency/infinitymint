const $ = require('jquery');
const createjs = require('createjs');

/**
 * 0xTinman.eth 2022
 * @type {{getDefaultOptions: (function(): _options), testMovement: (function(*=, *=): (undefined)), debugPrint: Audiocover.debugPrint, loadFromApi: Audiocover.loadFromApi, moveCursor: (function(*=, *=, *=): (undefined)), highlight: (function(*): (undefined)), load: Audiocover.load, setOptions: Audiocover.setOptions, share: Audiocover.share, getOptions: (function(): (undefined|{website: string, metadata: {}, apikey: string, audiocoverId: string, slowness: number, cdn: string, useBox: boolean, timeout: number, size: number, refreshRate: number, grid: number, tiny: boolean, sensitivity: number, api: string, https: boolean, embedded: boolean})), toggleDebug: Audiocover.toggleDebug, begin: Audiocover.begin, _: Audiocover._}}
 */

let Audiocover = (function () {
    //need jquery for this crap
    if ($ === undefined) throw 'Jquery undefined';

    let Audiocover = null;
    let isPlaying = false;
    let isMoving = false;
    let isActive = false;
    let xOffset;
    let yOffset;
    let _volume = 0.8;
    //the current tracks we are listening too
    let currentTracks = {};

    //the cursor element
    let cursor = {
        x: 0, //position on audiocover
        y: 0, //position on audiocover
        width: 1, //grid width
        height: 1, //grid height
        animation: [],
        element: null,
        closest: null,
    };

    //our options
    let _options = {
        grid: 8,
        useBox: false,
        refreshRate: 1,
        size: 52, //overwitten by AudiocoverAPI
        audiocoverId: 'audiocover',
        timeout: 100, //after 100 seconds refuse crash (slow internet)
        sensitivity: 4,
        cdn: 'https://dweb.link',
        website: 'localhost',
        api: 'localhoost:8000',
        apikey: '',
        https: false,
        metadata: {},
        tiny: false,
        slowness: 4,
        embedded: false,
    };

    let _musicpixels = [];
    let _loaded = [];
    let _files = [];

    /**
     * Creates a brand new music pixel
     * @param musicpixel
     * @returns {*[]}
     */

    function createMusicPixel(musicpixel) {
        return {
            x: musicpixel.x ?? 1, //position on grid
            y: musicpixel.y ?? 1, //position on grid,
            width: musicpixel.width ?? 1,
            height: musicpixel.height ?? 1,
            animation: musicpixel.animation ?? '',
            element: null,
            sound: null,
            metadata: null,
        };
    }

    /**
     * Creates a music pixel from an array
     * @param musicpixels
     */

    function createMusicPixels(musicpixels) {
        for (let i = 0; i < musicpixels.length; i++) {
            _musicpixels[i] = createMusicPixel(musicpixels[i]);
            _musicpixels[i].index = i;
        }
    }

    /**
     *
     * @param musicpixels
     * @param cursor
     * @param doanimation
     * @constructor
     */

    function controlMusicPixels(musicpixels, cursor, doanimation) {
        controlVolume(musicpixels, cursor);
        controlOpacity(musicpixels, cursor);

        if (
            doanimation !== null &&
            doanimation &&
            cursor.animation !== undefined
        )
            controlAnimation(musicpixels, cursor);

        setCurrentTracks(musicpixels);
    }

    /**
     * Controls the volume of each music pixel, updating it accordingly
     */

    function controlVolume(musicpixels, cursor) {
        for (let i = 0; i < musicpixels.length; i++) {
            if (
                musicpixels[i].highlighted !== undefined &&
                musicpixels[i].highlighted
            )
                continue;

            let element = convertFromGrid(musicpixels[i]);
            element = getMiddleOrigin(element);

            cursor = getMiddleOrigin({
                x: cursor.x - 1,
                y: cursor.y - 1,
                width: _options.grid,
                height: _options.grid,
            });

            let distance = getDistance(element, cursor);

            if (Math.abs(distance) > element.width * element.height * 2)
                musicpixels[i].sound.volume = 0.0;
            else {
                let deadzone = Math.abs(
                    _options.sensitivity -
                        musicpixels[i].width * musicpixels[i].height
                );
                let rat =
                    _volume - Math.min(Math.abs(distance / deadzone), _volume);

                if (isFinite(rat)) musicpixels[i].sound.volume = rat;

                musicpixels[i].listening = musicpixels[i].sound.volume > 0.4;
            }
        }
    }

    /**
     * Controls the opacitys of each music pixel, updating it accordingly
     */

    function controlOpacity(musicpixels, cursor) {
        for (let i = 0; i < musicpixels.length; i++) {
            if (
                musicpixels[i].highlighted !== undefined &&
                musicpixels[i].highlighted
            )
                continue;

            let element = convertFromGrid(musicpixels[i]);
            element = getMiddleOrigin(element);

            cursor = getMiddleOrigin({
                x: cursor.x - 1,
                y: cursor.y - 1,
                width: _options.grid,
                height: _options.grid,
            });

            let distance = getDistance(element, cursor);

            if (Math.abs(distance) > element.width + element.height) continue;

            let deadzone = Math.abs(
                _options.sensitivity -
                    musicpixels[i].width * musicpixels[i].height
            );
            let rat =
                _volume - Math.min(Math.abs(distance / deadzone), _volume);

            if (isFinite(rat)) musicpixels[i].opacity = rat;

            musicpixels[i].visible = musicpixels[i].sound.volume > 0.2;
        }
    }

    /**
     * Controls the volume of each music pixel, updating it accordingly
     */

    function controlAnimation(musicpixels, cursor) {
        for (let i = 0; i < musicpixels.length; i++) {
            if (!musicpixels[i].listening) {
                if (
                    musicpixels[i].animation !== undefined &&
                    cursor.animation !== undefined &&
                    cursor.animation.length !== 0
                )
                    for (let c = 0; c < cursor.animation.length; c++)
                        if (cursor.animation[c] === musicpixels[i].animation)
                            cursor.animation[c] = null;
            } else if (!cursor.animation.includes(musicpixels[i].animation))
                cursor.animation.push(musicpixels[i].animation);
        }

        for (let i = 0; i < cursor.animation.length; i++)
            if (cursor.animation[i] !== null) return;

        cursor.animation = [];
    }

    /**
     * Sets the current tracks we are listening too
     * @param musicpixels
     */

    function setCurrentTracks(musicpixels) {
        for (let i = 0; i < musicpixels.length; i++) {
            if (!musicpixels[i].listening) {
                if (currentTracks[i] !== undefined) delete currentTracks[i];

                continue;
            }

            if (currentTracks[i] === undefined)
                currentTracks[i] = musicpixels[i];
        }
    }

    /**
     *
     * @param element
     * @returns {{x: *, width: *, y: *, height: *}}
     */

    function getMiddleOrigin(element) {
        return {
            x: element.x + element.width / 2,
            y: element.y + element.height / 2,
            width: element.width,
            height: element.height,
        };
    }

    /**
     * Converts from Website X/Y to MusicPixel X/Y
     * @param object
     * @returns {{x: number, width: number, y: number, height: number}}
     */

    function convertFromGrid(object) {
        return {
            x: object.x * _options.grid,
            y: object.y * _options.grid,
            width: object.width * _options.grid,
            height: object.height * _options.grid,
        };
    }

    /**
     * gets the distance between an element and the cursor
     * @param element
     * @param cursor
     * @returns {number}
     */

    function getDistance(element, cursor) {
        return Math.sqrt(
            Math.pow(element.x - cursor.x, 2) +
                Math.pow(element.y - cursor.y, 2)
        );
    }

    /**
     * Main Loop
     */

    function loop() {
        if (_options.refreshRate % 10 !== 0 && _options.refreshRate !== 1)
            console.log(
                '[warning] strange refresh rate: ' + _options.refreshRate
            );

        setTimeout(function () {
            //render opacity and animation
            renderCursor();
            renderMusicPixels();
            checkCurrentTracks();

            //update the volume, opacity and animation based upon cursor position
            controlMusicPixels(_musicpixels, cursor, true);

            //loop forever
            if (isPlaying) loop();
        }, _options.refreshRate);
    }

    /**
     * Checks the current tracks we are listening too and adds or removes elements appropriately
     */

    function checkCurrentTracks() {
        let tracks = { ...this.currentTracks };
        let element = $('#ac-track');
        let obj = Object.values(tracks);

        if (obj.length !== 0) {
            obj.forEach(function (item, index) {
                if (currentTracks[item.index] === undefined) {
                    currentTracks[item.index] = item;
                    element.append(
                        "<div class='ac-track-name' id='ac-track-" +
                            item.index +
                            "'></div>"
                    );
                    renderTrack(item.index);
                }
            });

            Object.values(currentTracks).forEach(function (item, index, array) {
                if (tracks[item.index] === undefined) {
                    $('#ac-track-' + item.index).remove();
                    delete currentTracks[item.index];
                }
            });
        } else {
            currentTracks = {};
            element.empty();
        }
    }

    /**
     * Adds a track element from the music pixel index into the Audiocover
     * @param index
     */

    function renderTrack(index) {
        let sel = $('#ac-track-' + index);
        let mp = _musicpixels[index];
        let title;

        if (mp.metadata !== undefined) {
            if (mp.metadata.title !== undefined) title = mp.metadata.title;
            else if (mp.metadata.name !== null) title = mp.metadata.name;

            if (mp.metadata.artist !== undefined)
                title = mp.metadata.artist + ' - ' + title;
        } else title = 'Unknown - Unknown';

        sel.append(
            '<p>' + title + " <span style='font-size: 55%'> (PIN)</span></p>"
        );
        sel.click(function () {
            Audiocover.highlight(index);
            sel.toggleClass('ac-track-highlighted');

            if (_musicpixels[index].highlighted) {
                sel.empty();
                sel.append(
                    '<p>' +
                        title +
                        " <span style='font-size: 75%'> (UNPIN)</span></p>"
                );
            } else {
                sel.empty();
                sel.append(
                    '<p>' +
                        title +
                        " <span style='font-size: 55%'> (PIN)</span></p>"
                );
            }
        });
    }

    /**
     * Loads an Audiocover from data
     * @param data
     */

    function load(data) {
        if ($ === undefined)
            throw 'Jquery must be included before this method is called';

        if (Audiocover !== null) throw 'already loaded';

        if (data.resources === undefined) throw 'resources undefined';

        if (data.musicpixels === undefined) throw 'musicpixels undefined';

        if (data.information === undefined) throw 'information undefined';

        //get the main element
        let element = getElement();

        if (element.length === 0)
            throw 'element not found with id: ' + _options.audiocoverId;

        //setup element
        setupElement(element);

        //create loading screen
        placeLoadingScreen(element);

        Audiocover = data;

        createMusicPixels(data.musicpixels);
        placeImage(element, _files.cover);
        setupTracks(element);
        registerSounds(_files.sounds, () => {
            let loading = $('#ac-loading-screen');

            if (loading.length !== 0) {
                loading.remove();
                $('#ac-image').css('display', 'flex');
                setupAfterLoad(element, data);
            }
        });
    }

    /**
     * Sets up the element our tracks will be inside
     * @param element
     */

    function setupTracks(element) {
        element.append("<div class='ac-track' id='ac-track'></div>");
    }

    /**
     * Setup for the Audiocover after loading has completed
     * @param element
     * @param data
     */
    function setupAfterLoad(element, data) {
        //place musicpixels
        placeMusicPixels(element);
        debugMusicPixels();

        let image = $('#ac-image');

        if (image.length === 0) throw 'image not loaded first';

        //create drag events
        placeCursor(image);
        createDragEvents();

        //place menu screen
        placeMenuScreen(element, data.information);
        //place menu buttons
        placeMenuButtons(data.information);

        //set data variable from null
        Audiocover = data;
    }

    /**
     * Creates and places the loading screen.
     * @param element
     */

    function placeLoadingScreen(element) {
        let e = $(
            "<div class='ac-loading-screen' id='ac-loading-screen'><h1>Initializing</h1><p>Please hold, traveller</p>" +
                "<h2 style='display: none; font-size: 1.5vh; background: black; padding-left: 1%; width: 25vw;' id='timer'>" +
                "This is taking a while... please wait! <script>$('#timer').delay(6000).fadeIn(2000)</script>" +
                '</h2>' +
                '</div>'
        );

        e.css('width', _options.size * _options.grid);
        e.css('height', _options.size * _options.grid);

        element.append(e);
    }

    /**
     * Register a sound with the audio engine
     * @param sounds
     * @param callback
     */

    function registerSounds(sounds, callback) {
        let limit = _options.timeout;

        function check() {
            limit--;

            if (limit < 0) {
                alert('failed to load songs... please try again!');
                window.location.refresh(true);
            }

            if (_loaded.length === _musicpixels.length) callback();
            else
                setTimeout(function () {
                    console.log('still loading... (' + limit + ' tries left)');
                    check();
                }, 1000);
        }

        check();
        createjs.Sound.on('fileload', Audiocover._, this);
        createjs.Sound.alternateExtensions = ['mp3'];

        for (let i = 0; i < _musicpixels.length; i++) {
            if (sounds[i] === false) {
                console.log(
                    '[warning] sound (' +
                        Audiocover.resources.sounds[i] +
                        ') is an invalid id'
                );
                _loaded.push(false);
                continue;
            }

            console.log(
                'registered sound: ' +
                    'sound-' +
                    i +
                    ' (' +
                    sounds[i].location +
                    ')'
            );

            let sound = {
                path: '',
                manifest: [
                    { id: 'sound-' + i, src: { mp3: sounds[i].location } },
                ],
            };

            _musicpixels[i].metadata = sounds[i].metadata;
            console.log(
                'setting metadata ' + (i + 1) + '/' + _musicpixels.length
            );
            createjs.Sound.registerSounds(sound);
        }
    }

    /**
     * Start a sound or all sounds (key is index)
     * @param key
     */

    function startSounds(key) {
        if (key === undefined) key = null;

        console.log('starting sounds');

        if (_musicpixels.length === 0) throw 'music pixels not loaded';

        if (key === null) {
            for (let i = 0; i < _musicpixels.length; i++) {
                console.log('starting sound ' + i);
                _musicpixels[i].sound = createjs.Sound.play('sound-' + i);

                if (_musicpixels[i].sound.playState === 'playFailed')
                    console.log('failed to play sound');

                setVolume(i, 0.0);
            }
        } else {
            _musicpixels[key].sound = createjs.Sound.createInstance(
                'sound-' + key
            );
            setVolume(key, 0.0);
        }
    }

    /**
     * Sets the volume for all sounds or for a single sound (key is index)
     * @param key
     * @param value
     */

    function setVolume(key, value) {
        if (key === undefined) key = null;

        console.log('starting sounds');

        if (_musicpixels.length === 0) throw 'music pixels not loaded';

        if (key === null)
            for (let i = 0; i < _musicpixels.length; i++)
                _musicpixels[i].sound.volume = value;
        else _musicpixels[key].sound.volume = value;
    }

    /**
     * Returns true sound has started (key is index of music pixel)
     * @param key
     * @returns {boolean}
     */

    function hasSoundStarted(key) {
        return _musicpixels[key].sound !== null;
    }

    /**
     * Sets css on base element which holds everything
     * @param element
     */

    function setupElement(element) {
        element.css('width', _options.size * _options.grid);
        element.css('height', _options.size * _options.grid);
    }

    /**
     * Creates drag events
     */

    function createDragEvents() {
        let dragItem = document.querySelector('#ac-cursor');
        let container = document.querySelector('#ac-image');

        let currentX;
        let currentY;
        let initialX;
        let initialY;

        xOffset = cursor.x;
        yOffset = cursor.y;

        function dragStart(e) {
            console.log('drag start');
            if (e.type === 'touchstart') {
                initialX = e.touches[0].clientX - xOffset;
                initialY = e.touches[0].clientY - yOffset;
            } else {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
            }

            if (e.target === dragItem) {
                isActive = true;
            }
        }

        function dragEnd(e) {
            initialX = cursor.x;
            initialY = cursor.y;

            isActive = false;
        }

        function drag(e) {
            if (isActive) {
                e.preventDefault();

                if (e.type === 'touchmove') {
                    currentX = e.touches[0].clientX - initialX;
                    currentY = e.touches[0].clientY - initialY;
                } else {
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                }

                xOffset = currentX;
                yOffset = currentY;

                cursor.x = currentX;
                cursor.y = currentY;
            }
        }

        console.log('adding mobile events');

        container.addEventListener('touchstart', dragStart, false);
        container.addEventListener('touchend', dragEnd, false);
        container.addEventListener('touchmove', drag, false);

        console.log('adding mouse events');

        container.addEventListener('mousedown', dragStart, false);
        container.addEventListener('mouseup', dragEnd, false);
        container.addEventListener('mousemove', drag, false);
    }

    /**
     * Draws the cursor
     */

    function renderCursor() {
        if (cursor.element !== null)
            cursor.element.css(
                'transform',
                'translate3d(' + cursor.x + 'px, ' + cursor.y + 'px, 0)'
            );

        let sel = $('#ac-cursor-ani');

        if (cursor.animation.length !== 0) {
            if (sel.length === 0) {
                cursor.element.append(
                    "<div class='ac-cursor-ani' id='ac-cursor-ani'></div>"
                );
                sel = $('#ac-cursor.ani');
            }

            sel.css('animation-name', cursor.animation.join(', '));
        } else if (sel.length !== 0) sel.remove();
    }

    /**
     * Takes an array of movements, Use AudiocoverMovements for easy presets
     * @param movements
     * @param infinite
     */

    function performMovement(movements, infinite = true) {
        if (isMoving) throw 'already moving';

        window.movements = movements;
        window.infinite = infinite;
        doMovement(window.movements[0]);
    }

    /**
     * Triggers the cursor to move to a location inside a performance.
     * @param object
     */

    function doMovement(object) {
        if (isMoving) throw 'already moving';

        console.log('doing movement in sequence');

        if (object.speed === undefined) object.speed = 1;

        moveCursor(object.x, object.y, object.speed, function () {
            if (window.movements === undefined) return;

            window.movements.shift();

            if (!window.infinite) {
                if (window.movements.length === 0) delete window.movements;
                else doMovement(window.movements[0]);
            } else {
                window.movements.push(object);
                doMovement(window.movements[0]);
            }
        });
    }

    /**
     * Conclusion: My math is not good enough atm to do fancy curves :) (sorry)
     * @param x
     * @param y
     * @param speed
     * @param callback
     */

    function moveCursor(x, y, speed, callback = null) {
        let timer;

        if (timer !== undefined && timer !== null) clearTimeout(timer);

        x = Math.max(0, Math.min(_options.size, x)) * _options.grid;
        y = Math.max(0, Math.min(_options.size, y)) * _options.grid;

        function loop() {
            timer = setTimeout(function () {
                if (isActive) {
                    isMoving = false;

                    if (window.movements !== undefined) delete window.movements;

                    return;
                }

                if (cursor.x !== x) {
                    if (cursor.x > x) cursor.x--;

                    if (cursor.x < x) cursor.x++;
                }

                if (cursor.y !== y) {
                    if (cursor.y > y) cursor.y--;

                    if (cursor.y < y) cursor.y++;
                }

                if (
                    Math.floor(cursor.y) === Math.floor(y) &&
                    Math.floor(cursor.x) === Math.floor(x)
                ) {
                    isMoving = false;

                    if (callback !== null) callback();

                    return;
                }

                xOffset = cursor.x;
                yOffset = cursor.y;

                loop();
            }, speed * (_options.slowness * 10));
        }

        isMoving = true;

        loop();
    }

    /**
     * Places the cursor onto the audiocover
     * @param element
     */

    function placeCursor(element) {
        //center it
        cursor.x = (_options.grid * _options.size) / 2;
        cursor.y = (_options.grid * _options.size) / 2;

        let e = $("<div class='ac-cursor' id='ac-cursor'></div>");
        e.css('width', _options.grid);
        e.css('height', _options.grid);
        e.css(
            'transform',
            'translate3d(' + cursor.x + 'px, ' + cursor.y + 'px, 0)'
        );

        element.append(e);
        cursor.element = $('#ac-cursor');
    }

    /**
     * Places the image element
     * @param element
     * @param cover
     */

    function placeImage(element, cover) {
        let e = $("<div class='ac-image' id='ac-image'></div>");

        e.css('width', _options.size * _options.grid);
        e.css('height', _options.size * _options.grid);

        if (cover !== false)
            e.css('background-image', 'url("' + cover.location + '")');
        else
            console.log(
                '[warning] cover (' +
                    Audiocover.resources.cover +
                    ') is an invalid id'
            );

        element.append(e);
    }

    /**
     * Places the menu screen
     * @param element
     * @param information
     */

    function placeMenuScreen(element, information) {
        let label_logo = "<div class='ac-menu-label'></div>";

        if (
            _options.metadata.length !== 0 &&
            _options.metadata.label_logo !== undefined
        )
            label_logo =
                "<div class='ac-menu-label' style='" +
                _options.metadata.label_logo +
                "'></div>";

        if (information.title === undefined || information.artist === undefined)
            throw 'these should be set';

        let content = [
            "<div class='ac-menu-body'>",
            "<div class='ac-menu-header'>",
            "<p class='ac-menu-title'>" +
                information.title.replace(/<(.|\n)*?>/g, '') +
                '</p>',
            "<p class='ac-menu-subtitle'>" +
                information.artist.replace(/<(.|\n)*?>/g, '') +
                '</p>',
            '</div>',
            "<div class='ac-menu-buttons' id='ac-menu-buttons'></div>",
            "<div class='ac-menu-footer'>",
            "<div class='ac-menu-logo'></div>",
            label_logo,
            '</div>',
            '</div>',
        ].join('\n');

        let e = $("<div class='ac-menu' id='ac-menu'>" + content + '</div>');
        e.css('height', _options.size * _options.grid);
        e.css('width', _options.size * _options.grid);

        element.append(e);
    }

    /**
     * todo: make button choice selectable
     * @param information
     */

    function placeMenuButtons(information) {
        let e = $('#ac-menu-buttons');

        if (e.length === 0) throw 'was it created yet?';

        if (
            !_options.tiny ||
            _options.metadata.length === 0 ||
            _options.metadata.links === undefined ||
            _options.metadata.links.length === 0
        )
            e.append(
                "<div class='ac-menu-button play centered' style='background-size: contain !important;' onclick='Audiocover.begin()'></div>"
            );
        else {
            let count = Object.keys(_options.metadata.links).length;
            let width = 100 / (count + 1);
            let mid = Math.round(count / 2);

            if (count === 0)
                e.append(
                    "<div class='ac-menu-button play' onclick='Audiocover.begin()'></div>"
                );
            else
                Object.keys(_options.metadata.links).forEach(function (
                    value,
                    index,
                    array
                ) {
                    if (mid !== 1) {
                        if (mid % 2 === 1 && index === 0)
                            e.append(
                                "<div class='ac-menu-button play' style='width: " +
                                    width +
                                    "%' onclick='Audiocover.begin()'></div>"
                            );

                        if (mid % 2 === 0 && index === mid)
                            e.append(
                                "<div class='ac-menu-button play' style='width: " +
                                    width +
                                    "%' onclick='Audiocover.begin()'></div>"
                            );
                    } else if (index === mid)
                        e.append(
                            "<div class='ac-menu-button play' style='width: " +
                                width +
                                "%' onclick='Audiocover.begin()'></div>"
                        );

                    let button = $("<div class='ac-menu-button link'></div>");
                    button.attr('data-type', value);
                    button.attr('data-link', _options.metadata.links[value]);
                    button.addClass(value);
                    button.css('width', width + '%');
                    e.append(button);
                });
        }

        menuButtonEvents();
    }

    /**
     * adds the menu button events
     */

    function menuButtonEvents() {
        let s = $('.link');
        s.off('click');
        s.on('click', function (e) {
            var sel = $(this);
            let type = sel.attr('data-type');
            let link = sel.attr('data-link');

            switch (type) {
                case 'spotify':
                    window.open(
                        'https://open.spotify.com/album/' +
                            link.replace(/<(.|\n)*?>/g, '')
                    );
                    return;
                case 'itunes':
                    window.open(
                        'https://music.apple.com/' +
                            link.replace(/<(.|\n)*?>/g, '')
                    );
                    return;
                case 'soundcloud':
                    window.open(
                        'https://www.soundcloud.com/' +
                            link.replace(/<(.|\n)*?>/g, '')
                    );
                    return;
                case 'youtube':
                    window.open(
                        'https://www.youtube.com/' +
                            link.replace(/<(.|\n)*?>/g, '')
                    );
                    return;
                default:
                    throw 'unimplemented';
            }
        });
    }

    /**
     * Places the music pixels onto the audiocover
     * @param element
     */

    function placeMusicPixels(element) {
        let container = $(
            "<div class='ac-musicpixel-container' id='ac-musicpixel-container'></div>"
        );

        if (_musicpixels.length === 0) throw 'no musicpixels';

        for (let i = 0; i < _musicpixels.length; i++) {
            console.log('placing ' + (i + 1) + '/' + _musicpixels.length);

            let data = _musicpixels[i];
            data = convertFromGrid(data);

            let e = $(
                "<div class='ac-musicpixel' id='ac-musicpixel-" + i + "'></div>"
            );
            e.css('margin-left', data.x);
            e.css('margin-top', data.y);
            e.css('width', data.width);
            e.css('height', data.height);
            //e.attr("animation", data.animation );

            container.append(e);
            _musicpixels[i].element = $('#ac-musicpixel-' + i);
        }

        element.append(container);
    }

    /**
     * Renders the music pixels
     */

    function renderMusicPixels() {
        for (let i = 0; i < _musicpixels.length; i++) {
            let sel = $('#ac-musicpixel-' + i);

            if (sel.length === 0) throw 'bad sel';

            if (
                _musicpixels[i].opacity !== undefined &&
                isFinite(_musicpixels[i].opacity)
            )
                sel.css('opacity', _musicpixels[i].opacity);
        }
    }

    /**
     * gets our main element
     * @returns {*|jQuery.fn.init|jQuery|HTMLElement}
     */

    function getElement() {
        return $('#' + _options.audiocoverId);
    }

    /**
     * quick debug for music pixels
     */

    function debugMusicPixels() {
        let objects = $('.ac-musicpixel');

        if (_options.debug)
            objects.each(function () {
                $(this).addClass('ac-musicpixel-debug');
            });
        else
            objects.each(function () {
                $(this).removeClass('ac-musicpixel-debug');
            });
    }

    function setGridSize(tiny) {
        let grid = _options.defaultGridSize;

        if (window.innerWidth <= 320) grid = _options.defaultGridSize;
        else if (window.innerWidth <= 360)
            grid = _options.defaultGridSize * 1.1;
        else if (window.innerWidth <= 411)
            grid = _options.defaultGridSize * 1.25;
        else if (window.innerWidth <= 420)
            grid = _options.defaultGridSize * 1.5;
        else if (window.innerWidth <= 768)
            grid = _options.defaultGridSize * 1.7;
        else if (window.innerWidth <= 1024)
            grid = _options.defaultGridSize * 1.8;
        else if (window.innerWidth <= 1300)
            grid = _options.defaultGridSize * 1.9;
        else if (window.innerWidth <= 1424)
            grid = _options.defaultGridSize * 2.25;
        else if (window.innerWidth > 1424)
            grid = _options.defaultGridSize * 2.5;

        if (grid <= 0) grid = _options.defaultGridSize;

        return Math.floor(grid);
    }

    /**
     * Called when the window is resized
     */

    function onResize() {
        if (_loaded.length !== _musicpixels.length) return;

        if (
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            )
        )
            return;

        let element = getElement();
        element.empty();

        //new grid formula
        _options.grid = setGridSize(_options.tiny);

        //set our options incase they change
        Audiocover.setOptions(_options);

        setupElement(element);
        placeImage(element, _files.cover);
        setupTracks(element);

        let image = $('#ac-image');
        image.css('display', 'flex');

        placeMusicPixels(element);
        debugMusicPixels(); //calling this in case we've started in debug mode

        placeCursor(image);
        renderCursor();
        createDragEvents();

        if (!isPlaying) {
            placeMenuScreen(element, Audiocover.information);
            placeMenuButtons(Audiocover.information);
        } else $('.ac-cursor').fadeIn();
    }

    /**
     * Public stuff
     */
    return {
        /**
         * Enables debug move
         */

        toggleDebug: function () {
            _options.debug = !_options.debug;

            if (Audiocover !== null) debugMusicPixels();
        },

        /**
         * gets audiocover options
         */

        getOptions: function () {
            if (!isPlaying) return;

            return _options;
        },

        /**
         *
         * @param x
         * @param y
         * @param speed
         */

        moveCursor: function (x, y, speed = 1) {
            if (!isPlaying) return;

            moveCursor(x, y, speed);
        },

        /**
         *
         * @param movements
         * @param infinite
         */

        testMovement: function (movements, infinite = true) {
            if (!(movements instanceof Object)) throw 'must be object';

            if (!isPlaying) return;

            performMovement(movements, infinite);
        },

        /**
         * Returns the options array
         * @returns {_options}
         */

        getDefaultOptions: function () {
            return [].concat(_options)[0];
        },

        /**
         * Sets our options
         * @param options
         * @constructor
         */

        setOptions: function (options) {
            _options.website = options.website ?? _options.website;
            _options.cdn = options.cdn ?? _options.cdn;
            _options.api = options.api ?? _options.api;
            _options.https = options.https ?? _options.https;
            _options.debug = options.debug ?? _options.debug;
            _options.apikey = options.apikey ?? _options.apikey;
            _options.sensitivity = options.sensitivity ?? _options.sensitivity;
            _options.grid = options.grid ?? _options.grid;
            _options.size = options.size ?? _options.size;
            _options.tiny = options.tiny ?? _options.tiny;
            _options.embedded = options.embedded ?? _options.embedded;
        },

        /**
         *
         * @param index
         */

        highlight: function (index) {
            if (!isPlaying) return;

            console.log('Highlighting music pixel ' + index);

            if (!_musicpixels[index] === undefined)
                _musicpixels[index].highlighted = true;
            else
                _musicpixels[index].highlighted =
                    !_musicpixels[index].highlighted;

            $('#ac-musicpixel-' + index).toggleClass('ac-highlighted');
        },

        /**
         * DO NOT CALL THIS!
         * @param event
         * @protected
         */

        _: function (event) {
            if (_musicpixels.length === 0) throw 'no music pixels';

            if (_loaded.length >= _musicpixels.length) throw 'overflow';

            console.log('loaded sound: ' + _loaded.length);

            _loaded.push(event);
        },

        /**
         * Begins the experience (must be loaded)
         */

        begin: function () {
            if (isPlaying === false) {
                console.log('starting experience');

                if (Audiocover === null || _loaded.length === 0)
                    throw 'not loaded';

                isPlaying = true;
                $('.ac-cursor').fadeIn();

                //start the master loop
                console.log('starting master loop');
                startSounds();
                loop();

                //after slide up do our movements
                $('#ac-menu').slideUp('fast', function () {
                    //this shit could be attached to the audiocover pretty easily
                    console.log('Doing movements');
                    performMovement(
                        AudiocoverMovements.randomPattern(_options)
                    );
                });
            }
        },

        setResizeListener: function (callback) {
            $(window).on('resize', callback);
            $(window).on('onresize', callback);
        },

        /**
         * Shares the audio cover
         */

        share: function () {
            if (Audiocover === null) throw 'not loaded';
        },

        /**
         * Loads from data. data must be a valid audiocover (containing a data field and a metadata field)
         * @param data
         */

        load: function (data) {
            Audiocover.setOptions(_options);
            Audiocover.setResizeListener(onResize);
            console.log('loading audiocover data');
            load(data);
        },

        /**
         * Prints stuff to console for us to look at
         * @constructor
         */

        debugPrint: function () {
            console.log(_musicpixels);
            console.log(_files);
            console.log(Audiocover);
            console.log(_options);
        },
    };
})();

/**
 * 0xTinman.eth 2020
 * @type {{boxPattern: (function(*, *=, *=): ({x: number, y: number, speed: number})[]), randomPattern: (function(*=, *=, *=, *=): *[]), diagonalPattern: (function(*, *=, *=): ({x: number, y: number, speed: number})[])}}
 */

let AudiocoverMovements = (function () {
    /**
     *
     * @param max
     * @param min
     * @returns {number}
     */

    function getRandom(max, min = 1) {
        return min + Math.floor(Math.random() * max);
    }

    /**
     *
     * @param options
     * @param padding
     * @param result
     * @returns {number}
     */

    function maxMin(options, padding, result) {
        return Math.max(padding, Math.min(options.size - padding, result));
    }

    return {
        /**
         * Generates a random pattern
         * @param options
         * @param number
         * @param padding
         * @param speed
         * @returns {[]}
         */

        randomPattern: function (options, number = 12, padding = 6, speed = 1) {
            let results = [];
            for (let i = 0; i < number; i++)
                results[i] = {
                    x: maxMin(
                        options,
                        padding,
                        getRandom(options.size - padding, padding)
                    ),
                    y: maxMin(
                        options,
                        padding,
                        getRandom(options.size - padding, padding)
                    ),
                    speed: speed,
                };

            return results;
        },

        /**
         * Moves the cursor in a nice box pattern
         * @param options
         * @param padding
         * @param speed
         * @returns {[{x: number, y: number, speed: number}, {x: number, y: number, speed: number}, {x: number, y: number, speed: number}, {x: number, y: number, speed: number}]}
         */

        boxPattern: function (options, padding = 6, speed = 1) {
            return [
                {
                    x: padding,
                    y: padding,
                    speed: speed,
                },
                {
                    x: options.size - padding,
                    y: padding,
                    speed: speed,
                },
                {
                    x: options.size - padding,
                    y: options.size - padding,
                    speed: speed,
                },
                {
                    x: padding,
                    y: options.size - padding,
                    speed: speed,
                },
            ];
        },

        /**
         * Moves the cursor in a nice diagonal pattern
         * @param options
         * @param padding
         * @param speed
         * @returns {[{x: number, y: number, speed: number}, {x: number, y: number, speed: number}, {x: number, y: number, speed: number}, {x: number, y: number, speed: number}, {x: number, y: number, speed: number}]}
         */

        diagonalPattern: function (options, padding = 6, speed = 1) {
            return [
                {
                    x: padding,
                    y: padding,
                    speed: speed,
                },
                {
                    x: padding,
                    y: options.size - padding,
                    speed: speed,
                },
                {
                    x: options.size - padding,
                    y: padding,
                    speed: speed,
                },
                {
                    x: options.size - padding,
                    y: options.size - padding,
                    speed: speed,
                },
                {
                    x: options.size / 2,
                    y: options.size / 2,
                    speed: speed,
                },
            ];
        },
    };
})();

/**
 * The actual render script
 */

const AudiocoverRender = {
    //
    interface: {
        type: 'image',
        features: {
            stickers: true,
        },
        basicTokenURI: true,
        mintByte: [
            //must select a pathId
            'pathId',
        ],
        requirements: {
            minter: 'SelectiveMinter',
            config: {
                byteMint: true,
            },
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
    renderToken: (controller, token, stickers, settings = {}) => {},

    /**
     *
     * @param {object} controller
     * @param {object} token
     * @param {Array} stickers
     * @param {object} settings
     */
    updateToken: async (
        controller, //instance of src/Controller.js
        token,
        stickers = [],
        settings = {}
    ) => {},

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
        return {
            name: token.name,
            image: renderedToken,
            description: 'InfinityMint Token',
        };
    },
};

//must be an ES6 module
export default AudiocoverRender;
