package com.waeve.mobile.core.media

import android.net.Uri

enum class LocalMediaType {
    AUDIO,
    VIDEO
}

data class LocalMedia(
    val id: Long,
    val uri: Uri,
    val type: LocalMediaType,
    val title: String,
    val artist: String,
    val album: String,
    val albumArtist: String,
    val genre: String?,
    val year: Int?,
    val durationMs: Long,
    val artworkUri: Uri?,
    val folder: String?,
    val mimeType: String?
)
