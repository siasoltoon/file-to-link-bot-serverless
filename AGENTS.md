# Repository instructions

This is a new migration repository. Do not modify `siasoltoon/file-to-link-bot`.

- Runtime code belongs only under `tgcloud/schema.js`, `tgcloud/handlers/`, `tgcloud/lib/`, or `tgcloud/endpoints/`.
- Use only `sdk`, `sdk/db`, `sdk/api`, `sdk/fetch`, and relative project imports ending in `.js`.
- No arbitrary npm imports, Node filesystem APIs, or persistent background processes in runtime modules.
- Review schema diffs and apply database migrations separately from code deployment.
- Never store file bytes or credentials in the built-in database.
