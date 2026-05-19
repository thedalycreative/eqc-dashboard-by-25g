# EQC Perth Campus Dashboard

> A live lobby dashboard for the **Equinim College -- Perth Campus**. Shows real-time room allocations, weather, trainer photos, scrolling alerts, upcoming events, campus life carousel, and floorplan -- all updating across every screen on campus.

[![Live Site](https://img.shields.io/badge/Live-Vercel-1a7a54?style=for-the-badge)](https://eqc-dashboard-by-25g.vercel.app)
[![Stack](https://img.shields.io/badge/Stack-React_19_%C2%B7_Vite_%C2%B7_Firebase-1A1A1A?style=for-the-badge)](#)

---

## Team

| Name | Role |
|---|---|
| **Tim Daly** | Developer, project lead |
| **Intake 25g** | Cyber Security cohort contributing to the build |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6 |
| Styling | Tailwind CSS v4 |
| Animation | Motion (Framer Motion) |
| Icons | Lucide React |
| Real-time data | Firebase Firestore (`onSnapshot` listeners) |
| File storage | Firebase Storage (trainer photos, carousel images) |
| Routing | React Router v7 (BrowserRouter) |
| QR code | qrcode.react |
| Image cropping | react-easy-crop |
| Notifications | react-hot-toast |
| RSS parsing | rss-parser |
| Hosting | Vercel (auto-deploy on push to `main`) |

---

## Folder Structure

```
src/
  App.tsx                  # Router setup
  main.tsx                 # Entry point
  index.css                # Tailwind + global styles
  lib/
    firebase.ts            # Firebase config and init
    hooks.ts               # Real-time Firestore hooks
    rss.ts                 # RSS ticker logic
    storage.ts             # Firebase Storage upload/delete/crop utilities
    trainers.ts            # Trainer image helpers
    types.ts               # Shared TypeScript interfaces
  pages/
    Lobby.tsx              # Main lobby dashboard (full-screen)
    Mobile.tsx             # Mobile companion view
    TrainerSignOn.tsx       # Trainer sign-on portal
    Admin.tsx              # Admin shell (sidebar + outlet)
    admin/
      Rooms.tsx            # Room allocation management
      Events.tsx           # Event scheduling with icon picker
      Alerts.tsx           # Scrolling alert management
      Carousel.tsx         # Campus life photo carousel
      Trainers.tsx         # Trainer profile management
      RssFeeds.tsx         # RSS feed library and ticker settings
      Settings.tsx         # Global settings (carousel, WiFi, contacts)
      SignOnLog.tsx         # Historical sign-on/sign-off log
public/
  images/                  # Static assets (campus map, icons)
```

---

## Routes

| Route | Purpose |
|---|---|
| `/` | Lobby dashboard -- the campus screen |
| `/mobile` | Mobile companion view |
| `/trainer-sign-on` | Trainer sign-on form (break controls, photo update) |
| `/admin` | Admin panel (password-gated) |
| `/admin/rooms` | Room allocation management |
| `/admin/events` | Event scheduling |
| `/admin/alerts` | Scrolling banner alerts |
| `/admin/carousel` | Campus life photo carousel |
| `/admin/trainers` | Trainer profile management |
| `/admin/signon-log` | Sign-on / sign-off history |
| `/admin/rss` | RSS news ticker feeds |
| `/admin/settings` | WiFi, contacts, timing settings |

---

## Firestore Collections

| Collection | Purpose |
|---|---|
| `rooms` | Current room allocations (resets daily) |
| `events` | Scheduled events |
| `announcements` | Active scrolling alerts |
| `trainers` | Trainer profiles with photos |
| `carousel` | Campus life carousel images |
| `signOnLog` | Historical sign-on / sign-off log |
| `rssFeeds` | RSS feed source library |
| `settings/global` | Global config singleton |

---

## Local Development

**Prerequisites:** Node.js 20+

```bash
npm install
npm run dev        # http://localhost:3000
```

The dev server uses Express + Vite middleware with hot reload. Firestore listeners connect to the live Firebase project -- be careful with destructive actions.

### Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | TypeScript check (`tsc --noEmit`) |
| `npm run clean` | Delete `dist/` |

---

## Deploying

Pushes to `main` auto-deploy to Vercel. Manual deploy:

```bash
npx vercel --prod --yes
```

Set environment variables in Vercel project settings:

| Variable | Required | Notes |
|---|---|---|
| `VITE_ADMIN_PASSWORD` | Recommended | Admin panel password. Falls back to `"asdf"` |
| `VITE_FIREBASE_*` | No | Override baked-in Firebase config |

### Firebase rules

```bash
firebase deploy --only firestore:rules
```

---

## Links

| Where | URL |
|---|---|
| **Lobby** | [eqc-dashboard-by-25g.vercel.app](https://eqc-dashboard-by-25g.vercel.app) |
| **Mobile** | [eqc-dashboard-by-25g.vercel.app/mobile](https://eqc-dashboard-by-25g.vercel.app/mobile) |
| **Trainer sign-on** | [eqc-dashboard-by-25g.vercel.app/trainer-sign-on](https://eqc-dashboard-by-25g.vercel.app/trainer-sign-on) |
| **Admin** | [eqc-dashboard-by-25g.vercel.app/admin](https://eqc-dashboard-by-25g.vercel.app/admin) |
| **Repo** | [github.com/thedalycreative/eqc-dashboard-by-25g](https://github.com/thedalycreative/eqc-dashboard-by-25g) |
| **Firebase** | [console.firebase.google.com/project/eqc-dashboard-by-25g](https://console.firebase.google.com/project/eqc-dashboard-by-25g) |

---

## Compliance

This is the public-facing screen of a **Registered Training Organisation (RTO 45758, CRICOS 03952E)**. The footer displays campus address, phone, email, fire-assembly point, and first-aid location. Do not remove these -- they are a regulatory requirement.

---

## License

Internal project for EQC Institute / Equinim College. All trademarks and brand assets belong to their respective owners.
