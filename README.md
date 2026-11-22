# Vijayprasanth S — MERN Stack Developer Portfolio

A premium, responsive, animated personal portfolio built with the MERN stack. It includes a
dark/light public site, a working contact form backed by Express + MongoDB, and a
JWT-protected admin panel for managing the site content at runtime.

## Structure

```
vijay portfolio/
├── frontend/   React 18 + Vite + Framer Motion + lucide-react
│   └── src/
│       ├── admin/      Premium admin shell, dashboard, editors, inbox, media and settings
│       ├── content/    ContentProvider, CMS API client and public asset URL resolution
│       ├── sections/   Homepage sections (read CMS content, with static fallback)
│       ├── styles/     Global, responsive and CMS-extra styles
│       └── data/       Static fallback content
└── backend/    Express + Mongoose + MongoDB GridFS
    ├── config/        env, defaultContent seed, GridFS bucket helpers
    ├── models/        Admin, Content, ContactMessage
    ├── controllers/   auth, content, contact, assets, dashboard overview
    ├── middleware/    JWT auth and multipart upload validation
    └── routes/        auth, content, contact, admin, public assets
```

## Prerequisites

- Node.js (v18+) and npm
- MongoDB running locally on `localhost:27017`, or a hosted MongoDB Atlas connection string
- For deployment on a serverless host such as Vercel: a **persistent hosted MongoDB** is
  required. The local filesystem is not used for uploads and is not persistent on Vercel.

## Getting started

### 1. Backend

```bash
cd "E:\vijay portfolio\backend"
npm install
npm run dev        # http://localhost:5000
```

### 2. Frontend

```bash
cd "E:\vijay portfolio\frontend"
npm install
npm run dev        # http://localhost:5173
```

The frontend proxies `/api` to `http://localhost:5000` in development, so the contact
form and admin panel work out of the box.

### Production build

```bash
cd "E:\vijay portfolio\frontend"
npm run build
npm run preview
```

## Environment variables (`backend/.env`)

| Variable          | Description                                                       |
| ----------------- | ----------------------------------------------------------------- |
| `PORT`            | Backend port (default `5000`)                                     |
| `MONGO_URI`       | MongoDB connection string (local or hosted Atlas URI)             |
| `CLIENT_ORIGIN`   | Allowed frontend origin (default `http://localhost:5173`)         |
| `CONTACT_TO_EMAIL`| Where contact-form emails are sent (optional)                     |
| `SMTP_HOST`       | SMTP host (optional — required to email form replies)             |
| `SMTP_PORT`       | SMTP port (default `587`)                                         |
| `SMTP_USER`       | SMTP username (optional)                                          |
| `SMTP_PASS`       | SMTP password (optional)                                          |
| `ADMIN_USERNAME`  | Admin login username (default `admin`)                            |
| `ADMIN_PASSWORD`  | Admin login password (seeded on first backend start)              |
| `JWT_SECRET`      | Secret used to sign admin JWTs                                    |

No credentials are hardcoded. If SMTP is not configured, the contact form still saves
messages to MongoDB. If neither is available it returns a friendly 503.

## Frontend environment variables

| Variable      | Description                                                       |
| ------------- | ----------------------------------------------------------------- |
| `VITE_API_URL`| API base URL (defaults to `/api` via the Vite proxy in dev)       |

## Admin panel

The site is editable at runtime from a password-protected admin panel at
`http://localhost:5173/#/admin` (hash route — no rebuild needed after saving content).

The admin panel is grouped into:

- **Overview**: Dashboard with real database/CMS counts, resume status, last content
  update, recent activity, recent messages, quick actions and a live-site shortcut.
- **Portfolio content**: Home/Hero, About, Technical Skills, Experience, Projects,
  Education, Certificates, Contact Information, Development Approach, Engineering Focus,
  Learning Journey, Tech Marquee, Navigation and Design System.
- **Management**: Resume, Media Library and Messages.
- **System**: Settings (account, theme and session).

Highlights:

- Premium responsive dark/light theme with a mobile drawer, touch-friendly controls,
  responsive tables/cards/forms and no horizontal scrolling.
- The admin theme is stored in `localStorage` under `vp-admin-theme`; the public site theme
  is unaffected.
- Form validation, loading/success/error notifications, unsaved-change warnings and
  reset-to-default actions.
- Ordered sections are sorted by their `order` field on the public site.
- Project details modals support `problem`, `approach`, `outcome` and screenshot URLs.
- The Messages inbox supports search, read/unread filtering, read-state toggling and delete.

Saving structured content writes to the existing `Content` collection. The public site
fetches `GET /api/content` at runtime and falls back to `frontend/src/data` if the API is
unreachable. There is no second CMS.

## Storage model

- **Structured content** lives in the existing MongoDB `Content` collection, one document
  per section. New sections (`experience`, `education`, `certificates`) are seeded from the
  real profile data.
