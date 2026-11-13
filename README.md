# Clyra

Clyra is a two-sided creator campaign management and intelligence platform for brands, agencies, and creators.

## Current slice

The first implementation is a dependency-free product shell in `dist/index.html`. It establishes the visual system, brand workspace navigation, campaign pulse, review activity, and Simulation Lab interaction states described in the project brief.

Open `dist/index.html` in a browser to preview it locally.

## Planned foundation

- `apps/web`: Next.js frontend and workspace experiences
- `apps/api`: FastAPI modular monolith
- `packages/contracts`: shared API schemas and validation
- PostgreSQL with organization-scoped records and outbox events
- Redis + Celery for audits, metrics processing, retries, and replay
- Rule-based audit engine with advisory AI assistance

The UI currently uses realistic placeholder data; no authentication or external writes are wired yet.
