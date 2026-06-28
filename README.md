# 🏥 CareBot — AI-Powered Healthcare Platform

**Premium AI health assistant** with proactive care, smart analytics, and seamless health management.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Health Assistant** | Multi-provider AI (Gemini / OpenRouter / HuggingFace) with session memory |
| 📊 **Health Analytics** | Real-time vitals tracking with beautiful trend charts |
| 📅 **Appointments** | Schedule, manage, and track doctor appointments |
| 💊 **Medications** | Smart medication tracker with intake logging |
| 📋 **Report Scanner** | AI-powered analysis of medical documents |
| 🔔 **Notifications** | Real-time health alerts and reminders |
| 🌙 **Dark Mode** | Beautiful light & dark theme |
| 📱 **Responsive** | Pixel-perfect on mobile, tablet, and desktop |

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- npm v9+

### 1. Clone & Install

```bash
# Install all dependencies (root + server + client)
npm run setup
```

### 2. Configure AI (FREE)

Copy `.env.example` to `.env` and add at least one free API key:

```bash
cp .env.example .env
```

Get your **FREE** API key (pick one):
- **Gemini** → https://aistudio.google.com/ (recommended)
- **OpenRouter** → https://openrouter.ai/ (free models available)
- **HuggingFace** → https://huggingface.co/

```env
GEMINI_API_KEY=your_key_here
```

> **Note:** CareBot works without any API key using intelligent fallback responses.

### 3. Run

```bash
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api

---

## 🔧 Tech Stack

### Frontend
- **React 18** + TypeScript
- **Tailwind CSS** — utility-first styling
- **Framer Motion** — smooth animations
- **Zustand** — state management
- **Recharts** — health data visualizations
- **React Dropzone** — file uploads
- **React Hot Toast** — notifications

### Backend
- **Express.js** — REST API
- **better-sqlite3** — local SQLite database
- **bcryptjs** — password hashing
- **JWT** — authentication
- **multer** — file uploads

### AI Providers (FREE)
1. Google Gemini 1.5 Flash
2. OpenRouter (Mistral 7B free)
3. HuggingFace Inference API
4. Intelligent fallback responses

---

## 📁 Project Structure

```
carebot/
├── client/                 # React frontend
│   └── src/
│       ├── pages/          # All page components
│       ├── components/     # Reusable components
│       ├── store/          # Zustand state stores
│       ├── lib/            # Utilities & API client
│       └── styles/         # Global CSS
├── server/                 # Express backend
│   ├── routes/             # API routes
│   ├── db/                 # SQLite schema
│   ├── services/           # AI service
│   ├── middleware/         # Auth middleware
│   └── uploads/            # User files
├── .env                    # Your environment variables
├── .env.example            # Template
└── README.md
```

---

## 🗄️ Database

SQLite with full relational schema:
- `users` — Authentication
- `profiles` — Health profiles
- `conversations` — Chat history
- `messages` — AI messages
- `ai_memory` — Context memory
- `health_records` — Vital signs
- `reports` — Medical documents
- `appointments` — Doctor visits
- `medications` — Drug tracker
- `medication_logs` — Intake history
- `notifications` — Alerts
- `settings` — Preferences
- `analytics` — Usage data
- `logs` — System logs

---

## 🔐 Security

- JWT authentication with 7-day expiry
- Bcrypt password hashing (12 rounds)
- Rate limiting on all API endpoints
- Helmet.js security headers
- File upload validation & size limits
- Input sanitization on all routes

---

## 🎨 Design System

Inspired by Apple Health, Linear, and Stripe:
- Glassmorphism cards
- Smooth Framer Motion transitions
- Skeleton loading states
- Empty states with clear CTAs
- Toast notifications
- Responsive mobile-first layout

---

## 🌐 API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
GET    /api/profile
PUT    /api/profile
GET    /api/chat/conversations
POST   /api/chat/conversations
POST   /api/chat/conversations/:id/messages
GET    /api/health
POST   /api/health
GET    /api/health/stats
GET    /api/health/trends/:type
GET    /api/appointments
POST   /api/appointments
PUT    /api/appointments/:id
DELETE /api/appointments/:id
GET    /api/medications
POST   /api/medications
PUT    /api/medications/:id
POST   /api/medications/:id/log
POST   /api/reports/upload
GET    /api/reports/:id
GET    /api/notifications
PUT    /api/notifications/:id/read
PUT    /api/notifications/read-all
GET    /api/settings
PUT    /api/settings
```

---

## ⚠️ Disclaimer

CareBot is an AI health assistant and is **not a licensed medical device**. Always consult qualified healthcare professionals for medical advice. This application is for informational purposes only.

---

*Built with ❤️ for the AI Healthcare Hackathon*
