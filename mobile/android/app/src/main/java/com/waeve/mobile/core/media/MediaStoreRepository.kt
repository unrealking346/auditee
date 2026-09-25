package com.waeve.mobile.core.media

import android.content.ContentResolver
import android.content.ContentUris
import android.provider.MediaStore

class MediaStoreRepository(
    private val resolver: ContentResolver
) {
    fun queryAudio(): List<LocalMedia> {
        val collection =
            MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL)

        val projection = arrayOf(
            MediaStore.Audio.Media._ID,
            MediaStore.Audio.Media.TITLE,
            MediaStore.Audio.Media.ARTIST,
            MediaStore.Audio.Media.ALBUM,
            MediaStore.Audio.Media.ALBUM_ARTIST,
            MediaStore.Audio.Media.GENRE,
            MediaStore.Audio.Media.YEAR,
            MediaStore.Audio.Media.DURATION,
            MediaStore.Audio.Media.MIME_TYPE,
            MediaStore.Audio.Media.DATA
        )

        val result = mutableListOf<LocalMedia>()

        resolver.query(
            collection,
            projection,
            "${MediaStore.Audio.Media.IS_MUSIC} != 0",
            null,
            "${MediaStore.Audio.Media.TITLE} COLLATE NOCASE ASC"
        )?.use { cursor ->
            val id = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)
            val title = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE)
            val artist = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST)
            val album = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM)
            val albumArtist =
                cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM_ARTIST)
            val genre = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.GENRE)
            val year = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.YEAR)
            val duration =
                cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION)
            val mime = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.MIME_TYPE)
            val data = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA)

            while (cursor.moveToNext()) {
                val mediaId = cursor.getLong(id)
                val uri = ContentUris.withAppendedId(collection, mediaId)
                val path = cursor.getString(data)

                result += LocalMedia(
                    id = mediaId,
                    uri = uri,
                    type = LocalMediaType.AUDIO,
                    title = cursor.getString(title).orEmpty(),
                    artist = cursor.getString(artist).orEmpty()
                        .takeUnless { it == "<unknown>" }
                        ?: "Unknown artist",
                    album = cursor.getString(album).orEmpty(),
                    albumArtist = cursor.getString(albumArtist).orEmpty(),
                    genre = cursor.getString(genre),
                    year = cursor.getInt(year).takeIf { it > 0 },
                    durationMs = cursor.getLong(duration),
                    artworkUri = ContentUris.withAppendedId(
                        MediaStore.Audio.Albums.EXTERNAL_CONTENT_URI,
                        mediaId
                    ).takeIf { false },
                    folder = path?.substringBeforeLast('/', ""),
                    mimeType = cursor.getString(mime)
                )
            }
        }

        return result
    }
}
