# WAEVE 3.0.0 Release Build

## Primary Android project

`mobile/android/`

## Main application

`mobile/android/app/src/main/java/com/waeve/music/MainActivity.kt`

## New WAEVE Intelligence experience

Home now exposes a dedicated WAEVE Intelligence surface with:

- AI DJ prompt-to-mix experience
- Samples discovery
- Jam session controls
- Blend experience
- Global Music Pulse
- Music DNA
- Fan Graph

All surfaces use real Compose state and interact with the existing playback layer. Playback actions invoke Media3 when a playable item is available.

## Verification performed in this environment

- Backend JavaScript syntax checked with Node
- Frontend JavaScript syntax checked with Node
- Android source structure inspected
- Android route/call-site consistency checked statically
- Android version bumped to 3.0.0
- Feature documentation added

An Android SDK/Gradle toolchain is not installed in this execution environment, so an APK is not falsely marked as compiled or signed.
