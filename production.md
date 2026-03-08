# Vercel Production Deployment Guide

This document outlines the required steps to get the VC Sales Dashboard running safely and securely in production on Vercel.

## Pre-requisites
- A Vercel Account linked to your GitHub.
- Your project pushed to the `main` branch of your GitHub Repo.
- A Supabase Project configured with the `sales_data` table.
- A Google Gemini API Key.

## Vercel Setup

1. **Import Project**: In Vercel, select your GitHub repo: `Ada-Ace/VC-Sales-Dashboard`
2. **Root Directory Configuration**: 
   - Because the Next.js app is located in the `next-dashboard` folder, you MUST set the **Root Directory** to `next-dashboard` during import.
   - *If you skip this step, Vercel will attempt to deploy the root directory and fail, because it will look for a package.json at the root instead of inside next-dashboard.*

## Environment Variables
Security is the primary reason the AI Engine was moved from the client to a Next.js API Route. In Vercel, navigate to **Environment Variables** and securely add:

| Variable | Description | Example |
|---|---|---|
| `GEMINI_API_KEY` | Connects the backend to the Quantum Engine | `AIzaSy...` |
| `DATA_SOURCE` | Tells the API to read from the cloud DB | `supabase` |
| `SUPABASE_URL` | Your Supabase connection string | `https://xyz.supabase.co` |
| `SUPABASE_ANON_KEY` | Public access key for the table | `eyJ...` |

## Deployment Checks
1. Once deployed, visit your `.vercel.app` URL.
2. Ensure the metric cards are calculating (verifies the `/api/sales` connection to Supabase).
3. Click "Synthesize Insights". If insights populate, the server-side Gemini connection (`/api/insights`) is fully verified.

You are now in full production mode. 🚀
