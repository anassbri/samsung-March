# 🎯 Essential Web Features Needed Before Mobile Development

**Goal:** Identify the minimum web features required so you can start building the mobile app for Promoters and SFOS.

**Critical Path:** Mobile app needs working APIs and web app needs monitoring/validation tools for SFOS.

---

## 🔴 **PHASE 1: AUTHENTICATION SYSTEM (MUST HAVE - WEEK 1-2)**

### **Why Critical:**
- Mobile app **CANNOT** work without authentication
- All API calls need JWT tokens
- SFOS/Supervisors need to log into web app
-

### **Backend Tasks:**
1. ✅ Add JWT dependencies to `pom.xml`
   ```xml
   <dependency>
       <groupId>io.jsonwebtoken</groupId>
       <artifactId>jjwt-api</artifactId>
       <version>0.12.3</version>
   </dependency>
   ```

2. ✅ Create `AuthController.java`
   - `POST /api/auth/login` - Email + password → JWT token
   - `POST /api/auth/refresh` - Refresh token endpoint
   - `GET /api/auth/me` - Get current user info

3. ✅ Create `JwtService.java`
   - Token generation
   - Token validation
   - Extract user from token

4. ✅ Configure Spring Security
   - JWT filter/interceptor
   - Protect all `/api/**` except `/api/auth/login`
   - Role-based access control

### **Frontend Tasks:**
1. ✅ Create `LoginPage.jsx`
   - Email/password form
   - Call `/api/auth/login`
   - Store JWT in localStorage
   - Redirect to dashboard

2. ✅ Add token management
   - Axios interceptor to inject token in headers
   - Auto-refresh token logic
   - Logout functionality

3. ✅ Protect routes
   - PrivateRoute component
   - Redirect to login if not authenticated

**Deliverable:** SFOS/Supervisors can log into web app, mobile app can authenticate

---

## 🟡 **PHASE 2: ENHANCED VISIT SYSTEM (MUST HAVE - WEEK 3-4)**

### **Why Critical:**
- Mobile app needs to create visits with GPS, photos, sellout, interactions
- Web app needs to display and validate these visits

### **Backend Tasks:**

#### **2.1 Enhance Visit Entity**
```java
// Add to Visit.java
@Column(name = "check_in_latitude")
private Double checkInLatitude;

@Column(name = "check_in_longitude")
private Double checkInLongitude;

@Column(name = "check_in_timestamp")
private LocalDateTime checkInTimestamp;
```

#### **2.2 Create Photo Entity**
```java
@Entity
@Table(name = "photos")
public class Photo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String filePath; // or URL if using cloud storage
    
    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;
    
    @Column(name = "ai_shelf_share")
    private Double aiShelfShare; // From Google Vision API
    
    @Column(name = "ai_analysis_json")
    private String aiAnalysisJson; // Full AI response
    
    @Enumerated(EnumType.STRING)
    @Column(name = "validation_status")
    private PhotoValidationStatus validationStatus; // PENDING, APPROVED, REJECTED
    
    @ManyToOne
    @JoinColumn(name = "visit_id", nullable = false)
    private Visit visit;
    
    @ManyToOne
    @JoinColumn(name = "uploaded_by_id", nullable = false)
    private User uploadedBy;
}
```

#### **2.3 Create Sellout Entity (Product-Level)**
```java
@Entity
@Table(name = "sellouts")
public class Sellout {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "visit_id", nullable = false)
    private Visit visit;
    
    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(name = "sales_amount")
    private Double salesAmount;
    
    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;
}
```

#### **2.4 Create Interaction Entity (Product-Level)**
```java
@Entity
@Table(name = "interactions")
public class Interaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "visit_id", nullable = false)
    private Visit visit;
    
    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @Column(nullable = false)
    private Integer count; // Number of interactions
    
    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;
}
```

