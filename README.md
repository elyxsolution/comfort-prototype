# Comfort Builders & Developers: website prototype

React + Three.js front end, Node.js (Express) back end. Built as a concept for the client, using their current site for **information only** (facts, project list, contact details). No design, code or imagery was taken from it.

## Run it

```bash
npm run install:all      # installs root, client and server
npm run dev              # API on :4000, site on http://localhost:5173
```

Production:

```bash
npm run build            # builds client/dist
npm start                # Express serves the API and the built site on :4000
```

Optional environment (copy `server/.env.example` to `server/.env`):

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (default 4000) |
| `CORS_ORIGINS` | Allowed origins for dev (default `http://localhost:5173`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `MAIL_TO` | Email alerts for enquiries and CVs |
| `ADMIN_TOKEN` | Enables `GET /api/admin/enquiries` and `/api/admin/careers` (Bearer token) |

## What is where

```
shared/projects.json      single source for company facts and all 11 projects (client + server read it)
client/src/three/         Tower.jsx (procedural tower, crane, landscape), TowerStage.jsx (sky, sun, bloom, camera rig), CityMap.jsx
client/src/pages/         Home, Projects, ProjectDetail, About, Gallery, Career, Contact, NotFound
client/src/components/    Ui, Chrome (nav, footer), Enquiry (dialog + form), PageHero, Glyph, Archive
client/src/lib/           data (catalogue hook), api, motion (GSAP + ScrollTrigger hooks)
server/src/               Express app, routes (projects, enquiries, careers, admin), store, mailer
client/public/img/        archival pictures and one clip (credits are on the pages and in the footer)
```

## The look

Off-white ground, black and deep-blue components, Instrument Serif headlines over Plus Jakarta Sans. Buttons, rows and project panels follow the Avenlo reference: flat rectangles held by corner brackets that fill on hover, numbered service rows that sweep blue with a picture sliding in, and full-screen project panels whose picture draws closer on hover. The home page has no fixed frame: the building stands in the centre, starts as nothing, and is constructed floor by floor as you scroll, with the words around it, ending lit at night.

## The idea

The tower the firm builds stays fixed on one half of the screen and **reacts to the story**: it is raised floor by floor while you read how a home is built (a blue line fills beside the steps), moves from golden hour to a lit dusk, and switches project (Heights, Vimalaprabha) as you reach each one. Inner pages open on the same tower from a different angle and hour (Careers shows it half built, with the crane up).

The 3D is physically based: reflective curtain-wall glass that mirrors the real sky and sun (image-based lighting rendered from the sky shader), stone slabs and pilasters, brass fin screens, glass balcony rails, a rooftop pool and pergola, landscaped grounds, a pond and a hazy city behind, with soft shadows, ambient occlusion, bloom and anti-aliasing.

The live feature is the home-finder: pick bedrooms and part of the city, and it filters the real project list.

## API

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/health` | liveness |
| GET | `/api/projects?status=&zone=&bhk=` | catalogue, filterable |
| GET | `/api/projects/:slug` | one project |
| POST | `/api/enquiries` | JSON: name, phone, email?, project?, bhk?, message?. Validated with zod, honeypot field `website`, rate limited |
| POST | `/api/careers` | multipart: name, phone, email, `cv` (PDF/DOC/DOCX, max 5 MB) |
| GET | `/api/admin/enquiries`, `/api/admin/careers` | needs `ADMIN_TOKEN` |

Submissions are appended to `server/data/*.ndjson` (CVs to `server/uploads/`, never served statically). Swap `server/src/store.js` for a database when going live.

## Before launch: content the client must confirm

- **RERA number** `PRM/KA/RERA/1251/310/PR/180313/001730` is copied from the old site and not tied to a project there.
- **"From ₹65 lakhs"** is the old site's headline; confirm it is current. Old offers and possession dates were left out because they had expired.
- **Claims** (60% open space, OC/CC, RERA compliance, SBI / HDFC / Axis / LICHFL approvals) are the old site's claims, stated for the firm in general; confirm per project.
- The old site's stats (5 years, 8 projects, 312 customers) contradict "since 1990" and its three testimonials are template text, so none are used.
- **"Commercial Complex, Malleswaram"** appears on the old site as both upcoming and completed. Both are kept; confirm.
- Map pins use neighbourhood-level coordinates, not site coordinates.
- The 3D tower is an illustrative model, not an architect's render. Project photographs, floor plans, amenities and specifications are not on the old site, so the pages say "ask for details" and the Gallery has a labelled slot.
- Sample copy was written from the old site's About and Career pages. Read it through once.

## Pictures and licences

All credited on the page and in the footer. Wikimedia Commons: Bangalore 1900 (John Bartholomew, public domain), Plan of the Fort and Petta 1791 (Colin Mackenzie, public domain), Commercial Street 1900 (CH Doveton, CC BY-SA 3.0), Lalbagh Glass House (Subhashish Panigrahi, CC BY-SA 3.0), Vidhana Soudha (DeepanjanGhosh, CC BY-SA 4.0), Hebbal view video (Yourusernamewillbepublic2, CC0). They show Bengaluru, never the client's own buildings. Replace with project photography when available.

## Put it live (Render, free)

This is one Node service: Express serves the API and the built React site together, so you deploy **one thing** from **this folder** (`comfort-builders`, the folder that holds `client/`, `server/`, `shared/`, `package.json` and `render.yaml`).

1. Push this folder to a new GitHub repository (see the commands below).
2. On https://render.com choose **New > Blueprint**, pick the repository. Render reads `render.yaml` and builds it (`npm run install:all && npm run build`, then `npm start`). Wait for the first deploy; you get a `https://comfort-builders.onrender.com` style address.
3. Add the enquiry emails so nothing is lost (Render's free disk is wiped on every redeploy): in the service's Environment tab set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` and `MAIL_TO` (see `server/.env.example`). Optionally set `ADMIN_TOKEN` to read enquiries at `/api/admin/enquiries`.
4. For a real domain: Settings > Custom Domains, then add the DNS record Render shows.

```bash
cd comfort-builders
git init
git add .
git commit -m "Comfort Builders website"
git branch -M main
git remote add origin https://github.com/<your-account>/<repo-name>.git
git push -u origin main
```

The free plan sleeps after about 15 minutes idle (the first visit then takes ~30 s). The paid plan keeps it awake and lets you attach a disk (set `DATA_DIR` to its mount path).

## Brand, logo and photographs

- **Logo**: traced from the client's own artwork into vector shapes (`client/src/lib/logoShapes.json`: 27 gold rays and the teal lettering). `components/Logo3D.jsx` extrudes them in Three.js: click it to watch the circle of rays complete, turn once and return. Reduced-motion users get the still logo.
- **Fonts**: Marcellus (headings) and Source Sans 3 (text), the closest open fonts to the logo's lettering. If the client has the exact logo typeface licensed, swap `--font-display` / `--font-text` in `styles.css`.
- **Photographs**: the client's images are in `client/public/img/photos` and assigned to projects in `client/src/lib/media.js`. The assignment is a placeholder; confirm which photo belongs to which project and change the file names there.

## Put it live on Vercel (alternative to Render)

Vercel cannot store files, so there the forms use the serverless functions in `api/` and email every enquiry and CV to you. `vercel.json` already sets the build.

1. Import the GitHub repository. Leave **Root Directory** as `./` and set **Application Preset** to **Other** (do not use the "Services" preset or import `client` and `server` separately).
2. Before deploying, open **Environment Variables** and add: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_TO` and optionally `MAIL_FROM`. For Gmail: host `smtp.gmail.com`, port `465`, your address as user, and a Google **App Password** (not your normal password).
3. Deploy. Without those variables the site works but the forms answer "Online enquiries are not switched on yet".

Differences from the Express server: no rate limiting and no admin listing, and CVs are capped at 4 MB.
