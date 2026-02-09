## 🧾 Web Tasks Backlog – Samsung Merchandising

This file lists concrete tasks broken down into small steps so you can implement them **one by one**.

Focus is on **Supervisor web app** (only role on web) and on preparing APIs for **SFOS/Promoters mobile app**.

---

## 1. Authentication & Security (Phase 1)

- [ ] **Backend – JWT setup**
  - [ ] Add JWT dependencies in `pom.xml`.
  - [ ] Create `JwtService` for token generation/validation.
  - [ ] Create `AuthController` with:
    - [ ] `POST /api/auth/login` (email + password → JWT).
    - [ ] `POST /api/auth/refresh` (optional).
  - [ ] Configure Spring Security:
    - [ ] Add JWT filter.
    - [ ] Protect `/api/**` except `/api/auth/**`.
    - [ ] Restrict web access to **SUPERVISOR** role only.

- [ ] **Frontend – Login & protection**
  - [ ] Create `LoginPage` component.
  - [ ] Call `/api/auth/login` and store token (localStorage/sessionStorage).
  - [ ] Add Axios interceptor to send token in headers.
  - [ ] Implement protected routes (redirect to `/login` if not authenticated).
  - [ ] Add logout button (clear token, redirect to login).

---

## 2. Stores Management Module (Phase 2)

Goal: manage ~500 stores from web (Supervisor), with CRUD + CSV import. These stores will be used by mobile for visits and assignments.

### 2.1 Backend – Store APIs

- [ ] **Extend `Store` entity if needed**
  - [ ] Confirm fields: `name`, `type (OR/IR)`, `city`, `latitude`, `longitude`, `address`.

- [ ] **Create/extend controller `StoreController`**
  - [ ] `GET /api/stores` – list all stores.
  - [ ] `GET /api/stores/{id}` – get one store.
  - [ ] `POST /api/stores` – create store.
  - [ ] `PUT /api/stores/{id}` – update store.
  - [ ] `DELETE /api/stores/{id}` – delete store (with safety checks: no hard foreign-key break).
  - [ ] `POST /api/stores/bulk` – bulk create/update from CSV using `saveAll()`.

- [ ] **Validation & constraints**
  - [ ] Validate GPS coordinates format.
  - [ ] Enforce allowed values for `type` (`OR`, `IR`).

### 2.2 Frontend – `Stores` page

- [ ] **Create `Stores.jsx` route and menu item**
  - [ ] Add route in `App.jsx`.
  - [ ] Add navigation item in `Layout.jsx`.

- [ ] **DataGrid listing**
  - [ ] Use MUI DataGrid to show:
    - [ ] Name
    - [ ] Type (OR/IR)
    - [ ] City
    - [ ] Latitude / Longitude
    - [ ] Address
  - [ ] Add pagination and sorting.
  - [ ] Add filters (by city, type).

- [ ] **CRUD operations**
  - [ ] “Add Store” button → MUI Dialog form.
  - [ ] “Edit” action per row → pre-filled Dialog.
  - [ ] “Delete” action per row → confirm dialog.
  - [ ] After create/update/delete, refresh DataGrid from API.

- [ ] **CSV Import**
  - [ ] Add “Import Stores (CSV)” button.
  - [ ] Use papaparse to read file on client.
  - [ ] Map columns: `name,type,city,latitude,longitude,address`.
  - [ ] Show preview and basic validation (required fields, lat/lng numeric).
  - [ ] Send valid rows to `POST /api/stores/bulk`.
  - [ ] Show success/error feedback (Snackbar/Alert).

---

## 3. Assignments / Daily Tasks Module (Phase 3)

Goal: Supervisors plan **which Promoter/SFOS goes to which Store on which day**. Mobile app will read these assignments as daily tasks.

### 3.1 Backend – `Assignment` model & APIs

