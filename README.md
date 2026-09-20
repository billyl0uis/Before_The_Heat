# Before The Heat

A glassblowing design & murrini simulation suite. See [ARCHITECTURE.md](./ARCHITECTURE.md)
for the system design and data schema.

Stack: React (Vite) + Tailwind CSS + Three.js + Firebase (Auth/Firestore).

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your Firebase project config
npm run dev
```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run preview` — preview the production build locally
- `npm run lint` — lint with oxlint

## Deployment (Vercel)

This is a static Vite build — `npm run build` produces `dist/`, and Vercel
auto-detects Vite projects with zero config needed. No `vercel.json`, no
rewrites (there's no client-side router yet), nothing beyond connecting
the repo:

1. Go to [vercel.com/new](https://vercel.com/new) and import this GitHub
   repository. Vercel will detect the Vite framework preset automatically
   (build command `npm run build`, output directory `dist`).
2. **Before the first deploy** (or in Project Settings → Environment
   Variables afterward), add the same six `VITE_FIREBASE_*` variables from
   your `.env.local`. This is the one real gotcha: it'll build and deploy
   fine without them, but the Design Vault will silently show its "not
   configured" notice in production instead of erroring — easy to deploy,
   see the app mostly working, and not notice the Vault is quietly inert
   because the env vars never made it into Vercel's project settings.
3. Deploy. Every push to the branch Vercel is tracking gets its own
   preview or production deployment automatically from then on.
