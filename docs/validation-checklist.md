# Phase 1 validation checklist

This checklist tests the current metadata-only handler without deploying code or changing the database schema.

## Safety boundary

- Work only in siasoltoon/file-to-link-bot-serverless.
- Do not edit siasoltoon/file-to-link-bot.
- Do not run tgcloud push or tgcloud migrate during this validation pass.
- Never paste the Serverless CLI token into a chat, issue, commit, or screenshot. Run login locally in a trusted terminal; the CLI stores credentials in the local .tgcloud/ directory.
- tgcloud run executes code on the platform. Since this handler calls api.sendMessage, use a real private chat with the intended test bot, not a fabricated chat ID.

## Prepare locally

```sh
git clone https://github.com/siasoltoon/file-to-link-bot-serverless.git
cd file-to-link-bot-serverless
npm install
npm run check
npx tgcloud login
npx tgcloud status
npx tgcloud diff
```

Inspect the status and diff only. If the project is not linked to the intended test bot, stop and resolve that before running a handler. Avoid pull or reset if you have local edits you need to keep.

## Test the handler

Use a private chat with the bot that this Serverless project is linked to. Get your own numeric Telegram user/chat ID from a trusted source or use the incoming message's actual IDs. Then run the command below, replacing YOUR_REAL_CHAT_ID and YOUR_REAL_USER_ID with those numeric values:

```sh
npx tgcloud run handlers/message '{ chat: { id: YOUR_REAL_CHAT_ID, type: "private" }, from: { id: YOUR_REAL_USER_ID }, text: "/start" }'
```

Expected behavior: the handler attempts to send the initialization reply to that private chat and writes/updates the user metadata. A successful CLI exit plus a visible reply is the useful smoke-test result. If the Bot API call fails, preserve the sanitized error text but never share credentials.

Next, send a small, non-sensitive test document to the same bot. Confirm the reply says metadata was recorded and explicitly says that no bytes were transferred and no public link was created. This is the intended current behavior, not an upload success.

## Record results

Record these outcomes without posting secrets:
- [ ] npm install succeeds.
- [ ] npm run check succeeds (syntax only).
- [ ] tgcloud status and tgcloud diff are understood; no deployment has been performed.
- [ ] /start run succeeds against the intended test chat.
- [ ] A test document produces a metadata-only response.
- [ ] No schema migration was applied.
- [ ] The original repository remains unchanged.

## Stop and review before the next phase

Before connecting storage, decide the worker host, S3-compatible storage provider, Telegram file retrieval path/size limits, secret provisioning, retention policy, public download behavior, and abuse limits. Use docs/worker-api.md as the design draft; its endpoints are not deployed. Review the exact tgcloud diff output before any future migration.
