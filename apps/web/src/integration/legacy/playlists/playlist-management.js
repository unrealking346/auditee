/*
 * WAEVE PLAYLIST MANAGEMENT
 * Build: 0.3.0
 *
 * Handles:
 * - Creating playlists
 * - Adding songs
 * - Removing songs
 * - Deleting playlists
 * - Playlist song counts
 * - Local persistence
 * - Waeve playlist creation dialog
 */

(function () {

    "use strict";


    const WaevePlaylistManagement = {

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
                    "Waeve Playlist Management: Playlist engine unavailable."
                );

                return;

            }


            if (!window.WaeveMusic) {

                console.error(
                    "Waeve Playlist Management: Music engine unavailable."
                );

                return;

            }


            this.initialized = true;


            this.setupEvents();


            console.log(
                "Waeve Playlist Management 0.3.0 ready."
            );

        },


        /*
         * GLOBAL CLICK EVENTS
         */

        setupEvents() {

            document.addEventListener(
                "click",
                event => {


                    /*
                     * CREATE PLAYLIST
                     */

                    const createButton =
                        event.target.closest(
                            "[data-playlist-create]"
                        );


                    if (createButton) {

                        event.preventDefault();

                        this.createPlaylist();

                        return;

                    }


                    /*
                     * ADD SONG
                     */

                    const addButton =
                        event.target.closest(
                            "[data-playlist-add]"
                        );


                    if (addButton) {

                        event.preventDefault();

                        this.addSong(
                            addButton.dataset
                                .playlistAdd
                        );

                        return;

                    }


                    /*
                     * REMOVE SONG
                     */

                    const removeButton =
                        event.target.closest(
                            "[data-playlist-remove]"
                        );


                    if (removeButton) {

                        event.preventDefault();

                        this.removeSong(
                            removeButton.dataset
                                .playlistRemove,
                            removeButton.dataset
                                .playlistId
                        );

                        return;

                    }


                    /*
                     * DELETE PLAYLIST
                     */

                    const deleteButton =
                        event.target.closest(
                            "[data-playlist-delete]"
                        );


                    if (deleteButton) {

                        event.preventDefault();

                        this.deletePlaylist(
                            deleteButton.dataset
                                .playlistDelete
                        );

                    }

                }
            );

        },


        /*
         * CREATE PLAYLIST
         */

        createPlaylist() {

            /*
             * Prevent duplicate dialogs.
             */

            if (
                document.getElementById(
                    "waeve-create-playlist-dialog"
                )
            ) {

                return;

            }


            const overlay =
                document.createElement(
                    "div"
                );


            overlay.id =
                "waeve-create-playlist-dialog";


            overlay.className =
                "waeve-playlist-dialog";


            overlay.innerHTML = `

                <div
                    class="waeve-playlist-dialog-box"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="waeve-create-playlist-title"
                >

                    <div
                        class="waeve-playlist-dialog-header"
                    >

                        <div>

                            <h2
                                id="waeve-create-playlist-title"
                            >
                                Create Playlist
                            </h2>

                            <p>
                                Give your playlist a name.
                            </p>

                        </div>


                        <button
                            type="button"
                            class="waeve-dialog-close"
                            data-close-playlist-dialog
                            aria-label="Close"
                        >
                            ×
                        </button>

                    </div>


                    <form
                        id="waeve-create-playlist-form"
                    >

                        <label
                            for="waeve-playlist-name"
                        >
                            Playlist name
                        </label>


                        <input
                            id="waeve-playlist-name"
                            name="playlistName"
                            type="text"
                            maxlength="100"
                            autocomplete="off"
                            placeholder="My playlist"
                            required
                        >


                        <div
                            class="waeve-playlist-dialog-actions"
                        >

                            <button
                                type="button"
                                data-close-playlist-dialog
                            >
                                Cancel
                            </button>


                            <button
                                type="submit"
                            >
                                Create Playlist
                            </button>

                        </div>

                    </form>

                </div>

            `;


            document.body.appendChild(
                overlay
            );


            const input =
                document.getElementById(
                    "waeve-playlist-name"
                );


            if (input) {

                input.focus();

            }


            /*
             * FORM SUBMISSION
             */

            const form =
                document.getElementById(
                    "waeve-create-playlist-form"
                );


            if (form) {

                form.addEventListener(
                    "submit",
                    event => {

                        event.preventDefault();

                        this.submitPlaylist();

                    }
                );

            }


            /*
             * CLOSE BUTTONS
             */

            const closeButtons =
                overlay.querySelectorAll(
                    "[data-close-playlist-dialog]"
                );


            closeButtons.forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            this.closeCreateDialog();

                        }
                    );

                }
            );


            /*
             * CLOSE WHEN CLICKING
             * OUTSIDE THE WINDOW
             */

            overlay.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        overlay
                    ) {

                        this.closeCreateDialog();

                    }

                }
            );


            /*
             * ESCAPE KEY
             */

            document.addEventListener(
                "keydown",
                this.handleEscape
            );

        },


        /*
         * SUBMIT PLAYLIST
         */

        submitPlaylist() {

            const input =
                document.getElementById(
                    "waeve-playlist-name"
                );


            if (!input) {

                return;

            }


            const cleanName =
                input.value.trim();


            if (!cleanName) {

                input.focus();

                return;

            }


            const playlist =
                WaevePlaylists.create(
                    cleanName
                );


            if (!playlist) {

                console.error(
                    "Waeve Playlist Management: Unable to create playlist."
                );

                return;

            }


            console.log(
                "Waeve: Playlist created:",
                playlist.name
            );


            this.closeCreateDialog();


            this.refresh();

        },


        /*
         * CLOSE CREATE DIALOG
         */

        closeCreateDialog() {

            const dialog =
                document.getElementById(
                    "waeve-create-playlist-dialog"
                );


            if (dialog) {

                dialog.remove();

            }


            document.removeEventListener(
                "keydown",
                this.handleEscape
            );

        },


        /*
         * ESCAPE HANDLER
         */

        handleEscape(
            event
        ) {

            if (
                event.key ===
                "Escape"
            ) {

                WaevePlaylistManagement
                    .closeCreateDialog();

            }

        },


        /*
         * ADD SONG
         */

        addSong(
            trackId
        ) {

            if (!trackId) {

                return;

            }


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
                WaeveMusic
                    .getAll()
                    .find(
                        item =>
                            String(
                                item.id
                            ) ===
                            String(
                                trackId
                            )
                    );


            if (!track) {

                console.error(
                    "Waeve Playlist Management: Track not found."
                );

                return;

            }


            const choices =
                playlists
                    .map(
                        (playlist, index) =>
                            `${index + 1}. ${playlist.name}`
                    )
                    .join("\n");


            const answer =
                window.prompt(
                    `Add "${track.title}" to a playlist.\n\n${choices}\n\nEnter the playlist number:`
                );


            if (
                answer === null
            ) {

                return;

            }


            const number =
                Number(
                    answer.trim()
                );


            if (
                !Number.isInteger(number) ||
                number < 1 ||
                number > playlists.length
            ) {

                window.alert(
                    "Invalid playlist number."
                );

                return;

            }


            const playlist =
                playlists[
                    number - 1
                ];


            if (
                WaevePlaylists.hasTrack(
                    playlist.id,
                    trackId
                )
            ) {

                window.alert(
                    `"${track.title}" is already in "${playlist.name}".`
                );

                return;

            }


            const added =
                WaevePlaylists.addTrack(
                    playlist.id,
                    trackId
                );


            if (!added) {

                window.alert(
                    "Unable to add the song."
                );

                return;

            }


            window.alert(
                `"${track.title}" added to "${playlist.name}".`
            );


            console.log(
                "Waeve: Track added to playlist."
            );


            this.refresh();

        },


        /*
         * REMOVE SONG
         */

        removeSong(
            playlistId,
            trackId
        ) {

            if (
                !playlistId ||
                !trackId
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


            const confirmed =
                window.confirm(
                    "Remove this song from the playlist?"
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

                window.alert(
                    "Unable to remove the song."
                );

                return;

            }


            console.log(
                "Waeve: Track removed from playlist."
            );


            this.refresh();

        },


        /*
         * DELETE PLAYLIST
         */

        deletePlaylist(
            playlistId
        ) {

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


            const confirmed =
                window.confirm(
                    `Delete "${playlist.name}" permanently?`
                );


            if (!confirmed) {

                return;

            }


            const deleted =
                WaevePlaylists.delete(
                    playlistId
                );


            if (!deleted) {

                window.alert(
                    "Unable to delete playlist."
                );

                return;

            }


            console.log(
                "Waeve: Playlist deleted."
            );


            this.refresh();

        },


        /*
         * GET PLAYLIST SONGS
         */

        getPlaylistSongs(
            playlistId
        ) {

            const playlist =
                WaevePlaylists.getById(
                    playlistId
                );


            if (!playlist) {

                return [];

            }


            const tracks =
                WaeveMusic.getAll();


            return playlist.trackIds
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

        },


        /*
         * REFRESH CURRENT PAGE
         */

        refresh() {

            if (
                window.WaeveLibraryPlaylistUI &&
                typeof WaeveLibraryPlaylistUI
                    .refreshPlaylistList ===
                    "function"
            ) {

                WaeveLibraryPlaylistUI
                    .refreshPlaylistList();

                return;

            }


            const route =
                window.WaeveRouter
                    ? WaeveRouter.currentRoute
                    : null;


            if (
                route === "library" &&
                window.WaeveApp &&
                typeof WaeveApp.initializeLibrary ===
                    "function"
            ) {

                WaeveApp.initializeLibrary();

            }

        }

    };


    /*
     * GLOBAL ACCESS
     */

    window.WaevePlaylistManagement =
        WaevePlaylistManagement;


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

                WaevePlaylistManagement.init();

            },
            {
                once: true
            }
        );

    } else {

        WaevePlaylistManagement.init();

    }

})();