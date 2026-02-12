## 🚀 Samsung Merchandising – Consolidated Next Steps (Backend, Web, Mobile)

**Date:** February 2026  
**Scope:** Spring Boot backend, React web (Supervisor), React Native mobile (Promoter & SFOS)

---

## 1. 🔴 Critical Operational Steps (Do These First)

1. **Start and Stabilize the Backend**
   - Ensure PostgreSQL is running and reachable at `jdbc:postgresql://localhost:5432/samsung_merch_db`.
   - From project root: `./mvnw spring-boot:run` (or `mvn spring-boot:run` on Windows).
   - Verify: `http://localhost:8080/api/health` (add a simple health endpoint if needed) and test `POST /api/auth/login`.

2. **Fix Mobile API Connectivity**
   - Decide how mobile will reach the backend:
     - **Option A – LAN IP:** `http://192.168.x.x:8080/api` (recommended for local dev).
     - **Option B – ngrok:** `https://<your-subdomain>.ngrok-free.dev/api`.
   - Update `samsung-merch-mobile/src/api/client.ts`:
     - Replace the current hardcoded ngrok URL with:
       - a single `BASE_URL` constant read from an env-like config (e.g. `app.json` extra or `.env` via `expo-constants`), or
       - temporarily, your LAN IP while developing.

3. **End-to-End Smoke Test (Happy Path)**
   - Web (Supervisor):
     - Login as SUPERVISOR.
     - Create/update **stores**, **users**, and **assignments** for a promoter.
   - Mobile (Promoter):
     - Login.
     - Check **Today Assignments**.
     - Open **Assignment Detail**, start a **Visit**, fill form, capture photo, submit.
   - Web:
     - Go to **Validation** page and **VALIDATE** or **REJECT** the visit.
   - Verify:
     - Visit shows correct shelfShare, comments, photo URL, interactions, and sellout totals in DB.

---

## 2. 🔒 Backend – Security & API Hardening

### 2.1 Tighten Endpoint Security (JWT + Roles)

- **Goal:** Stop using `permitAll()` on all APIs and enforce proper RBAC.
- **Changes in `SecurityConfig`:**
  - Keep `permitAll()` only for:
    - `/api/auth/**`
    - `/api/dashboard/**` (optional – can be protected later)
    - static content `/uploads/**`
  - Apply role-based rules, for example:
    - `SUPERVISOR`:
      - `/api/users/**`
      - `/api/products/**`
      - `/api/stores/**`
      - `/api/assignments/**`
      - `/api/visits/**` (validation, reporting)
    - `PROMOTER` and `SFOS` (mobile):
      - `/api/assignments/my`
      - `/api/assignments/team`
      - `/api/visits/submit`, `/api/visits`
      - `/api/visits/user/{userId}`
      - `/api/photos/upload`
      - `/api/visits/{visitId}/interactions/**`
      - `/api/visits/{visitId}/sellout/**`

### 2.2 Implement `/api/auth/me` and Token Refresh

- **`GET /api/auth/me`:**
  - Read `Authorization: Bearer <token>`.
  - Use `JwtService.parseToken(...)` to extract email and role.
  - Load `User` from `UserRepository` and return a DTO with: `id, fullName, email, role`.
- **`POST /api/auth/refresh`:**
  - Accept current token, verify it, issue a new token with a fresh expiration.
  - Use same payload structure as login (`AuthResponse`).

### 2.3 API & Data Quality Improvements

- Add validation annotations to DTOs (`@NotNull`, `@Size`, etc.) and enforce them with `@Valid`.
- Standardize error responses (structured JSON with `code`, `message`, `details`).
- Add DB indexes on:
  - `visits.user_id`, `visits.store_id`, `visits.visit_date`, `visits.status`.
  - `assignments.user_id`, `assignments.store_id`, `assignments.date`, `assignments.status`.
- Configure static resource serving for `uploads/photos/**` so web and mobile can load images directly.

---

## 3. 🖥️ Web Frontend – Supervisor App Roadmap

### 3.1 Dashboard – Real Data, Not Placeholder

- Replace hardcoded `salesData` in `Dashboard.jsx` with API-driven data:
  - Backend endpoints (to add if missing):
    - `GET /api/visits/stats?from=&to=` – aggregate visits, shelfShare, sales over a date range.
    - `GET /api/sellout/stats?from=&to=&groupBy=day|product|store`.
  - Frontend:
    - Use React Query to fetch stats.
    - Feed Recharts with real weekly/daily sellout or visit totals.

### 3.2 Visit Detail & Validation UX

- **Goal:** Let Supervisor see full visit details before validating.
- In `ValidationPage.jsx`:
  - Add a **“View details”** button / card click → open modal or side drawer.
  - Show:
    - Store, promoter, visit date/time.
    - Shelf share, salesAmount, interactionCount.
    - Linked **interactions** and **sellout items** (via `/api/visits/{id}` or dedicated endpoints).
    - Visit photo (from `visit.photoUrl`).
    - Geofencing info if available (distance to store, outside/inside radius).

### 3.3 Sellout & Interaction Analytics

