# Migration boundary

## Serverless owns
Telegram command handling and small structured records: user metadata, file references, link metadata, request status, and expiry timestamps.

## External components remain authoritative
Object storage retains the bytes. A separate worker handles file transfer and any operations that need large payloads or a filesystem. The download endpoint remains independent if it must work without a bot invocation.

## Before production
- Validate that a user owns every file record before showing or changing it.
- Use opaque, unguessable link tokens; do not expose storage keys.
- Define link expiry enforcement at the download endpoint, not just in the bot UI.
- Sign/authenticate worker requests and make job creation idempotent.
- Define retention/deletion policy and test error recovery.
- Review schema with `npx tgcloud diff`; deploy code and migrate separately.
