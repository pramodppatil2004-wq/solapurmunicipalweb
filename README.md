# 🏛️ Solapur Municipal Corporation - Digital Grievance Redressal System
### सोलापूर महानगरपालिका - ई-तक्रार निवारण प्रणाली

An official-grade, fullstack digital grievance redressal web portal developed for the **Solapur Municipal Corporation (SMC)**. Built with a clean, high-contrast **White and Blue** civic UI/UX design, real-time 5-stage progress tracking, and administrative capabilities for municipal officers and ward engineers.

---

## 🌟 Key Features

### 👤 Citizen Services
- **Civic Grievance Registration**:
  - Structured grievance lodging with contact details, Solapur ward/prabhag picker (Jule Solapur, Navi Peth, Bhavani Peth, Saat Rasta, Ashok Chowk, Hotgi Road, etc.).
  - 9 key municipal departments (Water Supply, Drainage & Sewerage, Solid Waste Management, Roads & Potholes, Street Lighting, Health & Sanitation, Encroachment, etc.).
  - Priority flag (Normal, High, Urgent/Emergency).
  - Photo/document evidence upload with instant local preview.
  - Automatic generation of unique tracking tokens (e.g., `SMC-2026-1042`).
  - Printable official acknowledgment slip with print-ready stylesheet.
- **Real-Time Status Tracker**:
  - Lookup by unique tracking token or registered 10-digit mobile number.
  - Interactive **5-Stage Visual Stepper Timeline**:
    1. *Grievance Registered*
    2. *Under Preliminary Review*
    3. *Assigned to Ward Officer*
    4. *Ground Resolution In Progress*
    5. *Resolved & Closed*
  - Assigned field officer name, ward notes, and official resolution remarks.
  - Interactive **Citizen Satisfaction Rating (1 to 5 Stars)** and comments upon resolution.
- **Public Transparency Feed & Citizen Charter**:
  - Live public resolution feed (citizen privacy masked).
  - SLA timeframes per Maharashtra Right to Public Services Act (RTS).
- **Zonal Directory & Emergency Contacts**:
  - Direct contacts for Solapur 24x7 Disaster Control Room, Water Emergency cell, and Zonal Offices (Zone 1 to Zone 5).

### 🛡️ Municipal Officer & Admin Portal
- **Secure Officer Authentication**:
  - Pre-configured demo login for rapid testing.
- **Analytics Dashboard**:
  - Live KPI cards: Total Assigned, Action Pending, Resolved, and Urgent/Hazardous issues.
- **Complaint Management & Actioning**:
  - Multi-parameter filtering (by status, department, ward, or search query).
  - Action modal to reassign field officers, transition statuses, and append official action remarks.
- **One-Click Audit Report Export**:
  - Export filtered complaints data to CSV for departmental reviews.

---

## 🎨 Theme & UI/UX Design

The portal is styled using an authoritative, accessible **White and Blue** color palette:
- **Primary Navy**: `#0A3981` (Solapur Municipal Corporation Official Navy)
- **Royal Civic Blue**: `#1D63B8` (Navigation and active accents)
- **Action Sky**: `#2563EB`
- **Soft Ice Blue**: `#EBF3FB` (Card headers and badges)
- **Pure White**: `#FFFFFF` (Content containers and input backgrounds)
- **Text Contrast**: Dark Slate `#0F172A` for high readability across screens.

---

## 📂 Project Structure

