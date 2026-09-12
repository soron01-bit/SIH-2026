/**
 * Vercel Serverless Function: /api/voice/tts
 * High-fidelity Text-To-Speech powered by Google Gemini Aoede female voice
 * with fallback for Bengali, Hindi, and English.
 */

function pcmToWav(pcmBuffer, sampleRate = 24000, channels = 1, bitDepth = 16) {
  const byteRate = (sampleRate * channels * bitDepth) / 8;
  const blockAlign = (channels * bitDepth) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

async function generateGeminiSpeechWav(text, apiKey) {
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
      }
    } catch (e) {
      console.warn(`[Vercel TTS] Gemini TTS ${m} error:`, e.message);
    }
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const text = (req.query?.text || '').trim();
  const lang = (req.query?.lang || 'en').trim().toLowerCase();
  const hasBengali = /[\u0980-\u09FF]/.test(text);
  const hasHindi = /[\u0900-\u097F]/.test(text);
  const tl = hasBengali ? 'bn' : hasHindi ? 'hi' : lang.startsWith('bn') ? 'bn' : lang.startsWith('hi') ? 'hi' : 'en';

  const clean = text
    .replace(/[*#_~`]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()
    .slice(0, 600);

  if (!clean) {
    return res.status(400).send('Missing text');
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  // PRIMARY: Real Google Gemini Official Female Voice ('Aoede')
  try {
    const geminiWav = await generateGeminiSpeechWav(clean, apiKey);
    if (geminiWav) {
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Length', geminiWav.length);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('X-Voice-Model', 'gemini-aoede-female');
      return res.status(200).send(geminiWav);
    }
  } catch (e) {
    console.warn('[Vercel TTS] Gemini error:', e.message);
  }

  // SECONDARY FALLBACK: Google TTS MP3 chunks
  try {
    const chunks = [];
    let rem = clean;
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
      const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
      const upstream = await fetch(googleUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      if (upstream.ok) {
        audioBuffers.push(Buffer.from(await upstream.arrayBuffer()));
      }
    }

    if (audioBuffers.length > 0) {
      const combinedBuffer = Buffer.concat(audioBuffers);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', combinedBuffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.status(200).send(combinedBuffer);
    }
  } catch (err) {
    console.warn('[Vercel TTS] Google TTS failed:', err.message);
  }

  return res.status(502).send('TTS upstream unavailable');
}
