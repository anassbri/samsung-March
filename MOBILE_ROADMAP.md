## 📱 Samsung Merchandising – Mobile Roadmap (React Native)

**Scope:** Full mobile app for **Promoters** and **SFOS**, integrated with the existing Spring Boot backend and Supervisor web app.  
**Platforms:** Android (primary), built with **Expo + React Native + TypeScript**.

This roadmap is split into **phases**. Each phase has:
- **Goal** – what is achieved by the end of the phase.
- **Backend prerequisites** – what the API must provide.
- **Tasks** – concrete implementation items.
- **Deliverables / Validation** – how you confirm the phase is complete.

You can mark each phase as ✅ when done.

---

## Phase 0 – Foundation & Project Setup

**Goal:** Mobile project is created, structured, branded, and ready to consume the API.

### Backend Prerequisites
- None (can use mock endpoints or the existing `/api/health` / simple endpoints).

### Tasks
- **0.1 Project Bootstrapping**
  - Initialize Expo project with TypeScript template.
  - Configure app name, bundle ID, app icon, and splash screen (Samsung branding).
  - Set up environment configuration (dev, staging, prod API base URLs).

- **0.2 Core Dependencies**
  - Install and configure:
    - React Navigation (stack + tabs).
    - React Query (TanStack) for data fetching and caching.
    - Axios and a shared API client pointing to `/api`.
    - Secure storage (`expo-secure-store` or equivalent) for JWT.
    - Location module (`expo-location`) for GPS.
    - UI library (React Native Paper / NativeBase) or base design system components.

- **0.3 Project Structure**
  - Define and create folders:
    - `src/api` – Axios instances and API wrappers.
    - `src/hooks` – React Query hooks and custom hooks.
    - `src/context` – Auth and global app contexts.
    - `src/screens` – Screen components for features.
    - `src/components` – Shared UI components.
    - `src/navigation` – Navigators and route configuration.
    - `src/types` – Shared types/interfaces aligned with backend DTOs.

### Deliverables / Validation
- App builds and runs on Android (emulator/physical device).
- Basic screen renders and can call a test API (e.g., a simple GET) successfully.
- Folder structure and core libraries are in place and committed.

---

## Phase 1 – Authentication & Role-Based Shell

**Goal:** Users can log in with backend JWT auth, and see different navigation for **Promoter** vs **SFOS**.

### Backend Prerequisites
- `/api/auth/login` endpoint:
  - Accepts credentials (email/username + password).
  - Returns `{ token, userId, fullName, email, role }` or equivalent payload.
- Spring Security with JWT is correctly configured (already planned/implemented).

### Tasks
- **1.1 API & Types**
  - Define auth response type (`token`, `userId`, `fullName`, `email`, `role`).
  - Create `login` function in `src/api/auth.ts` calling `POST /api/auth/login`.

- **1.2 Auth Context & Storage**
  - Implement `AuthContext` with:
    - `user` (id, name, email, role).
    - `token`.
    - `login(credentials)`, `logout()`.
    - `loading` state during startup (session restore).
  - Store token and user info in secure storage.
  - On app startup, restore session from storage and update context.

- **1.3 Axios & Interceptors**
  - Configure global Axios instance:
    - `baseURL` from env.
    - Request interceptor to attach `Authorization: Bearer <token>` when available.
    - Response interceptor to handle 401/403 (e.g., auto-logout for now).

- **1.4 Navigation Setup**
  - Create:
    - `AuthStack` – `Login` (and `ForgotPassword` later).
    - `PromoterTabs` – e.g. `Home`, `Today`, `History`, `Profile`.
    - `SFOSTabs` – e.g. `Home`, `Team`, `Stores`, `Profile`.
  - In root navigator:
    - If not authenticated → show `AuthStack`.
    - If authenticated and `role === 'PROMOTER'` → show `PromoterTabs`.
    - If authenticated and `role === 'SFOS'` → show `SFOSTabs`.