- [ ] **Create `Assignment` entity**
  - [ ] Fields:
    - [ ] `id`
    - [ ] `date` (LocalDate)
    - [ ] `status` (PLANNED / DONE / CANCELLED)
    - [ ] `notes` (optional)
    - [ ] `user` (ManyToOne → `User`) – only SFOS or PROMOTER.
    - [ ] `store` (ManyToOne → `Store`).

- [ ] **Repository & service**
  - [ ] `AssignmentRepository` with search methods:
    - [ ] Find by date.
    - [ ] Find by user and date range.
    - [ ] Find by store and date range.
  - [ ] `AssignmentService`:
    - [ ] Create single assignment (validate user role and store existence).
    - [ ] Update / delete assignment.
    - [ ] Bulk create from CSV.

- [ ] **Controller `AssignmentController`**
  - [ ] `GET /api/assignments` with filters:
    - [ ] `date`
    - [ ] `userId`
    - [ ] `storeId`
    - [ ] pagination.
  - [ ] `POST /api/assignments` – create one assignment.
  - [ ] `PUT /api/assignments/{id}` – update.
  - [ ] `DELETE /api/assignments/{id}` – delete.
  - [ ] `POST /api/assignments/bulk` – CSV import.
  - [ ] `GET /api/assignments/my` – for mobile:
    - [ ] Return assignments for current authenticated SFOS/Promoter (today or date range).

### 3.2 Frontend – `Affectations` page

- [ ] **Create `Affectations.jsx` route**
  - [ ] Add navigation link (e.g. “Affectations / Daily Tasks”) in `Layout.jsx`.
  - [ ] Add route in `App.jsx`.

- [ ] **Filters & layout**
  - [ ] Date picker (default = today).
  - [ ] Role filter (SFOS / PROMOTER).
  - [ ] User filter (autocomplete).
  - [ ] Store filter (autocomplete).

- [ ] **DataGrid listing assignments**
  - [ ] Columns: Date, User, Role, Store, City, Status, Notes, Actions.
  - [ ] Server-side fetching with the filters.

- [ ] **CRUD**
  - [ ] “Add Assignment” button → Dialog:
    - [ ] Date.
    - [ ] User (from API filtered by role).
    - [ ] Store (from stores API).
    - [ ] Notes.
  - [ ] Edit action per row.
  - [ ] Delete action with confirmation.

- [ ] **CSV Import for assignments**
  - [ ] Button “Import Assignments (CSV)”.
  - [ ] Papaparse mapping:
    - [ ] `date`, `userEmail` (or `userId`), `storeName` (or `storeId`), `status`, `notes`.
  - [ ] Local validation (date format, user/store found).
  - [ ] Send valid rows to `POST /api/assignments/bulk`.
  - [ ] Show per-row error feedback if backend rejects some rows.

---

## 4. Supervisor Monitoring & Validation Enhancements (Phase 4)

Goal: make the web truly the **data collector and overview** of everything coming from mobile.

- [ ] **Validation page improvements**
  - [ ] Replace placeholder photo with real `Photo` from backend.
  - [ ] Show:
    - [ ] Linked Assignment (if any).
    - [ ] Store and city.
    - [ ] Promoter/SFOS name.
    - [ ] Shelf share (manual + AI when available).
    - [ ] Sellout summary (when model ready).
    - [ ] Interaction count.
  - [ ] Keep Approve / Reject actions.

- [ ] **Dashboard cards**
  - [ ] Add KPIs per day/week:
    - [ ] Planned vs completed assignments.
    - [ ] Number of visits validated.
    - [ ] Top stores by sellout (later).

---

## 5. Mobile-Readiness APIs (Phase 5 – can be parallel)

These tasks ensure the mobile app (SFOS/Promoters) can use the data planned on the web.

- [ ] `GET /api/assignments/my?date=` – daily tasks for logged-in SFOS/Promoter.
- [ ] `GET /api/stores` – used to show store details inside mobile app.
- [ ] Make sure all of these endpoints are covered by Swagger/OpenAPI for mobile integration.

---

Use this backlog as your **single source of truth**.  
Pick tasks from top to bottom and check them off as you implement each one.

