/*
 * WAEVE APPLICATION ENGINE
 * Build: 0.7.0
 *
 * HOME
 * SEARCH
 * LIBRARY
 * LIKED SONGS
 * PLAYLISTS
 * PLAYLIST SONGS
 * PERSISTENT PLAYLIST COVERS
 */

(function () {

    "use strict";


    const WaeveApp = {

        initialized: false,

        likedSongs: new Set(),


        /*
         * START APPLICATION
         */

        start() {

            if (this.initialized) {

                return;

            }


            if (!window.WaeveRouter) {

                console.error(
                    "Waeve App: Router unavailable."
                );

                return;

            }


            if (!window.WaeveMusic) {

                console.error(
                    "Waeve App: Music engine unavailable."
                );

                return;

            }


            if (!window.WaevePlaylists) {

                console.error(
                    "Waeve App: Playlist engine unavailable."
                );

                return;

            }


            console.log(
                `Starting ${WAEVE_CONFIG.appName} ${WAEVE_CONFIG.version}`
            );


            this.loadLikedSongs();

            this.registerRoutes();

            this.setupNavigation();

            this.setupRouterIntegration();

            this.initialized = true;


            WaeveRouter.navigate("home");

        },


        /*
         * ROUTES
         */

        registerRoutes() {

            WaeveRouter.register(
                "home",
                "pages/home.html"
            );


            WaeveRouter.register(
                "search",
                "pages/search.html"
            );


            WaeveRouter.register(
                "library",
                "pages/library.html"
            );

        },


        /*
         * NAVIGATION
         */

        setupNavigation() {

            const buttons =
                document.querySelectorAll(
                    "[data-page]"
                );


            buttons.forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        WaeveRouter.navigate(
                            button.dataset.page
                        );

                    }
                );

            });

        },


        /*
         * ROUTER INTEGRATION
         */

        setupRouterIntegration() {

            const originalNavigate =
                WaeveRouter.navigate.bind(
                    WaeveRouter
                );


            WaeveRouter.navigate =
                async name => {

                    await originalNavigate(name);

                    this.initializePage(name);

                };

        },


        /*
         * PAGE INITIALIZATION
         */

        initializePage(name) {

            switch (name) {

                case "home":

                    this.initializeHome();

                    break;


                case "search":

                    this.initializeSearch();

                    break;


                case "library":

                    this.initializeLibrary();

                    break;

            }

        },


        /*
         * HOME
         */

        initializeHome() {

            console.log(
                "Waeve Home initialized."
            );

        },


        /*
         * LIKED SONGS
         */

        loadLikedSongs() {

            try {

                const saved =
                    localStorage.getItem(
                        "waeve-liked-songs"
                    );


                if (!saved) {

                    this.likedSongs =
                        new Set();

                    return;

                }


                const parsed =
                    JSON.parse(saved);


                if (
                    !Array.isArray(parsed)
                ) {

                    this.likedSongs =
                        new Set();

                    return;

                }


                this.likedSongs =
                    new Set(parsed);

            } catch (error) {

                console.error(
                    "Waeve: Unable to load liked songs.",
                    error
                );

                this.likedSongs =
                    new Set();

            }

        },


        saveLikedSongs() {

            try {

                localStorage.setItem(
                    "waeve-liked-songs",
                    JSON.stringify(
                        Array.from(
                            this.likedSongs
                        )
                    )
                );

            } catch (error) {

                console.error(
                    "Waeve: Unable to save liked songs.",
                    error
                );

            }

        },


        isLiked(trackId) {

            return this.likedSongs.has(
                String(trackId)
            );

        },


        toggleLike(trackId) {

            const id =
                String(trackId);


            if (
                this.likedSongs.has(id)
            ) {

                this.likedSongs.delete(id);

            } else {

                this.likedSongs.add(id);

            }


            this.saveLikedSongs();

            this.refreshCurrentPage();

        },


        refreshCurrentPage() {

            if (
                !WaeveRouter.currentRoute
            ) {

                return;

            }


            this.initializePage(
                WaeveRouter.currentRoute
            );

        },


        /*
         * LIBRARY
         */

        initializeLibrary() {

            const songList =
                document.getElementById(
                    "library-song-list"
                );


            const likedList =
                document.getElementById(
                    "library-liked-list"
                );


            const playlistList =
                document.getElementById(
                    "playlist-list"
                );


            const songCount =
                document.getElementById(
                    "library-song-count"
                );


            const likedCount =
                document.getElementById(
                    "library-liked-count"
                );


            const createButton =
                document.getElementById(
                    "create-playlist-button"
                );


            if (!songList) {

                return;

            }


            const tracks =
                WaeveMusic.getAll();


            /*
             * SONG COUNT
             */

            if (songCount) {

                songCount.textContent =
                    tracks.length === 1
                        ? "1 song"
                        : `${tracks.length} songs`;

            }


            /*
             * ALL SONGS
             */

            songList.innerHTML =
                tracks.length === 0

                    ? `

                        <div class="empty-state">

                            <p>
                                Your library is currently empty.
                            </p>

                        </div>

                    `

                    : tracks
                        .map(
                            (track, index) =>
                                this.createSongCard(
                                    track,
                                    index
                                )
                        )
                        .join("");


            /*
             * LIKED SONGS
             */

            const likedTracks =
                tracks.filter(
                    track =>
                        this.isLiked(track.id)
                );


            if (likedCount) {

                likedCount.textContent =
                    likedTracks.length === 1
                        ? "1 song"
                        : `${likedTracks.length} songs`;

            }


            if (likedList) {

                likedList.innerHTML =
                    likedTracks.length === 0

                        ? `

                            <div class="empty-state">

                                <h3>
                                    No liked songs yet
                                </h3>

                                <p>
                                    Songs you like will appear here.
                                </p>

                            </div>

                        `

                        : likedTracks
                            .map(track => {

                                const index =
                                    tracks.findIndex(
                                        item =>
                                            item.id ===
                                            track.id
                                    );


                                return this.createSongCard(
                                    track,
                                    index
                                );

                            })
                            .join("");

            }


            /*
             * PLAYLISTS
             */

            this.renderPlaylists(
                playlistList,
                tracks
            );


            /*
             * CREATE PLAYLIST
             */

            if (createButton) {

                createButton.onclick =
                    () => {

                        this.openPlaylistDialog();

                    };

            }


            this.connectSongButtons(
                songList
            );


            this.connectSongButtons(
                likedList
            );


            console.log(
                "Waeve Library initialized:",
                tracks.length,
                "track(s),",
                likedTracks.length,
                "liked."
            );

        },


        /*
         * SONG CARD
         */

        createSongCard(
            track,
            index
        ) {

            const liked =
                this.isLiked(track.id);


            return `

                <article class="music-card">

                    <div class="music-card-number">
                        ${index + 1}
                    </div>


                    <div class="music-card-info">

                        <strong>
                            ${this.escapeHTML(
                                track.title
                            )}
                        </strong>


                        <span>
                            ${this.escapeHTML(
                                track.artist
                            )}

                            ${
                                track.album
                                    ? " • " +
                                      this.escapeHTML(
                                          track.album
                                      )
                                    : ""
                            }
                        </span>

                    </div>


                    <button
                        type="button"
                        class="music-card-playlist"
                        data-add-playlist="${this.escapeHTML(
                            track.id
                        )}"
                        aria-label="Add ${
                            this.escapeHTML(
                                track.title
                            )
                        } to playlist"
                    >
                        +
                    </button>


                    <button
                        type="button"
                        class="music-card-like ${
                            liked ? "liked" : ""
                        }"
                        data-like-id="${this.escapeHTML(
                            track.id
                        )}"
                    >
                        ${
                            liked
                                ? "♥"
                                : "♡"
                        }
                    </button>


                    <button
                        type="button"
                        class="music-card-play"
                        data-play-index="${index}"
                    >
                        ▶
                    </button>

                </article>

            `;

        },


        /*
         * CONNECT SONG BUTTONS
         */

        connectSongButtons(container) {

            if (!container) {

                return;

            }


            /*
             * PLAY
             */

            const playButtons =
                container.querySelectorAll(
                    "[data-play-index]"
                );


            playButtons.forEach(button => {

                button.onclick =
                    () => {

                        const index =
                            Number(
                                button.dataset.playIndex
                            );


                        if (
                            !Number.isInteger(index)
                        ) {

                            return;

                        }


                        if (
                            !window.WaevePlayer
                        ) {

                            console.error(
                                "Waeve: Music player unavailable."
                            );

                            return;

                        }


                        WaevePlayer.loadTrack(
                            index,
                            true
                        );

                    };

            });


            /*
             * LIKE
             */

            const likeButtons =
                container.querySelectorAll(
                    "[data-like-id]"
                );


            likeButtons.forEach(button => {

                button.onclick =
                    () => {

                        this.toggleLike(
                            button.dataset.likeId
                        );

                    };

            });


            /*
             * ADD TO PLAYLIST
             */

            const playlistButtons =
                container.querySelectorAll(
                    "[data-add-playlist]"
                );


            playlistButtons.forEach(button => {

                button.onclick =
                    () => {

                        this.openAddToPlaylistDialog(
                            button.dataset.addPlaylist
                        );

                    };

            });

        },


        /*
         * PLAYLIST LIST
         */

        renderPlaylists(
            container,
            tracks
        ) {

            if (!container) {

                return;

            }


            const playlists =
                WaevePlaylists.getAll();


            if (
                !Array.isArray(playlists) ||
                playlists.length === 0
            ) {

                container.innerHTML = `

                    <div class="empty-state">

                        <h3>
                            No playlists yet
                        </h3>

                        <p>
                            Create your first playlist.
                        </p>

                    </div>

                `;

                return;

            }


            container.innerHTML =
                playlists
                    .map(
                        playlist => {

                            /*
                             * New playlists receive
                             * coverNumber from the
                             * playlist engine.
                             *
                             * Older playlists may not
                             * have coverNumber, so a
                             * stable number is generated
                             * from their unique ID.
                             */

                            let coverNumber =
                                Number(
                                    playlist.coverNumber
                                );


                            if (
                                !Number.isInteger(
                                    coverNumber
                                ) ||
                                coverNumber < 1 ||
                                coverNumber > 6
                            ) {

                                coverNumber =
                                    String(
                                        playlist.id || ""
                                    )
                                        .split("")
                                        .reduce(
                                            (
                                                total,
                                                character
                                            ) => {

                                                return (
                                                    total +
                                                    character.charCodeAt(0)
                                                );

                                            },
                                            0
                                        ) % 6 + 1;

                            }


                            /*
                             * Save the generated
                             * cover number to older
                             * playlists.
                             */

                            if (
                                Number(
                                    playlist.coverNumber
                                ) !==
                                coverNumber
                            ) {

                                playlist.coverNumber =
                                    coverNumber;

                            }


                            const trackIds =
                                Array.isArray(
                                    playlist.trackIds
                                )
                                    ? playlist.trackIds
                                    : [];


                            const count =
                                trackIds.length;


                            return `

                                <article
                                    class="playlist-card"
                                    data-playlist-card="${this.escapeHTML(
                                        playlist.id
                                    )}"
                                >

                                    <div
                                        class="playlist-card-cover playlist-cover-${coverNumber}"
                                        aria-hidden="true"
                                    >

                                        <span>
                                            ♪
                                        </span>

                                    </div>


                                    <div
                                        class="playlist-card-content"
                                    >

                                        <h3>
                                            ${this.escapeHTML(
                                                playlist.name
                                            )}
                                        </h3>


                                        <p>
                                            ${
                                                count === 1
                                                    ? "1 song"
                                                    : `${count} songs`
                                            }
                                        </p>

                                    </div>


                                    <div
                                        class="playlist-card-actions"
                                    >

                                        <button
                                            type="button"
                                            data-open-playlist="${this.escapeHTML(
                                                playlist.id
                                            )}"
                                        >
                                            Open
                                        </button>


                                        <button
                                            type="button"
                                            data-delete-playlist="${this.escapeHTML(
                                                playlist.id
                                            )}"
                                        >
                                            Delete
                                        </button>

                                    </div>


                                    <button
                                        type="button"
                                        class="playlist-change-cover"
                                        data-change-playlist-cover="${this.escapeHTML(
                                            playlist.id
                                        )}"
                                    >
                                        🎨 Change Cover
                                    </button>

                                </article>

                            `;

                        }
                    )
                    .join("");


            /*
             * Save generated cover numbers
             * for older playlists.
             */

            try {

                WaevePlaylists.save();

            } catch (error) {

                console.error(
                    "Waeve: Unable to save playlist covers.",
                    error
                );

            }


            /*
             * OPEN PLAYLIST
             */

            container
                .querySelectorAll(
                    "[data-open-playlist]"
                )
                .forEach(button => {

                    button.onclick =
                        () => {

                            this.openPlaylist(
                                button.dataset
                                    .openPlaylist
                            );

                        };

                });


            /*
             * DELETE PLAYLIST
             */

            container
                .querySelectorAll(
                    "[data-delete-playlist]"
                )
                .forEach(button => {

                    button.onclick =
                        () => {

                            this.deletePlaylist(
                                button.dataset
                                    .deletePlaylist
                            );

                        };

                });


            /*
             * CHANGE COVER
             */

            container
                .querySelectorAll(
                    "[data-change-playlist-cover]"
                )
                .forEach(button => {

                    button.onclick =
                        () => {

                            const playlistId =
                                button.dataset
                                    .changePlaylistCover;


                            if (!playlistId) {

                                return;

                            }


                            const playlist =
                                WaevePlaylists.getById(
                                    playlistId
                                );


                            if (!playlist) {

                                return;

                            }


                            let currentCover =
                                Number(
                                    playlist.coverNumber
                                );


                            if (
                                !Number.isInteger(
                                    currentCover
                                ) ||
                                currentCover < 1 ||
                                currentCover > 6
                            ) {

                                currentCover = 1;

                            }


                            let nextCover =
                                currentCover + 1;


                            if (
                                nextCover > 6
                            ) {

                                nextCover = 1;

                            }


                            playlist.coverNumber =
                                nextCover;


                            try {

                                WaevePlaylists.save();

                            } catch (error) {

                                console.error(
                                    "Waeve: Unable to save playlist cover.",
                                    error
                                );

                                return;

                            }


                            this.initializeLibrary();

                        };

                });

        },


        /*
         * CREATE PLAYLIST DIALOG
         */

        openPlaylistDialog() {

            const dialog =
                document.getElementById(
                    "playlist-dialog"
                );


            const input =
                document.getElementById(
                    "playlist-name-input"
                );


            const cancel =
                document.getElementById(
                    "cancel-playlist-button"
                );


            const save =
                document.getElementById(
                    "save-playlist-button"
                );


            if (
                !dialog ||
                !input ||
                !cancel ||
                !save
            ) {

                console.error(
                    "Waeve: Playlist dialog unavailable."
                );

                return;

            }


            dialog.hidden =
                false;


            input.value =
                "";


            input.focus();


            const close =
                () => {

                    dialog.hidden =
                        true;

                };


            cancel.onclick =
                close;


            save.onclick =
                () => {

                    const name =
                        input.value.trim();


                    if (!name) {

                        input.focus();

                        return;

                    }


                    const playlist =
                        WaevePlaylists.create(
                            name
                        );


                    if (!playlist) {

                        return;

                    }


                    close();

                    this.initializeLibrary();

                };


            input.onkeydown =
                event => {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();

                        save.click();

                    }


                    if (
                        event.key ===
                        "Escape"
                    ) {

                        close();

                    }

                };

        },


        /*
         * ADD SONG TO PLAYLIST DIALOG
         */

        openAddToPlaylistDialog(
            trackId
        ) {

            const playlists =
                WaevePlaylists.getAll();


            if (
                playlists.length === 0
            ) {

                window.alert(
                    "Create a playlist first."
                );

                return;

            }


            const track =
                WaeveMusic.getAll().find(
                    item =>
                        String(item.id) ===
                        String(trackId)
                );


            if (!track) {

                return;

            }


            const available =
                playlists.filter(
                    playlist =>
                        !WaevePlaylists.hasTrack(
                            playlist.id,
                            trackId
                        )
                );


            if (
                available.length === 0
            ) {

                window.alert(
                    "This song is already in all your playlists."
                );

                return;

            }


            const choices =
                available
                    .map(
                        (playlist, index) =>
                            `${index + 1}. ${playlist.name}`
                    )
                    .join("\n");


            const answer =
                window.prompt(
                    `Add "${track.title}" to which playlist?\n\n${choices}\n\nEnter the playlist number:`
                );


            if (
                answer === null
            ) {

                return;

            }


            const choice =
                Number(
                    answer.trim()
                );


            if (
                !Number.isInteger(choice) ||
                choice < 1 ||
                choice > available.length
            ) {

                window.alert(
                    "Invalid playlist number."
                );

                return;

            }


            const playlist =
                available[
                    choice - 1
                ];


            const added =
                WaevePlaylists.addTrack(
                    playlist.id,
                    trackId
                );


            if (!added) {

                window.alert(
                    "The song could not be added."
                );

                return;

            }


            window.alert(
                `"${track.title}" added to "${playlist.name}".`
            );


            this.initializeLibrary();

        },


        /*
         * OPEN PLAYLIST
         */

        openPlaylist(id) {

            const playlist =
                WaevePlaylists.getById(
                    id
                );


            if (!playlist) {

                return;

            }


            const tracks =
                WaeveMusic.getAll();


            const playlistTracks =
                playlist.trackIds
                    .map(
                        trackId =>
                            tracks.find(
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


            const dialog =
                document.createElement(
                    "div"
                );


            dialog.className =
                "playlist-view-dialog";


            dialog.innerHTML = `

                <div
                    class="playlist-view-content"
                >

                    <div
                        class="playlist-view-header"
                    >

                        <div>

                            <h2>
                                ${this.escapeHTML(
                                    playlist.name
                                )}
                            </h2>

                            <p>
                                ${
                                    playlistTracks.length === 1
                                        ? "1 song"
                                        : `${playlistTracks.length} songs`
                                }
                            </p>

                        </div>


                        <button
                            type="button"
                            data-close-playlist
                        >
                            ✕
                        </button>

                    </div>


                    <div
                        class="playlist-song-list"
                    >

                        ${
                            playlistTracks.length === 0

                                ? `

                                    <div class="empty-state">

                                        <p>
                                            This playlist is empty.
                                        </p>

                                        <p>
                                            Use the + button beside a song to add music.
                                        </p>

                                    </div>

                                `

                                : playlistTracks
                                    .map(
                                        track => `

                                            <div
                                                class="playlist-song-row"
                                            >

                                                <div
                                                    class="playlist-song-info"
                                                >

                                                    <strong>
                                                        ${this.escapeHTML(
                                                            track.title
                                                        )}
                                                    </strong>

                                                    <span>
                                                        ${this.escapeHTML(
                                                            track.artist
                                                        )}
                                                    </span>

                                                </div>


                                                <button
                                                    type="button"
                                                    data-play-playlist-track="${this.escapeHTML(
                                                        track.id
                                                    )}"
                                                >
                                                    ▶
                                                </button>


                                                <button
                                                    type="button"
                                                    class="playlist-remove-song"
                                                    data-remove-playlist-track="${this.escapeHTML(
                                                        track.id
                                                    )}"
                                                >
                                                    Remove
                                                </button>

                                            </div>

                                        `
                                    )
                                    .join("")
                        }

                    </div>

                </div>

            `;


            document.body.appendChild(
                dialog
            );


            dialog
                .querySelector(
                    "[data-close-playlist]"
                )
                .onclick =
                    () => {

                        dialog.remove();

                    };


            /*
             * PLAY SONG
             */

            dialog
                .querySelectorAll(
                    "[data-play-playlist-track]"
                )
                .forEach(button => {

                    button.onclick =
                        () => {

                            const trackId =
                                button.dataset
                                    .playPlaylistTrack;


                            const index =
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
                                index === -1
                            ) {

                                return;

                            }


                            if (
                                !window.WaevePlayer
                            ) {

                                console.error(
                                    "Waeve: Music player unavailable."
                                );

                                return;

                            }


                            WaevePlayer.loadTrack(
                                index,
                                true
                            );

                        };

                });


            /*
             * REMOVE SONG
             */

            dialog
                .querySelectorAll(
                    "[data-remove-playlist-track]"
                )
                .forEach(button => {

                    button.onclick =
                        () => {

                            const trackId =
                                button.dataset
                                    .removePlaylistTrack;


                            WaevePlaylists.removeTrack(
                                id,
                                trackId
                            );


                            dialog.remove();


                            this.openPlaylist(
                                id
                            );


                            this.initializeLibrary();

                        };

                });

        },


        /*
         * DELETE PLAYLIST
         */

        deletePlaylist(id) {

            const playlist =
                WaevePlaylists.getById(
                    id
                );


            if (!playlist) {

                return;

            }


            const confirmed =
                window.confirm(
                    `Delete "${playlist.name}"?`
                );


            if (!confirmed) {

                return;

            }


            WaevePlaylists.delete(
                id
            );


            this.initializeLibrary();

        },


        /*
         * SEARCH
         */

        initializeSearch() {

            const input =
                document.getElementById(
                    "waeve-search-input"
                );


            const results =
                document.getElementById(
                    "search-results"
                );


            const resultCount =
                document.getElementById(
                    "search-result-count"
                );


            if (
                !input ||
                !results
            ) {

                return;

            }


            input.value =
                "";


            if (resultCount) {

                resultCount.textContent =
                    "0 results";

            }


            results.innerHTML = `

                <div class="empty-state">

                    <p>
                        Start typing to search Waeve.
                    </p>

                </div>

            `;


            const performSearch =
                () => {

                    const query =
                        input.value.trim();


                    if (!query) {

                        if (resultCount) {

                            resultCount.textContent =
                                "0 results";

                        }


                        results.innerHTML = `

                            <div class="empty-state">

                                <p>
                                    Start typing to search Waeve.
                                </p>

                            </div>

                        `;

                        return;

                    }


                    const matches =
                        WaeveMusic.search(
                            query
                        );


                    if (resultCount) {

                        resultCount.textContent =
                            matches.length === 1
                                ? "1 result"
                                : `${matches.length} results`;

                    }


                    if (
                        matches.length === 0
                    ) {

                        results.innerHTML = `

                            <div class="empty-state">

                                <h3>
                                    No results found
                                </h3>

                                <p>
                                    Try another song, artist or album.
                                </p>

                            </div>

                        `;

                        return;

                    }


                    const allTracks =
                        WaeveMusic.getAll();


                    results.innerHTML =
                        matches
                            .map(track => {

                                const index =
                                    allTracks.findIndex(
                                        item =>
                                            item.id ===
                                            track.id
                                    );


                                const liked =
                                    this.isLiked(
                                        track.id
                                    );


                                return `

                                    <article
                                        class="music-card"
                                    >

                                        <div
                                            class="music-card-number"
                                        >
                                            🎵
                                        </div>


                                        <div
                                            class="music-card-info"
                                        >

                                            <strong>
                                                ${this.escapeHTML(
                                                    track.title
                                                )}
                                            </strong>


                                            <span>
                                                ${this.escapeHTML(
                                                    track.artist
                                                )}

                                                ${
                                                    track.album
                                                        ? " • " +
                                                          this.escapeHTML(
                                                              track.album
                                                          )
                                                        : ""
                                                }
                                            </span>

                                        </div>


                                        <button
                                            type="button"
                                            class="music-card-playlist"
                                            data-add-playlist="${this.escapeHTML(
                                                track.id
                                            )}"
                                        >
                                            +
                                        </button>


                                        <button
                                            type="button"
                                            class="music-card-like ${
                                                liked
                                                    ? "liked"
                                                    : ""
                                            }"
                                            data-like-id="${this.escapeHTML(
                                                track.id
                                            )}"
                                        >
                                            ${
                                                liked
                                                    ? "♥"
                                                    : "♡"
                                            }
                                        </button>


                                        <button
                                            type="button"
                                            class="music-card-play"
                                            data-play-index="${index}"
                                        >
                                            ▶
                                        </button>

                                    </article>

                                `;

                            })
                            .join("");


                    this.connectSongButtons(
                        results
                    );

                };


            input.oninput =
                performSearch;


            console.log(
                "Waeve Search initialized."
            );

        },


        /*
         * ESCAPE HTML
         */

        escapeHTML(value) {

            return String(
                value || ""
            )
                .replace(
                    /&/g,
                    "&amp;"
                )
                .replace(
                    /</g,
                    "&lt;"
                )
                .replace(
                    />/g,
                    "&gt;"
                )
                .replace(
                    /"/g,
                    "&quot;"
                )
                .replace(
                    /'/g,
                    "&#039;"
                );

        }

    };


    /*
     * GLOBAL APPLICATION
     */

    window.WaeveApp =
        WaeveApp;


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

                WaeveApp.start();

            },
            {
                once: true
            }
        );

    } else {

        WaeveApp.start();

    }

})();