package com.waeve.mobile.playback
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
class WaevePlaybackService:MediaSessionService(){private var player:ExoPlayer?=null;private var session:MediaSession?=null;override fun onCreate(){super.onCreate();player=ExoPlayer.Builder(this).build();session=MediaSession.Builder(this,player!!).build()}override fun onGetSession(c:MediaSession.ControllerInfo)=session;override fun onDestroy(){session?.release();player?.release();super.onDestroy()}}