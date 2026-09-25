# Waeve security baseline

- HTTPS everywhere; HSTS at the edge.
- Rotate JWT/OIDC/S3/payment secrets through a secret manager.
- Use short-lived access tokens and refresh-token rotation for the production identity layer.
- Never expose S3 credentials to clients. Stream with short-lived authorized URLs.
- Verify billing provider webhooks server-side and make webhook processing idempotent.
- Apply rate limits and abuse detection to auth, search, events and upload endpoints.
- Encrypt databases and object storage at rest; use least-privilege IAM.
- Maintain immutable audit records for rights, billing, moderation and admin actions.
- Run SAST, dependency audit, container scanning, DAST and penetration testing before launch.
- Support user data export/deletion and jurisdiction-specific privacy requirements.