- **1.5 Optional Security Enhancements**
  - Add biometric authentication (via OS) to unlock an existing session.
  - Handle token expiry more gracefully when refresh tokens are implemented on backend.

### Deliverables / Validation
- User can:
  - Open app, see login screen.
  - Log in using real backend credentials.
  - Be routed to correct role-based tab navigator.
  - Close and re-open the app and still be logged in (session restored).
- Incorrect credentials show a clear error message.

---

## Phase 2 – Today’s Assignments (Read-Only Checklist)

**Goal:** Promoters and SFOS see their **daily assignments**; can open an assignment and view its checklist (read-only).

### Backend Prerequisites
- Endpoint (or equivalent) for current user assignments:
  - `GET /api/assignments/my?date=YYYY-MM-DD`
  - Optional for later: `GET /api/assignments/my?from=&to=`.
- Response should include:
  - Assignment id, date, status (PLANNED / IN_PROGRESS / DONE).
  - Linked store info (id, name, city, address, GPS).
  - Checklist tasks (e.g. `TaskItem` with description, status).

### Tasks
- **2.1 API & Hooks**
  - Implement `getMyAssignments(date)` API function.
  - Add `useMyAssignments(date)` React Query hook.

- **2.2 Today Screen UI**
  - Create `TodayScreen`:
    - List of assignments for selected date (default: today).
    - Each card shows:
      - Store name + city.
      - Assignment date/time.
      - Status chip (PLANNED / IN_PROGRESS / DONE).
      - Progress bar: `completedTasks / totalTasks`.
    - Filters by status (All, Planned, In Progress, Done).
    - Pull-to-refresh integrated with React Query.

- **2.3 Assignment Detail Screen (Read-Only)**
  - Show:
    - Store details (name, address, city, type).
    - User’s role at this store (Promoter/SFOS).
    - Assignment date + status.
    - Checklist tasks:
      - Description.
      - Current status (visual indicators, no editing yet).
    - Progress bar.
    - **“Start Visit / Check-In”** button (wired in Phase 3).

### Deliverables / Validation
- Logged-in Promoter:
  - Opens **Today** tab and sees their assignments from backend.
  - Opens an assignment; sees detailed info + read-only checklist.
- Data matches backend when checked via web app / API.

---

## Phase 3 – Visit Check-In with GPS & Basic Submission

**Goal:** From an assignment, user starts a visit, captures location and basic KPIs, and submits to backend.

### Backend Prerequisites
- `Visit` entity extended (as per project roadmap) with:
  - `checkInLatitude`, `checkInLongitude`.
  - Optional: `shelfShare`, `comment`, `interactionCount`.
- Endpoint:
  - `POST /api/visits` or `POST /api/visits/submit`
  - Request body includes: `storeId`, `userId`, `assignmentId`, `checkInLatitude`, `checkInLongitude`, `shelfShare`, `comment` (+ optional fields).

### Tasks
- **3.1 GPS Permissions & Helpers**
  - Request location permission on first use.
  - Utility to:
    - Check permission status and handle denied state (show message + link to settings).
    - Fetch current GPS coordinates (latitude, longitude) with error handling.

- **3.2 Start Visit Flow**
  - From Assignment Detail:
    - On “Start Visit” press:
      - Fetch current GPS location.
      - Prefill visit with store, user, assignment, GPS.
      - Navigate to `VisitFormScreen`.

- **3.3 Visit Form**
  - Inputs:
    - Shelf share (%).
    - Comment/notes.
    - Optional simple interaction count or toggle fields.
  - Show captured GPS coordinates (read-only) for transparency.

- **3.4 API Integration**
  - Implement `submitVisit` API calling `POST /api/visits` or `/submit`.
  - On success:
    - Show success confirmation.
    - Update local assignment status (e.g., to DONE).
    - Navigate back to Assignment Detail or Today screen.

### Deliverables / Validation
- Promoter can:
  - Open an assignment, tap “Start Visit”.
  - Grant location permissions and see GPS used.
  - Fill form and submit.
  - See the new visit record appear in backend (via Supervisor web dashboard or API).