```
solapur-municipal-corporation-grievance/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js        # Officer login & session verification
│   │   │   ├── grievanceController.js   # Citizen & officer grievance operations
│   │   │   └── statsController.js       # Real-time KPIs & public transparency feed
│   │   ├── data/
│   │   │   ├── seedData.json            # Pre-seeded authentic Solapur complaints
│   │   │   └── grievances.json          # Active persistent JSON store
│   │   ├── models/
│   │   │   └── grievanceStore.js        # Safe JSON persistence layer
│   │   ├── routes/
│   │   │   ├── authRoutes.js            # /api/auth
│   │   │   ├── grievanceRoutes.js       # /api/grievances
│   │   │   └── statsRoutes.js           # /api/stats
│   │   └── server.js                    # Express application & static file server
│   ├── .env                             # Environment configuration
│   ├── .env.example
│   └── package.json                     # Backend dependencies (express, cors, dotenv)
├── frontend/
│   ├── assets/
│   │   └── logo.svg                     # Vector Solapur Municipal Corporation Emblem
│   ├── css/
│   │   └── styles.css                   # White & Blue Civic Design System
│   ├── js/
│   │   ├── api.js                       # Frontend REST API client
│   │   ├── app.js                       # Router, toast alerts, modal handlers
│   │   ├── complaint.js                 # Validation, file upload, form submission
│   │   ├── tracking.js                  # 5-step stepper tracker & feedback handler
│   │   └── admin.js                     # Officer dashboard, status modal, CSV export
│   └── index.html                       # Complete responsive Single Page Application
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
The Express backend automatically serves both the **REST API** and the **complete frontend website** on port 5000!

---

## 🔑 Officer Portal Credentials (Demo)

For reviewing the administrative interface:
- **URL**: Click on **"Officer Portal"** in the top navigation or visit `#admin`
- **Username**: `admin`
- **Password**: `solapur@123`
- *(Tip: Click the "One-Click: Auto-fill Demo Credentials" button on the login screen for instant access!)*

### Sample Complaint Tokens for Testing the Tracker
You can search these pre-seeded tokens on the **Track Status** tab:
- `SMC-2026-1042` — Water Supply issue in Jule Solapur (*In Progress*)
- `SMC-2026-2188` — Garbage bin overflow in Bhavani Peth (*Resolved with feedback*)
- `SMC-2026-4851` — Road pothole at Saat Rasta (*Assigned to Roads Division*)
- `SMC-2026-3409` — Streetlights failure in Navi Peth (*Under Review*)

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status check |
| `GET` | `/api/stats` | Dashboard KPIs, resolution percentages, public transparency feed |
| `GET` | `/api/grievances` | List complaints with query filters (`?status=...&department=...&search=...`) |
| `POST` | `/api/grievances` | Citizen lodges a new grievance |
| `GET` | `/api/grievances/track/:query` | Track grievance by token (`SMC-2026-XXXX`) or 10-digit mobile number |
| `GET` | `/api/grievances/:id` | Fetch detailed grievance record by ID |
| `PATCH` | `/api/grievances/:id/status` | Municipal officer updates status, assigns personnel, and adds remarks |
| `POST` | `/api/grievances/:id/feedback` | Citizen submits 1-5 star rating and feedback comment |
| `POST` | `/api/auth/login` | Officer authentication |
| `GET` | `/api/auth/verify` | Verify active session token |

---

## 🐙 How to Push to Git (GitHub / GitLab)

Follow these exact steps to push this codebase to your Git repository:

### Step 1: Initialize Git
Open your command prompt or terminal in the project root directory:

```bash
git init
```

### Step 2: Add All Files
```bash
git add .
```

### Step 3: Create Initial Commit
```bash
git commit -m "feat: initial commit for Solapur Municipal Corporation Digital Grievance System"
```

### Step 4: Rename Branch to `main`
```bash
git branch -M main
```

### Step 5: Link Your Remote Repository
Create a new empty repository on **GitHub** (e.g. `solapur-municipal-grievance`). Then copy its URL and run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
```
*(Replace `YOUR_USERNAME` and `YOUR_REPOSITORY_NAME` with your actual GitHub username and repository name)*

### Step 6: Push Code to Git
```bash
git push -u origin main
```

---

## 🏛️ About Solapur Municipal Corporation
- **HQ**: Indrabhuvan, Ambedkar Chowk, Solapur - 413001, Maharashtra, India.
- **Citizen Control Room**: `0217-2740300` | Toll-Free: `1800-233-0217`
- **Email**: `grievance@solapurcorporation.gov.in`

Developed for the citizens of Solapur under the e-Governance Civic Redressal Initiative.
