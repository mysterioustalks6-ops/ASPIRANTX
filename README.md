# 🎯 AspirantX — Complete UPSC & Competitive Exam Preparation Platform

<div align="center">

![AspirantX](https://img.shields.io/badge/AspirantX-v1.0-brightgreen?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)
![Vite](https://img.shields.io/badge/Vite-6.0-purple?style=for-the-badge&logo=vite)

**A full-stack exam preparation platform for UPSC, NEET, NDA, SSC & more**

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📚 **PYQ Section** | 10,000+ Previous Year Questions (UPSC, NEET, NDA) with year filters |
| 🗂️ **Question Bank** | Searchable question bank with language & subject filters |
| 🧪 **CBT Exam Engine** | Computer Based Test with timer, auto-evaluation & results |
| 🤖 **AI Study Chat** | Gemini-powered AI tutor for exam preparation |
| 📊 **Syllabus Tracker** | Topic-wise progress tracking with prediction engine |
| 🏆 **Leaderboard** | Competitive rankings among students |
| 👥 **Community** | Discussion forums, study groups & peer learning |
| 📖 **Library** | Curated books, notes & PDF resources |
| 🃏 **Flashcards** | Spaced repetition flashcard system |
| ⏱️ **Pomodoro Timer** | Study session tracker |
| 💳 **Premium Plans** | Razorpay-integrated subscription management |
| 🔧 **Admin Panel** | Full admin dashboard with question import, user management |
| 📥 **Question Import** | Bulk import from PDF, images, text & URLs with OCR |
| 🌐 **Bilingual** | English & Hindi language support |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/aspirantx.git
cd aspirantx
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
```bash
cp .env.example .env
```
Fill in your actual values in `.env` (see [Environment Variables](#-environment-variables) below)

### 4. Start development server
```bash
npm run dev
```

App will be available at `http://localhost:3000`

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and fill in these values:

| Variable | Where to get it |
|---|---|
| `SUPABASE_URL` | [Supabase Dashboard](https://supabase.com) → Project → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role key |
| `JWT_SECRET` | Generate: `openssl rand -base64 32` |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `RAZORPAY_KEY_ID` | [Razorpay Dashboard](https://dashboard.razorpay.com) → Settings → API Keys |
| `ADSENSE_PUBLISHER_ID` | [Google AdSense](https://adsense.google.com) |

---

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom dark theme
- **Backend**: Node.js + Express (TypeScript)
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini API
- **Payments**: Razorpay
- **Animations**: Framer Motion

---

## 📁 Project Structure

```
aspirantx/
├── src/
│   ├── components/       # All React components
│   │   ├── AdminPanel.tsx
│   │   ├── PyqEngine.tsx
│   │   ├── QuestionBankEngine.tsx
│   │   ├── CbtExamEngine.tsx
│   │   └── ...
│   ├── data/             # Static data files
│   └── types.ts          # TypeScript type definitions
├── server.ts             # Express backend server
├── .env.example          # Environment variables template
└── vite.config.ts        # Vite configuration
```

---

## 📜 Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

---

## 🔒 Security Notes

- **Never commit `.env`** — it contains secret keys
- The `.env` file is in `.gitignore` for safety
- Admin panel is protected by passcode authentication
- All API endpoints use JWT verification

---

## 📄 License

Private — All rights reserved © 2026 AspirantX
