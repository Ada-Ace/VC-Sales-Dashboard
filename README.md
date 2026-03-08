# 🚀 VC Sales Dashboard (Next.js Edition)

A modern, high-performance SaaS-style dashboard built with **Next.js (App Router)** and **Tailwind CSS v4**. This dashboard dynamically parses sales data and presents KPIs using AI insights powered by Google Gemini.

It is fully prepared for Vercel deployment with Supabase.

## 📂 Architecture

This project has been upgraded from a React SPA to a **Full-Stack Next.js Application**.
- **Frontend**: `src/app/page.jsx`
- **Data API**: `src/app/api/sales/route.js` (Reads from CSV or Supabase)
- **AI Engine API**: `src/app/api/insights/route.js` (Securely calls Gemini server-side)

## ☁️ Setting up for Vercel

### 1. Push to GitHub
If you haven't already, push your code to your GitHub repository:
`https://github.com/Ada-Ace/VC-Sales-Dashboard`

### 2. Connect to Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** -> **Project**.
3. Import your GitHub repository (`VC-Sales-Dashboard`).
4. Set the **Framework Preset** to `Next.js`.
5. Set the **Root Directory** to `next-dashboard`.

### 3. Configure Environment Variables
In the Vercel dashboard, before clicking "Deploy", open the **Environment Variables** section and add the following keys:

- `GEMINI_API_KEY`: Your Google Gemini API Key.
- `DATA_SOURCE`: Set to `supabase` to use your live database (or `csv` to use the fallback file).
- `SUPABASE_URL`: Your Supabase Project URL.
- `SUPABASE_ANON_KEY`: Your Supabase Anon Key.

### 4. Deploy ⚡
Click **Deploy**. Vercel will build the `next-dashboard` directory. Once complete, your project is live in production!

---

## ☁️ Supabase Setup guide

1. In Supabase, open the SQL Editor and run:
```sql
create table sales_data (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  product text not null,
  channel text not null,
  orders integer default 0,
  revenue decimal(10,2) default 0,
  cost decimal(10,2) default 0,
  visitors integer default 0,
  customers integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```
2. Import `sales_data.csv` into the new table. (Available at the root of the repository).
