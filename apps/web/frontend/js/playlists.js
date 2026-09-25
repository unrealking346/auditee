/*
 * WAEVE PLAYLIST ENGINE
 * Build: 0.3.0
 *
 * Handles:
 * - Creating playlists
 * - Loading playlists
 * - Saving playlists
 * - Adding songs
 * - Removing songs
 * - Deleting playlists
 * - Finding playlists
 * - Checking whether songs exist
 * - Playlist cover numbers
 * - Changing playlist covers
 * - Stable local persistence
 */

(function () {

    "use strict";


    const STORAGE_KEY =
        "waeve-playlists";


    const COVER_COUNT =
        6;


    const WaevePlaylists = {

        /*
         * INTERNAL DATA
         */

        playlists: [],

        initialized: false,


        /*
         * INITIALIZE
         */

        init() {

            if (this.initialized) {

                return;

            }


            this.load();


            this.initialized = true;


            console.log(
                "Waeve Playlist Engine 0.3.0 ready."
            );

        },


        /*
         * CREATE UNIQUE PLAYLIST ID
         */

        createId() {

            return (
                "playlist-" +
                Date.now().toString(36) +
                "-" +
                Math.random()
                    .toString(36)
                    .slice(2, 9)
            );

        },


        /*
         * CREATE RANDOM COVER NUMBER
         *
         * Covers are numbered 1-6.
         */

        createCoverNumber() {

            return (
                Math.floor(
                    Math.random() *
                    COVER_COUNT
                ) + 1
            );

        },


        /*
         * CREATE PLAYLIST
         */

        create(name) {

            if (
                typeof name !== "string"
            ) {

                return null;

            }


            const cleanName =
                name.trim();


            if (!cleanName) {

                return null;

            }


            const playlist = {

                id:
                    this.createId(),

                name:
                    cleanName,

                trackIds:
                    [],

                /*
                 * Each playlist receives
                 * its own stable cover.
                 */

                coverNumber:
                    this.createCoverNumber(),

                createdAt:
                    new Date().toISOString()

            };


            this.playlists.push(
                playlist
            );


            this.save();


            return playlist;

        },


        /*
         * GET ALL PLAYLISTS
         */

        getAll() {

            return this.playlists;

        },


        /*
         * GET PLAYLIST BY ID
         */

        getById(id) {

            if (!id) {

                return null;

            }


            return (
                this.playlists.find(
                    playlist =>
                        String(
                            playlist.id
                        ) ===
                        String(id)
                ) || null
            );

        },


        /*
         * ADD SONG TO PLAYLIST
         */

        addTrack(
            playlistId,
            trackId
        ) {

            const playlist =
                this.getById(
                    playlistId
                );


            if (!playlist) {

                return false;

            }


            if (
                trackId ===
                undefined ||
                trackId ===
                null
            ) {

                return false;

            }


            const id =
                String(trackId);


            /*
             * Prevent duplicate songs.
             */

            if (
                playlist.trackIds.some(
                    existingId =>
                        String(
                            existingId
                        ) === id
                )
            ) {

                return false;

            }


            playlist.trackIds.push(
                trackId
            );


            this.save();


            return true;

        },


        /*
         * REMOVE SONG FROM PLAYLIST
         */

        removeTrack(
            playlistId,
            trackId
        ) {

            const playlist =
                this.getById(
                    playlistId
                );


            if (!playlist) {

                return false;

            }


            const originalLength =
                playlist.trackIds.length;


            playlist.trackIds =
                playlist.trackIds.filter(
                    existingId =>
                        String(
                            existingId
                        ) !==
                        String(
                            trackId
                        )
                );


            if (
                playlist.trackIds.length ===
                originalLength
            ) {

                return false;

            }


            this.save();


            return true;

        },


        /*
         * CHECK IF SONG IS IN PLAYLIST
         */

        hasTrack(
            playlistId,
            trackId
        ) {

            const playlist =
                this.getById(
                    playlistId
                );


            if (!playlist) {

                return false;

            }


            return playlist.trackIds.some(
                existingId =>
                    String(
                        existingId
                    ) ===
                    String(
                        trackId
                    )
            );

        },


        /*
         * DELETE PLAYLIST
         */

        delete(id) {

            const originalLength =
                this.playlists.length;


            this.playlists =
                this.playlists.filter(
                    playlist =>
                        String(
                            playlist.id
                        ) !==
                        String(id)
                );


            if (
                this.playlists.length ===
                originalLength
            ) {

                return false;

            }


            this.save();


            return true;

        },


        /*
         * CHANGE PLAYLIST COVER
         *
         * coverNumber must be between 1 and 6.
         */

        changeCover(
            playlistId,
            coverNumber
        ) {

            const playlist =
                this.getById(
                    playlistId
                );


            if (!playlist) {

                console.error(
                    "Waeve Playlist Engine: Playlist not found."
                );

                return false;

            }


            const number =
                Number(
                    coverNumber
                );


            if (
                !Number.isInteger(
                    number
                ) ||
                number < 1 ||
                number > COVER_COUNT
            ) {

                console.error(
                    "Waeve Playlist Engine: Invalid cover number."
                );

                return false;

            }


            playlist.coverNumber =
                number;


            this.save();


            console.log(
                "Waeve: Playlist cover changed.",
                playlist.name,
                "Cover:",
                number
            );


            return true;

        },


        /*
         * GET PLAYLIST COVER
         */

        getCover(
            playlistId
        ) {

            const playlist =
                this.getById(
                    playlistId
                );


            if (!playlist) {

                return 1;

            }


            /*
             * Older playlists may not have
             * a coverNumber.
             */

            if (
                !Number.isInteger(
                    Number(
                        playlist.coverNumber
                    )
                ) ||
                Number(
                    playlist.coverNumber
                ) < 1 ||
                Number(
                    playlist.coverNumber
                ) > COVER_COUNT
            ) {

                playlist.coverNumber =
                    this.createCoverNumber();


                this.save();

            }


            return Number(
                playlist.coverNumber
            );

        },


        /*
         * RENAME PLAYLIST
         */

        rename(
            playlistId,
            newName
        ) {

            const playlist =
                this.getById(
                    playlistId
                );


            if (!playlist) {

                return false;

            }


            if (
                typeof newName !==
                "string"
            ) {

                return false;

            }


            const cleanName =
                newName.trim();


            if (!cleanName) {

                return false;

            }


            playlist.name =
                cleanName;


            this.save();


            return true;

        },


        /*
         * SAVE PLAYLISTS
         */

        save() {

            try {

                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(
                        this.playlists
                    )
                );


                return true;

            } catch (error) {

                console.error(
                    "Waeve Playlist Engine: Unable to save playlists.",
                    error
                );


                return false;

            }

        },


        /*
         * LOAD PLAYLISTS
         */

        load() {

            try {

                const saved =
                    localStorage.getItem(
                        STORAGE_KEY
                    );


                if (!saved) {

                    this.playlists =
                        [];

                    return;

                }


                const parsed =
                    JSON.parse(
                        saved
                    );


                if (
                    !Array.isArray(
                        parsed
                    )
                ) {

                    this.playlists =
                        [];

                    return;

                }


                /*
                 * Clean and repair playlist
                 * data from older versions.
                 */

                this.playlists =
                    parsed
                        .filter(
                            playlist =>
                                playlist &&
                                typeof playlist ===
                                    "object"
                        )
                        .map(
                            playlist => {

                                const repaired = {

                                    id:
                                        playlist.id ||
                                        this.createId(),

                                    name:
                                        typeof playlist.name ===
                                            "string"
                                            ? playlist.name
                                            : "Untitled Playlist",

                                    trackIds:
                                        Array.isArray(
                                            playlist.trackIds
                                        )
                                            ? playlist.trackIds
                                            : [],

                                    coverNumber:
                                        Number.isInteger(
                                            Number(
                                                playlist.coverNumber
                                            )
                                        ) &&
                                        Number(
                                            playlist.coverNumber
                                        ) >= 1 &&
                                        Number(
                                            playlist.coverNumber
                                        ) <= COVER_COUNT
                                            ? Number(
                                                playlist.coverNumber
                                            )
                                            : this.createCoverNumber(),

                                    createdAt:
                                        playlist.createdAt ||
                                        new Date()
                                            .toISOString()

                                };


                                return repaired;

                            }
                        );


                /*
                 * Save repaired data so old
                 * playlists permanently receive
                 * their cover numbers.
                 */

                this.save();


            } catch (error) {

                console.error(
                    "Waeve Playlist Engine: Unable to load playlists.",
                    error
                );


                this.playlists =
                    [];

            }

        },


        /*
         * CLEAR ALL PLAYLISTS
         *
         * This is mainly useful for testing.
         */

        clearAll() {

            this.playlists =
                [];


            this.save();


            return true;

        }

    };


    /*
     * GLOBAL ACCESS
     */

    window.WaevePlaylists =
        WaevePlaylists;


    /*
     * START ENGINE
     */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            () => {

                WaevePlaylists.init();

            },
            {
                once: true
            }
        );

    } else {

        WaevePlaylists.init();

    }

})();