# EQC Perth Campus Dashboard

> A live lobby dashboard for the **Equinim College — Perth Campus**. Shows current room allocations, weather, alerts, the campus floorplan, and trainer sign-on — all updating in real time across every screen on campus.

[![Live Site](https://img.shields.io/badge/Live-Vercel-1a7a54?style=for-the-badge)](https://eqc-dashboard-by-25g.vercel.app)
[![Stack](https://img.shields.io/badge/Stack-React_19_·_Vite_·_Firebase-1A1A1A?style=for-the-badge)](#)

---

## What this is

A single-page React app deployed on Vercel that drives the lobby screen at EQC Perth. Real-time room status, trainer photos, scrolling alerts, upcoming events, weather, and a campus map. Trainers update their own status via a QR-coded sign-on form. Staff manage everything else from the `/admin` panel.

### What you can do

- **Lobby screen**: fluid layout that renders correctly at 100 percent browser zoom (90 / 100 / 110 / 125 percent all supported), live room allocations with trainer photos pulled from Firestore, scrolling alerts, weather, upcoming events, campus life carousel, floor plan, and a Google Maps embed.
- **Mobile visitors**: anyone hitting the lobby URL on a phone gets a redirect modal that points them to the mobile sign-on portal (with a small admin cog and a "view anyway" escape hatch).
- **Trainer sign-on portal**: sign on, start a break, end a break early, edit an active break's remaining time, sign off, and update your own profile photo (file picker + crop + Firebase upload, with the new photo appearing on the lobby live).
- **Admin panel**: fully responsive. Desktop keeps the static sidebar; phones and tablets get a hamburger-triggered drawer with a backdrop. Tap targets are at least 44 px, login form fields stack and full-width on narrow screens.
- **Carousel admin**: uploads now open an in-browser crop modal locked to the lobby tile ratio (16:9), with zoom, rotate, and reset controls before the cropped JPEG is uploaded to Firebase Storage.

| Where | URL |
|---|---|
| **Lobby (production)** | [eqc-dashboard-by-25g.vercel.app](https://eqc-dashboard-by-25g.vercel.app) |
| **Trainer sign-on** | [eqc-dashboard-by-25g.vercel.app/trainer-sign-on.html](https://eqc-dashboard-by-25g.vercel.app/trainer-sign-on.html) |
| **Admin panel** | [eqc-dashboard-by-25g.vercel.app/admin](https://eqc-dashboard-by-25g.vercel.app/admin) (password gated) |
| **Repo** | [github.com/thedalycreative/eqc-dashboard-by-25g](https://github.com/thedalycreative/eqc-dashboard-by-25g) |
| **Firebase** | [console.firebase.google.com/project/eqc-dashboard-by-25g](https://console.firebase.google.com/project/eqc-dashboard-by-25g) |

---

## Architecture

| Layer | Detail |
|---|---|
| Frontend | React 19 + TypeScript + Vite 6 + Tailwind CSS 4 |
| Routing | React Router v7 (BrowserRouter) — `/`, `/admin/*`, `/trainer-sign-on.html`, `/mobile` |
| Real-time | Firebase Firestore `onSnapshot` listeners (no Socket.io in production) |
| Persistence | Firebase Firestore (cloud — no in-memory state) |
| File storage | Firebase Storage (trainer photos, carousel images) |
| Production host | Vercel (static SPA + serverless rewrites) |
| Trainer sign-on | Native React/HTML form at `/trainer-sign-on.html` posting directly to Firestore |

> [!NOTE]
> An earlier version of this app ran on Render/Cloud Run as a single Node process with Socket.io for real-time sync. The current deployment is static on Vercel — Firestore handles the real-time channel directly from the browser. The `server.ts` Express server is kept for local development only (`npm run dev`).

---

## Routes

| Route | Purpose |
|---|---|
| `/` | The lobby dashboard — what shows on the campus screen |
| `/admin` | Redirects to `/admin/rooms` after password gate |
| `/admin/rooms` | Manage room allocations |
| `/admin/events` | Manage upcoming events |
| `/admin/alerts` | Manage scrolling banner alerts |
| `/admin/carousel` | Campus life photo carousel (with in-browser crop modal) |
| `/admin/trainers` | Trainer profile management with photo crop modal |
| `/admin/signon-log` | Historical sign-on / sign-off log |
| `/admin/rss` | RSS news ticker feeds |
| `/admin/settings` | WiFi, contacts, brand, timing settings |
| `/trainer-sign-on.html` | Trainer sign-on form (with break controls and photo update) |
| `/mobile` | Mobile companion view (used by the dashboard redirect) |

---

## Firestore Collections

| Collection | What it stores |
|---|---|
| `rooms` | Current room allocations (resets daily) |
| `events` | Scheduled upcoming events |
| `staff` | Sign-on records |
| `announcements` | Active scrolling alerts |
| `config` | Misc app config |
| `trainers` | (Phase 4) Trainer profiles with photos |
| `carousel` | (Phase 4) Campus life images |
| `signOnLog` | (Phase 4) Historical sign-on / sign-off log |
| `rssFeeds` | (Phase 6) RSS source library |
| `settings/global` | (Phase 4) Global singleton: carousel timing, WiFi, contacts |

Security rules live in [`firestore.rules`](./firestore.rules). Deploy them with:

```bash
firebase deploy --only firestore:rules
```

---

## Local Development

**Prerequisites:** Node.js 20+, Firebase CLI (`npm install -g firebase-tools`)

```bash
npm install
cp .env.example .env       # then edit VITE_ADMIN_PASSWORD if needed
npm run dev                # http://localhost:3000
```

The `npm run dev` script runs Express with Vite middleware so the React app hot-reloads. The Firestore listeners connect live to the production Firebase project — be careful when testing destructive actions.

### Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Run the dev server with hot reload |
| `npm run build` | Build the frontend into `dist/` for production |
| `npm run build:pages` | Build for GitHub Pages preview (demo mode) |
| `npm run start` | Run the production Express server (legacy) |
| `npm run lint` | TypeScript check (`tsc --noEmit`) |
| `npm run clean` | Delete `dist/` |

---

## Deploying

### Vercel (current production)

Pushes to `main` auto-deploy. Manual deploy:

```bash
npx vercel --prod --yes
```

Set environment variables in Vercel project settings:

| Variable | Value |
|---|---|
| `VITE_ADMIN_PASSWORD` | The admin panel password |

The Firebase config has safe defaults baked in — only override `VITE_FIREBASE_*` if pointing at a different Firebase project.

### Firebase rules

Update [`firestore.rules`](./firestore.rules) then:

```bash
firebase deploy --only firestore:rules
```

---

## Environment Variables

| Variable | Where | Required | Notes |
|---|---|---|---|
| `VITE_ADMIN_PASSWORD` | build-time | recommended | Password for `/admin`. Falls back to `"asdf"` |
| `VITE_FIREBASE_*` | build-time | no | Override the baked-in Firebase config |
| `VITE_DEMO_MODE` | build-time | no | `"true"` disables Firebase writes, seeds demo data |
| `ADMIN_PASSWORD` | server | legacy | Only used by `server.ts` for Cloud Run/Render |

> [!IMPORTANT]
> Never commit a real `.env` file. The repo ships `.env.example` only — `.env*` is in `.gitignore`.

---

## Operating Guide

> [!NOTE]
> No technical background needed.

### Trainer signing on for class

1. Walk past the lobby screen on the way in
2. Scan the QR code on the lobby (or open `/trainer-sign-on.html`)
3. Fill in your name, intake, room, course, and what you're teaching today
4. Hit **Sign On & Update Board** — your room flips to **Live** on every screen

### Staff admin

1. Open the lobby and tap the cog icon in the footer (or go to `/admin` directly)
2. Enter the admin password
3. Use the sidebar to switch between tabs: Rooms, Events, Alerts, etc.
4. Changes save when you press **Save Changes** at the bottom of each tab

### Daily checks

- [ ] Lobby loads and the clock is ticking
- [ ] All six rooms display as **Available** at the start of the day
- [ ] WiFi QR scans and connects
- [ ] Floorplan and Google Map both render
- [ ] Trainer sign-on portal opens via the QR
- [ ] An alert posted by an admin appears on the marquee within ~1 second

---

## Project Reference Files

- [`PROJECT.md`](./PROJECT.md) — what this project is, who it's for, and the user journey
- [`BRAND.md`](./BRAND.md) — the EQC visual and tonal reference

---

## Recent fixes

| Fix | What changed |
|---|---|
| Dashboard zoom dependency | Lobby now scales via a fluid root font-size (`clamp(11px, 0.85vw, 13px)` applied while the page is mounted) so layout works at 100 percent zoom and adapts at 90 / 110 / 125 percent. No magic 75 percent zoom required. |
| Admin mobile compatibility | Sidebar collapses into a hamburger-triggered drawer with backdrop and inline close button. Login form stacks, inputs are full-width, all tap targets are at least 44 px. |
| Trainer profile photo update | Trainer sign-on portal can now update a trainer's photo from the active sign-on tile: file picker, crop modal (react-easy-crop), upload to Firebase Storage, and immediate refresh on the lobby (Lobby now reads `photoUrl` from the `trainers` collection, falling back to the static cutout). |
| Mobile dashboard redirect modal | First load of `/` on a phone (≤768 px viewport) shows a modal pointing to `/trainer-sign-on.html`, with a "View anyway" link and a hand-coded cog icon linking to `/admin`. Dismissal is remembered for the session. |
| Carousel crop on upload | Carousel admin now opens a crop modal locked to 16:9 with zoom, rotate, and reset before uploading the cropped JPEG. |
| Trainer break controls | Active-break tiles now expose `End break now` and `Edit break time` actions that update Firestore and the lobby countdown immediately. |
| Live site image sync | Trainer photos persist to Firebase Storage (not localStorage) and the lobby reads them from Firestore in real time. The floor plan image carries a `?v5` cache-bust query so CDN caches do not serve a stale image after the floor plan is updated. |

---

## Compliance

This is the public-facing screen of a **Registered Training Organisation (RTO 45758, CRICOS 03952E)**. The footer lists the campus address, phone, email, fire-assembly point, and first-aid location. **Do not remove these** — they're a regulatory requirement.

---

## License

Internal project for EQC Institute / Equinim College. All trademarks and brand assets belong to their respective owners.
