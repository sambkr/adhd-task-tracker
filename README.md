# ADHD Task Tracker - Next.js + Vercel Migration

A specialized productivity app designed for individuals with ADHD, featuring intelligent task management with AI-generated preparation reminders and positive reinforcement.

## 🚀 Migration Complete: Firebase → Next.js + Vercel + Supabase

### Architecture
- **Frontend**: Next.js 15 with App Router, TypeScript, TailwindCSS
- **Backend**: Python FastAPI on Vercel serverless functions
- **Database**: Supabase PostgreSQL with Row Level Security
- **AI**: Google Gemini 2.0 Flash for intelligent prep step generation
- **Deployment**: Vercel (both frontend and Python backend)

### Key Features
- ✅ Task Management with AI-generated prep steps
- ✅ ADHD-friendly UI (minimal cognitive load, distraction-free)
- ✅ Progress tracking with streak counters and completion rates
- ✅ Category-based task organization
- ✅ Real-time statistics and motivational messages

## 🛠 Setup Instructions

### Prerequisites
- Node.js 18+ 
- Python 3.9+
- Poetry (for Python dependency management)
- Supabase account
- Google AI API key

### Environment Setup

1. **Copy environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Update `.env.local` with your credentials:**
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `GEMINI_API_KEY`: Your Google AI API key

### Database Setup

1. **Run the SQL schema in your Supabase project:**
   ```sql
   -- Execute the contents of supabase-schema.sql in Supabase SQL Editor
   ```

### Development

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Install Python dependencies:**
   ```bash
   cd api/python
   poetry install
   ```

3. **Start development servers:**
   ```bash
   # Frontend (Next.js)
   npm run dev

   # Python API (separate terminal - for local testing)
   cd api/python
   poetry run uvicorn main:app --reload --port 8000
   ```

### Deployment to Vercel

1. **Connect GitHub repository to Vercel**
2. **Add environment variables in Vercel dashboard**
3. **Deploy** - Vercel automatically handles both Next.js frontend and Python API

## 🧠 ADHD-Specific Features

### Cognitive Load Reduction
- Single-page interface with tab-based navigation
- Minimal form fields (only title required)
- Status-based task grouping for mental organization
- Progressive disclosure (expandable details)

### Executive Function Support
- AI-generated prep steps break down tasks into manageable pieces
- Time-based reminders with offset timing (e.g., "-60 minutes")
- Visual status indicators for clear task progression
- Default due dates to reduce decision fatigue

### Positive Reinforcement System
- Streak counter for building habits
- Completion rate tracking for self-awareness
- Category-based insights for identifying strengths
- Motivational messages based on achievement levels

## 📁 Project Structure

```
adhd_app/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx           # Main application
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── TaskForm.tsx
│   │   ├── TaskItem.tsx
│   │   ├── TaskList.tsx
│   │   └── UserStats.tsx
│   ├── lib/
│   │   ├── api.ts             # API client
│   │   └── supabase/          # Supabase configuration
│   └── types/
│       └── index.ts           # TypeScript interfaces
├── api/
│   └── python/
│       ├── main.py            # FastAPI backend
│       ├── pyproject.toml     # Poetry dependencies
│       └── requirements.txt   # Vercel requirements
├── supabase-schema.sql        # Database schema
└── vercel.json                # Vercel configuration
```

## 🔧 API Endpoints

### Tasks
- `POST /api/python/tasks` - Create task with AI-generated prep steps
- `GET /api/python/tasks/{user_id}` - Get all tasks for user
- `PUT /api/python/tasks/{task_id}` - Update task status/prep steps
- `DELETE /api/python/tasks/{task_id}` - Delete task

### Statistics
- `GET /api/python/stats/{user_id}` - Get user progress statistics

### Health
- `GET /api/python/health` - API health check

## 🧪 Testing

```bash
# Frontend
npm run lint
npm run build

# Python API
cd api/python
poetry run pytest  # (when tests are added)
```

## 📊 Migration Benefits

### Performance Improvements
- **SSR/SSG**: Better initial page loads with Next.js
- **Edge Functions**: Faster API responses with Vercel
- **Automatic Optimization**: Next.js image optimization, code splitting

### Developer Experience
- **Single Repository**: Frontend and backend in one place
- **TypeScript Throughout**: End-to-end type safety
- **Hot Reload**: Instant development feedback
- **Preview Deployments**: Test changes before production

### Cost Optimization
- **Vercel Free Tier**: Generous limits for personal projects
- **Supabase Free Tier**: PostgreSQL with real-time features
- **Serverless Architecture**: Pay only for actual usage

### Scalability
- **PostgreSQL**: Better performance for relational data vs Firestore
- **Row Level Security**: Built-in multi-tenancy support
- **Vercel Edge Network**: Global CDN for fast delivery

The migration successfully preserves all ADHD-specific features while modernizing the tech stack for better performance, developer experience, and scalability.