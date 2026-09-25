# Waeve Web Merge

The canonical Waeve web application uses the React/Vite implementation
as its application foundation.

The complete original Waeve frontend is preserved under:

`_legacy-waeve-frontend/`

It is a migration/reference source, not a second production application.

## Migration principle

Existing functionality must be reconciled into the React application.
Do not discard working Waeve functionality merely because the newer
implementation uses a different frontend architecture.

Important legacy capabilities include:

- playback
- queue
- playlists
- playlist management
- library
- search
- storage
- routing
- music/catalog handling
- player UI
- library/playlist UI
- reusable components

The canonical implementation must eventually expose these capabilities
through the unified Waeve API and domain architecture.

## Current foundation

- React
- React DOM
- TypeScript
- Vite
- Vitest
- API client boundary
- browser player boundary
- authentication UI boundary
