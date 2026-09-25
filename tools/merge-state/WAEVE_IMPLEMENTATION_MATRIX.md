# WAEVE IMPLEMENTATION MATRIX

Generated: 2026-09-19T08:50:03.382Z
Preserved source variants: 18
Classified source files: 696
Canonical domain paths present: 26/26
Canonical build-capable domains: 7/26
Canonical explicit test scripts: 6/26

## Canonical platform domains

| Domain | Files | Package | Check | Build | Test | Gradle |
|---|---:|---|:---:|:---:|:---:|:---:|
| apps/web | 258 | @waeve/web | — | YES | YES | — |
| apps/api | 169 | @waeve/api | YES | — | YES | — |
| apps/artist | 5 | @waeve/apps-artist | YES | YES | YES | — |
| apps/admin | 4 | @waeve/admin | YES | YES | YES | — |
| apps/developer | 4 | @waeve/developer | YES | YES | YES | — |
| packages/shared | 7 | @waeve/shared | YES | YES | — | — |
| packages/contracts | 1 | — | — | — | — | — |
| packages/database | 11 | @waeve/database | YES | — | — | — |
| packages/security | 7 | — | — | — | — | — |
| packages/ui | 12 | — | — | — | — | — |
| services/catalog | 18 | @waeve/services-catalog | YES | — | — | — |
| services/playback | 26 | @waeve/services-playback | YES | — | — | — |
| services/search | 7 | @waeve/services-search | — | — | — | — |
| services/discovery | 5 | @waeve/services-discovery | YES | — | — | — |
| services/recommendations | 7 | @waeve/services-recommendations | YES | — | — | — |
| services/rights | 9 | @waeve/services-rights | YES | — | — | — |
| services/royalties | 4 | @waeve/services-royalties | YES | — | — | — |
| services/territory | 3 | @waeve/services-territory | YES | — | — | — |
| services/knowledge | 3 | @waeve/services-knowledge | YES | — | — | — |
| services/trust | 3 | @waeve/services-trust | YES | — | — | — |
| services/editorial | 3 | @waeve/services-editorial | YES | — | — | — |
| services/analytics | 4 | @waeve/services-analytics | YES | — | — | — |
| services/payments | 9 | @waeve/services-payments | YES | — | — | — |
| services/media | 7 | @waeve/services-media | YES | — | — | — |
| services/notifications | 5 | @waeve/services-notifications | YES | YES | YES | — |
| mobile/android | 116 | — | — | — | — | YES |

## Client targets

| Family | Client | Source evidence |
|---|---|---:|
| Listener | Android | 220 |
| Listener | iOS / iPadOS | 1 |
| Listener | Web | 23 |
| Listener | Windows | 0 |
| Listener | macOS | 1 |
| Listener | Linux | 0 |
| Listener | Android / Google TV | 220 |
| Listener | Apple TV | 0 |
| Listener | Samsung / LG TV | 0 |
| Listener | PlayStation | 0 |
| Listener | Xbox | 0 |
| Listener | Android Auto | 0 |
| Listener | Apple CarPlay | 1 |
| Listener | Wear OS | 0 |
| Listener | Apple Watch | 0 |
| Listener | Garmin / Fitbit / Samsung Wearables | 0 |
| Listener | Connected audio / speakers | 0 |
| Listener | Voice integrations | 0 |
| Industry | Artist Studio | 35 |
| Industry | Label Portal | 0 |
| Industry | Distributor Portal | 0 |
| Industry | Publisher / Songwriter / Rights Portal | 2 |
| Industry | Royalty Operations | 1 |
| Industry | Advertiser / Partner Portal | 0 |
| Industry | Licensing / Rights Operations | 3 |
| Platform | Admin / Moderation / Operations | 0 |
| Platform | Developer Portal / API | 23 |

## Engineering policy

- All required capabilities remain in current implementation scope.
- Preserved source variants are never modified by this matrix.
- Clients consume canonical APIs, contracts and event definitions.
- A platform-specific environment limitation is recorded separately from implementation status.
- No production feature is considered complete without implementation, integration and applicable verification evidence.
