/**
 * Vercel Serverless Function: /api/voice/status (within frontend root)
 */

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const hasKey = !!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY);

  return res.status(200).json({
    ok: true,
    hasKey,
    voiceModel: process.env.GEMINI_VOICE_MODEL || 'gemini-3.1-flash-live-preview',
    textModel: process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash',
    platform: 'vercel-serverless',
    timestamp: new Date().toISOString(),
  });
}
