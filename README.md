# ABCL Self-PD Portal

**Aditya Birla Capital Limited — Self Personal Discussion Management System**

A full-stack web application enabling credit officers to trigger self-PD links to customers via SMS, and customers to complete their personal discussion forms digitally — with OTP authentication, geo-tagged photo uploads, and officer review workflow.

---

## Architecture

```
abcl-self-pd/
├── backend/          Node.js + Express REST API
│   ├── src/
│   │   ├── config/   Database (SQLite), migrations, seed data
│   │   ├── controllers/  Business logic
│   │   ├── middleware/   Auth (JWT), file upload (Cloudinary)
│   │   ├── routes/       API route definitions
│   │   ├── services/     Twilio SMS, OTP, Geo distance
│   │   └── utils/        Logger (Winston)
│   └── package.json
├── frontend/         React + Vite SPA
│   ├── src/
│   │   ├── api/      Axios client with interceptors
│   │   ├── components/   UI components, Layout, ABCL Logo
│   │   ├── pages/
│   │   │   ├── officer/  Login, Dashboard, Applications, Detail
│   │   │   └── customer/ Self-PD journey (OTP + multi-step form)
│   │   └── store/    Zustand auth store
│   └── package.json
├── railway.toml      Railway deployment config
└── nixpacks.toml     Build config
```

---

## Features

### Credit Officer Portal (`/officer/`)
- 🔐 Secure login with JWT authentication (8h session)
- 📊 Dashboard with live stats (Total / Pending / Link Sent / Completed)
- 📋 Application list with search, filter by status, and direct SMS trigger
- 📨 One-click Self-PD link trigger (with re-trigger option)
- 📄 Application detail view with full customer response review
- 🗺️ Geo-tag distance analysis (residence photo vs registered address, office photo vs office address)
- ✅ PD outcome recording (Positive / Negative) with remarks

### Customer Self-PD Journey (`/pd/:token`)
- 🔒 Link expiry validation (24-hour window)
- 📱 Mobile OTP verification (must match registered mobile)
- 📝 Multi-step form:
  1. Residence details (type, ownership, locality)
  2. Employment / Business details (salaried vs self-employed, adaptive)
  3. Personal details (family, dependents, loan purpose)
  4. Geo-tagged photo upload (residence + office/business)
  5. Review & submit
- 🌍 Automatic GPS geo-tagging on photo capture
- 🚫 Post-submission link invalidation

---

## Local Development

### Prerequisites
- Node.js 18+
- npm

### Setup

```bash
# 1. Clone and install
git clone <repo>
cd abcl-self-pd
npm run install:all

# 2. Configure backend
cd backend
cp .env.example .env
# Edit .env with your credentials (see below)

# 3. Seed demo data
npm run seed

# 4. Start backend (terminal 1)
npm run dev

# 5. Start frontend (terminal 2)
cd ../frontend
npm run dev
```

App runs at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Health: http://localhost:3001/api/health

---

## Environment Variables

### Required
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=<generate with: openssl rand -hex 32>
FRONTEND_URL=http://localhost:5173
BASE_URL=http://localhost:5173
```

### Twilio (for real SMS)
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```
> Without Twilio config, the app runs in simulation mode — SMS text is logged to console, and the OTP is returned in the API response (visible in dev mode banner on the customer form).

### Cloudinary (for persistent photo storage)
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
> Without Cloudinary, the app uses placeholder Unsplash images in demo mode.

---

## Railway Deployment

### Step 1 — Create Railway project
1. Go to [railway.app](https://railway.app) and create a new project
2. Connect your GitHub repository

### Step 2 — Set environment variables in Railway
```
NODE_ENV=production
JWT_SECRET=<openssl rand -hex 32>
FRONTEND_URL=https://your-app.up.railway.app
BASE_URL=https://your-app.up.railway.app
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Step 3 — Deploy
Railway auto-detects `nixpacks.toml` and runs the build. The app will:
1. Install all dependencies
2. Build the React frontend
3. Run database seed (creates demo data + officers)
4. Start the Express server serving both API and static frontend

### Step 4 — Verify
- `https://your-app.up.railway.app/api/health` → should return `{"status":"ok",...}`
- `https://your-app.up.railway.app/officer/login` → ABCL login page

---

## Demo Credentials

| Officer | Email | Password | Branch |
|---------|-------|----------|--------|
| Rajesh Kumar | rajesh.kumar@adityabirlacapital.com | Demo@1234 | Dehradun |
| Priya Sharma | priya.sharma@adityabirlacapital.com | Demo@1234 | Mumbai |
| Mukund K | mukund.k@adityabirlacapital.com | Demo@1234 | Dehradun |

### Demo Applications
| App ID | Customer | Status | Notes |
|--------|----------|--------|-------|
| PL00000701762 | Ashwini Dharpale | Pending | Ready to trigger |
| BL00000801234 | Vaibhav Kumbhar | Link Sent | Link active |
| PL00000901567 | Sunita Patel | Completed | Full data + geo analysis visible |
| HL00001002890 | Ramesh Agarwal | Pending | Home loan, self-employed |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Officer login |
| GET | `/api/auth/me` | Get current officer |

### Applications (Officer — requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/applications` | List all (with search/filter) |
| GET | `/api/applications/stats` | Dashboard stats |
| GET | `/api/applications/:id` | Full detail + submission + geo |
| POST | `/api/applications/:id/trigger-pd` | Send/re-trigger SMS link |
| POST | `/api/applications/:id/pd-outcome` | Save PD outcome |

### Customer PD
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pd/:token/info` | Get link info (validates expiry) |
| POST | `/api/pd/:token/request-otp` | Send OTP to mobile |
| POST | `/api/pd/:token/validate-otp` | Verify OTP → get session token |
| POST | `/api/pd/upload-photo` | Upload geo-tagged photo |
| POST | `/api/pd/submit` | Submit completed PD form |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router, Zustand, Axios, Lucide Icons |
| Styling | Tailwind CSS (inline), CSS custom properties |
| Backend | Node.js, Express 4 |
| Database | SQLite (via better-sqlite3) — production-safe for Railway |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| SMS | Twilio |
| Photos | Cloudinary (multer-storage-cloudinary) |
| Logging | Winston |
| Deployment | Railway (nixpacks) |

---

## Security Considerations

- JWT tokens expire in 8 hours (officer) / 2 hours (customer PD session)
- OTP valid for 10 minutes, max 3 attempts
- PD links valid for 24 hours, invalidated on use
- Mobile number must exactly match registered number
- Rate limiting: 200 req/15min (API), 5 OTP requests/10min
- Helmet.js for HTTP security headers
- CORS restricted to known origins in production
- All mobile numbers masked in API responses and UI

---

## License
Proprietary — Aditya Birla Capital Ltd. Demo build for internal use.
