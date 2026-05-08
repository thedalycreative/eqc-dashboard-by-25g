# EQC Perth Campus Dashboard

> A live lobby dashboard for the **Equinim College — Perth Campus**. Shows current room allocations, weather, announcements, the campus floorplan, and trainer sign-on — all updating in real time across every screen on campus.

[![Live Site](https://img.shields.io/badge/Live_Site-Render-1a7a54?style=for-the-badge)](https://eqc-dashboard-v2.onrender.com)
[![UI Preview](https://img.shields.io/badge/UI_Preview-GitHub_Pages-181717?style=for-the-badge&logo=github&logoColor=white)](https://thedalycreative.github.io/eqc-perth-campus-dashboard/)
[![Stack](https://img.shields.io/badge/Stack-React_19_·_Vite_·_Express_·_Socket.io-1A1A1A?style=for-the-badge)](#)

---

## Two Deployments, Two Purposes

| Where | URL | What it is |
|---|---|---|
| **Production** | [eqc-dashboard-v2.onrender.com](https://eqc-dashboard-v2.onrender.com) | The real lobby dashboard. Full-stack app on Render — Express + Socket.IO, real-time updates, admin panel, trainer sign-on. **This is what runs on the campus screen.** |
| **UI Preview** | [thedalycreative.github.io/eqc-perth-campus-dashboard](https://thedalycreative.github.io/eqc-perth-campus-dashboard/) | Static frontend on GitHub Pages, auto-deployed from `main`. Read-only, seeded with sample data. Useful for sharing UI changes with stakeholders without standing up a backend. |

> [!IMPORTANT]
> **Don't show the GitHub Pages URL to staff or trainers.** Admin panel, trainer sign-on, and multi-screen sync don't work there — it's a static screenshot of the UI for review only. The campus lobby screen must point at the Render URL.

---

## Architecture

| Layer | Detail |
|---|---|
| Local folder | `eqc-perth-campus-dashboard` |
| GitHub repo | `thedalycreative/eqc-perth-campus-dashboard` |
| Production host | Render (single Node container, `Dockerfile` provided) |
| Preview host | GitHub Pages (static `dist/` only) |
| Frontend | React 19 + TypeScript + Vite 6 + Tailwind CSS 4 |
| Backend | Express 4 + Socket.io 4 (single Node process) |
| Real-time channel | WebSockets via Socket.io |
| Trainer sign-on | Static HTML at `/trainer-sign-on.html` posting to `/api/staff-signon` |

---

## How it Works

The dashboard runs as a single Node process. Express serves the built React SPA from `dist/`, and Socket.io shares a live state map (rooms, events, staff sign-ons, announcements) with every connected client. When a trainer signs on, an admin posts an announcement, or midnight rolls around (which auto-resets the room board), the server broadcasts the change and every screen on campus updates instantly without a refresh.

There are three surfaces:

- **The lobby screen** (`/`) — the main dashboard, designed to live on a Samsung Frame TV in reception.
- **The trainer sign-on portal** (`/trainer-sign-on.html`) — a QR-code-friendly page. Trainers fill in their name, room, course, and topics for the day; the form posts to `/api/staff-signon` and immediately flips the room status to **Live** on every screen.
- **The admin panel** — hidden behind a small cog icon in the footer, password-protected against `ADMIN_PASSWORD`. Lets staff override room status, post events, and create announcements with auto-expiry.

State is kept in memory on the server, which is fine for a lobby kiosk that resets at midnight anyway. There's no database to manage.

---

## Operating Guide

> [!NOTE]
> This guide is for **staff and trainers at EQC Perth**. No technical background needed.

### As a trainer signing on for class

1. Walk past the lobby screen on the way in
2. Scan the **Trainer Sign-On QR** (or open the cog icon in the footer and tap "Trainer Sign-On Portal")
3. Fill in your name, intake, room, course, and what you're teaching today
4. Hit **Sign On & Update Board** — your room flips to "Live" on every screen on campus

### As an admin

1. Tap the small cog icon in the footer (bottom-right)
2. Enter the admin password
3. Use the three tabs: **Rooms** (override status, edit details), **Events** (add/edit/remove upcoming events), **Alerts** (post a scrolling announcement with an expiry)

### Daily checks

- [ ] Lobby screen loads and the clock is ticking
- [ ] All six rooms display as **Available** at the start of the day
- [ ] WiFi QR (`EQC-network`) scans and connects
- [ ] Floorplan image renders cleanly
- [ ] Google Map of West Perth loads
- [ ] Trainer Sign-On portal opens via the QR
- [ ] An announcement posted by an admin appears on the marquee within ~1 second

---

## Local Development

**Prerequisites:** Node.js 20+

```bash
npm install
cp .env.example .env       # then edit ADMIN_PASSWORD
npm run dev                # http://localhost:3000
```

The `npm run dev` script starts Express + Socket.io with Vite middleware mode, so the React app hot-reloads while the backend stays alive.

### Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Run the dev server with hot reload |
| `npm run build` | Build the frontend into `dist/` for the **full-stack** deploy |
| `npm run build:pages` | Build the frontend into `dist/` for **GitHub Pages preview** (sets base path + demo mode) |
| `npm run start` | Run the production server (serves from `dist/`) |
| `npm run lint` | TypeScript check (`tsc --noEmit`) |
| `npm run clean` | Delete `dist/` |

---

## Deploying to Render (production)

The dashboard needs a long-running Node process (because of WebSockets), so production lives on Render. A `Dockerfile` is included and Render builds from it on every push to `main`.

Set these environment variables in the Render service settings:

| Variable | Value |
|---|---|
| `ADMIN_PASSWORD` | a strong password (used by the admin panel) |
| `NODE_ENV` | `production` |
| `PORT` | leave unset — Render injects this |

> [!TIP]
> Render's free tier sleeps after inactivity. If the lobby screen needs to stay warm 24/7, upgrade to a paid plan or set up an uptime pinger.

---

## Deploying the Preview to GitHub Pages

A GitHub Actions workflow at [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml) builds the static frontend and publishes it to Pages on every push to `main`.

### One-time setup

1. **Repo Settings → Pages** → set **Source** to **GitHub Actions**
2. Push to `main` (or run the workflow manually from the Actions tab)
3. The first run takes ~1 minute; afterwards the URL appears in the workflow run output

### What's different in the Pages build

- Built with `VITE_BASE_PATH=/eqc-perth-campus-dashboard/` so all assets resolve under that subpath
- Built with `VITE_DEMO_MODE=true` which causes the app to:
  - Skip the Socket.IO connection (no backend to talk to)
  - Seed the rooms list with sample "Live" data so the UI looks complete
  - Show a small **"Static Preview · Read Only"** badge in the bottom-left
  - No-op all admin/sign-on writes (the form returns a friendly "preview only" message)
- A `.nojekyll` file is shipped to stop GitHub from running Jekyll on the build output (preserves Vite's `_`-prefixed asset names if any)

### If you fork the repo

The base path in `package.json` is hardcoded to `/eqc-perth-campus-dashboard/`. If you fork under a different repo name, update the `build:pages` script to match (`VITE_BASE_PATH=/your-repo-name/`).

---

## Environment Variables

| Variable | Where | Required | Notes |
|---|---|---|---|
| `ADMIN_PASSWORD` | server (Render) | **yes in production** | Falls back to `"asdf"` in local dev with a warning |
| `PORT` | server | no | Render injects this; defaults to `3000` locally |
| `NODE_ENV` | server | yes in prod | Set to `production` to serve `dist/` instead of running Vite |
| `VITE_BASE_PATH` | build-time | only for GH Pages | Subpath for static deploys; defaults to `/` |
| `VITE_DEMO_MODE` | build-time | only for GH Pages | Set to `true` to disable backend calls and seed sample data |

> [!IMPORTANT]
> Never commit a real `.env` file. The repo ships `.env.example` only — `.env*` is in `.gitignore`. Set production secrets via the Render dashboard.

---

## Project Reference Files

- [`PROJECT.md`](./PROJECT.md) — what this project is, who it's for, and the user journey
- [`BRAND.md`](./BRAND.md) — the EQC visual and tonal reference (colours, type, voice)

These live at the project root and are the source of truth for design and copy decisions. Update them as the project evolves.

---

## Compliance

This is the public-facing screen of a **Registered Training Organisation (RTO 45758, CRICOS 03952E)**. The footer lists the campus address, phone, email, fire-assembly point, and first-aid location. **Do not remove these** — they're a regulatory requirement.

---

## License

Internal project for EQC Institute / Equinim College. All trademarks and brand assets belong to their respective owners.
