# Waeve AI recommendation layer

The client already records the events needed for a prototype: plays, completion, recency, likes, follows, region, genre and mood. Production should stream these events to a backend recommender.

Ranking inputs:
1. Explicit taste: likes, follows, saved playlists.
2. Behavioral taste: completed plays, skips, repeats and session context.
3. Regional relevance: user's registered region and current permitted territory.
4. Freshness: new releases receive controlled exploration weight.
5. Diversity: avoid showing the same artist repeatedly.
6. Safety/rights: explicit filters, territory rights and takedowns.

Recommendation surfaces: Home, Radio/Autoplay, Daily Mixes, New Releases, Regional Charts, Artist Radio, Mood pages and Playlist suggestions.
