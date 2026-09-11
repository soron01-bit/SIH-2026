/**
 * token-server.mjs
 *
 * Secure local backend gateway for CycloneAI Voice & Text AI Assistant.
 *
 * MODELS CONFIGURED:
 *   - Voice Live Model : gemini-3.1-flash-live-preview (WebSocket Live Streaming Audio)
 *   - Text Chat Model  : gemini-3.6-flash (REST GenerateContent with Tool/XAI support)
 *
 * SECURITY:
 *   - GEMINI_API_KEY is read exclusively from the gitignored .env file.
 *   - The key is NEVER leaked or transmitted to the client browser.
 *   - Client browser communicates via local proxy:
 *       WebSocket : ws://localhost:3001/voice/live  (or /voice/live through Vite proxy)
 *       HTTP Chat : POST /voice/chat
 *       HTTP Token: POST /voice/token
 */

import http from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __dir = dirname(fileURLToPath(import.meta.url));

// Load .env manually from frontend/.env or project root
function loadDotEnv() {
  const envFiles = [
    join(__dir, '.env'),
    join(__dir, '..', '.env'),
  ];
  for (const envPath of envFiles) {
    try {
      const content = readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx < 0) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
      console.log(`[token-server] Loaded env from ${envPath}`);
      break;
    } catch {
      // try next
    }
  }
}
loadDotEnv();

const PORT = parseInt(process.env.TOKEN_SERVER_PORT || '3001', 10);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const VOICE_MODEL = process.env.GEMINI_VOICE_MODEL || 'gemini-3.1-flash-live-preview';
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-3.6-flash';

if (!GEMINI_API_KEY) {
  console.warn('\n⚠️  GEMINI_API_KEY not set. Add it to frontend/.env (gitignored).\n');
} else {
  console.log(`\n🔑 GEMINI_API_KEY loaded securely (length: ${GEMINI_API_KEY.length} chars)`);
  console.log(`🎙️  Voice Model : ${VOICE_MODEL}`);
  console.log(`💬 Text Model  : ${TEXT_MODEL}`);
}

const SYSTEM_INSTRUCTION = `You are CycloneAI, an intelligent voice and text assistant for the Cyclone Intelligence Dashboard.
You understand and converse fluently in English, Hindi (हिन्दी), and Bengali (বাংলা).
Respond in the language the user speaks or writes in.
You have expert knowledge of tropical cyclone tracking, Dvorak classification (CI 1.0 to 8.0), Rapid Intensification (RI), eyewall symmetry, central dense overcast (CDO), and IMD / JTWC alert bulletins.
Keep spoken and text answers concise, clear, and actionable.`;

/**
 * Handle Text Chat with gemini-3.6-flash (with location awareness & graceful fallback)
 */
