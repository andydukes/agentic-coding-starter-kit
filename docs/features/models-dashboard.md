# Models Dashboard Feature

This feature implements a minimal UP2TOM model management dashboard with authentication, server-side rendering, and model details in a modal.

## What it does

- Auth-gated dashboard at `/dashboard`
- Lists the current user's models (name, description)
- "View details" opens a modal with full model information

## How it works

- Server component `src/app/dashboard/page.tsx` fetches the session and models:
  - Uses `auth.api.getSession({ headers: await headers() })`
  - Queries Drizzle ORM via `db` and `model` table
  - Passes results to a client component for rendering
- Client component `src/components/dashboard/models-list.tsx`:
  - Renders a grid of models
  - Opens a shadcn/ui `Dialog` to show details
  - Fetches details from `/api/models/[id]` when opening

## Key files

- `src/lib/schema.ts` — defines `model` table
- `src/app/dashboard/page.tsx` — server data fetching + page
- `src/components/dashboard/models-list.tsx` — client rendering + modal
- `src/app/api/models/route.ts` — list endpoint (auth required)
- `src/app/api/models/[id]/route.ts` — detail endpoint (auth + ownership)

## Usage

- Navigate to `/login` and sign in with Google
- You will be redirected to `/dashboard`
- Click "View details" on any model to open the modal

## Configuration

- Requires environment variables for Better Auth Google OAuth and database:
  - `POSTGRES_URL`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`

## Design decisions

- Use server components for auth checks and data loading on the dashboard
- Use a small client component to handle dialog interactions
- Keep the schema consolidated in `src/lib/schema.ts` to simplify Drizzle migrations