#### **2.5 Build Enhanced Visit APIs**
```java
// VisitController.java additions:

// Mobile: Create visit with GPS check-in
@PostMapping("/checkin")
public ResponseEntity<VisitDTO> checkIn(
    @RequestBody CheckInDTO dto, // storeId, latitude, longitude
    @AuthenticationPrincipal User user
) {
    // Validate geofencing (within store radius)
    // Create visit with GPS coordinates
}

// Mobile: Upload photo for visit
@PostMapping("/{visitId}/photos")
public ResponseEntity<PhotoDTO> uploadPhoto(
    @PathVariable Long visitId,
    @RequestParam("file") MultipartFile file,
    @AuthenticationPrincipal User user
) {
    // Save file, call Google Vision API, store metadata
}

// Mobile: Add sellout per product
@PostMapping("/{visitId}/sellout")
public ResponseEntity<SelloutDTO> addSellout(
    @PathVariable Long visitId,
    @RequestBody SelloutCreateDTO dto, // productId, quantity, amount
    @AuthenticationPrincipal User user
) {
    // Create sellout record
}

// Mobile: Record interaction per product
@PostMapping("/{visitId}/interactions")
public ResponseEntity<InteractionDTO> recordInteraction(
    @PathVariable Long visitId,
    @RequestBody InteractionCreateDTO dto, // productId, count
    @AuthenticationPrincipal User user
) {
    // Create/update interaction record
}

// Mobile: Complete visit
@PutMapping("/{visitId}/complete")
public ResponseEntity<VisitDTO> completeVisit(
    @PathVariable Long visitId,
    @RequestBody VisitCompleteDTO dto // comment, final data
) {
    // Mark visit as COMPLETED
}
```

### **Frontend Tasks (Web App for SFOS):**

#### **2.6 Enhanced Validation Page**
Update `ValidationPage.jsx` to show:
- ✅ Real photos (not placeholders)
- ✅ GPS check-in location on map
- ✅ Product-level sellout data
- ✅ Product-level interaction counts
- ✅ Photo validation (approve/reject individual photos)
- ✅ Filter by promoter, store, date
- ✅ Search functionality

