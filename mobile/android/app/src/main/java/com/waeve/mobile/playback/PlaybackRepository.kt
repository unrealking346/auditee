package com.waeve.mobile.playback

import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer

data class PlaybackTrack(
    val id: String,
    val title: String,
    val artist: String,
    val album: String? = null,
    val artworkUri: String? = null,
    val mediaUri: String
)

class PlaybackRepository(
    private val player: ExoPlayer
) {
    fun setQueue(tracks: List<PlaybackTrack>, startIndex: Int = 0) {
        player.setMediaItems(
            tracks.map { track ->
                MediaItem.Builder()
                    .setMediaId(track.id)
                    .setUri(track.mediaUri)
                    .setMediaMetadata(
                        androidx.media3.common.MediaMetadata.Builder()
                            .setTitle(track.title)
                            .setArtist(track.artist)
                            .setAlbumTitle(track.album)
                            .setArtworkUri(track.artworkUri?.let(android.net.Uri::parse))
                            .build()
                    )
                    .build()
            },
            startIndex.coerceIn(0, (tracks.size - 1).coerceAtLeast(0)),
            0L
        )
        player.prepare()
    }

    fun play() {
        player.play()
    }

    fun pause() {
        player.pause()
    }

    fun toggle() {
        if (player.isPlaying) pause() else play()
    }

    fun next() {
        if (player.hasNextMediaItem()) player.seekToNextMediaItem()
    }

    fun previous() {
        if (player.currentPosition > 3_000L) {
            player.seekTo(0L)
        } else if (player.hasPreviousMediaItem()) {
            player.seekToPreviousMediaItem()
        } else {
            player.seekTo(0L)
        }
    }

    fun seekTo(positionMs: Long) {
        player.seekTo(positionMs.coerceAtLeast(0L))
    }

    fun setShuffle(enabled: Boolean) {
        player.shuffleModeEnabled = enabled
    }

    fun setRepeatMode(mode: Int) {
        player.repeatMode = mode
    }

    fun currentPosition(): Long = player.currentPosition

    fun duration(): Long = player.duration.takeIf { it > 0L } ?: 0L

    fun currentIndex(): Int = player.currentMediaItemIndex

    fun isPlaying(): Boolean = player.isPlaying

    fun addToQueue(track: PlaybackTrack) {
        player.addMediaItem(
            MediaItem.Builder()
                .setMediaId(track.id)
                .setUri(track.mediaUri)
                .setMediaMetadata(
                    androidx.media3.common.MediaMetadata.Builder()
                        .setTitle(track.title)
                        .setArtist(track.artist)
                        .setAlbumTitle(track.album)
                        .setArtworkUri(track.artworkUri?.let(android.net.Uri::parse))
                        .build()
                )
                .build()
        )
    }

    fun clearQueue() {
        player.clearMediaItems()
    }

    fun addListener(listener: Player.Listener) {
        player.addListener(listener)
    }

    fun removeListener(listener: Player.Listener) {
        player.removeListener(listener)
    }
}