---

## Phase 4 – Visit History & Detail (Mobile Reporting Basics)

**Goal:** Users can see their **past visits** and inspect KPIs and validation status.

### Backend Prerequisites
- `GET /api/visits/user/{userId}` endpoint (already exists).
  - Should return: visit id, store info, date/time, status (PLANNED/COMPLETED/VALIDATED/REJECTED), KPIs (`shelfShare`, `salesAmount`, `interactionCount`), and linked assignment id if any.

### Tasks
- **4.1 API & Hook**
  - Implement `getUserVisits(userId, filters)` API.
  - Create `useUserVisits(userId, filters)` React Query hook.

- **4.2 Visit History Screen**
  - List of visits:
    - Store name, city.
    - Date/time.
    - Status chip (COMPLETED/VALIDATED/REJECTED).
  - Filters:
    - Date range.
    - Status.

- **4.3 Visit Detail Screen**
  - Show:
    - Visit KPIs: shelfShare, salesAmount (if available), interactionCount.
    - Linked assignment summary: x/y tasks done (if data available).
    - Validation state from Supervisor (VALIDATED, REJECTED, with reason if provided).

### Deliverables / Validation
- Promoter can:
  - Open **History** tab and see a list of past visits from backend.
  - Tap a visit and see KPIs and validation state.
- Data is consistent with what Supervisor sees in the web application.

---

## Phase 5 – SFOS Features: Team Overview & Store Coverage

**Goal:** SFOS users can monitor their team’s assignments and store coverage for a given day.

### Backend Prerequisites
- Confirm user hierarchy:
  - SFOS has `manager` relationship to Promoters (already in `User` entity).
- Relevant endpoints (or add them):
  - `GET /api/users?role=PROMOTER` (filterable by manager or region).
  - `GET /api/users/stats` for counts by role (optional).
  - Assignments endpoint that can provide data per SFOS/team, e.g.:
    - `GET /api/assignments?date=&sfosId=` or equivalent.

### Tasks
- **5.1 SFOS Team Overview**
  - Create `SFOSTeamScreen`:
    - List promoters under current SFOS:
      - Name, region.
      - Today’s assignments count.
      - Simple progress indicator (e.g., completed vs planned assignments).
  - APIs:
    - Fetch promoters (either dedicated endpoint or filter client-side).
    - Fetch counts/progress for each promoter (assignment stats).

- **5.2 Store Coverage View**
  - Create `StoreCoverageScreen`:
    - List (or later map) of stores with assignments for selected date.
    - Show:
      - Store name, city.
      - Assigned promoter(s).
      - Number of planned vs completed visits/assignments.
    - Filters: date, city, region.

### Deliverables / Validation
- Logging in as SFOS:
  - **Team** tab shows correct list of promoters and basic daily stats.
  - **Stores** (or Coverage) tab shows which stores are planned vs visited for the day.
- Data matches backend and Supervisor dashboard.

---

## Phase 6 – Editable Checklists & Task Sync

**Goal:** Assignments’ **checklists become interactive** on mobile; updates are persisted to backend.

### Backend Prerequisites
- Endpoint to update task items:
  - Example: `PATCH /api/assignments/{assignmentId}/tasks`
  - Accepts list of task items with updated statuses.
- Clear task status model (e.g. TODO / IN_PROGRESS / DONE).

### Tasks
- **6.1 API & Types**
  - Define request/response types for updating tasks.
  - Implement `updateAssignmentTasks(assignmentId, tasks)` API.

- **6.2 Interactive Checklist UI**
  - In Assignment Detail screen:
    - Make each task item tappable.
    - On tap: cycle status (e.g. TODO → IN_PROGRESS → DONE).
    - Use colors/icons to represent states.

- **6.3 Sync & Optimistic Updates**
  - Create React Query mutation for task updates.
  - Implement optimistic UI updates:
    - Update UI immediately on tap.
    - Roll back if API call fails.
  - Handle loading/error states per assignment.

