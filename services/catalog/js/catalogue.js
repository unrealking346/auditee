/*
 * ============================================================
 * WAEVE MUSIC CATALOGUE
 * Build: 1.0.0
 * ============================================================
 */

const WaeveCatalogue = {

    tracks: [],


    initialise() {

        this.tracks = [

            {
                id: "waeve-demo-001",
                title: "Waeve Demo",
                artist: "Waeve",
                album: "Waeve Originals",
                genre: "Electronic",
                duration: 0,
                audio:
                    "music/test-track.mp3",
                artwork:
                    "assets/artwork/default.jpg"
            }

        ];

        return this.tracks;

    },


    all() {

        return [...this.tracks];

    },


    getById(id) {

        return this.tracks.find(
            track => track.id === id
        ) || null;

    },


    getByArtist(artist) {

        return this.tracks.filter(
            track =>
                track.artist.toLowerCase() ===
                artist.toLowerCase()
        );

    },


    getByAlbum(album) {

        return this.tracks.filter(
            track =>
                track.album.toLowerCase() ===
                album.toLowerCase()
        );

    },


    getByGenre(genre) {

        return this.tracks.filter(
            track =>
                track.genre.toLowerCase() ===
                genre.toLowerCase()
        );

    }

};