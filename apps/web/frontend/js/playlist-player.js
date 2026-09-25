/*

* WAEVE PLAYLIST PLAYER
* Build: 0.3.1
*
* Handles:
* - Playlist playback
* - Playlist queue
* - Next song
* - Previous song
* - Shuffle
* - Normal playlist order
* - Individual playlist song playback
* - Automatic next-track playback
    */

(function () {

"use strict";


if (window.WaevePlaylistPlayer) {

    console.log(
        "Waeve Playlist Player already exists."
    );

    return;

}


const WaevePlaylistPlayer = {

    initialized: false,

    currentPlaylistId: null,

    queue: [],

    currentIndex: -1,

    shuffleEnabled: false,

    eventsConnected: false,


    /*
     * INITIALIZE
     */

    init() {

        if (this.initialized) {

            return;

        }


        if (!window.WaevePlaylists) {

            console.error(
                "Waeve Playlist Player: Playlist engine unavailable."
            );

            return;

        }


        if (!window.WaeveMusic) {

            console.error(
                "Waeve Playlist Player: Music engine unavailable."
            );

            return;

        }


        if (!window.WaevePlayer) {

            console.error(
                "Waeve Playlist Player: Music player unavailable."
            );

            return;

        }


        this.setupPlayerEvents();


        this.initialized = true;


        console.log(
            "Waeve Playlist Player 0.3.1 ready."
        );

    },


    /*
     * PLAYER EVENTS
     */

    setupPlayerEvents() {

        if (this.eventsConnected) {

            return;

        }


        /*
         * Main player callback.
         */

        if (
            window.WaevePlayer &&
            typeof WaevePlayer.onTrackEnd ===
                "function"
        ) {

            WaevePlayer.onTrackEnd(
                () => {

                    this.handleTrackEnded();

                }
            );

        }


        /*
         * Direct audio fallback.
         *
         * Do not connect this if the
         * main player callback exists.
         */

        else if (
            window.WaevePlayer &&
            WaevePlayer.audio &&
            typeof WaevePlayer.audio.addEventListener ===
                "function"
        ) {

            WaevePlayer.audio.addEventListener(
                "ended",
                () => {

                    this.handleTrackEnded();

                }
            );

        }


        this.eventsConnected = true;

    },


    /*
     * PLAY PLAYLIST
     */

    playPlaylist(
        playlistId,
        shuffle = false
    ) {

        if (!this.initialized) {

            this.init();

        }


        if (
            !window.WaevePlaylists ||
            !window.WaeveMusic ||
            !window.WaevePlayer
        ) {

            console.error(
                "Waeve Playlist Player: Required engine unavailable."
            );

            return false;

        }


        const playlist =
            WaevePlaylists.getById(
                playlistId
            );


        if (!playlist) {

            console.error(
                "Waeve Playlist Player: Playlist not found."
            );

            return false;

        }


        const trackIds =
            Array.isArray(
                playlist.trackIds
            )
                ? playlist.trackIds
                : [];


        if (
            trackIds.length === 0
        ) {

            console.warn(
                "Waeve Playlist Player: Playlist is empty."
            );

            window.alert(
                "This playlist has no songs yet."
            );

            return false;

        }


        const allTracks =
            WaeveMusic.getAll();


        let tracks =
            trackIds
                .map(
                    trackId =>
                        allTracks.find(
                            track =>
                                String(
                                    track.id
                                ) ===
                                String(
                                    trackId
                                )
                        )
                )
                .filter(Boolean);


        if (
            tracks.length === 0
        ) {

            console.error(
                "Waeve Playlist Player: No playable tracks found."
            );

            return false;

        }


        this.currentPlaylistId =
            playlist.id;


        this.shuffleEnabled =
            Boolean(shuffle);


        if (
            this.shuffleEnabled
        ) {

            tracks =
                this.shuffleArray(
                    tracks
                );

        }


        this.queue =
            tracks;


        this.currentIndex =
            0;


        return this.playCurrent();

    },


    /*
     * PLAY CURRENT TRACK
     */

    playCurrent() {

        if (
            !window.WaeveMusic ||
            !window.WaevePlayer
        ) {

            console.error(
                "Waeve Playlist Player: Required music engines unavailable."
            );

            return false;

        }


        if (
            this.currentIndex < 0 ||
            this.currentIndex >=
                this.queue.length
        ) {

            return false;

        }


        const track =
            this.queue[
                this.currentIndex
            ];


        if (!track) {

            return false;

        }


        const allTracks =
            WaeveMusic.getAll();


        const actualIndex =
            allTracks.findIndex(
                item =>
                    String(
                        item.id
                    ) ===
                    String(
                        track.id
                    )
            );


        if (
            actualIndex === -1
        ) {

            console.error(
                "Waeve Playlist Player: Track not found in music library."
            );

            return false;

        }


        WaevePlayer.loadTrack(
            actualIndex,
            true
        );


        console.log(
            "Waeve Playlist Player:",
            track.title,
            "|",
            track.artist
        );


        return true;

    },


    /*
     * PLAY SPECIFIC TRACK
     */

    playTrack(
        playlistId,
        trackId
    ) {

        const playlist =
            WaevePlaylists.getById(
                playlistId
            );


        if (!playlist) {

            return false;

        }


        const allTracks =
            WaeveMusic.getAll();


        const tracks =
            playlist.trackIds
                .map(
                    id =>
                        allTracks.find(
                            track =>
                                String(
                                    track.id
                                ) ===
                                String(
                                    id
                                )
                        )
                )
                .filter(Boolean);


        if (
            tracks.length === 0
        ) {

            return false;

        }


        const selectedIndex =
            tracks.findIndex(
                track =>
                    String(
                        track.id
                    ) ===
                    String(
                        trackId
                    )
            );


        if (
            selectedIndex === -1
        ) {

            return false;

        }


        this.currentPlaylistId =
            playlist.id;


        this.shuffleEnabled =
            false;


        this.queue =
            tracks;


        this.currentIndex =
            selectedIndex;


        return this.playCurrent();

    },


    /*
     * NEXT TRACK
     */

    playNext() {

        if (
            this.queue.length === 0
        ) {

            return false;

        }


        const nextIndex =
            this.currentIndex + 1;


        if (
            nextIndex >=
            this.queue.length
        ) {

            this.currentIndex =
                -1;


            console.log(
                "Waeve Playlist Player: Playlist finished."
            );


            return false;

        }


        this.currentIndex =
            nextIndex;


        return this.playCurrent();

    },


    /*
     * PREVIOUS TRACK
     */

    playPrevious() {

        if (
            this.queue.length === 0
        ) {

            return false;

        }


        if (
            this.currentIndex <= 0
        ) {

            this.currentIndex =
                0;

            return this.playCurrent();

        }


        this.currentIndex--;


        return this.playCurrent();

    },


    /*
     * HANDLE TRACK END
     */

    handleTrackEnded() {

        if (
            this.queue.length === 0
        ) {

            return false;

        }


        return this.playNext();

    },


    /*
     * SHUFFLE CURRENT QUEUE
     */

    shuffle() {

        if (
            this.queue.length === 0
        ) {

            return false;

        }


        const currentTrack =
            this.getCurrentTrack();


        this.queue =
            this.shuffleArray(
                this.queue
            );


        if (currentTrack) {

            const newIndex =
                this.queue.findIndex(
                    track =>
                        String(
                            track.id
                        ) ===
                        String(
                            currentTrack.id
                        )
                );


            if (
                newIndex !== -1
            ) {

                this.currentIndex =
                    newIndex;

            }

        }


        this.shuffleEnabled =
            true;


        console.log(
            "Waeve Playlist Player: Queue shuffled."
        );


        return true;

    },


    /*
     * SHUFFLE ARRAY
     */

    shuffleArray(
        array
    ) {

        const result =
            Array.isArray(array)
                ? [...array]
                : [];


        for (
            let i =
                result.length - 1;
            i > 0;
            i--
        ) {

            const randomIndex =
                Math.floor(
                    Math.random() *
                    (i + 1)
                );


            const temporary =
                result[i];


            result[i] =
                result[randomIndex];


            result[randomIndex] =
                temporary;

        }


        return result;

    },


    /*
     * GET CURRENT TRACK
     */

    getCurrentTrack() {

        if (
            this.currentIndex < 0 ||
            this.currentIndex >=
                this.queue.length
        ) {

            return null;

        }


        return (
            this.queue[
                this.currentIndex
            ] || null
        );

    },


    /*
     * GET CURRENT PLAYLIST
     */

    getCurrentPlaylist() {

        if (
            !this.currentPlaylistId
        ) {

            return null;

        }


        if (
            !window.WaevePlaylists
        ) {

            return null;

        }


        return WaevePlaylists.getById(
            this.currentPlaylistId
        );

    },


    /*
     * GET QUEUE
     */

    getQueue() {

        return [
            ...this.queue
        ];

    },


    /*
     * GET CURRENT INDEX
     */

    getCurrentIndex() {

        return this.currentIndex;

    },


    /*
     * IS PLAYING PLAYLIST
     */

    isPlayingPlaylist(
        playlistId
    ) {

        return (
            String(
                this.currentPlaylistId
            ) ===
            String(
                playlistId
            ) &&
            this.currentIndex >= 0 &&
            this.currentIndex <
                this.queue.length
        );

    },


    /*
     * IS SHUFFLE ENABLED
     */

    isShuffleEnabled() {

        return this.shuffleEnabled;

    },


    /*
     * CLEAR QUEUE
     */

    clearQueue() {

        this.currentPlaylistId =
            null;

        this.queue =
            [];

        this.currentIndex =
            -1;

        this.shuffleEnabled =
            false;


        console.log(
            "Waeve Playlist Player: Queue cleared."
        );

    }

};


/*
 * GLOBAL ACCESS
 */

window.WaevePlaylistPlayer =
    WaevePlaylistPlayer;


/*
 * START
 */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            WaevePlaylistPlayer.init();

        },
        {
            once: true
        }
    );

} else {

    WaevePlaylistPlayer.init();

}

})();