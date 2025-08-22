# API Docs

This folder contains the OpenAPI spec for the external webhook endpoint.

- Spec file: `docs/api/openapi.yaml`
- Purpose: Document `POST /api/models/{id}/webhook` which updates attribute last values by name with domain validation.

## Lint and Bundle

Install Redocly CLI (as dev dependency) and use the scripts below.

### Add scripts (already added by assistant)

```json
{
  "scripts": {
    "openapi:lint": "redocly lint docs/api/openapi.yaml",
    "openapi:bundle": "redocly bundle docs/api/openapi.yaml -o docs/api/openapi.bundle.yaml"
  }
}
```

### Run

```bash
npm run openapi:lint
npm run openapi:bundle
```

The bundled file will be created at `docs/api/openapi.bundle.yaml`.

## Usage

- Security: Set `X-Webhook-Secret` header to the value of `WEBHOOK_SECRET` in your environment.
- Body schema: see `WebhookRequest` in the spec.
- Responses: per-item results with 200 (all success) or 207 (mixed), plus 400/401/404/422 for errors.
