# AGENTS.md

## Project Rules

- Use `yarn` only. Do not use `npm` or `pnpm`.
- Keep the service as a standalone Node.js/TypeScript microservice.
- Keep TypeScript strict and avoid `any`.
- Use `import type` for type-only imports.
- Keep code simple, explicit, and production-friendly.
- Do not add Docker unless explicitly requested.
- Do not integrate NATS yet; leave clear extension points for future event consumers.

## Verification

Before considering a change done, run:

- `yarn type-check`
- `yarn lint`
- `yarn test`
