# Project Status

Living to-do list for the current application build. I will keep this updated as we progress.

## Summary
- Core schema for endpoints/attributes added and seeded.
- Model detail UX now links to dedicated Prediction and Attributes pages.
- Next focus: read projection from normalized tables and admin UI for endpoints.
- Upcoming: add lastValue fields (numeric/text/object) with provenance and domain-aware validation.

## Checklist

### Database & Data Model
- [x] Define normalized tables: `endpoint_definitions`, `endpoint_operations`, `attribute_definitions`, `responses` (`src/lib/schema.ts`)
- [x] Generate and apply migrations (Drizzle)
- [x] Seed mock data for models, endpoints, operations, attribute_definitions, and one sample response (`src/app/api/models/seed/route.ts`)
- [ ] Projection layer: read `attribute_definitions` and map into `docs/schemas/model.json` shape
- [ ] Projection API: `GET /api/models/[id]/projection` returning the composed model
- [x] Add lastValue columns to `attribute_definitions`:
  - `lastValueNumber` (numeric, nullable)
  - `lastValueText` (text, nullable)
  - `lastValueObject` (jsonb, nullable)
  - `lastValueUpdatedAt` (timestamptz)
  - `lastValueSource` (text: endpoint|webhook|manual)
  - `lastResponseId` (FK → responses.id, nullable)
  - `lastValueMeta` (jsonb, nullable)
- [x] Add extraction config to `endpoint_operations`:
  - `responseExtractPath` (text)
  - `responseExtractFormat` (text)

### Application UI (User-facing)
- [x] Add Prediction page: `src/app/models/[id]/prediction/page.tsx`
- [x] Add Attributes page: `src/app/models/[id]/attributes/page.tsx`
- [x] Make dashboard model detail cards clickable (`src/components/dashboard/model-detail.tsx`)
- [x] Attributes page: show linked endpoint indicator (reads from normalized layer once projection is added)
- [x] Attributes page: display lastValue (numeric/text) and expose an inspector for object payloads when available
- [x] Attributes page: add object inspector to view `lastValueObject` payload (collapsible JSON viewer)

### Admin & Integration
- [ ] Admin APIs: CRUD for `endpoint_definitions` and `endpoint_operations`
- [ ] UI to link/unlink an `attribute_definitions` record to an operation and set `exec_*` inputs
- [ ] RBAC: separate permissions for editing attributes vs endpoints vs viewing responses
- [ ] Response viewer: page to browse recent responses with filters and details
- [ ] Execution mapping: support complex object responses; map to `lastValueObject` and derive scalar lastValue per domain
- [ ] Webhook handler: accept external updates for lastValue; validate and store with provenance
- [x] Utility: server-side helper `setLastValue(attributeId, payload, source, responseId?)` with domain-aware validation

### Security & Ops
- [ ] Use `authRef` indirection to fetch secrets from secure storage
- [ ] Basic auditing on admin mutations (created_by/updated_by or activity log)
- [ ] Add observability fields like `trace_id` (DB + logs) and simple metrics

## Notes
- Public read APIs must continue to match `docs/schemas/model.json` shape; projection will ensure compatibility while we store normalized data.
- Models are immutable by contract here; no model versioning required.
