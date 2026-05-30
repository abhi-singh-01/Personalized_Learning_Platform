# 🎓 Personalized Learning Platform (PLP)

An **AI-powered full-stack Learning Management System** that delivers personalized education experiences for students, teachers, and administrators. Powered by Google Gemini AI, the platform adapts to each learner's level, generates custom study plans, creates intelligent quizzes, and provides data-driven performance insights.

---

## ✨ Features

### Learner
- Browse and enroll in courses (free or paid via Razorpay / mock checkout)
- View course materials (YouTube, uploaded video, PDF, PPT, articles)
- Attempt educator-created quizzes with instant feedback
- Take AI-generated **Practice Quizzes** (no repeated questions)
- Generate a personalized **AI Study Plan** based on goals, available time, and weak topics
- **AI from lectures:** transcript, notes, syllabus, and learning roadmap from video materials (Gemini)
- **Course-aware AI chat** with optional attachments
- Track learning progress, streaks, and engagement scores
- Live class rooms (Socket.io), payment history, reviews

### Educator
- Create, edit, and manage courses; coupons; earnings and payouts (Razorpay)
- Upload course materials (Multer; optional **S3/R2** for durable storage in production)
- Create quizzes manually with multiple-choice questions
- View detailed **Learner Analytics** (scores, engagement, weak topics)
- Live lectures and live class manager

### Admin
- Full **Admin Dashboard** with platform-wide user and course management
- **Platform Analytics**, offers, UI config, feature flags
- **Live class monitor**, **audit logs**, **content moderation**
- Toggle **Maintenance Mode** to lock the platform for non-admins
- Manage global settings including Gemini AI API key and AI feature toggle
- Manage all users (roles, delete accounts)

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server |
| **MongoDB + Mongoose** | Database & ODM |
| **JWT (jsonwebtoken)** | Authentication & authorization |
| **bcryptjs** | Password hashing |
| **Nodemailer** | Email OTP delivery through SMTP |
| **Google Gemini AI** (`gemini-2.5-flash`) | Study plans, quizzes, feedback |
| **Multer** (+ optional **AWS S3** client) | File uploads; durable object storage when configured |
| **Helmet** | HTTP security headers |
| **express-rate-limit** | API rate limiting |
| **express-validator** | Request validation |
| **Morgan** | HTTP request logging |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18 + Vite** | UI framework & build tool |
| **React Router v6** | Client-side routing |
| **Tailwind CSS** | Utility-first styling |
| **Axios** | HTTP requests |
| **Recharts** | Analytics charts |
| **Lucide React** | Icon library |
| **Jodit React** | Rich text editor |
| **jsPDF + html2canvas** | PDF export |

---

## 📁 Project Structure

```
PLP/
├── backend/
│   ├── src/
│   │   ├── app.js               # Express app setup & middleware
│   │   ├── config/
│   │   │   ├── db.js            # MongoDB connection
│   │   │   └── env.js           # Environment variable exports
│   │   ├── controllers/         # Route handler logic
│   │   ├── middleware/          # Auth, error handling, maintenance, rate limit
│   │   ├── models/              # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Course.js
│   │   │   ├── Material.js
│   │   │   ├── Quiz.js
│   │   │   ├── Progress.js
│   │   │   ├── CourseProgress.js
│   │   │   ├── Comment.js
│   │   │   ├── AIInteractionLog.js
│   │   │   └── Setting.js
│   │   ├── routes/              # API route definitions
│   │   │   ├── auth.js
│   │   │   ├── courses.js
│   │   │   ├── materials.js
│   │   │   ├── quizzes.js
│   │   │   ├── progress.js
│   │   │   ├── ai.js
│   │   │   ├── analytics.js
│   │   │   ├── users.js
│   │   │   └── admin.js
│   │   ├── services/
│   │   │   ├── aiService.js     # Gemini AI integration
│   │   │   └── analyticsService.js
│   │   └── utils/               # Shared utility helpers
│   ├── uploads/                 # Uploaded course material files
│   ├── server.js                # Entry point
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx              # Routing & role-based protected routes
    │   ├── main.jsx             # React entry point
    │   ├── api/                 # Axios instance configuration
    │   ├── components/          # Reusable UI components & layouts
    │   ├── context/
    │   │   └── AuthContext.jsx  # Global auth state
    │   ├── hooks/               # Custom React hooks
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── About.jsx
    │   │   ├── Profile.jsx
    │   │   ├── auth/            # Login, Register
    │   │   ├── student/         # Dashboard, Courses, CourseDetail,
    │   │   │                    #   QuizAttempt, PracticeQuiz, StudyPlan
    │   │   ├── teacher/         # Dashboard, ManageCourse, CreateQuiz,
    │   │   │                    #   UploadMaterial, StudentAnalytics
    │   │   └── admin/           # AdminDashboard, PlatformAnalytics
    │   ├── styles/
    │   └── utils/
    ├── index.html
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) (local instance or MongoDB Atlas)
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

---

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd PLP
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/plp
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_google_gemini_api_key
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Email OTP — Brevo (recommended on Render: use API key, not SMTP)
# APP_NAME=PLP
# BREVO_API_KEY=xkeysib-your-brevo-api-key
# SMTP_FROM="PLP <noreply@yourdomain.com>"
# Optional SMTP fallback (often blocked/slow on Render):
# SMTP_HOST=smtp-relay.brevo.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-brevo-login-email@example.com
# SMTP_PASS=xsmtpsib-your-brevo-smtp-key
# EMAIL_OTP_TTL_MINUTES=10

# Optional: durable uploads (see “Durable uploads” below)
# AWS_REGION=us-east-1
# AWS_S3_BUCKET=
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
```

