# Almari-Adda — Frontend

React (Vite + Tailwind) frontend for the Almari-Adda virtual closet.

## Features

| Screen | What it does | Backend endpoint |
|---|---|---|
| **Closet** | Grid of catalogued items, category filters, transparent-cutout tiles | `GET /catalogue` |
| **Add Item** | Camera capture + file/drag-drop upload, live tagging result with confidence | `POST /upload` |
| **Outfits** | Rule-matched outfit combinations (color / formality / completeness) | `POST /outfit-suggest` |
| **Visualize** | Layer item cutouts onto a mannequin silhouette (rendered client-side) | — (frontend only) |
| **Stylist** | Occasion-based chatbot ("outfit for a wedding") with suggestions | `POST /chatbot/message`, `POST /chatbot/reset` |

The Visualize renderer is pure frontend — it composites the background-removed
PNGs from the catalogue, so it needs no extra backend.

## Setup

```bash
npm install
cp .env.example .env        # then edit VITE_API_BASE_URL
npm run dev                 # http://localhost:5173
```

### Environment

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the FastAPI backend. Local: `http://localhost:8000`. Production: your Railway URL. |

Vite only exposes vars prefixed with `VITE_`. No secrets live in the frontend —
Supabase access happens server-side in the backend.

## Build & Deploy (Vercel)

```bash
npm run build     # outputs to dist/
npm run preview   # preview the production build locally
```

Deploy on Vercel with:
- **Root directory:** `frontend`
- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Env var:** `VITE_API_BASE_URL` = deployed backend URL

## Notes on integration

- The **chatbot** (`/chatbot/*`) and richer **visualization** endpoints live on
  their owners' branches and aren't merged to `main` yet. The UI calls the
  documented contracts and degrades gracefully (a friendly message) when an
  endpoint isn't reachable, so the app never hard-crashes on a missing service.
- CORS is already open (`allow_origins=["*"]`) on the backend for this sprint.
