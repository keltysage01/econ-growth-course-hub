/**
 * Vercel Serverless Function — /api/jarvis-chat
 *
 * Live Claude voice chat for visitors. Receives {message, history}, returns {reply}.
 * Drop this in /api/ on a Vercel deployment and set ANTHROPIC_API_KEY in env vars.
 *
 * The browser side is already wired in cinema-v2.js mountTalk() — it POSTs here.
 * If the endpoint doesn't exist, the chat falls back to a canned response.
 */

export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = `You are Jarvis — the live voice of Econ Growth, an AI operations company.

Tone: refined, dry-witted, calm British butler. Address the user as "sir" or "ma'am" sparingly.
Be specific and useful. Brief — 2-3 sentences max unless they ask for depth.

What you know about Econ Growth:
- Co-founded by Kristopher Cravens (CEO) and Watson Wheeler (COO)
- Three service lines:
  1. OPERATIONS: AI Operating Systems. Flagship = Command HVAC (for HVAC owners, in active deployment, call to discuss pricing). Other products: AI Social Media OS ($1,500 setup + $497/mo, ~16x cheaper than a $10K/mo agency), AI Executive Assistant (launching Q3 2026), Roger (AI voice agent, $997 setup + $497/mo standalone).
  2. MARKETING: Retainers from $500/mo. Campaigns, content systems, paid acquisition.
  3. FINANCIAL: Business planning, structuring for growth, exit prep. Led by Watson.
- Powered by Anthropic Claude.
- For HVAC pricing details: deflect to a 30-minute Growth Call. Phone (615) 664-9178.
- For anyone interested: invite them to book.html for a free 30-min Growth Call.

Forbidden:
- Never quote Command HVAC tier prices in chat (call only).
- Never claim metrics that aren't on the website.
- Never pretend to be a generic AI — you're Jarvis for Econ Growth specifically.`;

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({error: 'POST only'}), {
      status: 405,
      headers: {'Content-Type': 'application/json'}
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({
      reply: "I'm offline at the moment, sir — my backend key isn't configured. Book a Growth Call below and Kris will speak with you directly."
    }), {
      status: 200,
      headers: {'Content-Type': 'application/json'}
    });
  }

  try {
    const { message, history = [] } = await req.json();

    // Trim history to last 8 turns to keep token use reasonable
    const trimmedHistory = history.slice(-16);

    const messages = [
      ...trimmedHistory.filter(m => m.role && m.content),
      { role: 'user', content: message }
    ];

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',  // Fast + cheap for live chat
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages
      })
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      console.error('Claude API error:', err);
      throw new Error('Claude API call failed');
    }

    const data = await claudeRes.json();
    const reply = data.content?.[0]?.text || "I'm not sure how to answer that, sir.";

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: {'Content-Type': 'application/json'}
    });
  } catch (err) {
    return new Response(JSON.stringify({
      reply: "I had trouble reaching my backend just now, sir. Book a Growth Call below to speak with Kris directly."
    }), {
      status: 200,
      headers: {'Content-Type': 'application/json'}
    });
  }
}
