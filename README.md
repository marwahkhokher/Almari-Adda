# Almari Adda

**Your personal virtual closet, styled by AI.**

Almari Adda is a full-stack virtual wardrobe application that lets users digitize their clothing, receive AI-generated outfit recommendations, chat with an occasion-based AI stylist, and visualize outfits on themselves or a model before wearing them — all through a self-built, self-hosted ML pipeline.

Built as a NETSOL Technologies internship project by a 5-person team.

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [ML Pipeline](#ml-pipeline)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Team](#team)

---

## Overview

Almari Adda solves a simple problem: most people forget what's in their own closet. The app turns a photo of any clothing item into a structured, searchable wardrobe entry — automatically detecting its category, color, season, and formality — then uses that structured data to power outfit generation, styling chat, and AI try-on visualization.

The entire pipeline runs on free-tier infrastructure with one exception: a dedicated GPU deployment on Modal for the try-on visualization model, since that workload was too heavy for shared/free inference endpoints to run reliably.

---

## Core Features

### 1. Automated Wardrobe Cataloging
Upload a photo of any clothing item. The backend automatically:
- Segments the garment from its background (removes background noise)
- Classifies the garment type using zero-shot classification (no manual category selection needed)
- Detects dominant color
- Infers the most appropriate season(s)
- Assigns a formality tier (casual / semi-formal / formal)

Users can review and correct any auto-filled field before saving.

### 2. Build Your Own Outfit
Users specify preferences — color, season, formality — and the engine generates the best-matching outfit from their actual closet. Matching combines:
- **Rule-based filtering** on formality, season, and color compatibility
- **Embedding-based similarity matching** to rank outfit combinations by overall coherence, not just exact filter matches

If no outfit perfectly satisfies every preference, the closest match is returned along with a message explaining what didn't fully align — rather than failing silently or returning nothing.

### 3. AI Stylist Chatbot
An occasion-based conversational assistant ("What should I wear to a wedding?") that uses embedding similarity to surface relevant items from the user's own wardrobe and suggest outfit combinations suited to the occasion described.

### 4. AI Try-On Visualization
Users can see selected outfits rendered on:
- A default stock model (male or female), or
- Their own uploaded photo

Visualization runs through a self-hosted CatVTON (Category-Agnostic Virtual Try-ON) diffusion pipeline, deployed on dedicated GPU infrastructure for reliability. Supports both single-piece items (dresses, eastern wear) and full top+bottom outfit compositing.

---

## Tech Stack

**Frontend**
- React (Vite)
- Tailwind CSS
- Framer Motion (animation)
- React Router
- Supabase JS client (auth)

**Backend**
- Python / FastAPI
- Supabase (PostgreSQL + object storage)
- Async request handling throughout (including async GPU inference calls)

**Machine Learning**
- **Segmentation:** U2-Net (via ONNX Runtime)
- **Classification:** CLIP (zero-shot image classification)
- **Outfit Matching & Chatbot:** Embedding-based similarity search
- **Virtual Try-On:** CatVTON (diffusion-based garment try-on model)

**Infrastructure**
- **Modal** — serverless GPU compute (A10G) for the try-on visualization pipeline, deployed via `modal deploy`
- **Supabase** — managed Postgres database, object storage for images, and authentication
- **Git / GitHub** — version control across a 5-person team

---

## System Architecture

```
┌─────────────┐      ┌──────────────┐      ┌────────────────────┐
│   Frontend   │─────▶│   FastAPI    │─────▶│      Supabase       │
│ React + Vite │◀─────│   Backend    │◀─────│ (Postgres + Storage) │
└─────────────┘      └──────┬───────┘      └────────────────────┘
                             │
                             │ async .remote.aio()
                             ▼
                    ┌─────────────────┐
                    │  Modal (A10G)    │
                    │  CatVTON model   │
                    │  run_full_outfit │
                    │  run_dress_tryon │
                    └─────────────────┘
```

**Request flow for an upload:**
1. User uploads a photo via the frontend
2. FastAPI backend runs it through the ML pipeline (segmentation → classification → color/season/formality tagging)
3. Processed image is stored in Supabase Storage; structured metadata is written to Postgres
4. Frontend receives the auto-filled item details for user review before final save

**Request flow for visualization:**
1. User selects one or more wardrobe items (and optionally uploads their own photo)
2. Backend downloads the relevant item images from storage
3. Backend makes an async remote call to the appropriate Modal-hosted function (`run_dress_tryon` for single-piece items, `run_full_outfit` for top+bottom combinations)
4. Modal runs the CatVTON model on a dedicated A10G GPU and returns the rendered result
5. Result image is uploaded to storage and its public URL returned to the frontend

---

## ML Pipeline

| Stage | Model / Method | Purpose |
|---|---|---|
| Segmentation | U2-Net (ONNX) | Remove background, isolate garment |
| Classification | CLIP (zero-shot) | Determine garment category/subcategory without a fixed label set |
| Color Detection | Custom color-extraction logic | Identify dominant garment color |
| Season Detection | Rule-based inference | Map garment type/attributes to appropriate season(s) |
| Formality Tagging | Rule-based lookup + keyword matching | Assign casual / semi-formal / formal tier |
| Outfit Matching | Embedding similarity + rule-based filters | Score and rank outfit combinations against user preferences |
| Chatbot Retrieval | Embedding similarity search | Surface relevant wardrobe items for occasion-based queries |
| Virtual Try-On | CatVTON (diffusion model) | Render selected garments onto a person image |

---

## API Reference

All endpoints are served from the FastAPI backend.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload` | Segment, classify, and tag an uploaded clothing item; stores to catalogue |
| `GET` | `/catalogue` | List all items in the user's wardrobe |
| `GET` | `/item-metadata` | Fetch color/season/formality metadata for items |
| `POST` | `/outfit-suggest` | Rule-based outfit suggestion |
| `POST` | `/build-outfit` | Preference-filtered outfit generation (color/season/formality) with embedding-based ranking |
| `POST` | `/visualize` | AI try-on visualization (single item or full outfit) via Modal |
| `POST` | `/chatbot/*` | Occasion-based AI stylist chat |
| `DELETE` | `/items/{id}` | Remove an item from the wardrobe |

---

## Database Schema

**`items`**
Core catalogue table — one row per wardrobe item (category, subcategory, image URL, owner, timestamps).

**`item_metadata`**
Extended attributes per item — color, season(s), formality tier — populated automatically at upload time.

Both tables live in Supabase Postgres; images are stored in Supabase Storage buckets with public URLs referenced from the database rows.

---

## Project Structure

```
Almari-Adda/
├── backend/
│   └── app/
│       ├── main.py                 # FastAPI app, route definitions
│       ├── ml/
│       │   ├── visualization/      # CatVTON Modal deployment, try-on assets
│       │   ├── segmentation/       # U2-Net pipeline
│       │   └── classification/     # CLIP zero-shot classification
│       ├── chatbot/                 # Occasion-based chatbot logic
│       ├── outfit_matching.py       # Rule-based + embedding outfit matching
│       ├── formality_utils.py       # Formality tier lookup
│       └── color_utils.py           # Color detection logic
├── frontend/
│   └── src/
│       ├── pages/                   # Screen-level components
│       │   ├── DashboardScreen.jsx
│       │   ├── UploadScreen.jsx
│       │   ├── ClosetScreen.jsx
│       │   ├── VisualizeScreen.jsx
│       │   ├── BuildOutfitScreen.jsx
│       │   └── ChatbotScreen.jsx
│       ├── lib/                     # API client, Supabase client, config
│       └── contexts/                # AuthContext
├── docs/                            # PRD, wireframes, ideation materials
└── README.md
```

---

## Setup & Installation

### Prerequisites
- Node.js and npm
- Python 3.11+
- A Supabase project (Postgres + Storage + Auth enabled)
- A Modal account (for GPU-hosted visualization)

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

# Deploy the Modal visualization app (one-time / on model changes)
modal deploy app/ml/visualization/modal_catvton.py

uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Backend `.env`:
```
SUPABASE_URL=
SUPABASE_KEY=
MODAL_TOKEN_ID=
MODAL_TOKEN_SECRET=
```

Frontend `.env`:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=
```

---

## Deployment

- **Backend:** FastAPI app (deployment target per team setup)
- **ML Visualization:** Deployed independently on Modal as app `almari-adda-catvton`, exposing `run_full_outfit` and `run_dress_tryon` as remote GPU functions, called asynchronously from the backend via `modal.Function.from_name(...).remote.aio(...)`
- **Database & Storage:** Supabase (managed)
- **Frontend:** Vite build, deployable to any static hosting provider

---

## Team

Built by a 5-person team as part of a NETSOL Technologies internship deliverable, including project ideation (Miro/FigJam), a PRD, a JIRA board, wireframes, and this working deployed application — completed within a one-week build constraint using entirely free-tier tooling (with dedicated GPU compute as the sole paid exception).

---

*"Har almari mein kuch kahaniyan hoti hain."*
