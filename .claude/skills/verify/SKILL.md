---
name: verify
description: Build, launch, and drive College Circle Connect end-to-end in a sandbox with no Supabase credentials, by mocking the Supabase API in the browser.
---

# Verifying College Circle Connect

## Build
- `npm ci` first — fresh containers have no node_modules.
- `npm run build` runs `tsc -b && vite build`.

## Launch without real Supabase credentials
`src/supabase.ts` throws at startup if the env vars are missing. Dummy values
work as long as the Supabase API is mocked at the browser level:

    VITE_SUPABASE_URL=https://dummy.supabase.co VITE_SUPABASE_ANON_KEY=dummy npx vite --port 5173 --strictPort

## Drive
- Use playwright-core (`npm i playwright-core` in a scratch dir) with the
  pre-installed browser: `chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })`.
- Mock Supabase with `page.route('https://dummy.supabase.co/**', ...)`:
  - `GET /auth/v1/user` → user JSON (`id`, `aud`, `email`, `app_metadata`, `user_metadata`)
  - `/rest/v1/users?...` → profile row `{id, full_name, email, role, avatar_initials}`;
    return a bare object when the request's Accept header contains `object`
    (PostgREST `.single()`), else an array
  - other `/rest/v1/*` → `[]`
- To land in the app signed in — or on the reset-password screen — navigate to
  `/#access_token=<fake JWT>&expires_in=3600&expires_at=<epoch>&refresh_token=x&token_type=bearer[&type=recovery]`.
  supabase-js (implicit flow) builds the session from the hash and only calls
  the mocked `GET /auth/v1/user`. The fake JWT just needs three base64url
  segments with a `sub`/`exp` payload; the signature is never checked
  client-side.

## Gotchas
- Entry animations (`cc-swap`, `cc-rise`) start near opacity 0 — wait ~1.2s
  before screenshots or the card looks empty.
- `npm run lint` has ~100 pre-existing errors on main; it is not a useful gate.
  The `any`-typed inline style consts are the established idiom.
