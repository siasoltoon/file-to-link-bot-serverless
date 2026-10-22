# File-to-Link Bot — Telegram Serverless

**Status:** Phase 0 migration shell. This is not a complete port of the original Python application.

Original: `siasoltoon/file-to-link-bot`  
Purpose: move Telegram-facing commands and small file/link metadata into Telegram Serverless while keeping file bytes and download serving external.

## Architecture boundary

- **Serverless:** bot-facing interactions, user records, file metadata, public-link metadata, request state.
- **External services:** S3-compatible object storage, large-file transfer worker, and any download/API endpoint.
- **Not implemented yet:** actual upload processing, storage calls, public-link generation, expiration cleanup, or signed worker requests.

The built-in SQLite-backed database is a good fit for metadata, not for storing file contents or replacing object storage. No production data is imported.

## Setup and validation

1. Use Node.js 18+ and run `npm install`.
2. Enable Serverless for the intended bot in @BotFather.
3. Run `npx tgcloud login` using that bot's **Serverless CLI access token**, not its Bot API token. Never paste tokens into chat or commit them.
4. Run `npm run check`. This only checks JavaScript syntax; it does not validate SDK compatibility, database operations, or live bot behavior.
5. Once authenticated locally, test `npx tgcloud run handlers/message '{ chat: { id: 123 }, from: { id: 123 }, text: "/start" }'` against the CLI's documented input format.
6. Review `npx tgcloud diff`. Do not run a migration until its full proposed schema change has been reviewed.
7. Code sync (`npx tgcloud push`) and schema migration (`npx tgcloud migrate`) are separate operations; do not assume either one applies the other.

## External worker design

See [`docs/worker-api.md`](docs/worker-api.md) for a **design draft only** of the authenticated transfer-worker boundary, job states, download-token handling, expiry, and pre-implementation checks. No worker URL or credentials are configured and no worker calls are implemented yet.

## Data and safety

Relationships are enforced in application code because the platform does not enforce foreign keys. Before production, add idempotency, ownership checks, retention cleanup, and authenticated worker requests. Never put credentials or file bytes in the database. The original repository remains unchanged.
