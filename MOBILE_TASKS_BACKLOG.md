## 📱 Mobile Tasks Backlog – React Native App (Promoters & SFOS)

**Goal:** Build a robust React Native mobile app for **Promoters** and **SFOS**, fully integrated with the existing Spring Boot backend and Supervisor web app (data collector & overview).

---

## 1. Foundation & Project Setup

- **1.1 Project Bootstrapping**
  - [ ] Choose baseline: **Expo + React Native + TypeScript**
  - [ ] Initialize project (`expo init` with TypeScript template)
  - [ ] Configure app name, icons, splash screen (Samsung branding) 
  - [ ] Set up environment handling (API base URL, env files for dev/prod)

- **1.2 Core Dependencies**
  - [ ] Install **React Navigation** (stack + tabs)
  - [ ] Install **React Query** (TanStack) for networking
  - [ ] Install **Axios** and configure base client for `/api`
  - [ ] Install **Secure Storage** (`expo-secure-store` or equivalent) for JWT
  - [ ] Install **Location** module (`expo-location` or equivalent) for GPS
  - [ ] Install basic UI library (e.g., React Native Paper or NativeBase) or custom design system

- **1.3 Project Structure**
  - [ ] Define folder layout:
    - `src/api` – axios wrappers
    - `src/hooks` – React Query hooks
    - `src/context` – auth + app contexts
    - `src/screens` – feature screens
    - `src/components` – reusable UI
    - `src/navigation` – navigators
    - `src/types` – DTOs & types aligned with backend

---

## 2. Authentication & Role-Based Navigation

- **2.1 Auth API Integration**
  - [ ] Create `login` API calling `POST /api/auth/login`
  - [ ] Map backend response (`token`, `userId`, `fullName`, `email`, `role`)
  - [ ] Store JWT in secure storage; keep user profile in context
  - [ ] Configure Axios interceptor to attach `Authorization: Bearer <token>` to all requests

- **2.2 Auth Context & Hooks**
  - [ ] Create `AuthContext` with:
    - `user`, `token`, `login`, `logout`, `loading` state
  - [ ] Implement `useAuth()` hook for easy access
  - [ ] Restore session from secure storage on app start

- **2.3 Navigation & Role Handling**
  - [ ] Configure **Auth stack**: `Login`, `ForgotPassword` (optional)
  - [ ] Configure **App stack**:
    - [ ] Promoter tabs: `Home`, `Tasks`, `History`, `Profile`
    - [ ] SFOS tabs: `Home`, `Team`, `Stores`, `Tasks`, `Profile`
  - [ ] Route user after login based on `role`:
    - `PROMOTER` → PromoterTabNavigator
    - `SFOS` → SFOSTabNavigator
  - [ ] Implement guard that redirects unauthenticated users to `Login`

---

## 3. Assignments (Daily Tasks) – Core Mobile Workflow

### 3.1 API Integration for Assignments

- [ ] Create API wrappers:
  - [ ] `GET /api/assignments/my?date=` – current user daily tasks
  - [ ] (Optional later) `GET /api/assignments/my?from=&to=` – weekly view
- [ ] Create React Query hooks:
  - [ ] `useMyAssignments(date)` – list of assignments for the logged-in user
  - [ ] (Optional) `useAssignment(id)` – fetch a single assignment

### 3.2 “Today” Screen (Promoters & SFOS)

- [ ] UI: list of today’s assignments:
  - [ ] Card per assignment:
    - Store name + city
    - Date / time
    - Status chip (PLANNED / IN_PROGRESS / DONE)
    - Progress: `completedTasks / totalTasks`
  - [ ] Filter by status (All, Planned, In Progress, Done)
  - [ ] Pull-to-refresh integrated with React Query
- [ ] Interaction:
  - [ ] Tap card → navigate to **Assignment Detail** screen

### 3.3 Assignment Detail & Checklist (Trello Interior on Mobile)

- [ ] Data:
  - [ ] Display store info (name, address, city, type)
  - [ ] User’s role at store (Promoter/SFOS)
  - [ ] Assignment date + status
  - [ ] Checklist tasks (from `TaskItem` on backend via `/api/assignments/my`)
- [ ] UI:
  - [ ] Task list with:
    - Checkbox → toggle Todo/In Progress/Done (simple mapping, e.g. tap cycles states)
    - Task description
  - [ ] Visual progress bar for tasks
  - [ ] “Start Visit” / “Check-in” button
- [ ] Backend sync (Phase 1 mobile):
  - [ ] For now, **read-only tasks** (no status updates) or:
  - [ ] Design new backend endpoint: `PATCH /api/assignments/{id}/tasks` to update task statuses (planned)

---

## 4. Visit Check-In, GPS & Submission

### 4.1 GPS Permissions & Location

- [ ] Request location permission on first use
- [ ] Implement helper to:
  - [ ] Get current GPS coordinates
  - [ ] Handle permission denied (fallback UI)

### 4.2 Start Visit Flow

- [ ] From Assignment Detail, “Start Visit”:
  - [ ] Capture current location (`checkInLatitude`, `checkInLongitude`)
  - [ ] Prefill store & user
  - [ ] Present **Visit Form** screen:
    - Shelf share (%)
    - Comment / notes
    - (Optionally later) product-level sellout & interactions

- **API Integration**
  - [ ] POST to backend:
    - `POST /api/visits/submit` or `POST /api/visits`
    - Body: `storeId`, `userId`, `assignmentId`, `shelfShare`, `comment`, `checkInLatitude`, `checkInLongitude`
  - [ ] On success:
    - [ ] Update local assignment status (e.g. to DONE)
    - [ ] Navigate back to Assignment Detail / Today screen

