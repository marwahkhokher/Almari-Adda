# Product Requirement Document — Almari Adda

**Version:** 1.0 (Week 1 MVP)
**Status:** In development

---

## 1. Problem Statement

People often struggle with what to wear — combining existing wardrobe pieces into outfits is time-consuming, and finding an appropriate outfit for a specific occasion (e.g. a wedding) is even harder without external input. Almari Adda digitizes a user's wardrobe into a searchable closet and uses AI to suggest outfit combinations, including for specific occasions, removing the daily friction of "what do I wear."

## 2. Target Users

Primarily individuals who want quick outfit ideas from clothes they already own, without needing to buy anything new or manually plan outfits in advance. Useful both for everyday dressing decisions and for occasion-specific needs (weddings, formal events, etc.).

## 3. Goals (MVP — Week 1 Scope)

1. Let a user photograph a clothing item and have it automatically catalogued (background removed, tagged by category and subcategory).
2. Automatically suggest outfit combinations from catalogued items using rule-based logic (color, formality, category completeness).
3. Let a user describe an occasion in natural language (e.g. "I need an outfit for a wedding") and receive a chatbot-suggested outfit combo.
4. Visually preview a suggested outfit on a mannequin/silhouette.
5. Ship as a deployed, working web application.

## 4. Out of Scope (Cut for Week 1, Noted as Future Work)

These were considered during ideation but deliberately deprioritized to protect the one-week timeline:
- Photorealistic virtual try-on (diffusion-based, e.g. IDM-VTON/OOTDiffusion) — GPU-heavy and slow; flat mannequin overlay used instead for MVP
- Embedding-based "smart" outfit matching (similarity search) — rule-based matching used instead for MVP
- Fine-tuned clothing classifier — CLIP zero-shot classification used instead, sufficient accuracy without training overhead
- Multi-user authentication — single demo user assumed for MVP
- Native mobile app — MVP ships as a mobile-responsive web app; native (React Native) conversion is a planned future step, not required for MVP since the backend/API layer is already decoupled and reusable

## 5. Core Features

### 5.1 Clothing Upload & Cataloguing
User photographs a clothing item. The system:
- Segments the item from its background (U²-Net deep learning model)
- Classifies it into a category (top / bottom / dress / eastern wear) and subcategory (e.g. t-shirt, jeans, kurta, shalwar kameez) using CLIP zero-shot classification
- Saves the processed image and tags to the user's digital closet

### 5.2 Outfit Suggestions (Rule-Based)
Given the catalogued items, the system suggests valid outfit combinations by applying rules: category completeness (a full outfit needs a top + bottom, or one dress/eastern-wear piece), color-wheel compatibility, and formality-level matching.

### 5.3 Occasion-Based Chatbot
A conversational interface where a user describes an occasion (e.g. "wedding," "casual outing") in natural language. The chatbot (LangGraph agent + LLM) interprets the request, filters the user's catalogue accordingly, and returns a suggested outfit with reasoning.

### 5.4 Outfit Visualization
A suggested outfit combination is rendered visually on a mannequin/silhouette template, overlaying the segmented item images into their appropriate body regions (top, bottom, full-body), giving the user a quick visual preview of the combination.

## 6. User Flow

Upload photo → Item automatically tagged → Item added to digital closet → User requests outfit suggestion (either via rule-based suggestion or by describing an occasion to the chatbot) → Suggested outfit is displayed → User views the outfit rendered on the mannequin.

## 7. Technical Architecture

| Layer | Technology |
|---|---|
| Frontend | React, deployed on Vercel |
| Backend API | FastAPI, deployed on Railway |
| Image Segmentation | U²-Net (via ONNX Runtime) |
| Image Classification | CLIP (open_clip, zero-shot) |
| Database | Supabase (Postgres) |
| Image Storage | Supabase Storage |
| Outfit Matching | Rule-based logic (Python) |
| Chatbot | LangGraph + Groq/Gemini free-tier LLM |
| Visualization | Python (Pillow/OpenCV) or HTML Canvas, mannequin overlay compositing |
| Version Control / CI | GitHub, GitHub Actions |

All services used are free-tier, in line with the project's zero-budget constraint.

## 8. Team & Ownership

| Role | Responsibility |
|---|---|
| ML + Backend | Segmentation/classification pipeline, FastAPI backend, database/storage integration, deployment |
| Outfit Matching | Rule-based outfit combination logic |
| Visualization | Mannequin overlay rendering |
| Frontend | React application UI, connecting all backend features into one working app |
| Chatbot | Occasion-based conversational agent |

## 9. Success Criteria (Week 1 Demo)

- A user can photograph a real clothing item and see it correctly tagged and added to their closet
- The app can suggest at least one valid outfit combination from catalogued items
- The chatbot can take an occasion description and return a relevant suggested outfit
- A suggested outfit can be viewed as a visual composite on a mannequin
- The full flow is accessible through a single deployed web application

## 10. Known Limitations (Week 1 MVP)

- Segmentation quality depends on background/lighting; best results on plain, well-lit backgrounds
- Outfit matching is rule-based, not learned — combinations reflect coded heuristics, not personalized style learning
- Visualization is a flat overlay composite, not a realistic try-on render
- No user authentication; single shared closet for demo purposes
