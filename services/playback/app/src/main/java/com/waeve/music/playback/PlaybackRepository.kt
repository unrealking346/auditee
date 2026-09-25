package com.waeve.music.playback
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
class PlaybackRepository(private val player:ExoPlayer){fun setQueue(urls:List<String>){player.setMediaItems(urls.map{MediaItem.fromUri(it)});player.prepare()};fun play()=player.play();fun pause()=player.pause();fun seekTo(ms:Long)=player.seekTo(ms)}