package com.waeve.mobile.player

import android.content.ComponentName
import android.content.Context
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.waeve.mobile.model.Song
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class WaevePlayer(context: Context) {
    private val appContext = context.applicationContext
    private val token = SessionToken(appContext, ComponentName(appContext, WaevePlaybackService::class.java))
    private var controller: MediaController? = null

    suspend fun connect(): MediaController {
        controller?.let { return it }
        return suspendCancellableCoroutine { cont ->
            val future = MediaController.Builder(appContext, token).buildAsync()
            future.addListener({
                try { controller = future.get(); cont.resume(controller!!) }
                catch (t: Throwable) { cont.resumeWithException(t) }
            }, { it.run() })
            cont.invokeOnCancellation { future.cancel(true) }
        }
    }

    suspend fun play(song: Song) {
        val url = song.audioUrl ?: return
        val c = connect()
        c.setMediaItem(MediaItem.Builder().setUri(url).setMediaId(song.id).setMediaMetadata(MediaMetadata.Builder().setTitle(song.title).setArtist(song.artistName).build()).build())
        c.prepare(); c.play()
    }
    suspend fun pause() { connect().pause() }
    suspend fun resume() { connect().play() }
    fun isPlaying() = controller?.isPlaying == true
    fun release() { controller?.release(); controller = null }
}
