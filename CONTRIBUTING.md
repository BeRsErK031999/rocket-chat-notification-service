# Contributing

## Development

- Use `yarn` only.
- Keep the service standalone Node.js/TypeScript.
- Keep TypeScript strict and avoid `any`.
- Use `import type` for type-only imports.
- Do not add Dockerfiles or NATS integration unless explicitly requested.

## Local checks

Run the full verification set before opening a pull request:

```bash
yarn type-check
yarn lint
yarn test
```

## Pull requests

- Keep changes focused and production-friendly.
- Include tests when behavior changes.
- Update README or docs when workflows or API contracts change.