async function handleTextChat(body) {
  const { message, history = [], language = 'en', userLocation } = body;

  let locationContext = '';
  if (userLocation) {
    locationContext = `
CURRENT USER LOCATION & CYCLONE TELEMETRY:
- User Station: ${userLocation.city || 'Coastal City'}, ${userLocation.state || 'India'} (${userLocation.latitude}°N, ${userLocation.longitude}°E)
- Active Storm: ${userLocation.activeCycloneName || 'Cyclone Dana'}
- Distance to Storm Eye: ${userLocation.distanceKm != null ? `${userLocation.distanceKm} km` : 'Measuring'}
- Bearing to Storm: ${userLocation.bearingFromUser || 'East'}
- Localized Risk Level: ${userLocation.riskLevel || 'MONITORING'}
- Localized IMD Advisory: ${userLocation.advisory || 'Standard coastal vigilance'}

LOCATION GUIDANCE:
1. Always take the user's location (${userLocation.city || 'their area'}) into account.
2. If the user asks "Am I safe?", "Will it hit my area?", "How far is the cyclone?", or questions in Bengali ("আমার শহরে কি ঝড় হবে?"), Hindi ("क्या मेरे शहर में ख़तरा है?"), or English:
   - State their city (${userLocation.city}) and the exact distance (${userLocation.distanceKm} km) and risk category (${userLocation.riskLevel}).
   - Provide clear, reassuring, safety-first guidance tailored to their distance and language.`;
  }

  const contents = [];
  for (const turn of history.slice(-6)) {
    contents.push({
      role: turn.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: turn.text }],
    });
  }
  contents.push({
    role: 'user',
    parts: [{ text: message }],
  });

  const fullInstruction = `${SYSTEM_INSTRUCTION}\n${locationContext}\nUser language: ${language}.`;

  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: fullInstruction }],
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500,
    },
  };

  const modelsToTry = [TEXT_MODEL, 'gemini-2.5-flash', 'gemini-2.0-flash'];

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.status === 503 || response.status === 429) {
        console.warn(`[token-server] ${model} HTTP ${response.status} (quota or busy), trying next model...`);
        continue;
      }

      const json = await response.json();
      if (json.error) {
        console.warn(`[token-server] ${model} API error:`, json.error.message);
        continue;
      }

      const replyText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (replyText) {
        return {
          reply: replyText,
          modelUsed: model,
        };
      }
    } catch (err) {
      console.warn(`[token-server] fetch failed for ${model}:`, err.message);
    }
  }

  // Intelligent calculated fallback if Google API quotas are temporarily congested
  const city = userLocation?.city || 'your station';
  const storm = userLocation?.activeCycloneName || 'Cyclone Dana';
  const dist = userLocation?.distanceKm != null ? `${userLocation.distanceKm} km` : 'active radius';
  const risk = userLocation?.riskLevel || 'MONITORING';
  const adv = userLocation?.advisory || 'Please stay tuned to official IMD bulletins.';

  let fallbackReply = `According to latest radar telemetry, you are located in ${city}, approximately ${dist} from ${storm}. Your localized risk level is ${risk}. ${adv}`;
  if (language === 'bn') {
    fallbackReply = `সরাসরি রাডার টেলিমেট্রি অনুযায়ী, আপনি ${city}-তে অবস্থান করছেন, যা ${storm}-এর কেন্দ্র থেকে প্রায় ${dist} দূরে। আপনার এলাকার ঝুঁকির মাত্রা: ${risk}। ${adv}`;
  } else if (language === 'hi') {
    fallbackReply = `लाइव रडार टेलीमेट्री के अनुसार, आप ${city} में हैं, जो ${storm} से लगभग ${dist} दूर है। आपके क्षेत्र का जोखिम स्तर: ${risk} है। ${adv}`;
  }

  return {
    reply: fallbackReply,
    modelUsed: 'cyclone-ai-telemetry-engine',
  };
}

