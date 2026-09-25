/*
 * WAEVE PLAYLIST UI
 * Build: 0.1.0
 *
 * Adds playlist playback controls
 * without modifying the core engines.
 */

(function () {

    "use strict";


    const WaevePlaylistUI = {

        initialized: false,


        /*
         * INITIALIZE
         */

        init() {

            if (this.initialized) {

                return;

            }


            if (!window.WaevePlaylistPlayer) {

                console.error(
                    "Waeve Playlist UI: Playlist Player unavailable."
                );

                return;

            }


            this.initialized = true;


            this.observeInterface();

            this.setupClickHandling();


            console.log(
                "Waeve Playlist UI 0.1.0 ready."
            );

        },


        /*
         * WATCH FOR DYNAMICALLY LOADED PAGES
         */

        observeInterface() {

            const observer =
                new MutationObserver(
                    () => {

                        this.addPlaylistCardControls();

                        this.addPlaylistModalControls();

                    }
                );


            observer.observe(
                document.body,
                {
                    childList: true,
                    subtree: true
                }
            );


            this.addPlaylistCardControls();

            this.addPlaylistModalControls();

        },


        /*
         * ADD CONTROLS TO PLAYLIST CARDS
         */

        addPlaylistCardControls() {

            const cards =
                document.querySelectorAll(
                    ".playlist-card"
                );


            cards.forEach(card => {

                if (
                    card.querySelector(
                        "[data-waeve-play-playlist]"
                    )
                ) {

                    return;

                }


                const openButton =
                    card.querySelector(
                        "[data-open-playlist]"
                    );


                if (!openButton) {

                    return;

                }


                const playlistId =
                    openButton.dataset.openPlaylist;


                if (!playlistId) {

                    return;

                }


                const actions =
                    card.querySelector(
                        ".playlist-card-actions"
                    );


                if (!actions) {

                    return;

                }


                const playButton =
                    document.createElement(
                        "button"
                    );


                playButton.type =
                    "button";


                playButton.textContent =
                    "▶ Play";


                playButton.dataset
                    .waevePlayPlaylist =
                    playlistId;


                actions.insertBefore(
                    playButton,
                    actions.firstChild
                );


                const shuffleButton =
                    document.createElement(
                        "button"
                    );


                shuffleButton.type =
                    "button";


                shuffleButton.textContent =
                    "🔀 Shuffle";


                shuffleButton.dataset
                    .waeveShufflePlaylist =
                    playlistId;


                actions.insertBefore(
                    shuffleButton,
                    playButton.nextSibling
                );

            });

        },


        /*
         * ADD CONTROLS TO PLAYLIST MODAL
         */

        addPlaylistModalControls() {

            const dialogs =
                document.querySelectorAll(
                    ".playlist-view-dialog"
                );


            dialogs.forEach(dialog => {

                if (
                    dialog.querySelector(
                        "[data-waeve-modal-play]"
                    )
                ) {

                    return;

                }


                const content =
                    dialog.querySelector(
                        ".playlist-view-content"
                    );


                if (!content) {

                    return;

                }


                const closeButton =
                    dialog.querySelector(
                        "[data-close-playlist]"
                    );


                if (!closeButton) {

                    return;

                }


                const playlist =
                    this.findPlaylistFromDialog(
                        dialog
                    );


                if (!playlist) {

                    return;

                }


                const actions =
                    document.createElement(
                        "div"
                    );


                actions.className =
                    "playlist-view-actions";


                const playButton =
                    document.createElement(
                        "button"
                    );


                playButton.type =
                    "button";


                playButton.textContent =
                    "▶ Play Playlist";


                playButton.dataset
                    .waeveModalPlay =
                    playlist.id;


                const shuffleButton =
                    document.createElement(
                        "button"
                    );


                shuffleButton.type =
                    "button";


                shuffleButton.textContent =
                    "🔀 Shuffle";


                shuffleButton.dataset
                    .waeveModalShuffle =
                    playlist.id;


                actions.appendChild(
                    playButton
                );


                actions.appendChild(
                    shuffleButton
                );


                const header =
                    content.querySelector(
                        ".playlist-view-header"
                    );


                if (header) {

                    header.insertAdjacentElement(
                        "afterend",
                        actions
                    );

                } else {

                    content.insertBefore(
                        actions,
                        content.firstChild
                    );

                }

            });

        },


        /*
         * FIND PLAYLIST FOR OPEN MODAL
         */

        findPlaylistFromDialog(
            dialog
        ) {

            const removeButton =
                dialog.querySelector(
                    "[data-remove-playlist-track]"
                );


            if (
                removeButton &&
                window.WaevePlaylists
            ) {

                const playlists =
                    WaevePlaylists.getAll();


                /*
                 * A playlist containing the
                 * displayed track is identified
                 * from the modal's song list.
                 *
                 * The modal itself does not expose
                 * the playlist ID, so we use its
                 * heading to identify the playlist.
                 */

                const heading =
                    dialog.querySelector(
                        ".playlist-view-header h2"
                    );


                if (!heading) {

                    return null;

                }


                const name =
                    heading.textContent.trim();


                return playlists.find(
                    playlist =>
                        playlist.name === name
                ) || null;

            }


            /*
             * Also support empty playlists.
             */

            if (
                window.WaevePlaylists
            ) {

                const heading =
                    dialog.querySelector(
                        ".playlist-view-header h2"
                    );


                if (!heading) {

                    return null;

                }


                const name =
                    heading.textContent.trim();


                return WaevePlaylists
                    .getAll()
                    .find(
                        playlist =>
                            playlist.name ===
                            name
                    ) || null;

            }


            return null;

        },


        /*
         * CLICK HANDLING
         */

        setupClickHandling() {

            document.addEventListener(
                "click",
                event => {

                    const playButton =
                        event.target.closest(
                            "[data-waeve-play-playlist]"
                        );


                    if (playButton) {

                        event.preventDefault();


                        const playlistId =
                            playButton.dataset
                                .waevePlayPlaylist;


                        this.playPlaylist(
                            playlistId,
                            false
                        );


                        return;

                    }


                    const shuffleButton =
                        event.target.closest(
                            "[data-waeve-shuffle-playlist]"
                        );


                    if (shuffleButton) {

                        event.preventDefault();


                        const playlistId =
                            shuffleButton.dataset
                                .waeveShufflePlaylist;


                        this.playPlaylist(
                            playlistId,
                            true
                        );


                        return;

                    }


                    const modalPlay =
                        event.target.closest(
                            "[data-waeve-modal-play]"
                        );


                    if (modalPlay) {

                        event.preventDefault();


                        const playlistId =
                            modalPlay.dataset
                                .waeveModalPlay;


                        this.playPlaylist(
                            playlistId,
                            false
                        );


                        return;

                    }


                    const modalShuffle =
                        event.target.closest(
                            "[data-waeve-modal-shuffle]"
                        );


                    if (modalShuffle) {

                        event.preventDefault();


                        const playlistId =
                            modalShuffle.dataset
                                .waeveModalShuffle;


                        this.playPlaylist(
                            playlistId,
                            true
                        );

                    }

                }
            );

        },


        /*
         * PLAY PLAYLIST
         */

        playPlaylist(
            playlistId,
            shuffle
        ) {

            if (
                !window.WaevePlaylistPlayer
            ) {

                console.error(
                    "Waeve Playlist UI: Playlist Player unavailable."
                );

                return;

            }


            const success =
                WaevePlaylistPlayer.playPlaylist(
                    playlistId,
                    shuffle
                );


            if (!success) {

                console.error(
                    "Waeve Playlist UI: Unable to start playlist."
                );

                return;

            }


            console.log(
                shuffle
                    ? "Waeve: Shuffled playlist started."
                    : "Waeve: Playlist started."
            );

        }

    };


    /*
     * GLOBAL ACCESS
     */

    window.WaevePlaylistUI =
        WaevePlaylistUI;


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

                WaevePlaylistUI.init();

            },
            {
                once: true
            }
        );

    } else {

        WaevePlaylistUI.init();

    }

})();