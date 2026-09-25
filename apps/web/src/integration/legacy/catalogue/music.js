/*
 * WAEVE MUSIC CATALOGUE ENGINE
 * Build: 0.3.0
 *
 * LOCAL-FIRST CATALOGUE
 */

(function () {

    "use strict";


    if (window.WaeveMusic) {

        console.log(
            "Waeve Music catalogue already exists."
        );

        return;

    }


    const music = {

        tracks: [],

        loaded: false,


        /*
         * LOCAL CATALOGUE
         *
         * Add new songs here.
         */

        localCatalogue: [

            {
                id: "waeve-demo-001",

                title: "Waeve Demo Track",

                artist: "Waeve",

                album: "Waeve Sessions",

                genre: "Demo",

                year: 2026,

                duration: 0,

                audio: "music/test-track.mp3",

                artwork: "assets/default-album.png",

                explicit: false
            },


            {
                id: "waeve-demo-002",

                title: "Second Waeve Track",

                artist: "Waeve",

                album: "Waeve Sessions",

                genre: "Demo",

                year: 2026,

                duration: 0,

                audio: "music/second-track.mp3",

                artwork: "assets/default-album.png",

                explicit: false
            }

        ],


        /*
         * LOAD CATALOGUE
         */

        async load() {

            this.tracks =
                this.localCatalogue.map(
                    track => ({
                        ...track
                    })
                );


            this.loaded = true;


            console.log(
                "Waeve local catalogue loaded:",
                this.tracks.length,
                "track(s)"
            );


            /*
             * Try music.json.
             */

            try {

                const response =
                    await fetch(
                        "data/music.json",
                        {
                            cache: "no-store"
                        }
                    );


                if (!response.ok) {

                    throw new Error(
                        "HTTP " +
                        response.status
                    );

                }


                const data =
                    await response.json();


                if (
                    data &&
                    Array.isArray(
                        data.tracks
                    ) &&
                    data.tracks.length > 0
                ) {

                    this.tracks =
                        data.tracks.map(
                            track => ({
                                ...track
                            })
                        );


                    console.log(
                        "Waeve JSON catalogue loaded:",
                        this.tracks.length,
                        "track(s)"
                    );

                }

            } catch (error) {

                console.warn(
                    "Waeve: music.json unavailable. Using local catalogue."
                );

            }


            return this.tracks;

        },


        /*
         * GET ALL TRACKS
         */

        getAll() {

            return [
                ...this.tracks
            ];

        },


        /*
         * GET TRACK BY ID
         */

        getById(id) {

            return (
                this.tracks.find(
                    track =>
                        String(track.id) ===
                        String(id)
                ) || null
            );

        },


        /*
         * SEARCH
         */

        search(query) {

            if (
                typeof query !== "string"
            ) {

                return [];

            }


            const term =
                query
                    .trim()
                    .toLowerCase();


            if (!term) {

                return this.getAll();

            }


            return this.tracks.filter(
                track => {

                    const title =
                        String(
                            track.title || ""
                        ).toLowerCase();


                    const artist =
                        String(
                            track.artist || ""
                        ).toLowerCase();


                    const album =
                        String(
                            track.album || ""
                        ).toLowerCase();


                    const genre =
                        String(
                            track.genre || ""
                        ).toLowerCase();


                    return (
                        title.includes(term) ||
                        artist.includes(term) ||
                        album.includes(term) ||
                        genre.includes(term)
                    );

                }
            );

        },


        /*
         * ARTISTS
         */

        getArtists() {

            return [
                ...new Set(
                    this.tracks
                        .map(
                            track =>
                                track.artist
                        )
                        .filter(Boolean)
                )
            ];

        },


        /*
         * ALBUMS
         */

        getAlbums() {

            return [
                ...new Set(
                    this.tracks
                        .map(
                            track =>
                                track.album
                        )
                        .filter(Boolean)
                )
            ];

        },


        /*
         * GENRES
         */

        getGenres() {

            return [
                ...new Set(
                    this.tracks
                        .map(
                            track =>
                                track.genre
                        )
                        .filter(Boolean)
                )
            ];

        },


        /*
         * TRACKS BY ARTIST
         */

        getByArtist(artist) {

            if (
                typeof artist !== "string"
            ) {

                return [];

            }


            const value =
                artist
                    .trim()
                    .toLowerCase();


            return this.tracks.filter(
                track =>
                    String(
                        track.artist || ""
                    ).toLowerCase() === value
            );

        },


        /*
         * TRACKS BY ALBUM
         */

        getByAlbum(album) {

            if (
                typeof album !== "string"
            ) {

                return [];

            }


            const value =
                album
                    .trim()
                    .toLowerCase();


            return this.tracks.filter(
                track =>
                    String(
                        track.album || ""
                    ).toLowerCase() === value
            );

        },


        /*
         * TRACKS BY GENRE
         */

        getByGenre(genre) {

            if (
                typeof genre !== "string"
            ) {

                return [];

            }


            const value =
                genre
                    .trim()
                    .toLowerCase();


            return this.tracks.filter(
                track =>
                    String(
                        track.genre || ""
                    ).toLowerCase() === value
            );

        }

    };


    /*
     * GLOBAL MUSIC ENGINE
     */

    window.WaeveMusic =
        music;


    /*
     * START LOADING
     */

    music.load();


    console.log(
        "Waeve Music Engine 0.3.0 ready."
    );

})();