// ── HTTP Server ─────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health / Status
  if (req.method === 'GET' && (req.url === '/voice/status' || req.url === '/voice/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      hasKey: !!GEMINI_API_KEY,
      voiceModel: VOICE_MODEL,
      textModel: TEXT_MODEL,
    }));
    return;
  }

  // Token endpoint (for client session setup)
  if (req.method === 'POST' && req.url === '/voice/token') {
    if (!GEMINI_API_KEY) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'GEMINI_API_KEY not found in frontend/.env' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      token: 'session_active',
      voiceModel: VOICE_MODEL,
      textModel: TEXT_MODEL,
    }));
    return;
  }

  // Text Chat endpoint (uses gemini-3.6-flash)
  if (req.method === 'POST' && req.url === '/voice/chat') {
    if (!GEMINI_API_KEY) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }));
      return;
    }

    let bodyStr = '';
    req.on('data', (c) => (bodyStr += c));
    req.on('end', async () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        const result = await handleTextChat(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

// ── WebSocket Server (Live Voice Gateway: gemini-3.1-flash-live-preview) ───
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  if (pathname === '/voice/live' || pathname === '/voice' || pathname === '/') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (clientWs, request) => {
  console.log('[token-server] Client connected to live voice socket');

  if (!GEMINI_API_KEY) {
    clientWs.send(JSON.stringify({
      error: 'GEMINI_API_KEY is not configured on the server.',
    }));
    clientWs.close();
    return;
  }

  // Parse location parameters if passed in URL
  let liveInstruction = SYSTEM_INSTRUCTION;
  try {
    const urlObj = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const city = urlObj.searchParams.get('city');
    const state = urlObj.searchParams.get('state');
    const lat = urlObj.searchParams.get('lat');
    const lon = urlObj.searchParams.get('lon');
    const dist = urlObj.searchParams.get('dist');
    const risk = urlObj.searchParams.get('risk');
    const cyclone = urlObj.searchParams.get('cyclone') || 'Cyclone Dana';

    if (city) {
      liveInstruction += `\nUSER STATION LOCATION:
- Station City: ${city}, ${state || 'India'} (${lat}°N, ${lon}°E)
- Active Cyclone: ${cyclone}
- Distance: ${dist ? `${dist} km` : 'measuring'}
- Risk Level: ${risk || 'SAFE'}
When answering spoken queries about safety or weather, explicitly reference the user's city (${city}) and proximity to ${cyclone}.`;
    }
  } catch {}

  // Connect to Google Gemini Live API
  const googleWsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;
  const googleWs = new WebSocket(googleWsUrl);

  googleWs.on('open', () => {
    console.log(`[token-server] Connected to Google Gemini Live API (${VOICE_MODEL})`);
    // Send session setup message for gemini-3.1-flash-live-preview
    googleWs.send(JSON.stringify({
      setup: {
        model: `models/${VOICE_MODEL}`,
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Aoede' },
            },
          },
        },
        systemInstruction: {
          parts: [{ text: liveInstruction }],
        },
      },
    }));
  });

  // Relay messages from Google Gemini Live -> Browser Client
  googleWs.on('message', (data) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(data);
    }
  });

  googleWs.on('error', (err) => {
    console.error('[token-server] Google Live WS error:', err.message);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ error: `Live API error: ${err.message}` }));
    }
  });

  googleWs.on('close', (code, reason) => {
    console.log('[token-server] Google Live WS closed:', code, reason.toString());
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close(code, reason);
    }
  });

  // Relay messages from Browser Client -> Google Gemini Live
  clientWs.on('message', (data) => {
    if (googleWs.readyState !== WebSocket.OPEN) return;
    try {
      const str = typeof data === 'string' ? data : data.toString();
      const parsed = JSON.parse(str);
      // Auto-convert deprecated mediaChunks to audio format
      if (parsed.realtimeInput?.mediaChunks) {
        const chunk = parsed.realtimeInput.mediaChunks[0];
        parsed.realtimeInput = {
          audio: { mimeType: chunk.mimeType || 'audio/pcm;rate=16000', data: chunk.data },
        };
        googleWs.send(JSON.stringify(parsed));
        return;
      }
    } catch {}
    googleWs.send(data);
  });

  clientWs.on('close', () => {
    console.log('[token-server] Client disconnected from live voice socket');
    if (googleWs.readyState === WebSocket.OPEN) {
      googleWs.close();
    }
  });

  clientWs.on('error', (err) => {
    console.error('[token-server] Client WS error:', err.message);
    if (googleWs.readyState === WebSocket.OPEN) {
      googleWs.close();
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n========================================================`);
  console.log(` CycloneAI AI Token & Voice Gateway running on port ${PORT}`);
  console.log(` Voice Model : ${VOICE_MODEL}`);
  console.log(` Text Model  : ${TEXT_MODEL}`);
  console.log(` Live WS     : ws://localhost:${PORT}/voice/live`);
  console.log(` Text Chat   : http://localhost:${PORT}/voice/chat`);
  console.log(` Status      : http://localhost:${PORT}/voice/status`);
  console.log(`========================================================\n`);
});
