/*
 * WAEVE MUSIC PLAYER ENGINE
 * Build: 0.3.1
 *
 * LOCAL-FIRST AUDIO ENGINE
 */

(function () {

    "use strict";


    if (window.WaevePlayer) {

        console.log(
            "Waeve Player already exists."
        );

        return;

    }


    const player = {

        audio: new Audio(),

        queue: [],

        currentIndex: -1,

        initialized: false,

        isSeeking: false,

        previousVolume: 1,


        /*
         * INITIALIZE
         */

        async init() {

            if (this.initialized) {

                return;

            }


            this.createInterface();


            this.setupAudioEvents();


            this.setupControls();


            /*
             * Wait until the music
             * engine exists.
             */

            if (
                !window.WaeveMusic
            ) {

                console.error(
                    "Waeve Player: WaeveMusic engine is not available."
                );

                return;

            }


            const tracks =
                await WaeveMusic.load();


            if (
                !Array.isArray(tracks) ||
                tracks.length === 0
            ) {

                console.error(
                    "Waeve Player: Music catalogue contains no tracks."
                );

                return;

            }


            this.queue = [
                ...tracks
            ];


            this.initialized =
                true;


            this.loadTrack(
                0,
                false
            );


            this.updateAll();


            console.log(
                "Waeve Music Player 0.3.1 initialized."
            );

        },


        /*
         * LOAD TRACK
         */

        loadTrack(
            index,
            autoplay = false
        ) {

            if (
                !Number.isInteger(index)
            ) {

                return;

            }


            if (
                index < 0 ||
                index >= this.queue.length
            ) {

                return;

            }


            const track =
                this.queue[index];


            if (!track) {

                return;

            }


            this.currentIndex =
                index;


            this.audio.pause();


            this.audio.src =
                track.audio;


            this.audio.load();


            this.audio.currentTime =
                0;


            this.updateTrack();


            this.updateProgress();


            if (autoplay) {

                this.play();

            }

        },


        /*
         * PLAY
         */

        play() {

            if (
                !this.audio.src
            ) {

                console.warn(
                    "Waeve: No audio source loaded."
                );

                return;

            }


            const promise =
                this.audio.play();


            if (
                promise &&
                typeof promise.catch ===
                "function"
            ) {

                promise.catch(
                    error => {

                        console.error(
                            "Waeve playback error:",
                            error
                        );

                    }
                );

            }

        },


        /*
         * PAUSE
         */

        pause() {

            this.audio.pause();

        },


        /*
         * TOGGLE
         */

        togglePlay() {

            if (
                this.audio.paused
            ) {

                this.play();

            } else {

                this.pause();

            }

        },


        /*
         * PREVIOUS
         */

        previous() {

            if (
                this.queue.length === 0
            ) {

                return;

            }


            if (
                this.audio.currentTime > 3
            ) {

                this.audio.currentTime =
                    0;

                return;

            }


            if (
                this.queue.length === 1
            ) {

                this.audio.currentTime =
                    0;

                return;

            }


            let index =
                this.currentIndex - 1;


            if (
                index < 0
            ) {

                index =
                    this.queue.length - 1;

            }


            this.loadTrack(
                index,
                true
            );

        },


        /*
         * NEXT
         */

        next() {

            if (
                this.queue.length === 0
            ) {

                return;

            }


            if (
                this.queue.length === 1
            ) {

                this.audio.currentTime =
                    0;

                return;

            }


            let index =
                this.currentIndex + 1;


            if (
                index >= this.queue.length
            ) {

                index = 0;

            }


            this.loadTrack(
                index,
                true
            );

        },


        /*
         * SEEK
         */

        seek(value) {

            const duration =
                this.audio.duration;


            if (
                !Number.isFinite(duration) ||
                duration <= 0
            ) {

                return;

            }


            let percentage =
                Number(value);


            if (
                !Number.isFinite(percentage)
            ) {

                return;

            }


            percentage =
                Math.max(
                    0,
                    Math.min(
                        100,
                        percentage
                    )
                );


            this.audio.currentTime =
                (
                    percentage /
                    100
                ) *
                duration;


            this.updateTimeDisplay();

        },


        /*
         * UPDATE PROGRESS
         */

        updateProgress() {

            const progress =
                document.getElementById(
                    "waeve-player-progress"
                );


            if (!progress) {

                return;

            }


            if (this.isSeeking) {

                return;

            }


            const duration =
                this.audio.duration;


            if (
                !Number.isFinite(duration) ||
                duration <= 0
            ) {

                progress.value =
                    0;

                return;

            }


            progress.value =
                (
                    this.audio.currentTime /
                    duration
                ) *
                100;


            this.updateTimeDisplay();

        },


        /*
         * TIME DISPLAY
         */

        updateTimeDisplay() {

            const current =
                document.getElementById(
                    "waeve-player-current"
                );


            const duration =
                document.getElementById(
                    "waeve-player-duration"
                );


            if (current) {

                current.textContent =
                    this.formatTime(
                        this.audio.currentTime
                    );

            }


            if (duration) {

                duration.textContent =
                    this.formatTime(
                        this.audio.duration
                    );

            }

        },


        /*
         * FORMAT TIME
         */

        formatTime(seconds) {

            if (
                !Number.isFinite(seconds) ||
                seconds < 0
            ) {

                return "0:00";

            }


            const minutes =
                Math.floor(
                    seconds / 60
                );


            const remaining =
                Math.floor(
                    seconds % 60
                );


            return (
                minutes +
                ":" +
                String(
                    remaining
                ).padStart(
                    2,
                    "0"
                )
            );

        },


        /*
         * VOLUME
         */

        setVolume(value) {

            let volume =
                Number(value);


            if (
                !Number.isFinite(volume)
            ) {

                return;

            }


            volume =
                Math.max(
                    0,
                    Math.min(
                        1,
                        volume
                    )
                );


            this.audio.volume =
                volume;


            if (volume > 0) {

                this.previousVolume =
                    volume;

            }


            this.updateVolume();

        },


        /*
         * MUTE
         */

        toggleMute() {

            if (
                this.audio.volume > 0
            ) {

                this.previousVolume =
                    this.audio.volume;

                this.audio.volume =
                    0;

            } else {

                this.audio.volume =
                    this.previousVolume ||
                    1;

            }


            this.updateVolume();

        },


        /*
         * TRACK DISPLAY
         */

        updateTrack() {

            const track =
                this.queue[
                    this.currentIndex
                ];


            if (!track) {

                return;

            }


            const title =
                document.getElementById(
                    "waeve-player-title"
                );


            const artist =
                document.getElementById(
                    "waeve-player-artist"
                );


            if (title) {

                title.textContent =
                    track.title;

            }


            if (artist) {

                artist.textContent =
                    track.artist;

            }

        },


        /*
         * PLAY BUTTON
         */

        updatePlayButton() {

            const button =
                document.getElementById(
                    "waeve-player-play"
                );


            if (!button) {

                return;

            }


            button.textContent =
                this.audio.paused
                    ? "▶"
                    : "⏸";

        },


        /*
         * VOLUME UI
         */

        updateVolume() {

            const slider =
                document.getElementById(
                    "waeve-player-volume"
                );


            const button =
                document.getElementById(
                    "waeve-player-mute"
                );


            if (slider) {

                slider.value =
                    this.audio.volume;

            }


            if (button) {

                button.textContent =
                    this.audio.volume === 0
                        ? "🔇"
                        : "🔊";

            }

        },


        /*
         * UPDATE EVERYTHING
         */

        updateAll() {

            this.updateTrack();

            this.updatePlayButton();

            this.updateProgress();

            this.updateVolume();

        },


        /*
         * AUDIO EVENTS
         */

        setupAudioEvents() {

            this.audio.addEventListener(
                "play",
                () => {

                    this.updatePlayButton();

                }
            );


            this.audio.addEventListener(
                "pause",
                () => {

                    this.updatePlayButton();

                }
            );


            this.audio.addEventListener(
                "timeupdate",
                () => {

                    this.updateProgress();

                }
            );


            this.audio.addEventListener(
                "loadedmetadata",
                () => {

                    this.updateTimeDisplay();

                    this.updateProgress();

                }
            );


            this.audio.addEventListener(
                "durationchange",
                () => {

                    this.updateTimeDisplay();

                }
            );


            this.audio.addEventListener(
                "ended",
                () => {

                    this.next();

                }
            );


            this.audio.addEventListener(
                "volumechange",
                () => {

                    this.updateVolume();

                }
            );


            this.audio.addEventListener(
                "error",
                () => {

                    console.error(
                        "Waeve audio error:",
                        this.audio.error
                    );

                }
            );

        },


        /*
         * CREATE PLAYER
         */

        createInterface() {

            if (
                document.getElementById(
                    "waeve-player"
                )
            ) {

                return;

            }


            const element =
                document.createElement(
                    "section"
                );


            element.id =
                "waeve-player";


            element.className =
                "waeve-player";


            element.innerHTML = `

                <div class="player-track">

                    <div class="player-track-info">

                        <strong
                            id="waeve-player-title"
                        >
                            No song
                        </strong>

                        <span
                            id="waeve-player-artist"
                        >
                            No artist
                        </span>

                    </div>

                </div>


                <div class="player-controls">

                    <button
                        id="waeve-player-previous"
                        type="button"
                    >
                        ⏮
                    </button>


                    <button
                        id="waeve-player-play"
                        type="button"
                    >
                        ▶
                    </button>


                    <button
                        id="waeve-player-next"
                        type="button"
                    >
                        ⏭
                    </button>

                </div>


                <div class="player-progress">

                    <span
                        id="waeve-player-current"
                    >
                        0:00
                    </span>


                    <input
                        id="waeve-player-progress"
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                        value="0"
                    >


                    <span
                        id="waeve-player-duration"
                    >
                        0:00
                    </span>

                </div>


                <div class="player-volume">

                    <button
                        id="waeve-player-mute"
                        type="button"
                    >
                        🔊
                    </button>


                    <input
                        id="waeve-player-volume"
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value="1"
                    >

                </div>

            `;


            const app =
                document.getElementById(
                    "waeve-app"
                );


            if (!app) {

                return;

            }


            app.appendChild(
                element
            );

        },


        /*
         * CONTROLS
         */

        setupControls() {

            const play =
                document.getElementById(
                    "waeve-player-play"
                );


            const previous =
                document.getElementById(
                    "waeve-player-previous"
                );


            const next =
                document.getElementById(
                    "waeve-player-next"
                );


            const progress =
                document.getElementById(
                    "waeve-player-progress"
                );


            const volume =
                document.getElementById(
                    "waeve-player-volume"
                );


            const mute =
                document.getElementById(
                    "waeve-player-mute"
                );


            if (play) {

                play.addEventListener(
                    "click",
                    () => {

                        this.togglePlay();

                    }
                );

            }


            if (previous) {

                previous.addEventListener(
                    "click",
                    () => {

                        this.previous();

                    }
                );

            }


            if (next) {

                next.addEventListener(
                    "click",
                    () => {

                        this.next();

                    }
                );

            }


            if (progress) {

                progress.addEventListener(
                    "input",
                    event => {

                        this.isSeeking =
                            true;

                        this.seek(
                            event.target.value
                        );

                    }
                );


                progress.addEventListener(
                    "change",
                    event => {

                        this.seek(
                            event.target.value
                        );

                        this.isSeeking =
                            false;

                        this.updateProgress();

                    }
                );

            }


            if (volume) {

                volume.addEventListener(
                    "input",
                    event => {

                        this.setVolume(
                            event.target.value
                        );

                    }
                );

            }


            if (mute) {

                mute.addEventListener(
                    "click",
                    () => {

                        this.toggleMute();

                    }
                );

            }

        }

    };


    window.WaevePlayer =
        player;


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            () => {

                window.WaevePlayer.init();

            },
            {
                once: true
            }
        );

    } else {

        window.WaevePlayer.init();

    }

})();