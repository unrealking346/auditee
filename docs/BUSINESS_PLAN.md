# WAEVE GLOBAL MUSIC PLATFORM - BUSINESS PLAN 2.0

## Executive thesis
Waeve should launch as an artist-first, Africa-rooted but globally designed music platform: free ad-supported streaming + Premium, creator tools, discovery, fan/community features, and eventually licensed downloads and superfandom products.

The market is large but mature. IFPI reports that global recorded-music revenue reached $31.7B in 2025, up 6.4%, with paid streaming at 52.4% of global revenue and 837M paid subscription accounts. Streaming remains the economic engine, while fraud, rights, AI and regional growth are strategic pressure points.

## Product moat
1. Regional discovery: country/city/continent charts and region-aware home feeds.
2. Artist operating system: upload, metadata, lyrics, releases, analytics, fan growth and future payouts.
3. Transparent rights ledger: recording/publishing ownership, splits, ISRC/UPC, takedowns and royalty statements.
4. Fan graph: follows, likes, reactions, badges, superfans, early access and artist communities.
5. Discovery engine: Smart Mix, Samples, mood/genre stations, radio, similar artists and cold-start onboarding.
6. Collaborative playlists with approvals, invite links, reactions and QR sharing.
7. Premium: ad-free, background, high quality, protected offline downloads, Smart Downloads and premium experiences.
8. Global charts: transparent methodology and anti-fraud weighting so Waeve can become a credible ranking layer.
9. AI with consent: recommendation assistant, playlist generation, semantic search and later licensed remix/creation tools with attribution.
10. Low-data mode: adaptive bitrate, audio-only mode, download-on-Wi-Fi and data saver.

## Feature benchmark synthesis
Waeve's architecture deliberately combines patterns found across major services rather than cloning one product:
- Apple Music: collaborative playlist approvals, invite links, reorder controls and emoji reactions.
- YouTube Music: Samples, Smart Downloads, audio-only mode, background play and offline access.
- Spotify for Artists: real-time/release performance, source-of-stream analysis, countries/cities and playlist reach.
- SoundCloud for Artists: direct upload/distribution workflows, collaborator splits, advanced fan insights and creator tooling.
- Global industry model: free ad-supported services, subscriptions and paid downloads are established service types.

## Revenue model
### Listener
Free:
- ad-supported streaming
- standard quality
- on-demand listening where rights allow
- playlists, likes, follows, discovery and social features

Premium:
- monthly/annual subscription
- first-month trial subject to Play Billing rules
- ad-free
- background play
- higher quality tiers
- protected offline downloads
- Smart Downloads
- enhanced lyrics
- premium fan features
- future concert/ticket and merchandise integrations

### Artists
Free artist account:
- profile
- verified artist application
- uploads
- release metadata
- analytics
- fan tools

Future paid Pro tier:
- advanced audience intelligence
- campaign tools
- release scheduling
- team access
- advanced exports
- distribution services
- mastering partnerships

### Business/enterprise
- label dashboards
- API/data licensing
- chart intelligence
- B2B music licensing
- fitness/hospitality integrations
- branded stations

## Royalty strategy
Do not promise a fixed "per stream" price. Streaming payouts depend on revenue pools, contracts, territory, rights and methodology.

Waeve should maintain a rights ledger for:
- master owner
- publisher/composition rights
- writers
- producers
- featured artists
- distributors
- territories
- effective dates
- takedown status
- split percentages
- ISRC
- UPC/EAN
- PRO/CMO identifiers where applicable

Recommended long-term model: support both contractual pro-rata accounting and an optional user-centric allocation experiment, subject to licensing contracts and local law.

## Anti-fraud
Build from day one:
- abnormal repeat-stream detection
- bot/device/IP/ASN signals
- impossible travel
- suspicious playlist loops
- coordinated account clusters
- stream-quality thresholds
- delayed royalty finalization
- human review
- audit logs
- appeal process

## Rights and safety
Before commercial launch:
- direct licenses and/or distributor agreements
- publishing/mechanical/performance rights strategy
- territory restrictions
- copyright notice/takedown system
- counter-notice workflow
- artist identity/KYC where payouts require it
- age/child safety controls
- privacy/consent controls
- data deletion/export
- fraud and abuse reporting
- AI provenance and consent policy

## Technology
Current build:
- Node.js backend using only built-in modules
- JSON persistence for development
- HTML/CSS/JavaScript frontend
- REST API
- local audio upload endpoint
- PWA foundation

Production replacement:
- PostgreSQL
- Redis
- object storage
- CDN
- audio transcoding workers
- search index
- event/analytics pipeline
- queue
- secrets manager
- observability
- WAF/rate limiting
- automated backups
- multi-region deployment

## Recommended production services
Authentication: OAuth/Google/Apple + email/password + MFA for artists/admins.
Payments: Google Play Billing on Android, Apple In-App Purchase on iOS, web billing where permitted.
Storage: S3-compatible object storage + CDN.
Audio: FFmpeg pipeline for normalized streaming renditions.
Search: OpenSearch/Elasticsearch.
Analytics: event stream + warehouse.
Recommendation: hybrid collaborative + content + geographic + session model.
Notifications: FCM/APNs.
Moderation: automated classification + human review.
Lyrics: licensed provider or direct rights agreements.
Music fingerprinting: licensed fingerprint/identification vendor.

## Go-to-market
Phase 1: Uganda/East Africa independent artists and listeners.
Phase 2: Africa regional expansion.
Phase 3: diaspora and global independent music.
Phase 4: major-label/catalog licensing.
Phase 5: global charts, B2B intelligence and superfans.

## Launch metrics
North star:
- Weekly engaged listeners with >= 30 minutes of intentional listening

Supporting:
- activation
- D7/D30 retention
- streams/listener
- completion rate
- saves/listener
- follows
- playlist creation
- collaborative participation
- artist uploads
- artist retention
- premium conversion
- trial-to-paid
- ARPU
- ad ARPU
- CAC/LTV
- fraud rate
- payout accuracy
- catalog availability
- stream start latency

## Google Play production checklist
- Android native wrapper/client using Media3/ExoPlayer
- MediaSession
- notification playback controls
- lock-screen controls
- Bluetooth/headset controls
- background audio
- Android Auto where eligible
- Play Billing
- subscription restore
- account deletion
- privacy policy
- terms
- content rating
- data safety disclosure
- target/current Android API requirements
- signed AAB
- crash monitoring
- staged rollout
- Play Console testing tracks
- copyright/takedown contact
- support contact
- regional availability and pricing

## Business warning
A functional demo is not a licensed global music service. The biggest commercial barrier is rights acquisition and sustainable economics, not the UI. The product should therefore start with independent/owned/licensed catalogs and scale catalog rights in parallel with user growth.
