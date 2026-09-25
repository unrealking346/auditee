# Waeve Canonical Implementation Policy

Waeve uses one canonical platform contract layer shared by backend services
and all client families.

## Rules

- Existing source variants remain preserved under `_sources/`.
- Canonical implementations are authoritative for new integration.
- Clients must consume canonical contracts rather than inventing incompatible
  representations.
- Security decisions remain server authoritative.
- Playback authorization remains server authoritative.
- Rights and territory decisions remain server authoritative.
- Subscription/payment state remains server authoritative.
- Royalty accounting remains append-oriented and auditable.
- Client-local state is never the authoritative source for commercial rights,
  payments, royalties or catalog ownership.
- Every implementation requires applicable build and test evidence.

## Client families

Listener:
Android, iOS/iPadOS, Web, Windows, macOS, Linux, TV, console,
automotive, wearable and connected-device clients.

Industry:
Artist Studio, label, distributor, publisher/rights, royalty,
advertising/partner and licensing clients.

Platform:
Administration, moderation, operations and developer/API clients.