Start the backend server:

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:5000`.

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend dev server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🔌 API Endpoints

| Prefix | Description |
|---|---|
| `POST /api/auth/register` | Register a new user (`learner` or `educator`) and send email OTP |
| `POST /api/auth/verify-email` | Verify email OTP and issue a JWT |
| `POST /api/auth/resend-email-otp` | Resend email verification OTP |
| `POST /api/auth/login` | Login and receive a JWT |
| `GET/POST /api/courses` | List or create courses |
| `GET/POST /api/materials` | Fetch or upload course materials |
| `GET/POST /api/quizzes` | Fetch or create quizzes |
| `GET/POST /api/progress` | Track & update learner progress |
| `POST /api/ai/study-plan` | Generate an AI study plan |
| `POST /api/ai/generate-quiz` | Generate an AI practice quiz |
| `POST /api/ai/feedback` | Get AI personalized feedback |
| `POST /api/ai/transcribe/:materialId` | Transcribe / enrich video material (educator) |
| `GET /api/ai/transcript/:materialId` | Fetch stored transcript / notes / syllabus |
| `GET/POST /api/payments/*` | Checkout, verify, webhooks, coupons, refunds |
| `GET/POST /api/live-classes/*` | Live sessions (Socket.io) |
| `POST /api/chatbot/chat` | Learner AI tutor (course context) |
| `GET /api/notifications` | In-app notifications |
| `GET/POST /api/reviews` | Course reviews |
| `GET /api/audit-logs` | Admin audit trail |
| `GET/PUT /api/admin/*` | Admin-only platform management |
| `GET /health` | **Uptime check** (no DB required; use on Render) |

All protected routes require a `Bearer <token>` Authorization header.

---

## Payments (Razorpay)

For **examiner or demo presentations**, use Razorpay’s **Test mode** keys so learners see the **real Razorpay checkout** (not the built-in mock modal):

1. In the [Razorpay Dashboard](https://dashboard.razorpay.com/), switch to **Test mode** and copy **Key ID** and **Key Secret**.
2. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in the backend `.env` (or your host’s environment). Test keys usually start with `rzp_test_`.
3. **`DUMMY_PAYMENT` and Razorpay together:** set `DUMMY_PAYMENT=true` **and** add Razorpay Test keys. Learners see **two** options on paid courses: **Pay with Razorpay** (real checkout → `POST /api/payments/verify`) and **Test pay (mock)** (in-app flow → `POST /api/payments/dummy-verify`). For Razorpay-only demos, set `DUMMY_PAYMENT=false`.
4. **`POST /api/payments/create-order`** accepts optional `paymentMode`: `"razorpay"` (default when keys exist) or `"dummy"` (requires `DUMMY_PAYMENT=true`). **`GET /api/payments/checkout-options`** (learner) returns `{ razorpay, dummy }` for the UI.
5. Complete Razorpay test payments using [Razorpay’s test methods](https://razorpay.com/docs/payments/payments/test-card-details/) (test cards, UPI, etc.).

**Mock checkout only (no Razorpay keys):** set `DUMMY_PAYMENT=true` and omit Razorpay keys. Only the mock flow is available.

### Vercel (frontend) + Render (API) — checklist

If checkout or login “does nothing” or the browser console shows **CORS** / **failed to fetch**:

1. **Vercel → Environment variables (Production & Preview)**  
   Set **`VITE_API_URL`** to your Render API base **including `/api`**, for example:  
   `https://YOUR-SERVICE.onrender.com/api`  
   Then **redeploy** the frontend (Vite bakes this in at build time).

2. **Render → Environment**  
   Set **`FRONTEND_URL`** to your exact Vercel origin(s), **comma-separated** if you use both production and preview URLs, for example:  
   `https://your-app.vercel.app,https://your-app-git-main-xxx.vercel.app`  
   No trailing slash. Must match what the browser sends as the `Origin` header.

3. **Optional:** `CORS_ALLOW_VERCEL_PREVIEWS=true` on Render allows **any** `https://*.vercel.app` origin (convenient for demos; less strict than an explicit list).

4. On Render, set **`RAZORPAY_KEY_ID`** and **`RAZORPAY_KEY_SECRET`** (Test mode for demos). Set **`DUMMY_PAYMENT=true`** if you want **both** Razorpay and mock checkout on the same deployment.

5. Complete a Razorpay test payment using [Razorpay test instruments](https://razorpay.com/docs/payments/payments/test-card-details/); success runs **`POST /api/payments/verify`** and enrolls the learner.

**Failed payments (learner history):** Failed attempts store a **support snapshot** (order id, payment id, amount, course, educator, email). Rows are **deleted automatically** after **`FAILED_PAYMENT_RETENTION_HOURS`** (default **72**) unless the learner uses **Raise query** in Payments — then the record is kept.

---

## 🤖 AI Features (Powered by Google Gemini)

All AI features use the `gemini-2.5-flash` model and are togglable by the admin.

| Feature | Description |
|---|---|
| **Study Plan Generator** | Creates a week-by-week study plan based on the student's goal, available hours, level, and weak topics |
| **Practice Quiz Generator** | Generates unique multiple-choice questions on any topic/difficulty; prevents duplicate questions across sessions |
| **Personalized Feedback** | Analyzes quiz scores, average performance, and weak areas to provide tailored improvement recommendations |

---

## 👤 User Roles

| Role | Access |
|---|---|
| `learner` | Default student experience: courses, materials, quizzes, AI, payments, live classes |
| `educator` | Course/material/quiz management, learner analytics, coupons, earnings, live teaching |
| `admin` | Full platform access + user management, analytics, settings, maintenance mode |
| `student` / `teacher` | Legacy enum values (migration path); prefer **learner** / **educator** for new accounts |

---

## 🔒 Security

- Passwords are hashed with **bcryptjs** (12 salt rounds)
- API authentication via **JWT** (7-day expiry by default)
- HTTP headers secured with **Helmet**
- API rate limiting via **express-rate-limit**
- Request validation via **express-validator**
- CORS restricted to the configured `FRONTEND_URL`

---

## 📊 Data Models

| Model | Key Fields |
|---|---|
| `User` | name, email, role, aiLevel, engagementScore, averageScore, streak |
| `Course` | title, description, instructor, category, enrolledStudents |
| `Material` | course, title, type, fileUrl, content |
| `Quiz` | course, title, questions (MCQ), createdBy |
| `Progress` | student, quiz, score, answers, completedAt |
| `CourseProgress` | student, course, completedMaterials, lastAccessed |
| `AIInteractionLog` | user, type (study-plan/quiz/feedback), input, output |
| `Setting` | aiEnabled, geminiApiKey, maintenanceMode |

---

## 🧰 Development Scripts

### Backend
```bash
npm run dev    # Start with nodemon (auto-reload)
npm start      # Start in production mode
npm test       # Health checks + materials API integration (MongoDB Memory Server; use `npm ci` first)
npm run seed   # Seed the database with sample data
```

### Frontend
```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview the production build
npx playwright install   # One-time: browsers for e2e
npm run test:e2e          # Playwright smoke (CI skips unless PLAYWRIGHT_RUN=1)
```

---

## 🧪 CI

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to `main` or `master`:

- **backend:** `npm ci` + `npm test`
- **frontend:** `npm ci` + `npm run build`

---

## 📦 Durable uploads (S3 / R2 / MinIO)

On hosts with an **ephemeral filesystem** (e.g. Render free web instances), files under `/uploads` can disappear after a restart. When these variables are set, new course material uploads are copied to your bucket and the **public HTTPS URL** is stored on the `Material` document (the UI already supports absolute `fileUrl`s):

| Variable | Purpose |
|---|---|
| `AWS_S3_BUCKET` | Bucket name |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | API credentials |
| `AWS_REGION` | Region (default `us-east-1` if omitted) |
| `AWS_S3_ENDPOINT` | Optional; set for **Cloudflare R2**, MinIO, LocalStack (enables path-style access) |
| `AWS_S3_PUBLIC_URL_BASE` | Optional; public CDN or R2 dev URL prefix for object URLs and delete key parsing |

Implementation: `backend/src/services/storageService.js` (used from `materialController`).

---

## 🛣️ Product roadmap (next implementations)

Suggested order to deepen the product (not yet built as full features in this repo):

1. **Email / push** — wire `Notification.channel` beyond `in_app` (transactional email for class start, payment, digest).
2. **Completion credentials** — PDF certificate or badge when course + quiz thresholds pass.
3. **Adaptive path** — recommend next lessons / practice from aggregate quiz + transcript signals.
4. **Spaced repetition** — review deck from transcripts or weak-topic quizzes.

---

## 📜 License

This project is for educational and demonstration purposes.
