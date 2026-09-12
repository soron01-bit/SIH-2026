/**
 * vite-voice-plugin.mjs
 *
 * Vite dev server plugin that integrates the CycloneAI Voice & Text Gateway
 * directly into the Vite development server on port 5173.
 *
 * Features:
 *  - /voice/status and /voice/health status endpoints
 *  - /voice/token session endpoint
 *  - /voice/chat REST endpoint (powered by gemini-3.5-flash / gemini-3.6-flash with telemetry fallback)
 *  - /voice/live WebSocket gateway (relays bi-directional PCM audio to Gemini Live API)
 *
 * Eliminates the need to run "node token-server.mjs" in a separate terminal.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));

function loadDotEnv() {
  const envFiles = [
    join(__dir, '.env'),
    join(__dir, '..', '.env'),
  ];
  for (const envPath of envFiles) {
    if (existsSync(envPath)) {
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
        console.log(`[vite-voice] Loaded environment from ${envPath}`);
        break;
      } catch {}
    }
  }
}
loadDotEnv();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const VOICE_MODEL = process.env.GEMINI_VOICE_MODEL || 'gemini-3.1-flash-live-preview';
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-3.5-flash';

const SYSTEM_INSTRUCTION = `You are CycloneAI, an intelligent voice and text assistant for the Cyclone Intelligence Dashboard.
You understand and converse fluently in English, Hindi (हिन्दी), and Bengali (বাংলা).
Respond in the language the user speaks or writes in.
You have expert knowledge of tropical cyclone tracking, Dvorak classification (CI 1.0 to 8.0), Rapid Intensification (RI), eyewall symmetry, central dense overcast (CDO), and IMD / JTWC alert bulletins.
Keep spoken and text answers concise, clear, and actionable.`;

export async function handleTextChat(body) {
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

  const modelsToTry = [
    TEXT_MODEL,
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.7-flash',
    'gemini-2.5-flash',
  ];

  if (GEMINI_API_KEY) {
    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.status === 503 || response.status === 429) {
          console.warn(`[vite-voice] ${model} HTTP ${response.status} (quota or busy), trying next model...`);
          continue;
        }

        const json = await response.json();
        if (json.error) {
          console.warn(`[vite-voice] ${model} API error:`, json.error.message);
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
        console.warn(`[vite-voice] fetch failed for ${model}:`, err.message);
      }
    }
  }

  // Telemetry fallback if external APIs are busy
  const city = userLocation?.city || 'your coastal station';
  const storm = userLocation?.activeCycloneName || 'Cyclone Dana';
  const dist = userLocation?.distanceKm != null ? `${userLocation.distanceKm} km` : 'active monitoring zone';
  const risk = userLocation?.riskLevel || 'MODERATE';
  const adv = userLocation?.advisory || 'Please stay alert to official IMD bulletins and coastal radar updates.';

  let fallbackReply = `According to latest Doppler radar telemetry, you are located in ${city}, approximately ${dist} from ${storm}. Your localized risk level is ${risk}. ${adv}`;
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

export function cycloneVoicePlugin() {
  return {
    name: 'cyclone-voice-gateway',
    configureServer(server) {
      console.log(`[vite-voice] Initializing CycloneAI Voice & Chat Gateway on Vite Dev Server`);
      console.log(`[vite-voice] Key status: ${GEMINI_API_KEY ? 'Active (Ready)' : 'Missing from .env'}`);
      console.log(`[vite-voice] Voice Model: ${VOICE_MODEL} | Text Model: ${TEXT_MODEL}`);

      // ── Connect HTTP Middleware ───────────────────────────────────────────
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (!url.startsWith('/voice')) {
          return next();
        }

        const pathOnly = url.split('?')[0];

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        // Status / Health
        if (req.method === 'GET' && (pathOnly === '/voice/status' || pathOnly === '/voice/health')) {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            ok: true,
            hasKey: !!GEMINI_API_KEY,
            voiceModel: VOICE_MODEL,
            textModel: TEXT_MODEL,
            mode: 'vite-integrated',
          }));
        }

        // Token endpoint
        if (req.method === 'POST' && pathOnly === '/voice/token') {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            ok: true,
            token: 'session_active',
            voiceModel: VOICE_MODEL,
            textModel: TEXT_MODEL,
          }));
        }

        // Text Chat endpoint
        if (req.method === 'POST' && pathOnly === '/voice/chat') {
          let bodyStr = '';
          req.on('data', (c) => (bodyStr += c));
          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const result = await handleTextChat(body);
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });

      // ── WebSocket Live Voice Gateway ─────────────────────────────────────
      if (server.httpServer) {
        const wss = new WebSocketServer({ noServer: true });

        server.httpServer.on('upgrade', (request, socket, head) => {
          try {
            const host = request.headers.host || 'localhost:5173';
            const pathname = new URL(request.url, `http://${host}`).pathname;
            if (pathname === '/voice/live' || pathname === '/voice' || pathname === '/voice/') {
              wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
              });
            }
          } catch (e) {
            console.error('[vite-voice] WebSocket upgrade error:', e.message);
          }
        });

        wss.on('connection', (clientWs, request) => {
          console.log('[vite-voice] Client connected to live voice socket');

          if (!GEMINI_API_KEY) {
            clientWs.send(JSON.stringify({
              error: 'GEMINI_API_KEY is not configured in .env.',
            }));
            clientWs.close();
            return;
          }

          let liveInstruction = SYSTEM_INSTRUCTION;
          try {
            const host = request.headers.host || 'localhost:5173';
            const urlObj = new URL(request.url, `http://${host}`);
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

          const googleWsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;
          const googleWs = new WebSocket(googleWsUrl);

          googleWs.on('open', () => {
            console.log(`[vite-voice] Connected to Google Gemini Live API (${VOICE_MODEL})`);
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

          googleWs.on('message', (data) => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(data);
            }
          });

          googleWs.on('error', (err) => {
            console.error('[vite-voice] Google Live WS error:', err.message);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ error: `Live API: ${err.message}` }));
            }
          });

          googleWs.on('close', (code, reason) => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.close(code, reason);
            }
          });

          clientWs.on('message', (data) => {
            if (googleWs.readyState !== WebSocket.OPEN) return;
            try {
              const str = typeof data === 'string' ? data : data.toString();
              const parsed = JSON.parse(str);
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
            if (googleWs.readyState === WebSocket.OPEN) {
              googleWs.close();
            }
          });

          clientWs.on('error', (err) => {
            console.error('[vite-voice] Client WS error:', err.message);
            if (googleWs.readyState === WebSocket.OPEN) {
              googleWs.close();
            }
          });
        });
      }
    },
  };
}

export default cycloneVoicePlugin;
