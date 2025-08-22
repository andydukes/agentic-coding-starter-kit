# Endpoint Integration Requirements (Attributes ↔ OpenAPI)

## Overview
This document defines how to extend the current model attribute architecture to support optional OpenAPI/LLM endpoint execution per attribute, while keeping the public API response shape compatible with `docs/schemas/model.json`.

## Scope and Core Decisions
- Models are immutable in this app: a model’s `attributes.metadata.prediction` and `attributes.metadata.attributes` never change after creation.
- Each `metadata.attributes` item may optionally link to exactly one endpoint (0..1). No many-to-many.
- Attribute rows store the per-attribute execution inputs (e.g., base URL value, path params, query params) needed to hit its linked endpoint.
- A global Endpoints catalog holds multiple API definitions, each of which may expose multiple operations (paths + methods + option schemas).
- Every endpoint invocation is recorded in a `Response` table (audit/observability).

## Out of Scope / Non-Goals
- Model versioning (not required; models are immutable by contract here).
- Changing the existing `docs/schemas/model.json` shape returned to clients.

## Current Context
- JSON schema: `docs/schemas/model.json` defines `attributes.metadata.attributes` as an array of attribute objects (`domain`, `name`, `question`, `type`).
- Types: `src/lib/types.ts` mirrors this with `AttributeItem` and `ModelAttributes`.

## Data Model (Proposed)

Tables and key fields (names indicative; adapt to Drizzle/ORM conventions):

1) attribute_definitions
- id (PK)
- model_id (FK → model.id)   // since models are immutable, attributes are tied to a model
- name (text)
- question (text)
- type (text)                 // e.g., "Continuous", "Nominal"
- domain_json (jsonb)         // DomainC/DomainR as today
- extra_fields_json (jsonb)   // room for added non-endpoint fields per attribute
- endpoint_definition_id (FK → endpoint_definitions.id, nullable) // 0..1
- exec_base_url (text, nullable)   // user-supplied per-attribute execution input
- exec_path_params_json (jsonb, nullable)   // e.g., { patientId: "..." }
- exec_query_params_json (jsonb, nullable)  // e.g., { topK: 5 }
- created_at, updated_at (timestamptz)

Rationale: stores the per-attribute execution parameters required to call the chosen endpoint, without duplicating global endpoint configuration.

2) endpoint_definitions
- id (PK)
- name (text)                  // human label, unique
- provider (text)              // e.g., "openai", "internal", "http"
- base_url_template (text)     // e.g., https://api.example.com
- auth_ref (text)              // reference/alias to secret manager/credential
- default_headers_json (jsonb) // baseline headers (non-secret)
- created_at, updated_at (timestamptz)

3) endpoint_operations
- id (PK)
- endpoint_definition_id (FK → endpoint_definitions.id)
- operation_name (text)                     // descriptive label
- http_method (text)                        // GET|POST|...
- path_template (text)                      // e.g., /v1/resources/{id}
- request_schema_json (jsonb, nullable)     // optional JSON schema for body
- query_schema_json (jsonb, nullable)
- response_schema_json (jsonb, nullable)    // for validation/mapping
- options_json (jsonb, nullable)            // provider/model params, retry, timeouts
- created_at, updated_at (timestamptz)

Note: An attribute links to the endpoint_definition (table 2). If needed, store which operation to use in attribute_definitions via operation_id (nullable) to keep the 1:1 mapping explicit:
- operation_id (FK → endpoint_operations.id, nullable)

4) responses (aka Response)
- id (PK)
- attribute_definition_id (FK)
- endpoint_definition_id (FK)
- operation_id (FK, nullable)
- request_url (text)
- request_headers_json (jsonb)
- request_query_json (jsonb, nullable)
- request_body_json (jsonb, nullable)
- response_status (int)
- response_headers_json (jsonb)
- response_body_json (jsonb)
- error_json (jsonb, nullable)
- latency_ms (int, nullable)
- tokens_in (int, nullable)    // for LLMs
- tokens_out (int, nullable)
- cost (numeric, nullable)
- created_at (timestamptz)

Indexes/Constraints (high level):
- attribute_definitions(model_id, name) unique if names are unique per model.
- responses(attribute_definition_id, created_at DESC) for retrieval.
- endpoint_operations(endpoint_definition_id, operation_name) unique.

## Relationships
- model 1..N attribute_definitions
- attribute_definitions 0..1 → endpoint_definitions
- endpoint_definitions 1..N endpoint_operations
- attribute_definitions 0..1 → endpoint_operations (selected operation for that attribute)
- responses N..1 attribute_definitions; N..1 endpoint_definitions; N..1 endpoint_operations (nullable)

## Read API Compatibility
- Continue returning the `model.attributes.metadata.attributes` array as defined in `docs/schemas/model.json`.
- Server composes this array by reading from `attribute_definitions` for the model.
- Endpoint linkage and exec_* fields are not exposed unless a new API surface is introduced; they remain internal/admin APIs.

## Execution Flow (Happy Path)
1) Resolve the attribute by model + attribute name.
2) If `endpoint_definition_id` is present, resolve endpoint + operation.
3) Compose request:
   - Base URL: prefer attribute.exec_base_url, else endpoint.base_url_template.
   - Path: expand operation.path_template with attribute.exec_path_params_json.
   - Query: merge attribute.exec_query_params_json with operation defaults.
   - Body: validate against operation.request_schema_json if provided.
4) Send request using auth_ref to retrieve credentials from secret manager.
5) Record a `responses` row with full request/response and metrics.
6) Optionally transform/store normalized output in `response_body_json` following response_schema_json.

## Admin/Authoring UX
- Create endpoint definitions and operations centrally.
- For each attribute that needs an endpoint, select endpoint + operation and fill `exec_*` inputs.
- Attributes without endpoints function as today.

## Security & Governance
- Do not store raw secrets in DB; `auth_ref` must resolve to secure storage.
- RBAC should separate permissions for:
  - Editing attributes (domain semantics).
  - Editing endpoints/operations (integration concerns).
  - Accessing responses (may contain sensitive inputs/outputs).
- Audit logging on all admin mutations.

## Observability
- `responses` table is the single source for tracing, debugging, and cost/usage analytics.
- Consider adding `trace_id` and correlation with app logs/APM.

## Migration Plan (High-Level)
1) Create new tables: endpoint_definitions, endpoint_operations, attribute_definitions (migrate attributes from the embedded JSON), responses.
2) Backfill attribute_definitions from existing `model.attributes.metadata.attributes` for all models.
3) Keep producing the old JSON shape by projecting from attribute_definitions.
4) Add admin UI/API for managing endpoints and linking attributes.

## Open Questions
- Should attribute names be unique per model? (recommended)
- Do we need soft-delete/versioning for endpoints/operations for audit? (could add status/version fields later without changing reads)
- Any PII in responses requiring retention policy or encryption at rest?