### Deliverables / Validation
- Promoter can:
  - Change task statuses from mobile.
  - See changes reflected in web Supervisor app after refresh.
- Checklist state remains consistent across devices and sessions.

---

## Phase 7 – Photos & Shelf Share Integration

**Goal:** Capture and upload photos linked to visits/assignments with metadata, ready for AI shelf-share analysis.

### Backend Prerequisites
- Photo infrastructure (per project roadmap):
  - `Photo` entity linked to `Visit`, `Store`, `User`.
  - File storage (local or cloud).
  - `POST /api/photos/upload` (multipart/form-data):
    - Accept fields: `visitId`, `storeId`, `userId`, timestamp, GPS, and image file.
- (Later) AI integration via Google Cloud Vision will read stored photos; mobile doesn’t change.

### Tasks
- **7.1 Camera Integration**
  - Add camera permissions and screens using Expo Camera.
  - Provide camera UI:
    - Capture photo.
    - Preview and allow retake.
    - Light compression/resizing before upload.

- **7.2 Photo Attachments to Visits**
  - From Visit form or Visit detail:
    - Button: “Add Photo”.
    - Display list/grid of attached photos.

- **7.3 Upload Flow**
  - Implement `uploadPhoto` API:
    - Multipart upload including metadata.
  - Handle:
    - Progress indicator.
    - Error states and retries.
  - Prepare metadata for AI (correct IDs, GPS, timestamps).

### Deliverables / Validation
- During a visit:
  - User can capture one or more photos.
  - Photos appear attached to that visit on mobile and backend.
- Backend can later send those photos to AI service without changes to mobile.

---

## Phase 8 – Product-Level Sellout & Interaction Tracking

**Goal:** Record detailed sellout and interaction data per visit and per product.

### Backend Prerequisites
- `Sellout` entity & APIs:
  - `POST /api/visits/{visitId}/sellout`
  - `GET /api/sellout/stats` (for analytics).
- `Interaction` entity & APIs:
  - `POST /api/visits/{visitId}/interactions`
  - `GET /api/interactions/stats`.
- Product list (already available through product management).

### Tasks
- **8.1 Product-Level Sellout UI**
  - In Visit form or separate screen:
    - Product selector (search by name/SKU).
    - Inputs per product: quantity, amount.
  - List all sellout lines for that visit with ability to add/remove items.
  - API:
    - `addSelloutItem(visitId, productSellout)` and/or bulk save.

- **8.2 Interaction Tracking UI**
  - In Visit detail:
    - Button “+1 interaction”.
    - Optional per-product interaction when relevant.
  - API:
    - `addInteraction(visitId, payload)` (or batch).

- **8.3 Data Consistency**
  - Integrate sellout and interaction counts into Visit detail KPIs.
  - Ensure no duplicate entries (idempotency rules if needed).

### Deliverables / Validation
- For any visit:
  - Promoter can record sellout by product and interactions.
  - Data shows up in backend stats (`/api/sellout/stats`, `/api/interactions/stats` and dashboards).

---

## Phase 9 – Offline Mode & Sync

**Goal:** App remains usable without network; data is safely queued and synced when online.

### Backend Prerequisites
- None specific, but:
  - APIs should be robust to out-of-order or delayed writes.
  - Server should tolerate duplicate submissions where possible (idempotence where needed).

### Tasks
- **9.1 Local Caching**
  - Cache:
    - Assignments and their tasks.
    - Visits (at least summary data).
  - Use AsyncStorage or a lightweight local DB.
  - On app start:
    - Show last known data immediately.
    - Refresh when network available.

- **9.2 Sync Queue / Outbox**
  - Design structure for queued actions, such as:
    - `CREATE_VISIT`.
    - `UPDATE_TASK_STATUS`.
    - `UPLOAD_PHOTO`.
  - Persist queue locally.
  - Background worker:
    - When network returns, process queued actions with retry logic.
    - Mark items as synced or failed with reason.

