/*
 * WAEVE LIBRARY PLAYLIST UI
 * Build: 0.6.0
 *
 * Handles:
 * - Library playlist display
 * - Create playlist
 * - Play playlist
 * - Shuffle playlist
 * - Open playlist
 * - Display playlist songs
 * - Play individual playlist songs
 * - Remove playlist songs
 * - Delete playlist
 * - Playlist covers
 * - Change playlist cover
 * - Add song to playlist
 * - Playlist selection for song cards
 */

(function () {

    "use strict";


    const WaeveLibraryPlaylistUI = {

        initialized: false,


        /*
         * INITIALIZE
         */

        init() {

            if (this.initialized) {

                return;

            }


            if (!window.WaevePlaylists) {

                console.error(
                    "Waeve Library Playlist UI: Playlist engine unavailable."
                );

                return;

            }


            this.initialized = true;

            this.setupClickHandling();

            this.watchRouter();


            console.log(
                "Waeve Library Playlist UI 0.6.0 ready."
            );

        },


        /*
         * WATCH ROUTER
         */

        watchRouter() {

            if (
                !window.WaeveRouter ||
                typeof WaeveRouter.navigate !==
                    "function"
            ) {

                console.error(
                    "Waeve Library Playlist UI: Router unavailable."
                );

                return;

            }


            const originalNavigate =
                WaeveRouter.navigate;


            if (
                originalNavigate.__waeveLibraryWrapped
            ) {

                return;

            }


            const self = this;


            const wrappedNavigate =
                async function (name) {

                    const result =
                        await originalNavigate.call(
                            this,
                            name
                        );


                    if (
                        name === "library"
                    ) {

                        self.render();

                    }


                    return result;

                };


            wrappedNavigate
                .__waeveLibraryWrapped = true;


            WaeveRouter.navigate =
                wrappedNavigate;

        },


        /*
         * RENDER LIBRARY PLAYLIST SECTION
         */

        render() {

            const content =
                document.getElementById(
                    "waeve-content"
                );


            if (!content) {

                return;

            }


            const page =
                content.querySelector(
                    ".page"
                );


            if (!page) {

                return;

            }


            const existing =
                page.querySelector(
                    "#waeve-library-playlists"
                );


            if (existing) {

                this.refreshPlaylistList();

                return;

            }


            const section =
                document.createElement(
                    "section"
                );


            section.id =
                "waeve-library-playlists";


            section.className =
                "library-playlists";


            section.innerHTML = `

                <div
                    class="library-playlists-header"
                >

                    <div>

                        <h2 class="section-title">
                            Your Playlists
                        </h2>

                        <p class="page-description">
                            Create and organize your music.
                        </p>

                    </div>


                    <button
                        type="button"
                        id="waeve-create-playlist"
                        class="waeve-create-playlist"
                    >
                        + Create Playlist
                    </button>

                </div>


                <div
                    id="waeve-playlist-list"
                    class="waeve-playlist-list"
                >
                </div>

            `;


            page.appendChild(
                section
            );


            this.refreshPlaylistList();

        },


        /*
         * REFRESH PLAYLIST LIST
         */

        refreshPlaylistList() {

            const container =
                document.getElementById(
                    "waeve-playlist-list"
                );


            if (!container) {

                return;

            }


            if (
                !window.WaevePlaylists
            ) {

                container.innerHTML = `

                    <div class="empty-state">

                        <p>
                            Playlist engine unavailable.
                        </p>

                    </div>

                `;

                return;

            }


            const playlists =
                WaevePlaylists.getAll();


            if (
                !Array.isArray(
                    playlists
                ) ||
                playlists.length === 0
            ) {

                container.innerHTML = `

                    <div class="empty-state">

                        <h3>
                            No playlists yet
                        </h3>

                        <p>
                            Create your first playlist
                            and start adding music.
                        </p>

                    </div>

                `;

                return;

            }


            container.innerHTML =
                playlists
                    .map(
                        playlist =>
                            this.createPlaylistCard(
                                playlist
                            )
                    )
                    .join("");

        },


        /*
         * CREATE PLAYLIST CARD
         */

        createPlaylistCard(
            playlist
        ) {

            const trackIds =
                Array.isArray(
                    playlist.trackIds
                )
                    ? playlist.trackIds
                    : [];


            const count =
                trackIds.length;


            const songs =
                count === 1
                    ? "1 song"
                    : `${count} songs`;


            const coverNumber =
                WaevePlaylists.getCover(
                    playlist.id
                );


            return `

                <article
                    class="waeve-playlist-card"
                    data-playlist-card="${this.escapeHTML(
                        playlist.id
                    )}"
                >

                    <div
                        class="waeve-playlist-cover waeve-playlist-cover-${coverNumber}"
                        data-playlist-cover="${this.escapeHTML(
                            playlist.id
                        )}"
                    >

                        <span>
                            ♪
                        </span>

                    </div>


                    <div
                        class="waeve-playlist-card-info"
                    >

                        <h3>
                            ${this.escapeHTML(
                                playlist.name
                            )}
                        </h3>


                        <p>
                            ${songs}
                        </p>

                    </div>


                    <div
                        class="waeve-playlist-card-actions"
                    >

                        <button
                            type="button"
                            data-library-play="${this.escapeHTML(
                                playlist.id
                            )}"
                        >
                            ▶ Play
                        </button>


                        <button
                            type="button"
                            data-library-shuffle="${this.escapeHTML(
                                playlist.id
                            )}"
                        >
                            🔀 Shuffle
                        </button>


                        <button
                            type="button"
                            data-library-open="${this.escapeHTML(
                                playlist.id
                            )}"
                        >
                            Open
                        </button>


                        <button
                            type="button"
                            data-library-delete="${this.escapeHTML(
                                playlist.id
                            )}"
                        >
                            Delete
                        </button>

                    </div>

                </article>

            `;

        },


        /*
         * CLICK HANDLING
         */

        setupClickHandling() {

            document.addEventListener(
                "click",
                event => {


                    /*
                     * ADD SONG TO PLAYLIST
                     */

                    const addSongButton =
                        event.target.closest(
                            "[data-playlist-add]"
                        );


                    if (addSongButton) {

                        event.preventDefault();

                        this.handleSongCardAdd(
                            addSongButton
                        );

                        return;

                    }


                    /*
                     * CLOSE ADD-TO-PLAYLIST PICKER
                     */

                    const closePicker =
                        event.target.closest(
                            "[data-close-playlist-picker]"
                        );


                    if (closePicker) {

                        event.preventDefault();

                        const picker =
                            document.querySelector(
                                "[data-waeve-playlist-picker]"
                            );


                        if (picker) {

                            picker.remove();

                        }

                        return;

                    }


                    /*
                     * SELECT PLAYLIST
                     */

                    const selectPlaylist =
                        event.target.closest(
                            "[data-add-song-to-playlist]"
                        );


                    if (selectPlaylist) {

                        event.preventDefault();

                        this.addSongToSelectedPlaylist(
                            selectPlaylist.dataset
                                .addSongToPlaylist,
                            selectPlaylist.dataset
                                .trackId
                        );

                        return;

                    }


                    /*
                     * CREATE
                     */

                    const createButton =
                        event.target.closest(
                            "#waeve-create-playlist"
                        );


                    if (createButton) {

                        event.preventDefault();

                        this.createPlaylist();

                        return;

                    }


                    /*
                     * CREATE PLAYLIST FROM PICKER
                     */

                    const pickerCreate =
                        event.target.closest(
                            "[data-picker-create-playlist]"
                        );


                    if (pickerCreate) {

                        event.preventDefault();

                        this.createPlaylistFromPicker();

                        return;

                    }


                    /*
                     * PLAY PLAYLIST
                     */

                    const playButton =
                        event.target.closest(
                            "[data-library-play]"
                        );


                    if (playButton) {

                        event.preventDefault();

                        this.playPlaylist(
                            playButton.dataset
                                .libraryPlay,
                            false
                        );

                        return;

                    }


                    /*
                     * SHUFFLE PLAYLIST
                     */

                    const shuffleButton =
                        event.target.closest(
                            "[data-library-shuffle]"
                        );


                    if (shuffleButton) {

                        event.preventDefault();

                        this.playPlaylist(
                            shuffleButton.dataset
                                .libraryShuffle,
                            true
                        );

                        return;

                    }


                    /*
                     * OPEN PLAYLIST
                     */

                    const openButton =
                        event.target.closest(
                            "[data-library-open]"
                        );


                    if (openButton) {

                        event.preventDefault();

                        this.openPlaylist(
                            openButton.dataset
                                .libraryOpen
                        );

                        return;

                    }


                    /*
                     * DELETE PLAYLIST
                     */

                    const deleteButton =
                        event.target.closest(
                            "[data-library-delete]"
                        );


                    if (deleteButton) {

                        event.preventDefault();

                        this.deletePlaylist(
                            deleteButton.dataset
                                .libraryDelete
                        );

                        return;

                    }


                    /*
                     * PLAY INDIVIDUAL SONG
                     */

                    const songPlayButton =
                        event.target.closest(
                            "[data-play-playlist-song]"
                        );


                    if (songPlayButton) {

                        event.preventDefault();

                        this.playPlaylistSong(
                            songPlayButton.dataset
                                .playPlaylistSong
                        );

                        return;

                    }


                    /*
                     * REMOVE SONG
                     */

                    const removeSongButton =
                        event.target.closest(
                            "[data-remove-playlist-song]"
                        );


                    if (removeSongButton) {

                        event.preventDefault();

                        this.removePlaylistSong(
                            removeSongButton.dataset
                                .removePlaylistSong,
                            removeSongButton.dataset
                                .playlistId
                        );

                        return;

                    }


                    /*
                     * CHANGE COVER
                     */

                    const changeCoverButton =
                        event.target.closest(
                            "[data-change-playlist-cover]"
                        );


                    if (changeCoverButton) {

                        event.preventDefault();

                        this.openCoverPicker(
                            changeCoverButton.dataset
                                .changePlaylistCover
                        );

                        return;

                    }


                    /*
                     * SELECT COVER
                     */

                    const coverButton =
                        event.target.closest(
                            "[data-select-playlist-cover]"
                        );


                    if (coverButton) {

                        event.preventDefault();

                        this.changeCover(
                            coverButton.dataset
                                .selectPlaylistCover,
                            coverButton.dataset
                                .coverNumber
                        );

                    }

                }
            );

        },


        /*
         * HANDLE SONG CARD ADD
         *
         * Finds the song represented by
         * the clicked song card.
         */

        handleSongCardAdd(
            button
        ) {

            if (
                !window.WaeveMusic ||
                typeof WaeveMusic.getAll !==
                    "function"
            ) {

                console.error(
                    "Waeve Library Playlist UI: Music engine unavailable."
                );

                return;

            }


            const card =
                button.closest(
                    ".song-card"
                );


            if (!card) {

                console.error(
                    "Waeve Library Playlist UI: Song card not found."
                );

                return;

            }


            const titleElement =
                card.querySelector(
                    "h3"
                );


            const artistElement =
                card.querySelector(
                    "p"
                );


            const title =
                titleElement
                    ? titleElement.textContent
                        .trim()
                    : "";


            const artist =
                artistElement
                    ? artistElement.textContent
                        .trim()
                    : "";


            if (!title) {

                console.error(
                    "Waeve Library Playlist UI: Song title unavailable."
                );

                return;

            }


            const tracks =
                WaeveMusic.getAll();


            const track =
                tracks.find(
                    item => {

                        const itemTitle =
                            String(
                                item.title || ""
                            )
                                .trim();


                        const itemArtist =
                            String(
                                item.artist || ""
                            )
                                .trim();


                        return (
                            itemTitle === title &&
                            (
                                !artist ||
                                itemArtist === artist
                            )
                        );

                    }
                );


            if (!track) {

                console.error(
                    "Waeve Library Playlist UI: Unable to identify song.",
                    title,
                    artist
                );

                return;

            }


            this.openPlaylistPicker(
                track
            );

        },


        /*
         * OPEN PLAYLIST PICKER
         */

        openPlaylistPicker(
            track
        ) {

            if (
                !window.WaevePlaylists
            ) {

                console.error(
                    "Waeve Library Playlist UI: Playlist engine unavailable."
                );

                return;

            }


            const existing =
                document.querySelector(
                    "[data-waeve-playlist-picker]"
                );


            if (existing) {

                existing.remove();

            }


            const playlists =
                WaevePlaylists.getAll();


            const overlay =
                document.createElement(
                    "div"
                );


            overlay.className =
                "waeve-playlist-picker-overlay";


            overlay.dataset
                .waevePlaylistPicker =
                "true";


            const playlistHTML =
                playlists.length === 0

                    ? `

                        <div class="empty-state">

                            <p>
                                You don't have any playlists yet.
                            </p>

                        </div>

                    `

                    : playlists
                        .map(
                            playlist => {

                                const alreadyAdded =
                                    Array.isArray(
                                        playlist.trackIds
                                    ) &&
                                    playlist.trackIds.some(
                                        id =>
                                            String(id) ===
                                            String(track.id)
                                    );


                                return `

                                    <button
                                        type="button"
                                        class="waeve-playlist-picker-item"
                                        ${
                                            alreadyAdded
                                                ? "disabled"
                                                : ""
                                        }
                                        data-add-song-to-playlist="${this.escapeHTML(
                                            playlist.id
                                        )}"
                                        data-track-id="${this.escapeHTML(
                                            track.id
                                        )}"
                                    >

                                        <span
                                            class="waeve-playlist-picker-icon"
                                        >
                                            ♪
                                        </span>


                                        <span
                                            class="waeve-playlist-picker-info"
                                        >

                                            <strong>
                                                ${this.escapeHTML(
                                                    playlist.name
                                                )}
                                            </strong>

                                            <small>
                                                ${
                                                    alreadyAdded
                                                        ? "Already added"
                                                        : (
                                                            Array.isArray(
                                                                playlist.trackIds
                                                            )
                                                                ? playlist.trackIds.length
                                                                : 0
                                                          ) +
                                                          (
                                                              Array.isArray(
                                                                  playlist.trackIds
                                                              ) &&
                                                              playlist.trackIds.length === 1
                                                                  ? " song"
                                                                  : " songs"
                                                          )
                                                }
                                            </small>

                                        </span>


                                        <span
                                            class="waeve-playlist-picker-action"
                                        >
                                            ${
                                                alreadyAdded
                                                    ? "✓"
                                                    : "+"
                                            }
                                        </span>

                                    </button>

                                `;

                            }
                        )
                        .join("");


            overlay.innerHTML = `

                <div
                    class="waeve-playlist-picker"
                >

                    <div
                        class="waeve-playlist-picker-header"
                    >

                        <div>

                            <h2>
                                Add to Playlist
                            </h2>

                            <p>
                                ${this.escapeHTML(
                                    track.title
                                )}

                                ${
                                    track.artist
                                        ? " • " +
                                          this.escapeHTML(
                                              track.artist
                                          )
                                        : ""
                                }
                            </p>

                        </div>


                        <button
                            type="button"
                            data-close-playlist-picker
                            aria-label="Close"
                        >
                            ✕
                        </button>

                    </div>


                    <div
                        class="waeve-playlist-picker-list"
                    >

                        ${playlistHTML}

                    </div>


                    <button
                        type="button"
                        class="waeve-picker-create-button"
                        data-picker-create-playlist
                    >
                        + Create New Playlist
                    </button>

                </div>

            `;


            document.body.appendChild(
                overlay
            );


            overlay.onclick =
                event => {

                    if (
                        event.target ===
                        overlay
                    ) {

                        overlay.remove();

                    }

                };

        },


        /*
         * ADD SONG TO SELECTED PLAYLIST
         */

        addSongToSelectedPlaylist(
            playlistId,
            trackId
        ) {

            if (
                !window.WaevePlaylists
            ) {

                console.error(
                    "Waeve Library Playlist UI: Playlist engine unavailable."
                );

                return;

            }


            const playlist =
                WaevePlaylists.getById(
                    playlistId
                );


            if (!playlist) {

                console.error(
                    "Waeve Library Playlist UI: Playlist not found."
                );

                return;

            }


            const alreadyExists =
                Array.isArray(
                    playlist.trackIds
                ) &&
                playlist.trackIds.some(
                    id =>
                        String(id) ===
                        String(trackId)
                );


            if (alreadyExists) {

                window.alert(
                    "This song is already in the playlist."
                );

                return;

            }


            if (
                typeof WaevePlaylists.addTrack !==
                    "function"
            ) {

                console.error(
                    "Waeve Library Playlist UI: Playlist addTrack method unavailable."
                );

                return;

            }


            const added =
                WaevePlaylists.addTrack(
                    playlistId,
                    trackId
                );


            if (!added) {

                console.error(
                    "Waeve Library Playlist UI: Unable to add song to playlist."
                );

                return;

            }


            const picker =
                document.querySelector(
                    "[data-waeve-playlist-picker]"
                );


            if (picker) {

                picker.remove();

            }


            this.refreshPlaylistList();


            console.log(
                "Waeve: Song added to playlist.",
                playlist.name,
                trackId
            );


            window.alert(
                `Song added to "${playlist.name}".`
            );

        },


        /*
         * CREATE PLAYLIST
         */

        createPlaylist() {

            if (
                !window.WaevePlaylistManagement
            ) {

                console.error(
                    "Waeve Library Playlist UI: Playlist management unavailable."
                );

                return;

            }


            WaevePlaylistManagement
                .createPlaylist();


            this.refreshPlaylistList();

        },


        /*
         * CREATE PLAYLIST FROM PICKER
         */

        createPlaylistFromPicker() {

            if (
                !window.WaevePlaylistManagement
            ) {

                console.error(
                    "Waeve Library Playlist UI: Playlist management unavailable."
                );

                return;

            }


            const picker =
                document.querySelector(
                    "[data-waeve-playlist-picker]"
                );


            if (!picker) {

                return;

            }


            const name =
                window.prompt(
                    "Enter a name for your new playlist:"
                );


            if (
                name === null
            ) {

                return;

            }


            const cleanName =
                name.trim();


            if (!cleanName) {

                window.alert(
                    "Please enter a playlist name."
                );

                return;

            }


            const created =
                WaevePlaylistManagement
                    .createPlaylist(
                        cleanName
                    );


            if (!created) {

                console.error(
                    "Waeve: Unable to create playlist."
                );

                return;

            }


            /*
             * Close the picker.
             *
             * The newly created playlist will
             * appear in the library.
             */

            picker.remove();


            this.refreshPlaylistList();


            console.log(
                "Waeve: Playlist created from picker.",
                cleanName
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
                    "Waeve Library Playlist UI: Playlist player unavailable."
                );

                return;

            }


            WaevePlaylistPlayer.playPlaylist(
                playlistId,
                shuffle
            );

        },


        /*
         * OPEN PLAYLIST
         */

        openPlaylist(
            playlistId
        ) {

            if (
                !window.WaevePlaylists
            ) {

                return;

            }


            const playlist =
                WaevePlaylists.getById(
                    playlistId
                );


            if (!playlist) {

                console.error(
                    "Waeve Library Playlist UI: Playlist not found."
                );

                return;

            }


            const coverNumber =
                WaevePlaylists.getCover(
                    playlist.id
                );


            const tracks =
                window.WaeveMusic &&
                typeof WaeveMusic.getAll ===
                    "function"

                    ? WaeveMusic.getAll()

                    : [];


            const playlistTracks =
                Array.isArray(
                    playlist.trackIds
                )

                    ? playlist.trackIds
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
                        .filter(Boolean)

                    : [];


            const overlay =
                document.createElement(
                    "div"
                );


            overlay.className =
                "waeve-playlist-overlay";


            overlay.innerHTML = `

                <div
                    class="waeve-playlist-window"
                >

                    <div
                        class="waeve-playlist-window-header"
                    >

                        <div>

                            <div
                                class="waeve-playlist-modal-cover waeve-playlist-cover-${coverNumber}"
                            >
                                ♪
                            </div>

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
                            data-close-waeve-playlist
                        >
                            ✕
                        </button>

                    </div>


                    <div
                        class="waeve-playlist-window-actions"
                    >

                        <button
                            type="button"
                            data-window-play="${this.escapeHTML(
                                playlist.id
                            )}"
                        >
                            ▶ Play Playlist
                        </button>


                        <button
                            type="button"
                            data-window-shuffle="${this.escapeHTML(
                                playlist.id
                            )}"
                        >
                            🔀 Shuffle
                        </button>


                        <button
                            type="button"
                            data-change-playlist-cover="${this.escapeHTML(
                                playlist.id
                            )}"
                        >
                            🎨 Change Cover
                        </button>

                    </div>


                    <div
                        class="waeve-playlist-window-songs"
                    >

                        ${
                            playlistTracks.length === 0

                                ? `

                                    <div class="empty-state">

                                        <h3>
                                            This playlist is empty
                                        </h3>

                                        <p>
                                            Add songs from your library or search.
                                        </p>

                                    </div>

                                `

                                : playlistTracks
                                    .map(
                                        (
                                            track,
                                            index
                                        ) => `

                                            <div
                                                class="waeve-playlist-song"
                                            >

                                                <div
                                                    class="waeve-playlist-song-number"
                                                >
                                                    ${
                                                        index + 1
                                                    }
                                                </div>


                                                <div
                                                    class="waeve-playlist-song-info"
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
                                                    class="waeve-playlist-song-play"
                                                    data-play-playlist-song="${this.escapeHTML(
                                                        track.id
                                                    )}"
                                                >
                                                    ▶
                                                </button>


                                                <button
                                                    type="button"
                                                    class="waeve-playlist-song-remove"
                                                    data-remove-playlist-song="${this.escapeHTML(
                                                        track.id
                                                    )}"
                                                    data-playlist-id="${this.escapeHTML(
                                                        playlist.id
                                                    )}"
                                                >
                                                    ✕
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
                overlay
            );


            /*
             * CLOSE
             */

            const close =
                overlay.querySelector(
                    "[data-close-waeve-playlist]"
                );


            if (close) {

                close.onclick =
                    () => {

                        overlay.remove();

                    };

            }


            /*
             * PLAY PLAYLIST
             */

            const play =
                overlay.querySelector(
                    "[data-window-play]"
                );


            if (play) {

                play.onclick =
                    () => {

                        this.playPlaylist(
                            play.dataset.windowPlay,
                            false
                        );

                    };

            }


            /*
             * SHUFFLE
             */

            const shuffle =
                overlay.querySelector(
                    "[data-window-shuffle]"
                );


            if (shuffle) {

                shuffle.onclick =
                    () => {

                        this.playPlaylist(
                            shuffle.dataset.windowShuffle,
                            true
                        );

                    };

            }


            /*
             * CLOSE ON BACKDROP
             */

            overlay.onclick =
                event => {

                    if (
                        event.target ===
                        overlay
                    ) {

                        overlay.remove();

                    }

                };

        },


        /*
         * PLAY INDIVIDUAL PLAYLIST SONG
         */

        playPlaylistSong(
            trackId
        ) {

            if (
                !window.WaeveMusic ||
                !window.WaevePlayer
            ) {

                console.error(
                    "Waeve: Music player unavailable."
                );

                return;

            }


            const tracks =
                WaeveMusic.getAll();


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

                console.error(
                    "Waeve: Playlist song not found."
                );

                return;

            }


            WaevePlayer.loadTrack(
                index,
                true
            );

        },


        /*
         * REMOVE PLAYLIST SONG
         */

        removePlaylistSong(
            trackId,
            playlistId
        ) {

            if (
                !window.WaevePlaylists
            ) {

                return;

            }


            const playlist =
                WaevePlaylists.getById(
                    playlistId
                );


            if (!playlist) {

                return;

            }


            const track =
                window.WaeveMusic &&
                typeof WaeveMusic.getAll ===
                    "function"

                    ? WaeveMusic
                        .getAll()
                        .find(
                            item =>
                                String(
                                    item.id
                                ) ===
                                String(
                                    trackId
                                )
                        )

                    : null;


            const songName =
                track
                    ? track.title
                    : "this song";


            const confirmed =
                window.confirm(
                    `Remove "${songName}" from "${playlist.name}"?`
                );


            if (!confirmed) {

                return;

            }


            const removed =
                WaevePlaylists.removeTrack(
                    playlistId,
                    trackId
                );


            if (!removed) {

                console.error(
                    "Waeve: Unable to remove playlist song."
                );

                return;

            }


            /*
             * Refresh the open playlist.
             */

            const overlay =
                document.querySelector(
                    ".waeve-playlist-overlay"
                );


            if (overlay) {

                overlay.remove();

            }


            this.refreshPlaylistList();

            this.openPlaylist(
                playlistId
            );


            console.log(
                "Waeve: Playlist song removed."
            );

        },


        /*
         * OPEN COVER PICKER
         */

        openCoverPicker(
            playlistId
        ) {

            const playlist =
                WaevePlaylists.getById(
                    playlistId
                );


            if (!playlist) {

                return;

            }


            const currentCover =
                WaevePlaylists.getCover(
                    playlistId
                );


            const existing =
                document.querySelector(
                    "[data-waeve-cover-picker]"
                );


            if (existing) {

                existing.remove();

            }


            const picker =
                document.createElement(
                    "div"
                );


            picker.className =
                "waeve-cover-picker-overlay";


            picker.dataset
                .waeveCoverPicker =
                "true";


            let coversHTML = "";


            for (
                let number = 1;
                number <= 6;
                number++
            ) {

                coversHTML += `

                    <button
                        type="button"
                        class="waeve-cover-option ${
                            number === currentCover
                                ? "selected"
                                : ""
                        }"
                        data-select-playlist-cover="${this.escapeHTML(
                            playlistId
                        )}"
                        data-cover-number="${number}"
                        aria-label="Choose cover ${number}"
                    >

                        <span
                            class="waeve-playlist-cover waeve-playlist-cover-${number}"
                        >
                            ♪
                        </span>

                        <small>
                            Cover ${number}
                        </small>

                    </button>

                `;

            }


            picker.innerHTML = `

                <div
                    class="waeve-cover-picker"
                >

                    <div
                        class="waeve-cover-picker-header"
                    >

                        <div>

                            <h2>
                                Change Cover
                            </h2>

                            <p>
                                ${this.escapeHTML(
                                    playlist.name
                                )}
                            </p>

                        </div>


                        <button
                            type="button"
                            data-close-cover-picker
                        >
                            ✕
                        </button>

                    </div>


                    <div
                        class="waeve-cover-grid"
                    >
                        ${coversHTML}
                    </div>

                </div>

            `;


            document.body.appendChild(
                picker
            );


            const close =
                picker.querySelector(
                    "[data-close-cover-picker]"
                );


            if (close) {

                close.onclick =
                    () => {

                        picker.remove();

                    };

            }


            picker.onclick =
                event => {

                    if (
                        event.target ===
                        picker
                    ) {

                        picker.remove();

                    }

                };

        },


        /*
         * CHANGE COVER
         */

        changeCover(
            playlistId,
            coverNumber
        ) {

            if (
                !window.WaevePlaylists
            ) {

                return;

            }


            const changed =
                WaevePlaylists.changeCover(
                    playlistId,
                    coverNumber
                );


            if (!changed) {

                console.error(
                    "Waeve Library Playlist UI: Unable to change cover."
                );

                return;

            }


            const picker =
                document.querySelector(
                    "[data-waeve-cover-picker]"
                );


            if (picker) {

                picker.remove();

            }


            this.refreshPlaylistList();


            const modalCover =
                document.querySelector(
                    ".waeve-playlist-modal-cover"
                );


            if (modalCover) {

                const number =
                    WaevePlaylists.getCover(
                        playlistId
                    );


                modalCover.className =
                    `waeve-playlist-modal-cover waeve-playlist-cover-${number}`;

            }


            console.log(
                "Waeve: Playlist cover updated."
            );

        },


        /*
         * DELETE PLAYLIST
         */

        deletePlaylist(
            playlistId
        ) {

            if (
                !window.WaevePlaylistManagement
            ) {

                return;

            }


            WaevePlaylistManagement
                .deletePlaylist(
                    playlistId
                );


            const overlay =
                document.querySelector(
                    ".waeve-playlist-overlay"
                );


            if (overlay) {

                overlay.remove();

            }


            this.refreshPlaylistList();

        },


        /*
         * ESCAPE HTML
         */

        escapeHTML(
            value
        ) {

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
     * GLOBAL ACCESS
     */

    window.WaeveLibraryPlaylistUI =
        WaeveLibraryPlaylistUI;


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

                WaeveLibraryPlaylistUI.init();

            },
            {
                once: true
            }
        );

    } else {

        WaeveLibraryPlaylistUI.init();

    }

})();