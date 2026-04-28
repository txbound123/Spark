# ✦ Spark

Your personal AI second brain — a warm conversational app that helps people discover and articulate their own intelligence.

## What's Inside

- **Voice-first chat** with Claude (Anthropic API)
- **Supabase auth** — email signup and login
- **Persistent memory** — conversations and insights saved per user
- **Secure architecture** — API keys stay on the server via Supabase Edge Functions

---

## 🚀 Quick Setup (30 minutes)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once it's ready, go to **SQL Editor** and run the contents of `supabase/setup.sql`
3. Go to **Settings → API** and copy:
   - Project URL
   - anon public key

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase values:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your real keys.

### 4. Deploy the Edge Function

This keeps your Anthropic API key SECRET (never put it in the frontend!).

Install the Supabase CLI:
```bash
npm install -g supabase
```

Login and link your project:
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Set your Anthropic API key as a secret:
```bash
supabase secrets set ANTHROPIC_API_KEY=your-key-here
```

Deploy the function:
```bash
supabase functions deploy chat-with-spark
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and create an account!

---

## 🌐 Deploy to Production (Vercel)

1. Push this code to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Add the same environment variables you put in `.env.local`
4. Deploy! You'll get a URL like `https://spark-yourname.vercel.app`
5. Go back to Supabase → **Authentication → URL Configuration** and add this URL

---

## 📁 Project Structure

```
spark/
├── pages/
│   ├── index.js          # Main app (auth gated)
│   ├── login.js          # Signup/signin page
│   └── _app.js           # App entry point
├── components/
│   └── Spark.js          # The Spark chat component
├── lib/
│   └── supabase.js       # Supabase client
├── styles/
│   └── globals.css       # Global styles
├── supabase/
│   ├── setup.sql         # Database schema
│   └── functions/
│       └── chat-with-spark/
│           └── index.ts  # Edge Function (secure API)
├── .env.example          # Environment template
├── .gitignore
├── next.config.js
├── package.json
└── README.md
```

---

## 🔌 Connecting Paperclip AI

Paperclip can connect to your Supabase database in two ways:

**Option A — Direct Postgres** (most powerful)
Get connection string from Supabase → Settings → Database

**Option B — Through Edge Functions** (safer, recommended)
Create additional Edge Functions for specific agent tasks:
- `get-user-stats` — for Analytics Agent
- `get-inactive-users` — for Engagement Agent
- `get-recent-feedback` — for Support Agent

Then give Paperclip agents the URLs and your service_role key.

---

## 💰 Costs

- **Supabase free tier** — $0 (50K monthly users included)
- **Vercel free tier** — $0
- **Anthropic API** — pay as you go (~$50–100/month early on)
- **Total to start** — under $100/month

---

## 🎙 Browser Support

Voice input works best in:
- ✅ Chrome
- ✅ Edge
- ✅ Safari (mostly)
- ⚠️ Firefox (limited)

Users on unsupported browsers can still type.

---

Built with ❤️ to help people discover the intelligence they already have.