### 4.3 Future Geofencing (Prep Only)

- [ ] On client side, compute distance to store once backend provides store radius
- [ ] Show warning if outside target radius (no blocking yet – server will validate in later phase)

---

## 5. History & Reporting (Mobile)

- **5.1 Visit History for User**
  - [ ] API hook:
    - `GET /api/visits/user/{userId}` (simple history list)
  - [ ] Screen:
    - List of past visits with:
      - Store, city
      - Date/time
      - Status (COMPLETED/VALIDATED/REJECTED)
    - Basic filters: date range, status

- **5.2 Visit Detail**
  - [ ] Show:
    - Visit KPIs (shelfShare, salesAmount when available, interactionCount)
    - Linked assignment (if any)
    - Task checklist summary (x/y tasks done)
    - Validation state from Supervisor (VALIDATED/REJECTED)

---

## 6. SFOS-Specific Features

- **6.1 Team Overview**
  - [ ] API hooks (read-only):
    - `GET /api/users?role=PROMOTER&sfosId=` (if supported later) or `/api/users` + filter client-side by `manager`
    - (Optional) `GET /api/users/stats` for counts by role
  - [ ] Screen:
    - List of promoters under this SFOS with:
      - Name, region
      - Today assignments count
      - Quick indicator of completion (e.g., tasks done / planned)

- **6.2 Store Coverage View**
  - [ ] API (later): e.g. `GET /api/assignments?date=&region=` or reuse `/api/assignments/my` for SFOS with team filter
  - [ ] Screen:
    - Map or list of stores with assigned promoters (today)
    - Filter by city/date

---

## 7. Photos & Shelf Share (Future Integration)

> Backend photo & AI stack will come later; here we prepare the client side.

- **7.1 Photo Capture**
  - [ ] Use camera API (Expo Camera)
  - [ ] Attach photos to a visit or assignment
  - [ ] Local preview & compression before upload

- **7.2 Upload Flow (when backend ready)**
  - [ ] API: `POST /api/photos/upload` (multipart)
  - [ ] Metadata: `visitId`, `storeId`, `userId`, timestamp, GPS
  - [ ] Sync failures → queued for retry

---

## 8. Sellout & Interaction Entry (Advanced)

- **8.1 Product-level Sellout**
  - [ ] When backend adds Sellout entity & APIs:
    - `POST /api/visits/{visitId}/sellout`
    - `GET /api/sellout/stats`
  - [ ] Screen:
    - Inside Visit form:
      - Product selector (SKU search)
      - Quantity + amount fields per product
    - Simple table/list by product

- **8.2 Interaction Tracking**
  - [ ] When backend adds Interaction APIs:
    - `POST /api/visits/{visitId}/interactions`
  - [ ] UI:
    - Visit detail: button to “+1 interaction”
    - Counter showing total interactions for the visit

---

## 9. Offline Mode & Sync

- **9.1 Local Data Caching**
  - [ ] Cache assignments & visits in local storage (e.g., AsyncStorage)
  - [ ] Ensure app can display last known data when offline

- **9.2 Outbox / Sync Queue**
  - [ ] Implement offline queue for:
    - Pending visits
    - Pending task status updates
    - Pending photo uploads
  - [ ] Background sync when connection is available
  - [ ] UI indicator for “Not yet synced” items

- **9.3 Conflict Handling (Later)**
  - [ ] Define strategy if same visit edited both offline & online
  - [ ] Basic approach: last-write-wins + log conflicts

---

## 10. UX, Theming & Polish

- **10.1 Theming**
  - [ ] Define global theme using **Samsung blue `#034EA2`** and neutrals
  - [ ] Consistent button styles, chips, cards mirroring web app feel

- **10.2 UX Details**
  - [ ] Haptic feedback on critical actions (check-in, submit visit)
  - [ ] Loading & error states for all API calls (React Query)
  - [ ] Empty states (no tasks, no history, offline)
  - [ ] Optimistic updates where safe (e.g., marking tasks as done)

- **10.3 Performance**
  - [ ] Avoid over-fetching (React Query cache & pagination)
  - [ ] Use FlatList/SectionList for all lists
  - [ ] Image optimization for photos

---

## 11. QA, Monitoring & Release

- **11.1 Testing**
  - [ ] Manual test matrix: Promoter vs SFOS scenarios
  - [ ] Basic unit tests for critical hooks & utils
  - [ ] Smoke tests on low-end Android devices

- **11.2 Error Monitoring**
  - [ ] Integrate crash/error reporting (e.g., Sentry)

- **11.3 Release Pipeline**
  - [ ] Configure build profiles (dev, staging, prod)
  - [ ] Set up Play Store deployment (internal testing track)
  - [ ] Document release checklist (versioning, changelog, smoke tests)

---

## 12. Prioritized Mobile MVP Scope

**MVP 1 (Go / No-Go for field tests):**
- [ ] Authentication + role-based navigation (Promoter/SFOS)
- [ ] Today’s Assignments list (`/api/assignments/my`)
- [ ] Assignment Detail with **read-only** checklist + progress
- [ ] Visit Check-in with GPS + simple visit submission (`/api/visits/submit` or `/api/visits`)
- [ ] Visit History (per user)

**MVP 2 (Pilot Ready):**
- [ ] Editable task checklist (update TaskItem status)
- [ ] Basic SFOS views: team list + store coverage list
- [ ] Stable offline caching for assignments & visits

**MVP 3 (Full Production):**
- [ ] Photos capture & upload
- [ ] Product-level sellout entry
- [ ] Offline sync queue & conflict resolution
- [ ] Polished UX, performance and monitoring

