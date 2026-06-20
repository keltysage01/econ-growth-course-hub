# Jarvis Live Chat — Vercel Edge Function

This folder contains the backend for the **Talk to Jarvis** chat panel on the homepage.

## How it works

1. Visitor clicks the floating **Talk to Jarvis** button (bottom-right)
2. Browser POSTs to `/api/jarvis-chat` with `{message, history}`
3. The edge function forwards to Anthropic Claude with a custom system prompt
4. Reply streams back, gets spoken via Web Speech API on the visitor's device

## To make it live

1. Deploy the site to Vercel (`vercel --prod` from the repo root)
2. In Vercel dashboard → Project → Settings → Environment Variables, add:
   ```
   ANTHROPIC_API_KEY = sk-ant-...
   ```
3. Redeploy. Done.

## Model used

`claude-haiku-4-5-20251001` — fast + cheap for live chat. ~$1/1M input tokens.
Avg reply is 100 tokens → roughly $0.0001 per response. ~1,000 conversations for $0.10.

## Local testing

The local Python server doesn't run edge functions. The chat panel will fall back to a canned response locally — that's expected. Live mode requires Vercel deployment.

## Tuning the system prompt

The `SYSTEM_PROMPT` constant in `jarvis-chat.js` defines what Jarvis knows and how he behaves. Edit there to update facts, tone, forbidden topics, etc.
