# AGENTS.md

## Stack

Expo 54 (New Architecture) + React Native 0.81 + TypeScript (strict) + Expo Router 6 (file-based routing) + Supabase (Postgres, Realtime, Storage). No monorepo. Package manager is npm.

## Commands

```bash
npm run dev          # Expo dev server (telemetry disabled)
npm run typecheck    # tsc --noEmit
npm run lint         # expo lint (ESLint via Expo, no custom config)
npm run android      # Build & run on Android device/emulator
npm run build:web    # expo export --platform web
```

No test framework is configured. There are no CI workflows or git hooks.

## Environment

Copy `.env.example` to `.env` and fill in the two Supabase keys:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

The app crashes at startup if these are missing (`lib/supabase.ts` throws).

## Architecture

```
app/                 Expo Router screens (file-based routing)
  (tabs)/            Bottom tabs: calendario, recetas, compra
components/          Shared UI (Button) and feature components (calendario/)
lib/                 Supabase client, types, theme tokens, storage helpers
hooks/               Custom hooks (useLookups for cached Supabase lookups)
supabase/migrations/ SQL migrations (run via Supabase CLI, not the app)
```

- `app/index.tsx` redirects to `/calendario`. Three tabs: Calendario, Recetas, Compra.
- Path alias: `@/*` maps to project root (e.g. `@/lib/supabase`).

## Database & Backend

- All tables use RLS with full anonymous access (no auth). The app is designed for a single family.
- Every main screen subscribes to Supabase Realtime (`postgres_changes`) for live updates.
- Storage bucket `recetas-fotos` holds recipe images (5 MB, JPEG/PNG/WebP). Upload/delete helpers in `lib/storage.ts`.
- Lookup tables (`categorias_recetas`, `categorias_compra`, `usuarios`) are fetched and cached at module level in `hooks/useLookups.ts`.

## Conventions

- **All UI text, variable names, and comments are in Spanish.** Keep new code in Spanish to match.
- Styling uses `StyleSheet.create` with centralized tokens from `lib/theme.ts` (primary color: `#7C2D3A`). No Tailwind, no CSS-in-JS.
- Font: Nunito (Regular, SemiBold, Bold, ExtraBold) loaded via `@expo-google-fonts/nunito`.
- Icons: `lucide-react-native`.
- Formatting: Prettier with single quotes, 2-space indent, bracket spacing (`.prettierrc`).
- Optimistic UI updates: state is mutated immediately, then persisted to Supabase.
