# WAEVE Android

Native Android application foundation for WAEVE. This is not a web wrapper.

## Build debug APK

Open `mobile/android` in Android Studio (Ladybug or newer), let Gradle sync, then run:

`./gradlew :app:assembleDebug`

APK: `app/build/outputs/apk/debug/app-debug.apk`

## Local backend

The debug build defaults to `http://10.0.2.2:4000/v1/`, which maps Android Emulator traffic to the host computer's port 4000.

For a physical phone, change `WAEVE_API_BASE_URL` to the computer's LAN IP, for example `http://192.168.1.20:4000/v1/`, and ensure the API listens on the LAN interface and the firewall permits the port. Production must use HTTPS.

## Production boundaries

The project includes native Media3 background playback architecture, session persistence, authentication, search, home recommendations, playlists, likes, and listening events. Production release still requires real licensed audio delivery, HTTPS, object storage/CDN, DRM/encrypted offline delivery, platform billing, push notifications, rights/royalty systems, fraud controls, observability, privacy/legal documents, and release signing/Play Console configuration.
