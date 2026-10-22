# External storage worker contract (design draft)

**Status: specification only. No worker endpoint is called by Serverless yet.**

This contract defines the boundary for the next phase. It does not assume a worker framework, public hostname, storage provider, or secret-delivery mechanism. Do not deploy a worker or apply a database migration based on this draft alone.

## Responsibilities

- **Telegram Serverless:** command handling, user identity, file metadata, request/job state, and user-facing status.
- **External worker:** retrieve file bytes using the configured Telegram access path, transfer bytes to S3-compatible object storage, and report job outcomes.
- **Download service:** validate an opaque public token and expiry on every request, then stream the object or issue a short-lived signed redirect. It must not trust the bot UI to enforce expiry.
- **Object storage:** bytes only. Never store file bytes or credentials in the Serverless database.

## Proposed API

All paths are versioned. These are proposed paths, not currently deployed endpoints.

### 1. Create a transfer job

`POST /v1/file-jobs`

Example request (the worker must treat all user-controlled fields as untrusted):

```json
{
  "request_id": "serverless-file-record-id-or-opaque-id",
  "telegram_file_id": "Telegram file_id",
  "file_name": "report.pdf",
  "mime_type": "application/pdf",
  "file_size": 123456,
  "expires_at": "2026-10-30T00:00:00Z"
}
```

Rules:
- The authenticated caller must be authorized for this bot/tenant.
- Use `request_id` as an idempotency key. Repeating the same request must return the existing job, not upload a duplicate.
- Apply configured maximum size, allowed media types, rate limits, and expiry bounds before downloading.
- Do not accept arbitrary storage keys, destination URLs, filesystem paths, or caller-provided download URLs.
- The worker must independently resolve the Telegram file and enforce limits; metadata supplied by the caller is not authoritative.

Suggested accepted response:

```json
{
  "job_id": "opaque-worker-job-id",
  "status": "queued"
}
```

### 2. Read job status

`GET /v1/file-jobs/{job_id}`

Suggested response:

```json
{
  "job_id": "opaque-worker-job-id",
  "request_id": "serverless-file-record-id-or-opaque-id",
  "status": "queued | downloading | uploading | ready | failed",
  "public_url": null,
  "expires_at": "2026-10-30T00:00:00Z",
  "error_code": null
}
```

Only return a public URL after the object is fully uploaded and the download service has persisted the token/expiry. Never return credentials, signed storage keys, Telegram bot tokens, raw exception traces, or internal paths. Keep user-facing error codes non-sensitive.

### 3. Cancel a job (optional)

`POST /v1/file-jobs/{job_id}/cancel`

Cancellation must be authenticated, idempotent, and best-effort. A completed job cannot be represented as cancelled if its object already exists; deletion requires a separate explicit retention policy.

## Authentication requirements (must be designed before implementation)

Use server-to-server authentication with a secret stored only in the Serverless secret/config mechanism and the worker's secret manager. Never place secrets in source files, commits, database rows, bot messages, query strings, or logs.

Preferred proposal: HMAC-SHA-256 over a canonical request containing the HTTP method, path, timestamp, unique nonce, and SHA-256 body digest. The worker must:
1. Reject invalid signatures using constant-time comparison.
2. Enforce a narrow clock-skew window.
3. Reject reused nonces (replay protection).
4. Require HTTPS and rotate credentials.
5. Apply per-bot authorization and rate limits.
6. Redact authorization headers and sensitive values from logs.

**Do not implement HMAC by guessing runtime APIs.** First confirm how this Serverless runtime securely provisions secrets and supports the required cryptographic primitives. If those capabilities are unavailable, put a small authenticated gateway in front of the worker rather than weakening authentication.

## Download tokens and expiry

- Generate at least 128 bits of cryptographically secure randomness for opaque public tokens.
- Store only the token (or preferably a token hash, if lookup requirements permit), object reference, owner ID, status, and expiry in metadata.
- Do not expose an S3 key or permanent signed URL as the public token.
- Check token status and expiry at request time; expired/revoked tokens must fail closed.
- Use short-lived storage redirects only after validating the token.
- Add cleanup for expired objects and metadata, with retry-safe deletion and audit events.
- Protect against path traversal, SSRF, oversized responses, and content-type/content-disposition injection.

## State model

Suggested transition graph:

`queued -> downloading -> uploading -> ready`

Any active state may transition to `failed`; cancellation may be supported separately. A retry must be safe and idempotent. Store a stable error code and keep sensitive diagnostic details only in protected worker logs.

## Before coding/deploying

- [ ] Confirm the supported Telegram file retrieval method and actual size limits for this bot setup.
- [ ] Choose the worker host and S3-compatible provider.
- [ ] Confirm secret provisioning and crypto support in Telegram Serverless CLI/runtime.
- [ ] Choose whether downloads stream through the service or use short-lived redirects.
- [ ] Define maximum file size, retention, expiry defaults, and abuse/rate-limit policy.
- [ ] Add integration tests for authentication failures, replay, duplicate requests, partial uploads, retries, expiry, and deletion.
- [ ] Review the actual schema diff before running any migration.
- [ ] Keep the original `siasoltoon/file-to-link-bot` repository untouched.
