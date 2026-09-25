# WAEVE 2.0.0 — production architecture build

Waeve is a standalone music platform. External music services are enrichment/identity sources, not Waeve's backend of record.

## Run

Requires Node.js 18+.

```bash
node server.js
```

Open `http://localhost:8787`.

The frontend also has an offline preview path and will not become a blank screen if the API is unavailable.

## Integration policy

### Spotify
Use the official Spotify Web API only for permitted catalogue metadata, artist/album/track identifiers and related enrichment. Spotify's current developer policy says the platform cannot be used to develop commercial streaming integrations, and its Web Playback/Player APIs are not a route for Waeve to redistribute Spotify audio. See the official developer documentation before enabling production credentials.

### Apple Music
MusicKit/Apple Music API can provide catalogue metadata and artwork and, with authorization, Apple Music playback/library functionality. Waeve should keep Apple Music playback as a user-authorized external-service mode, not copy Apple audio into Waeve storage.

### YouTube
Use the official YouTube Data API for permitted discovery metadata/thumbnails and the official YouTube IFrame Player API for YouTube playback where the product and terms allow it. Do not extract or download YouTube audio streams.

### Lyrics
Do not scrape or republish copyrighted lyrics. Implement a licensed/authorized lyrics provider adapter and store only the rights-cleared lyric/timing data required by the license.

## Waeve owns

- Waeve accounts and authentication
- Waeve artists and artist verification
- Waeve followers and likes
- Waeve play events and listening statistics
- Waeve playlists and collaborative playlists
- Waeve recommendation engine
- Waeve genre intelligence
- Waeve regional discovery
- Waeve charts/rankings
- Waeve artist analytics
- Waeve subscription/premium state
- Waeve uploaded music catalogue, subject to rights and moderation

## Production work before Play Store launch

1. Replace JSON storage with PostgreSQL or another managed production database.
2. Add secure password hashing such as Argon2id and rotating refresh tokens.
3. Put media in object storage and deliver through a CDN.
4. Add audio transcoding, loudness normalization, waveform generation and HLS/DASH delivery.
5. Add rights/territory metadata, ISRC/UPC/ISWC fields, takedown workflow and royalty accounting.
6. Add licensed lyrics provider credentials and timing validation.
7. Add Google Play Billing and Apple StoreKit subscription verification server-side.
8. Add push notifications, Android MediaSession/MediaStyle controls, iOS Now Playing/MPRemoteCommandCenter and Web Media Session API.
9. Add abuse/fraud detection, rate limiting, moderation and audit logs.
10. Complete privacy policy, terms, copyright policy, consent flows, data deletion/export and regional compliance.
11. Run security, accessibility, performance and store-release QA.

This build deliberately does not pretend that API keys, music licences, billing credentials, DRM or store certificates exist when they have not been supplied.
