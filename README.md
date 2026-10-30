# mayo-and-bonnie

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_7YcIegdFg20gG0HqQ683G7GiFT9W)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

## Current implementation

The app now uses Supabase Auth and Postgres for the core household flow:

- Email magic-link login and session refresh
- Household onboarding with pets and default inventory categories
- Inventory stock-in with multiple expiry batches
- Real inventory list, product detail, FEFO consumption, and history records
- Pet weight, deworming, bathing, and grooming records
- Editable household, pet, category, and product metadata
- Barcode lookup with camera scanning and manual fallback
- History note editing and transactional inventory reversal
- Product image uploads through the household-scoped Supabase Storage bucket
- Household-scoped Row Level Security policies
- Auth and household guards for Home, Inventory, History, Settings, Stock-in, and detail pages

The original v0 visual language and page structure are preserved. The remaining product-layer work is mainly richer third-party catalog coverage and future reporting/automation, not local-only persistence for the features above.

## Supabase setup

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL` to the Supabase project URL.
3. Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the public `anon` key. Never put a `service_role` key in browser-exposed variables.
4. Run `supabase/migrations/001_initial.sql`, then `supabase/migrations/002_records_settings_barcode.sql` in the Supabase SQL editor. The second migration adds pet records, image storage policies, and transactional history reversal.
5. Add local and deployed callback URLs in Supabase Auth URL Configuration. The callback path is `/auth/callback`.

## Cloudflare deployment

This is a dynamic Next.js application: it uses server components, server actions, cookies, and Supabase SSR. The repository includes `open-next.config.ts` and `wrangler.jsonc` for the Cloudflare OpenNext Workers runtime; deploy it as a Worker, not as a plain static export. Configure the same two `NEXT_PUBLIC_SUPABASE_*` variables in Cloudflare and add the deployed `/auth/callback` URL in Supabase Auth.

## Verification

`pnpm typecheck` passes in the current source. Next.js compilation also succeeds. The current Codex Windows sandbox blocks the final Next TypeScript worker with `spawn EPERM`; the build no longer depends on Google Fonts because the UI uses a local system font stack.
