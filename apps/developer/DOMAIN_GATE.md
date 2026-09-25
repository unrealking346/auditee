# Waeve Domain Verification Gate

Domain: `apps/developer`

This domain is part of the canonical Waeve production ecosystem.

## Required verification

1. Static/type validation
2. Build/compile validation where applicable
3. Automated tests where applicable
4. Integration against canonical Waeve contracts
5. Security and permission validation where applicable
6. Runtime/integration verification where the environment supports it

## Policy

Existing implementation files must be preserved during reconciliation.
Source variants under `_sources/` are preserved and are not modified by this process.
Environment-specific limitations are recorded separately from implementation status.
