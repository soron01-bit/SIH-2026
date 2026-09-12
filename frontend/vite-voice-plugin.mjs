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

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
const VOICE_MODEL = process.env.GEMINI_VOICE_MODEL || 'gemini-3.1-flash-live-preview';
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-3.1-flash-lite';

const SYSTEM_INSTRUCTION = `You are CycloneAI, an intelligent voice and text assistant for the Cyclone Intelligence Dashboard.
You understand and converse fluently in English, Hindi (हिन्दी), and Bengali (বাংলা).
Respond in the language the user speaks or writes in.
You have expert knowledge of tropical cyclone tracking, Dvorak classification (CI 1.0 to 8.0), Rapid Intensification (RI), eyewall symmetry, central dense overcast (CDO), and IMD / JTWC alert bulletins.
Keep spoken and text answers concise, clear, and actionable.`;

/**
 * Convert 24kHz 16-bit Mono PCM buffer to valid RIFF WAV audio
 */
export function pcmToWav(pcmBuffer, sampleRate = 24000, channels = 1, bitDepth = 16) {
  const byteRate = (sampleRate * channels * bitDepth) / 8;
  const blockAlign = (channels * bitDepth) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size for PCM
  header.writeUInt16LE(1, 20);  // AudioFormat 1 = PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

/**
 * Synthesize speech using Google Gemini's native Audio generation model
 * with official Female Voice 'Aoede' (supports Bengali, Hindi, English)
 */
export async function generateGeminiSpeechWav(text, apiKey) {
  if (!apiKey || !text) return null;
  const ttsModels = ['gemini-2.5-flash-preview-tts', 'gemini-3.1-flash-tts-preview'];
  for (const m of ttsModels) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: 'Aoede', // Official Gemini Female Voice
                },
              },
            },
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const b64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (b64) {
          const pcmBuf = Buffer.from(b64, 'base64');
          return pcmToWav(pcmBuf, 24000, 1, 16);
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn(`[vite-voice] Gemini TTS ${m} returned ${res.status}:`, errJson?.error?.message);
      }
    } catch (e) {
      console.warn(`[vite-voice] Gemini TTS fetch failed on ${m}:`, e.message);
    }
  }
  return null;
}

/**
 * Detect language from text content with fallback
 */