- **Uploaded binary files** live in MongoDB GridFS bucket `portfolio_assets`. PDF and media
  bytes are stored in GridFS chunks, not inside `Content` documents.
- **Stable public URLs** use `/api/assets/k/:key`. Replacing a file with the same key
  deletes old versions, so links keep working. The resume key is `resume`.
- **Inline images** chosen in section editors are still compressed in the browser and saved
  with their section content in MongoDB.
- **Static fallback files** in `frontend/public` are deployment assets. They are useful as
  defaults, but they cannot be changed at runtime on Vercel.

### Resume management

Admin → **Resume** supports PDF-only upload, replace, preview, download and delete with
confirmation. Uploads use authenticated `multipart/form-data` with real XHR progress, which
works with the Android file picker and mobile browsers.

Validation includes extension, MIME type, `%PDF-` signature and a 10 MB size limit. The
upload endpoint is JWT-protected and rate-limited to 60 requests/hour per client. After a
successful upload, `profile.resume` and `profile.resumeMeta` are updated in the same CMS
document, so the public resume button updates immediately without a rebuild.

On Vercel, set `MONGO_URI` to a hosted MongoDB/Atlas database with enough storage for
GridFS. A local `localhost` database or server-local disk will not persist uploads from a
deployed serverless function.

### Media library

Admin → **Media Library** lists uploaded GridFS assets and supports image upload, keyed
replacement, copyable stable URLs, filtering by category and delete with confirmation.
Accepted image types are PNG, JPG, WebP, GIF and SVG (10 MB maximum). Two optional keys can
be supplied for a stable URL: `key` on upload, or the `:key` path on replace.

## CMS API endpoints

| Method | Endpoint                    | Auth | Description                                            |
| ------ | --------------------------- | ---- | ------------------------------------------------------ |
| GET    | `/api/health`               | None | API health check                                       |
| GET    | `/api/content`              | None | All content sections for the public site               |
| GET    | `/api/content/:section`     | JWT  | One section (seed data if none saved)                  |
| PUT    | `/api/content/:section`     | JWT  | Save/replace a section                                 |
| DELETE | `/api/content/:section`     | JWT  | Reset a section to default content                     |
| POST   | `/api/admin/login`          | None | Login, returns JWT                                     |
| PUT    | `/api/admin/password`       | JWT  | Change the admin password                              |
| GET    | `/api/admin/overview`       | JWT  | Dashboard counts, activity, messages and resume status |
| GET    | `/api/admin/assets`         | JWT  | List GridFS assets (`?kind=image` filter optional)     |
| POST   | `/api/admin/assets`         | JWT  | Upload image; multipart field `file`, optional body `kind`/`key` |
| PUT    | `/api/admin/assets/key/:key`| JWT  | Replace a file while keeping its stable URL            |
| DELETE | `/api/admin/assets/key/:key`| JWT  | Delete a file by key                                   |
| GET    | `/api/admin/resume`         | JWT  | Current resume metadata and URLs                       |
| POST   | `/api/admin/resume`         | JWT  | Upload/replace the resume PDF (multipart field `file`) |
| DELETE | `/api/admin/resume`         | JWT  | Delete the resume and clear its CMS metadata           |
| GET    | `/api/assets/k/:key`        | None | Stream an asset by stable key (`?download=1` to force download) |
| GET    | `/api/assets/:id`           | None | Stream an asset by GridFS ObjectId                     |
| POST   | `/api/contact`              | None | Public contact form (rate-limited)                     |
| GET    | `/api/contact`              | JWT  | List contact messages (newest first)                   |
| PATCH  | `/api/contact/:id/read`     | JWT  | Toggle a message's read state                          |
| DELETE | `/api/contact/:id`          | JWT  | Delete a contact message                               |

## Editing content

- Runtime content → Admin panel (`#/admin`) for all editable sections, media, messages and
  resume.
- Initial/static fallback data → `frontend/src/data` and `frontend/src/config.js`.
- Default CMS seed values → `backend/config/defaultContent.js`.
- Resume fallback → place a PDF in `frontend/public/` and set `profile.resume` in the CMS or
  config. Runtime uploads go to GridFS instead.
- Icons are resolved in code (`frontend/src/content/iconMap.js`) and are not editable.

## Notes

- Only real information is shown: VijayCart (live + GitHub) and the Weather App (GitHub).
  No fake projects, URLs or percentages.
- Dashboard statistics come from MongoDB/ CMS records only — they are not hardcoded.
- The admin UI was checked at 320, 360, 375, 390, 412 and 430 px, plus 1366, 1440 and
  1920 px, for horizontal overflow, drawer behavior and theme switching.
- Nothing is pushed to GitHub — Git/GitHub and deployment are managed manually.