- **9.3 Conflict Handling**
  - Define simple first version:
    - Last-write-wins from server.
    - Log conflicts in local log for debugging.
  - UX:
    - Indicator for unsynced items.
    - Basic error messages when something cannot sync.

### Deliverables / Validation
- In airplane mode:
  - User can still see cached assignments and visits.
  - User can queue visit submissions and task updates.
- When network returns:
  - Queued actions are sent to backend.
  - Data on web and other devices becomes consistent.

---

## Phase 10 – GPS, Geofencing & Maps

**Goal:** Improve location reliability with geofencing and optional map-based views.

### Backend Prerequisites
- Store coordinates (already exist).
- Geofencing support (per main roadmap):
  - Google Maps API integration for distance calculations.
  - Validation logic to check if check-in is within allowed radius.
  - Optional endpoints:
    - `POST /api/visits/checkin` (with validation).
    - `GET /api/users/{id}/location` or streaming for real-time tracking.

### Tasks
- **10.1 Client-Side Geofencing UX**
  - On check-in, compute distance to store (using store GPS + current GPS).
  - Show:
    - Distance.
    - Warning if outside allowed radius, while still letting server enforce final rule.

- **10.2 Backend Geofencing Integration**
  - Update check-in to use backend’s validated endpoint (if provided).
  - Display server validation messages (e.g., “Too far from store”).

- **10.3 Map Views (Optional / Later)**
  - For SFOS:
    - Map of stores with assignments and their status.
    - Optionally show promoter locations in near real time if backend supports it.

### Deliverables / Validation
- During visit check-in:
  - User sees distance to store and possible warnings.
  - Backend can reject invalid check-ins, and mobile handles this gracefully.
- Optional: SFOS can visualise coverage on a map.

---

## Phase 11 – UX, Performance, QA, Monitoring & Release

**Goal:** Polish the app, ensure quality and stability, and prepare for production rollout.

### Backend Prerequisites
- Stable APIs for previous phases.
- Logging and monitoring on backend to support production.

### Tasks
- **11.1 UX & Theming**
  - Finalize global theme:
    - Samsung blue `#034EA2` + neutrals.
    - Consistent typography, buttons, chips, cards.
  - Refine UX:
    - Haptic feedback on key actions (check-in, submit visit, complete task).
    - Consistent loading indicators, error messages, and empty states.
    - Clear offline/online indicators.

- **11.2 Performance & Optimization**
  - Avoid over-fetching:
    - React Query cache, proper invalidation, pagination where needed.
  - Ensure all long lists use `FlatList`/`SectionList`.
  - Optimize image handling for photos (size, caching).

- **11.3 QA & Monitoring**
  - Testing:
    - Manual test matrix covering Promoter and SFOS paths.
    - Basic unit tests for core hooks and utilities.
    - Smoke tests on low-end Android devices.
  - Error monitoring:
    - Integrate crash/error reporting (e.g., Sentry).

- **11.4 Release Pipeline**
  - Configure build profiles:
    - Dev, staging, prod.
  - Set up Play Store:
    - Internal testing track.
    - Beta / production rollout strategy.
  - Create release checklist:
    - Versioning.
    - Changelog.
    - Pre-release smoke tests.

### Deliverables / Validation
- Stable app that:
  - Performs well in field conditions (network, battery, device constraints).
  - Has monitoring in place to catch issues.
- App available via Play Store internal track and/or production rollout.

---

## Summary of MVP Milestones

- **MVP 1 – Field Test Ready**
  - Phases: 0, 1, 2, 3, 4.
  - Features: Auth, role-based navigation, today’s assignments (read-only), basic visit check-in with GPS, visit history.

- **MVP 2 – Pilot Ready**
  - Phases: 5, 6 (plus basic offline caching from Phase 9.1).
  - Features: SFOS team & coverage views, editable checklists, early offline support.

- **MVP 3 – Production Ready**
  - Phases: 7, 8, 9, 10, 11.
  - Features: Photos, product-level sellout, interactions, full offline sync, geofencing, polished UX, monitoring, and release pipeline.