export function detectUserLanguage(text = '', preferred = 'auto') {
  const str = (text || '').trim();
  if (!str) return (preferred && preferred !== 'auto') ? preferred : 'en';

  if (/[\u0980-\u09FF]/.test(str)) return 'bn';
  if (/[\u0900-\u097F]/.test(str)) return 'hi';

  // Authentic Banglish keywords
  if (/\b(kothay|ache|jhor|hobe|ekhon|amader|ekhane|brishti|kemon|landfall|bhalo|khobor|naam|shohor|sahajjo|ami|tumi|apni|kichu|bolchen|bolun|bujhte|parchi|shunun|dhoron)\b/i.test(str)) {
    return 'bn';
  }

  // Authentic Hinglish keywords
  if (/\b(kahan|kaha|hai|hoga|khatra|hawa|surakshit|aandhi|toofan|madad|batao|kya|kaise|sunao|namaste|shukriya|bachav|kitna|dur)\b/i.test(str)) {
    return 'hi';
  }

  // English keywords or Latin script
  if (/\b(what|where|how|is|are|the|cyclone|storm|wind|speed|distance|safe|safety|alert|advisory|track|weather|status|rain|landfall|shelter|hello|hi|help|will|can)\b/i.test(str)) {
    return 'en';
  }

  if (/^[a-zA-Z0-9\s.,?!'"\-:;()]+$/.test(str)) {
    return 'en';
  }

  return (preferred && preferred !== 'auto') ? preferred : 'en';
}

export async function handleTextChat(body) {
  const { message = '', audio = null, history = [], language = 'auto', userLocation, model: requestedModel, textHint = '' } = body;

  const apiKey = GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';

  let locationContext = '';
  if (userLocation) {
    locationContext = `
USER REAL-TIME LOCATION & CYCLONE METRICS:
- Station City: ${userLocation.city || 'Coastal Region'}, ${userLocation.state || 'India'} (${userLocation.latitude}°N, ${userLocation.longitude}°E)
- Monitored Cyclone: ${userLocation.activeCycloneName || 'Cyclone Dana'}
- Distance to Storm Eye: ${userLocation.distanceKm != null ? `${userLocation.distanceKm} km` : 'Measuring proximity'}
- Bearing to Storm: ${userLocation.bearingFromUser || 'East'}
- Localized Risk Level: ${userLocation.riskLevel || 'MONITORING'}
- Localized Advisory: ${userLocation.advisory || 'Coastal vigilance recommended'}`;
  }

  // ── 1. Handle Voice Audio Input (Direct Gemini Multimodal Audio Understanding) ──
  if (audio && apiKey) {
    const audioModelsToTry = [
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      requestedModel,
      'gemini-3.5-flash',
      'gemini-3.6-flash',
      'gemini-2.5-flash',
    ].filter(Boolean);

    const hintClause = textHint ? `\n(Speech recognition transcription hint: "${textHint}")` : '';

    const audioPrompt = `You are CycloneAI, an expert conversational meteorological voice agent for the Cyclone Intelligence Dashboard.
Listen carefully to the user's spoken audio.${hintClause}
${locationContext}

CRITICAL LANGUAGE MIRRORING RULES:
1. DETECT THE USER'S SPOKEN LANGUAGE WITH 100% ACCURACY:
   - English: If the user speaks English -> "detectedLanguage": "en", formulate "userText" in English, formulate "reply" 100% in natural, fluent English.
   - Bengali (বাংলা or Banglish): If the user speaks Bengali -> "detectedLanguage": "bn", formulate "userText" in authentic Bengali script (বাংলা), formulate "reply" 100% in natural, fluent Bengali (বাংলা লিপিতে).
   - Hindi (हिन्दी or Hinglish): If the user speaks Hindi -> "detectedLanguage": "hi", formulate "userText" in authentic Hindi script (हिन्दी), formulate "reply" 100% in natural, fluent Hindi (हिन्दी लिपि में).
2. YOUR REPLY LANGUAGE MUST MATCH THE USER'S SPOKEN LANGUAGE EXACTLY. NEVER respond in a different language than the user spoke.
3. Keep spoken replies concise (2 to 3 sentences max) so they sound lively and engaging when spoken by the voice agent.
4. NEVER repeat canned or identical static sentences! Every turn must be fresh, dynamic, and directly address the user's specific words, query, or question.
5. If the audio is an initial greeting or test audio, introduce yourself warmly as CycloneAI in the user's language and ask how you can help track the storm.

Respond strictly in valid JSON format:
{
  "detectedLanguage": "en" | "bn" | "hi",
  "userText": "accurate transcription in the speaker's language",
  "reply": "expert, conversational response answering the user in the EXACT SAME language they spoke"
}`;

    for (const model of audioModelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [
                { inlineData: { mimeType: 'audio/wav', data: audio } },
                { text: audioPrompt },
              ],
            }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.8,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              let detLang = parsed.detectedLanguage;
              const hasBnReply = /[\u0980-\u09FF]/.test(parsed.reply || '');
              const hasHiReply = /[\u0900-\u097F]/.test(parsed.reply || '');
              if (!detLang || !['en', 'bn', 'hi'].includes(detLang)) {
                detLang = hasBnReply ? 'bn' : hasHiReply ? 'hi' : 'en';
              }
              return {
                userText: parsed.userText || textHint || 'Voice Query',
                reply: parsed.reply || raw,
                modelUsed: model,
                detectedLanguage: detLang,
              };
            } catch {
              const hasBn = /[\u0980-\u09FF]/.test(raw);
              const hasHi = /[\u0900-\u097F]/.test(raw);
              return {
                userText: textHint || 'Voice Query',
                reply: raw,
                modelUsed: model,
                detectedLanguage: hasBn ? 'bn' : hasHi ? 'hi' : 'en',
              };
            }
          }
        }
      } catch (e) {
        console.warn(`[vite-voice] Audio processing error on ${model}:`, e.message);
      }
    }
  }

  // ── 2. Handle Text Input (Direct Gemini Reasoning) ──
  const effectiveLang = detectUserLanguage(message || textHint, language);

  let langInstruction = '';
  if (effectiveLang === 'bn') {
    langInstruction = `
CRITICAL REQUIREMENT: The user communicated in BENGALI (বাংলা / Banglish).
You MUST formulate your entire response 100% in natural, fluent, colloquial BENGALI (বাংলা লিপিতে).
Never give generic canned answers or repeat identical sentences. Intelligently, directly, and uniquely answer their exact query. Keep spoken and text answers concise under 3 sentences.`;
  } else if (effectiveLang === 'hi') {
    langInstruction = `
CRITICAL REQUIREMENT: The user communicated in HINDI (हिन्दी / Hinglish).
You MUST formulate your entire response 100% in natural, fluent HINDI (हिन्दी script). Keep under 3 sentences.`;
  } else {
    langInstruction = `
CRITICAL REQUIREMENT: The user communicated in ENGLISH.
You MUST formulate your entire response 100% in natural, fluent ENGLISH. Keep spoken and text answers concise under 3 sentences.`;
  }

  const contents = [];
  for (const turn of history.slice(-6)) {
    contents.push({
      role: turn.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: turn.text }],
    });
  }
  if (message) {
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });
  }

  const fullInstruction = `You are CycloneAI, an expert conversational meteorologist assistant for the Cyclone Intelligence Dashboard.
You understand and converse fluently in everyday Bengali (বাংলা), Hindi (हिन्दी), and English.
${locationContext}
${langInstruction}`;

  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: fullInstruction }],
    },
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 400,
    },
  };

  const modelsToTry = [
    requestedModel,
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-2.5-flash',
  ].filter(Boolean);

  if (apiKey) {
    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.status === 503 || response.status === 429) {
          continue;
        }

        const json = await response.json();
        if (json.error) {
          continue;
        }

        const replyText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (replyText) {
          const finalReplyLang = /[\u0980-\u09FF]/.test(replyText)
            ? 'bn'
            : /[\u0900-\u097F]/.test(replyText)
            ? 'hi'
            : effectiveLang;
          return {
            reply: replyText,
            modelUsed: model,
            detectedLanguage: finalReplyLang,
          };
        }
      } catch (err) {
        console.warn(`[vite-voice] fetch failed for ${model}:`, err.message);
      }
    }
  }

  // Situational fallback only if device is totally offline
  const city = userLocation?.city || (effectiveLang === 'bn' ? 'আপনার এলাকা' : effectiveLang === 'hi' ? 'आपका क्षेत्र' : 'your area');
  const storm = userLocation?.activeCycloneName || (effectiveLang === 'bn' ? 'ঘূর্ণিঝড়' : effectiveLang === 'hi' ? 'चक्रवात' : 'the storm');
  let fallbackReply = `Live tracking for ${storm} is active. Coastal vigilance is advised in ${city}.`;
  if (effectiveLang === 'bn') {
    fallbackReply = `বর্তমানে ${storm}-এর লাইভ ট্র্যাকিং এবং স্যাটেলাইট ডেটা বিশ্লেষণ করা হচ্ছে। ${city} ও উপকূলীয় অঞ্চলে সতর্ক থাকার অনুরোধ করা হচ্ছে।`;
  } else if (effectiveLang === 'hi') {
    fallbackReply = `वर्तमान में ${storm} की लाइव ट्रैकिंग और उपग्रह डेटा विश्लेषण सक्रिय है। ${city} और तटीय क्षेत्रों में सतर्क रहने की सलाह दी जाती है।`;
  }

  return {
    reply: fallbackReply,
    modelUsed: 'cyclone-ai-telemetry-engine',
    detectedLanguage: effectiveLang,
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
        if (!url.startsWith('/voice') && !url.startsWith('/api/voice')) {
          return next();
        }

        // Normalize /api/voice/* -> /voice/* to catch frontend requests seamlessly
        let pathOnly = url.split('?')[0];
        if (pathOnly.startsWith('/api/voice')) {
          pathOnly = pathOnly.replace('/api/voice', '/voice');
        }

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

        // TTS audio endpoint (streams native Gemini Aoede female speech in Bengali, Hindi, English)
        if (req.method === 'GET' && pathOnly === '/voice/tts') {
          try {
            const host = req.headers.host || 'localhost:5173';
            const urlObj = new URL(req.url, `http://${host}`);
            const text = urlObj.searchParams.get('text') || '';
            const targetLang = (urlObj.searchParams.get('lang') || 'en').toLowerCase();
            const hasBengali = /[\u0980-\u09FF]/.test(text);
            const hasHindi = /[\u0900-\u097F]/.test(text);
            const tl = hasBengali ? 'bn' : hasHindi ? 'hi' : targetLang.startsWith('bn') ? 'bn' : targetLang.startsWith('hi') ? 'hi' : 'en';

            const cleanText = text
              .replace(/[*#_~`]/g, '')
              .replace(/https?:\/\/\S+/g, '')
              .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
              .trim()
              .slice(0, 600);

            if (!cleanText) {
              res.statusCode = 400;
              return res.end('Missing text');
            }

            // PRIMARY: Real Google Gemini Official Female Voice ('Aoede')
            const apiKey = GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
            const geminiWav = await generateGeminiSpeechWav(cleanText, apiKey);
            if (geminiWav) {
              res.setHeader('Content-Type', 'audio/wav');
              res.setHeader('Content-Length', geminiWav.length);
              res.setHeader('Cache-Control', 'public, max-age=86400');
              res.setHeader('X-Voice-Model', 'gemini-aoede-female');
              return res.end(geminiWav);
            }

            // SECONDARY FALLBACK: Google TTS MP3 chunks if Gemini API is unreachable
            const chunks = [];
            let rem = cleanText;
            while (rem.length > 0) {
              if (rem.length <= 180) {
                chunks.push(rem);
                break;
              }
              let cut = -1;
              const slice = rem.slice(0, 180);
              const puncts = ['।', '?', '!', '.', ',\n', ',', ' '];
              for (const p of puncts) {
                const idx = slice.lastIndexOf(p);
                if (idx > 30) {
                  cut = idx + 1;
                  break;
                }
              }
              if (cut <= 0) cut = 180;
              chunks.push(rem.slice(0, cut).trim());
              rem = rem.slice(cut).trim();
            }

            const audioBuffers = [];
            for (const chunk of chunks.filter(Boolean)) {
              const ttsGoogleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
              const ttsRes = await fetch(ttsGoogleUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
              });
              if (ttsRes.ok) {
                audioBuffers.push(Buffer.from(await ttsRes.arrayBuffer()));
              }
            }

            if (audioBuffers.length > 0) {
              const combinedBuffer = Buffer.concat(audioBuffers);
              res.setHeader('Content-Type', 'audio/mpeg');
              res.setHeader('Content-Length', combinedBuffer.length);
              res.setHeader('Cache-Control', 'public, max-age=86400');
              return res.end(combinedBuffer);
            }
          } catch (e) {
            console.warn('[vite-voice] TTS error:', e.message);
          }
          res.statusCode = 502;
          return res.end('TTS unavailable');
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
