# 🏛️ Solapur Municipal Corporation - Digital Grievance Redressal System
### सोलापूर महानगरपालिका - ई-तक्रार निवारण प्रणाली

A fullstack digital grievance redressal web portal developed for the **Solapur Municipal Corporation (SMC)**. Built with a clean, high-contrast **White and Blue** civic UI/UX design, **Citizen Authorization (Registration & Login)**, **Municipal Officer / Admin Authorization & Role Management**, **Live GPS Geotagging**, real-time 5-stage progress tracking for citizens, and an **Administrative Panel** for municipal officers to manage and resolve all complaints.

---

## 🌟 Key Features

### 👤 Citizen Authorization & Profile Management
- **Citizen Registration & Login**:
  - Citizens register with Full Name, 10-Digit Mobile Number, Email, Default Solapur Ward/Prabhag, and Password.
  - Quick Login via Mobile/Email & Password with persistent token sessions.
  - **Auto-Fill**: Once logged in, citizen details (Name, Mobile, Email, Ward) are automatically pre-populated into the grievance form.
  - **My Complaints View**: Citizens can view all historical complaints they have lodged, complete with status badges and one-click tracking.
  - **Demo Citizen Access**: Includes a one-click button to pre-fill test citizen credentials (`9822012345` / `citizen@123`).

### 🛡️ Single Municipal Administrator Portal
- **Single Admin Authentication**:
  - Centralized municipal administration with a single secure admin login (`admin` / `solapur@123`).
  - Salted SHA-256 cryptographic password hashing.
  - One-click auto-fill demo button for immediate administrative access.
- **Full Grievance Lifecycle & Status Management**:
  - Administrator can update complaint status across 6 official stages:
    - `Submitted` (Fresh registration)
    - `Under Review` (Helpdesk / triage verification)
    - `Assigned` (Designated to zonal field engineer)
    - `In Progress` (Field machinery / squad deployed)
    - `Resolved` (Civic repair successfully completed)
    - `Rejected` (Duplicate or unfeasible)
  - Assign specific field engineers (e.g. Junior Engineer, Sanitation Squad).
  - Add official action remarks detailing steps taken.
- **📸 Work Done Photo Upload (Resolution Proof)**:
  - Admin can **upload work done / completion evidence photos** (e.g. repaired road, cleared waste bin, repaired pipeline) directly in the status modal.
  - Photo is permanently stored and linked with the grievance token.
  - Citizens see the **Work Done Photo** alongside their reported issue photo when tracking complaints online.
- **Audit & Analytics**:
  - Live KPI cards: Total Complaints, Action Pending, Resolved, Urgent/Hazardous.
  - Multi-criteria filtering by Status, Department, Ward, Citizen, or GPS coordinates.
  - One-click **"Export CSV Report"** for official municipal compliance and commissioner reviews.

### 🛰️ Live GPS Incident Geotagging
- **Auto-Detect Live Coordinates**:
  - Uses the browser's HTML5 Geolocation API (`navigator.geolocation`) with high-accuracy satellite lock.
  - Captures exact **Latitude, Longitude, and Accuracy Radius** (e.g. `17.6432° N, 75.9012° E`).
  - Solapur municipal center fallback coordinates applied if location permissions are restricted.
  - **Map Link**: Clickable link to preview the pin on Google Maps (`https://www.google.com/maps?q=lat,lng`).
  - Stored permanently with the grievance record so field officers can navigate directly to the ground incident.

### 📝 Civic Grievance Registration
- 9 Key Municipal Departments (Water Supply, Drainage & Sewerage, Solid Waste Management, Roads & Potholes, Street Lighting, Health & Sanitation, etc.).
- Solapur Ward/Prabhag picker (Jule Solapur, Navi Peth, Bhavani Peth, Saat Rasta, Ashok Chowk, Hotgi Road, Bale, etc.).
- Priority level (Normal, High, Urgent/Emergency).
- Photo evidence upload with live thumbnail preview.
- Generates a unique tracking token (e.g. `SMC-2026-1042`) and opens a printable acknowledgment receipt.

### 🔍 Real-Time 5-Stage Stepper Tracker
- Track by token or 10-digit mobile number.
- 5-stage visual progress bar:
  1. *Grievance Registered*
  2. *Under Preliminary Review*
  3. *Assigned to Ward Officer*
  4. *Ground Resolution In Progress*
  5. *Resolved & Closed*
- Displays assigned officer, official resolution notes, GPS coordinates with map link, and 5-star citizen satisfaction rating form.

### 🍃 MongoDB Database System (Mongoose ODM)
- **Database Architecture**:
  - Full MongoDB persistence managed via Mongoose models:
    - **`Grievance` Collection**: Tokens, citizen details, GPS lat/lng coordinates, priority, department, ward, citizen photo, work done resolution photo, audit timeline, and feedback.
    - **`Citizen` Collection**: Registered citizen profiles, unique mobile numbers, and salted SHA-256 hashed passwords.
    - **`Admin` Collection**: Municipal administrator credentials and permissions.
- **Local MongoDB & MongoDB Atlas Cloud Support**:
  - Automatically connects to `mongodb://127.0.0.1:27017/solapur_grievances` or remote MongoDB Atlas connection string set in `backend/.env`.
