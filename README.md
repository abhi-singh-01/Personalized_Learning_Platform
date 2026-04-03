# 🎓 Personalized Learning Platform (PLP)

An **AI-powered full-stack Learning Management System** that delivers personalized education experiences for students, teachers, and administrators. Powered by Google Gemini AI, the platform adapts to each learner's level, generates custom study plans, creates intelligent quizzes, and provides data-driven performance insights.

---

## ✨ Features

### 👨‍🎓 Student
- Browse and enroll in courses
- View course materials (videos, PDFs, documents)
- Attempt teacher-created quizzes with instant feedback
- Take AI-generated **Practice Quizzes** (no repeated questions)
- Generate a personalized **AI Study Plan** based on goals, available time, and weak topics
- Track learning progress, streaks, and engagement scores
- Receive AI **Personalized Feedback** on performance

### 👩‍🏫 Teacher
- Create, edit, and manage courses
- Upload course materials (supports file upload via Multer)
- Create quizzes manually with multiple-choice questions
- View detailed **Student Analytics** (scores, engagement, weak topics)
- Monitor per-student progress across enrolled courses

### 🛡️ Admin
- Full **Admin Dashboard** with platform-wide user and course management
- View **Platform Analytics** (charts via Recharts)
- Toggle **Maintenance Mode** to lock the platform for non-admins
- Manage global settings including Gemini AI API key and AI feature toggle
- Manage all users (promote/demote roles, delete accounts)

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server |
| **MongoDB + Mongoose** | Database & ODM |
| **JWT (jsonwebtoken)** | Authentication & authorization |
| **bcryptjs** | Password hashing |
| **Google Gemini AI** (`gemini-2.5-flash`) | Study plans, quizzes, feedback |
| **Multer** | File uploads (course materials) |
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
| `POST /api/auth/register` | Register a new user (student/teacher) |
| `POST /api/auth/login` | Login and receive a JWT |
| `GET/POST /api/courses` | List or create courses |
| `GET/POST /api/materials` | Fetch or upload course materials |
| `GET/POST /api/quizzes` | Fetch or create quizzes |
| `GET/POST /api/progress` | Track & update student progress |
| `POST /api/ai/study-plan` | Generate an AI study plan |
| `POST /api/ai/quiz` | Generate an AI practice quiz |
| `POST /api/ai/feedback` | Get AI personalized feedback |
| `GET /api/analytics` | Fetch analytics data |
| `GET /api/users` | User management |
| `GET/PUT /api/admin/*` | Admin-only platform management |

All protected routes require a `Bearer <token>` Authorization header.

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
| `student` | Courses, materials, quizzes, study plans, AI features, own progress |
| `teacher` | All student access + create/manage courses, materials, quizzes, view student analytics |
| `admin` | Full platform access + user management, platform analytics, settings, maintenance mode |

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
npm run seed   # Seed the database with sample data
```

### Frontend
```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview the production build
```

---

## 📜 License

This project is for educational and demonstration purposes.