#### **2.7 SFOS Monitoring Dashboard**
Create new page `SFOSDashboard.jsx`:
- ✅ List of assigned promoters
- ✅ Real-time visit status (who's where)
- ✅ Pending validations count
- ✅ Today's visits summary
- ✅ Quick actions (validate, message)

**Deliverable:** Mobile can create complete visits, web can validate them

---

## 🟡 **PHASE 3: PHOTO UPLOAD & STORAGE (MUST HAVE - WEEK 5-6)**

### **Why Critical:**
- Mobile app needs to upload photos
- Web app needs to display and validate photos

### **Backend Tasks:**

#### **3.1 File Storage Service**
```java
@Service
public class FileStorageService {
    // Option 1: Local storage
    private final Path fileStorageLocation;
    
    // Option 2: Cloud storage (AWS S3, Google Cloud Storage)
    // Use Spring Cloud AWS or Google Cloud Storage library
    
    public String storeFile(MultipartFile file, Long visitId) {
        // Save file, return path/URL
    }
}
```

#### **3.2 Google Cloud Vision API Integration**
```java
@Service
public class VisionAIService {
    public VisionAnalysisResult analyzeShelfShare(String imagePath) {
        // Call Google Cloud Vision API
        // Calculate shelf share percentage
        // Detect products
        // Return analysis results
    }
}
```

#### **3.3 Photo Upload Endpoint**
```java
@PostMapping("/{visitId}/photos")
public ResponseEntity<PhotoDTO> uploadPhoto(
    @PathVariable Long visitId,
    @RequestParam("file") MultipartFile file,
    @AuthenticationPrincipal User user
) {
    // 1. Validate file (size, type)
    // 2. Store file
    // 3. Call Vision AI service
    // 4. Save photo entity with AI results
    // 5. Return photo DTO
}
```

### **Frontend Tasks:**

#### **3.4 Photo Display in Validation Page**
- ✅ Display actual uploaded photos
- ✅ Show AI analysis results (shelf share %)
- ✅ Photo gallery view
- ✅ Zoom functionality
- ✅ Photo validation buttons (per photo)

**Deliverable:** Mobile can upload photos, web can view and validate them

---

## 🟢 **PHASE 4: GPS & GEOFENCING (SHOULD HAVE - WEEK 7-8)**

### **Why Important:**
- Mobile needs GPS check-in validation
- Web needs to see promoter locations

### **Backend Tasks:**

#### **4.1 Google Maps API Service**
```java
@Service
public class GeofencingService {
    public boolean isWithinStoreRadius(
        Double userLat, Double userLng,
        Long storeId, Double radiusMeters
    ) {
        // Calculate distance using Google Maps API
        // Return true if within radius
    }
}
```

#### **4.2 Enhanced Check-In Endpoint**
```java
@PostMapping("/checkin")
public ResponseEntity<CheckInResponseDTO> checkIn(
    @RequestBody CheckInDTO dto,
    @AuthenticationPrincipal User user
) {
    // 1. Validate geofencing
    // 2. If valid, create visit with GPS
    // 3. If invalid, return error with distance
}
```

### **Frontend Tasks:**

#### **4.3 Real-time GPS Tracking (Optional for Web)**
- ✅ Map view showing promoter locations
- ✅ Heatmap of visits
- ✅ Store boundaries visualization

**Deliverable:** Mobile can validate GPS check-in, web can monitor locations

---

## 📋 **MINIMUM VIABLE WEB FEATURES CHECKLIST**

Before starting mobile development, ensure:

### **✅ Authentication (Week 1-2)**
- [ ] JWT login endpoint working
- [ ] Web login page functional
- [ ] Token management in frontend
- [ ] Protected routes working
- [ ] Test: SFOS can log in via web

### **✅ Enhanced Visit APIs (Week 3-4)**
- [ ] Visit entity has GPS fields
- [ ] Photo entity created
- [ ] Sellout entity created (product-level)
- [ ] Interaction entity created (product-level)
- [ ] Check-in endpoint with GPS
- [ ] Photo upload endpoint
- [ ] Sellout entry endpoint
- [ ] Interaction recording endpoint
- [ ] Test: Can create visit via Postman/API client

### **✅ Photo Management (Week 5-6)**
- [ ] File storage working
- [ ] Photo upload endpoint functional
- [ ] Google Vision API integrated (or mocked)
- [ ] Photo display in validation page
- [ ] Photo validation workflow
- [ ] Test: Upload photo, see it in web validation page

### **✅ Web Validation Interface (Week 3-4)**
- [ ] Enhanced validation page shows:
  - [ ] Real photos
  - [ ] GPS location
  - [ ] Product-level sellout
  - [ ] Product-level interactions
- [ ] SFOS can approve/reject visits
- [ ] Filter and search functionality
- [ ] Test: SFOS can validate a complete visit

### **✅ Monitoring Dashboard (Week 3-4)**
- [ ] SFOS dashboard shows:
  - [ ] Assigned promoters
  - [ ] Visit status
  - [ ] Pending validations
- [ ] Test: SFOS can monitor team activity

---

## 🎯 **RECOMMENDED DEVELOPMENT ORDER**

### **Week 1-2: Authentication**
1. Backend: JWT implementation
2. Frontend: Login page
3. **Test:** Login works end-to-end

### **Week 3-4: Enhanced Visit System**
1. Backend: Entities (Photo, Sellout, Interaction)
2. Backend: Enhanced Visit APIs
3. Frontend: Enhanced validation page
4. **Test:** Can create visit with all data via API

### **Week 5-6: Photo Upload**
1. Backend: File storage
2. Backend: Vision AI integration (or mock)
3. Frontend: Photo display in validation
4. **Test:** Upload photo, see in web

### **Week 7-8: GPS & Geofencing**
1. Backend: Google Maps API integration
2. Backend: Geofencing validation
3. **Test:** GPS check-in validation works

---

## 🚀 **READY FOR MOBILE WHEN:**

✅ **All APIs are working and tested:**
- Authentication API
- Visit check-in API
- Photo upload API
- Sellout entry API
- Interaction recording API
- Visit completion API

✅ **Web app allows SFOS to:**
- Log in
- View visits from promoters
- See photos, GPS, sellout, interactions
- Validate/reject visits
- Monitor team activity

✅ **Database schema is complete:**
- All entities created
- Relationships defined
- Migrations ready

---

## 📝 **NEXT STEPS AFTER WEB IS READY**

Once the above is complete, you can start mobile development:

1. **Android Project Setup**
   - Create Kotlin project
   - Add dependencies (Retrofit, Room, etc.)
   - Set up architecture (MVVM)

2. **Mobile Authentication**
   - Login screen
   - JWT token storage
   - API client with token injection

3. **Core Mobile Features**
   - GPS check-in
   - Photo capture & upload
   - Sellout entry
   - Interaction counter
   - Visit checklist

4. **Offline Mode**
   - Room database
   - Sync queue
   - Conflict resolution

---

## ⚠️ **IMPORTANT NOTES**

1. **Don't wait for perfect web UI** - Focus on APIs first, then enhance web UI
2. **Mock external services** - You can mock Google Vision API initially, integrate later
3. **Test APIs thoroughly** - Use Postman/Insomnia to test all endpoints before mobile
4. **Document APIs** - Create API documentation (Swagger/OpenAPI) for mobile team

---

**Estimated Timeline:** 6-8 weeks to have web ready for mobile development

**Critical Path:** Authentication → Enhanced Visits → Photo Upload → GPS

Once these are done, mobile development can proceed in parallel with web enhancements.