- **Automatic Data Seeding**:
  - Seeds authentic Solapur grievances, demo citizen (`9822012345`), and demo admin (`admin`) on initial run if MongoDB collections are fresh.
- **Resilient Fallback Mode**:
  - If MongoDB service is offline or not installed on the host machine, the server activates a resilient JSON fallback store so the portal remains 100% operational without crashing.

---

## 🎨 Theme & UI/UX Design

- **Primary Navy**: `#0A3981` (Solapur Municipal Corporation Official Navy)
- **Royal Civic Blue**: `#1D63B8` (Navigation and active accents)
- **Action Sky**: `#2563EB`
- **Soft Ice Blue**: `#EBF3FB` (Card headers and badges)
- **Pure White**: `#FFFFFF` (Content containers and input backgrounds)
- **Text Contrast**: Dark Slate `#0F172A` for high readability.

---

## 📂 Project Structure

```
solapur-municipal-corporation-grievance/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                    # MongoDB Mongoose connection, auto-seeder & resilient fallback
│   │   ├── controllers/
│   │   │   ├── authController.js        # Citizen & Admin login, registration, verification
│   │   │   ├── grievanceController.js   # Grievance CRUD, /my complaints & geotagging
│   │   │   └── statsController.js       # Real-time analytics & KPIs
│   │   ├── models/
│   │   │   ├── mongo/
│   │   │   │   ├── Grievance.js         # Mongoose schema for complaints, GPS & photo proofs
│   │   │   │   ├── Citizen.js           # Mongoose schema for citizen accounts & passwords
│   │   │   │   └── Admin.js             # Mongoose schema for single municipal administrator
│   │   │   ├── grievanceStore.js        # Hybrid MongoDB query layer + JSON synchronization
│   │   │   ├── userStore.js             # Citizen auth data access layer
│   │   │   └── adminStore.js            # Admin auth data access layer
│   │   ├── data/
│   │   │   ├── seedData.json            # Pre-seeded authentic Solapur complaints with GPS
│   │   │   ├── grievances.json          # Active persistent JSON store
│   │   │   ├── citizens.json            # Registered citizen accounts store
│   │   │   └── officers.json            # Single municipal administrator account store
│   │   ├── routes/
│   │   │   ├── authRoutes.js            # /api/auth
│   │   │   ├── grievanceRoutes.js       # /api/grievances
│   │   │   └── statsRoutes.js           # /api/stats
│   │   └── server.js                    # Express app, static server & DB initialization
│   ├── .env                             # Environment configuration (PORT, MONGODB_URI)
│   ├── .env.example
│   └── package.json                     # Backend dependencies (express, cors, dotenv, mongoose)
├── frontend/
│   ├── assets/
│   │   └── logo.svg                     # Vector Solapur Municipal Corporation Emblem
│   ├── css/
│   │   └── styles.css                   # White & Blue Civic Design System + Auth & Geotag UI
│   ├── js/
│   │   ├── api.js                       # Frontend REST API client
│   │   ├── citizenAuth.js               # Citizen login, registration, profile & my complaints
│   │   ├── app.js                       # Router (Home, Lodge, Track, Admin)
│   │   ├── complaint.js                 # Validation, GPS Geotagging & submission
│   │   ├── tracking.js                  # 5-step stepper tracker with Geotag coordinates
│   │   └── admin.js                     # Admin auth, dashboard, filtering, status modal, CSV export
│   └── index.html                       # Responsive Single Page Application
├── .gitignore                           # Git ignore rules
├── package.json                         # Root orchestration scripts
└── README.md                            # Documentation & Git instructions
```

---

## 🚀 Quick Start (Run Locally)

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/)

### 1. Install Dependencies
Open your terminal inside this project folder:

```bash
cd backend
npm install
```

### 2. Start the Application
Run the server:

```bash
npm start
```
*(Alternatively, from the project root folder: `node backend/src/server.js`)*

### 3. Open in Browser
Visit:
```
http://localhost:5000
```
The Express backend automatically serves both the **REST API** and the **complete frontend website** on port 5000.

---

## 🔑 Demo Credentials

### 1. Citizen Portal Demo (Public Authorization)
- **Mobile**: `9822012345`
- **Password**: `citizen@123`
- *(Tip: Click the "⚡ One-Click Auto-Fill Demo Citizen" button in the Citizen Login modal)*

### 2. Single Administrator Portal Demo
- **Access**: Click **"🛡️ Admin Portal"** in the top navigation bar.
- **Username**: `admin`
- **Password**: `solapur@123`
- *(Tip: Click the "🔑 Auto-Fill Admin Credentials" button on the administrator login screen)*

---

## 🐙 How to Push to Git (GitHub / GitLab)

Follow these exact steps to push this codebase to your Git repository:

```bash
git init
git add .
git commit -m "feat: digital grievance system for Solapur Municipal Corporation with citizen & admin authorization and geotagging"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
git push -u origin main
```

---

## 🏛️ About Solapur Municipal Corporation
- **HQ**: Indrabhuvan, Ambedkar Chowk, Solapur - 413001, Maharashtra, India.
- **Citizen Control Room**: `0217-2740300` | Toll-Free: `1800-233-0217`
- **Email**: `grievance@solapurcorporation.gov.in`