- New pages or dashboard sections:
  - **Sellout Analytics:**
    - By product (top SKUs by volume/amount).
    - By store/city.
    - Over time (daily/weekly trends).
  - **Interaction Analytics:**
    - Total interactions by product, store, time-of-day.
    - Gender/color breakdown when data is rich enough.
- Export:
  - Add **CSV/Excel export** buttons for core grids.
  - Later: PDF export for visit reports and team performance.

### 3.4 Map Enhancements

- Use backend coordinates to:
  - Show stores with today’s assignments colored by completion rate.
  - (Future) show last known promoter position from mobile when that API exists.

---

## 4. 📱 Mobile App – Promoter & SFOS Roadmap

### 4.1 Configuration & Environments

- Centralize API base URL configuration:
  - Use `app.json` → `extra.apiBaseUrl` or `.env` + `expo-constants`.
  - `client.ts` should read from config, not from a hardcoded string.
- Define 3 profiles:
  - **dev:** local LAN IP.
  - **staging:** stable ngrok or test server.
  - **prod:** real backend URL.

### 4.2 Promoter Experience

- **Today / Assignment Flow:**
  - Keep as is (already strong) and refine:
    - Show a small geofence indicator (inside/outside) directly on cards if location is available.
    - Allow quick “Start visit” from Today list (shortcut into `VisitFormScreen`).
- **Assignment Detail / Tasks:**
  - Optional improvement: allow changing individual task statuses (with a dedicated endpoint if needed).
  - In future: allow partial sync of tasks mid-visit (for long visits).
- **Visit Form:**
  - Fine-tune validations:
    - Shelf share must be numeric and within 0–100.
    - Sellout amounts must be non-negative.
  - Improve error messages for:
    - Geofencing rejection from backend.
    - Photo upload failures (suggest retry or offline queue).

### 4.3 SFOS Experience

- **Home Dashboard:**
  - Already shows daily KPIs; add:
    - Filter by city/region (optional).
    - Quick link to “stores with no visit today”.
- **Team Screen:**
  - Add navigation from promoter card to:
    - That promoter’s visit history (using existing visits API).
    - Store coverage list for that promoter.
- **Store Coverage & Store Map:**
  - Ensure map pins reflect:
    - Assignment counts.
    - Completion colors (e.g. green = all done, orange = in progress, red = none started).

### 4.4 Offline & Sync

- Current `syncQueue` and `syncManager` are solid. Next steps:
  - Add a small **sync history screen** (for debugging / support):
    - Show last sync time, last errors, and pending item count.
  - Add user-facing indicators:
    - On Visit History and Today Assignments, show badges like “Not yet synced”.

### 4.5 UX & Quality

- **Biometrics:**
  - Use `expo-local-authentication` to add optional FaceID / fingerprint unlock after first login.
- **Branding:**
  - Replace Expo default icon and splash screen with Samsung-branded assets.
- **Performance:**
  - Tune `FlatList` on heavy screens:
    - `windowSize`, `maxToRenderPerBatch`, `removeClippedSubviews`.
- **Monitoring:**
  - Integrate Sentry or similar for runtime error and crash reporting.

---

## 5. 📈 Cross-Cutting Enhancements & Milestones

### 5.1 Short-Term Milestones (Next 2–3 Weeks)

1. **Backend & Security**
   - Backend running reliably in dev.
   - JWT-secured endpoints with proper roles.
   - `/api/auth/me` and `/api/auth/refresh` implemented.
2. **Web**
   - Dashboard uses real data for at least one chart.
   - Visit Validation page with proper detail view.
3. **Mobile**
   - API base URL configurable by environment.
   - End-to-end flow stable with backend on LAN or stable tunnel.

### 5.2 Medium-Term Milestones (1–2 Months)

1. **Analytics**
   - Sellout and interaction analytics available on web.
   - Basic export to CSV/Excel.
2. **Mobile Enhancements**
   - Biometric login.
   - Better offline visibility and small sync status screen.
3. **Supervisor Tools**
   - Visit PDF/exportable reports for audits.

### 5.3 Long-Term (2–4 Months)

1. **AI Photo Analysis**
   - Google Cloud Vision integrated for shelf share and product detection.
   - Photo validation workflow (SFOS approval in web).
2. **Real-Time Features**
   - WebSocket/SSE for:
     - Live visit submissions.
     - Optional live GPS tracking.
3. **Multilingual Support**
   - FR/AR i18n for both web and mobile.

---

## 6. ✅ Quick Checklist

- **Backend**
  - [ ] Backend starts reliably and is reachable from mobile.
  - [ ] SecurityConfig locked down with roles.
  - [ ] `/api/auth/me` and (optionally) `/api/auth/refresh` implemented.
  - [ ] Static photo files served correctly.
- **Web**
  - [ ] Dashboard charts using real API data.
  - [ ] Visit detail UI available from Validation page.
  - [ ] Basic analytics for sellout and interactions.
- **Mobile**
  - [ ] API base URL configurable per environment.
  - [ ] Full visit flow tested (online & offline).
  - [ ] Sync queue visible and reliable.
  - [ ] Branding, UX, and biometric login in place.

This file is your **single source of truth** for the next steps across backend, web, and mobile. You can evolve it as you complete items and adjust priorities.

