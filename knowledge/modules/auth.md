# Module: Auth

## Responsibility
User authentication, session management, route protection, and tenant identity.

## Files
- `src/lib/session-crypto.ts` — JWT encrypt/decrypt (Edge-compatible, NO server-only)
- `src/lib/session.ts` — Cookie create/delete (server-only)
- `src/lib/auth-api.ts` — `getAuthUserId()`, `verifyPropertyOwnership()`, `getUserPropertyIds()`
- `src/proxy.ts` — Next.js 16 route protection
- `src/app/actions/auth.ts` — Server actions: login, register, logout
- `src/app/login/page.tsx` — Login UI
- `src/app/register/page.tsx` — Register UI
- `src/app/api/auth/me/route.ts` — Current user endpoint

## Boundaries
- Auth module provides `getAuthUserId()` — all other modules call this, never read cookies directly
- `session-crypto.ts` is shared between Edge (proxy) and Node (API) — must stay Edge-compatible
- Password hashing with bcryptjs (cost factor 10)
- Session: JWT HS256, HttpOnly cookie, 7-day expiry

## Key Constraints
- `proxy.ts` cannot import `server-only`
- Public routes: `/login`, `/register` only
- API routes handle their own 401 (proxy skips `/api/`)
