# Pulse — Realtime Chat App

A WhatsApp-style realtime chat app built with React + Vite + Supabase.

## Features
- 🔐 Email/password authentication
- 💬 Multiple chat rooms (create, join, leave)
- ⚡ Realtime messages via Supabase Realtime
- ✍️ Live typing indicators (via Supabase Presence)
- 🟢 Online presence (see who's active)
- 👍 Emoji reactions on messages
- ↩ Reply-to-message with preview
- ✓✓ Read receipts
- 📅 Date separators in chat history

---

## Setup Guide

### Step 1 — Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click **New Project** → choose a name and region → create
3. Wait ~2 minutes for it to spin up

### Step 2 — Run the Database Schema
1. In your Supabase dashboard → **SQL Editor** → **New Query**
2. Open `src/lib/supabase.js` and copy everything inside the big SQL comment block
3. Paste it into the SQL Editor and click **Run**

### Step 3 — Get Your API Keys
1. In Supabase → **Settings** → **API**
2. Copy **Project URL** and **anon public** key

### Step 4 — Configure Environment
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 5 — Install and Run
```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) 🎉

---

## Project Structure
```
src/
├── lib/
│   ├── supabase.js        # Supabase client + DB schema (SQL)
│   └── AuthContext.jsx    # Auth state & helpers
├── hooks/
│   ├── useMessages.js     # Realtime messages, typing, presence, reactions
│   └── useRooms.js        # Room CRUD and membership
├── components/
│   ├── Avatar.jsx         # User avatar with online dot
│   ├── MessageBubble.jsx  # Message with reactions + reply
│   ├── TypingIndicator.jsx
│   ├── Sidebar.jsx        # Room list + create/join modals
│   └── ChatArea.jsx       # Chat view + message input
└── pages/
    ├── AuthPage.jsx        # Login / Sign up
    └── ChatPage.jsx        # Main chat layout
```

## Deploy to Vercel (free)
```bash
npm install -g vercel
vercel
```
Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel → Project Settings → Environment Variables.

---

## Next Steps (Phase 2)
- [ ] Direct messages between users
- [ ] File/image uploads (Supabase Storage)
- [ ] Push notifications (Web Push API)
- [ ] Message search
- [ ] Link preview cards
- [ ] Voice messages (MediaRecorder API)
- [ ] @mentions with notifications
- [ ] Mobile app (React Native + same Supabase backend)
