# File-to-Link Bot — Telegram Serverless

**Status:** Phase 0 migration shell. This is not a complete port of the original Python application.

Original: `siasoltoon/file-to-link-bot`  
Purpose: move Telegram-facing commands and small file/link metadata into Telegram Serverless while keeping file bytes and download serving external.

## Architecture boundary

- **Serverless:** bot-facing interactions, user records, file metadata, public-link metadata, request state.
- **External services:** S3-compatible object storage, large-file transfer worker, and any download/API endpoint.
- **Not implemented yet:** actual upload processing, storage calls, public-link generation, expiration cleanup, or signed worker requests.

The built-in SQLite-backed database is a good fit for metadata, not for storing file contents or replacing object storage. No production data is imported.

## Setup

1. Use Node.js 18+ and run `npm install`.
2. Enable Serverless for the intended bot in @BotFather.
3. Run `npx tgcloud login` using that bot's **Serverless CLI access token**, not its Bot API token.
4. Run `npm run check`, then `npx tgcloud run handlers/message '{ chat: { id: 123 }, from: { id: 123 }, text: "/start" }'`.
5. Review `npx tgcloud diff`; only then use `npx tgcloud push` and separately review/run `npx tgcloud migrate`.

## Data and safety

Relationships are enforced in application code because the platform does not enforce foreign keys. Add idempotency, ownership checks, retention cleanup, and authentication/signing before connecting an external worker. Never put credentials or file bytes in the database.
