# Vitrum Designer

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
