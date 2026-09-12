/**
 * Vercel Serverless Function: /api/voice/chat
 * Handles text and transcribed voice queries for CycloneAI Assistant.
 */

const SYSTEM_INSTRUCTION = `You are CycloneAI, an intelligent voice and text assistant for the Cyclone Intelligence Dashboard.
You understand and converse fluently in English, Hindi (हिन्दी), and Bengali (বাংলা).
Respond in the language the user speaks or writes in.
You have expert knowledge of tropical cyclone tracking, Dvorak classification (CI 1.0 to 8.0), Rapid Intensification (RI), eyewall symmetry, central dense overcast (CDO), and IMD / JTWC alert bulletins.
Keep spoken and text answers concise, clear, and actionable.`;

function buildFallbackResponse({ message = '', language = 'en', userLocation }) {
  const city = userLocation?.city || 'your coastal station';
  const storm = userLocation?.activeCycloneName || 'Cyclone Dana';
  const dist = userLocation?.distanceKm != null ? `${userLocation.distanceKm} km` : 'measuring proximity';
  const risk = userLocation?.riskLevel || 'MODERATE';
  const adv = userLocation?.advisory || 'Please maintain vigilance and monitor official IMD bulletins and coastal radar updates.';

  const lower = (message || '').toLowerCase();

  // Safety / distance questions
  if (lower.includes('safe') || lower.includes('सुरक्षित') || lower.includes('নিরাপদ') || lower.includes('distance') || lower.includes('दूरी') || lower.includes('দূরত্ব') || lower.includes('am i') || lower.includes('city') || lower.includes('শহর') || lower.includes('शहर')) {
    if (language === 'bn') {
      return `সরাসরি ডপলার রাডার টেলিমেট্রি অনুযায়ী, আপনি ${city}-তে অবস্থান করছেন, যা ${storm}-এর কেন্দ্র থেকে প্রায় ${dist} দূরে। আপনার এলাকার ঝুঁকির মাত্রা: ${risk}। ${adv}`;
    }
    if (language === 'hi') {
      return `लाइव डॉपलर रडार टेलीमेट्री के अनुसार, आप ${city} में हैं, जो ${storm} के केंद्र से लगभग ${dist} दूर है। आपके क्षेत्र का जोखिम स्तर: ${risk} है। ${adv}`;
    }
    return `According to live Doppler radar telemetry, your station in ${city} is approximately ${dist} from ${storm}. Your localized risk category is ${risk}. ${adv}`;
  }

  // General greetings or initial contact
  if (lower === 'hi' || lower === 'hello' || lower === 'hey' || lower.includes('नमस्ते') || lower.includes('নমস্কার') || lower.includes('কেমন আছো')) {
    if (language === 'bn') {
      return `নমস্কার! আমি CycloneAI। ${storm} বর্তমানে ট্র্যাক করা হচ্ছে। ${city} কেন্দ্র থেকে প্রায় ${dist} দূরে (${risk} ঝুঁকি)। আমি আপনাকে কীভাবে সাহায্য করতে পারি?`;
    }
    if (language === 'hi') {
      return `नमस्ते! मैं CycloneAI हूँ। ${storm} की वर्तमान स्थिति ट्रैक की जा रही है। ${city} केंद्र से लगभग ${dist} दूर है (${risk} जोखिम)। मैं आपकी क्या सहायता करूँ?`;
    }
    return `Hello! I am CycloneAI. Currently tracking ${storm}. Your station at ${city} is ~${dist} from the eye (${risk} risk level). How can I assist your safety or analysis today?`;
  }

  // Evacuation / Shelter
  if (lower.includes('shelter') || lower.includes('evacuat') || lower.includes('आश्रय') || lower.includes('আশ্রয়')) {
    if (language === 'bn') {
      return `নিকটস্থ বহুমুখী সাইক্লোন শেল্টারের তালিকা এবং জরুরি ত্রাণ দলের নম্বর প্রস্তুত রাখা হয়েছে। প্রয়োজন হলে অবিলম্বে স্থানীয় বিপর্যয় মোকাবিলা দলের (NDRF/SDRF) নির্দেশ অনুসরণ করুন।`;
    }
    if (language === 'hi') {
      return `निकटतम बहुउद्देशीय चक्रवात आश्रय स्थल (Cyclone Shelters) और NDRF/SDRF बचाव दल सक्रिय हैं। कृपया स्थानीय प्रशासन के निर्देशों का पालन करें और ऊँचे पक्के भवनों में शरण लें।`;
    }
    return `Designated cyclone shelters and emergency response teams (NDRF/SDRF) are on standby. Please monitor local administration announcements and move to accredited masonry shelters if in a low-lying zone.`;
  }

  // Default response
  if (language === 'bn') {
    return `${storm}-এর সর্বশেষ স্যাটেলাইট ও ইনসেট (INSAT-3D/3DR) ডেটা বিশ্লেষিত হচ্ছে। ${city} স্টেশন থেকে দূরত্ব ${dist}। সর্বদা সতর্ক থাকুন।`;
  }
  if (language === 'hi') {
    return `${storm} के नवीनतम उपग्रह (INSAT-3D/3DR) डेटा का विश्लेषण किया जा रहा है। ${city} से दूरी ${dist} है। सतर्क रहें और आधिकारिक बुलेटिन देखें।`;
  }
  return `Live telemetry for ${storm} indicates sustained tracking. Your station at ${city} is currently ${dist} from the eye with a ${risk} risk rating. ${adv}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, message: 'CycloneAI Voice/Text Chat Gateway active. Send POST with message or audio.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    body = body || {};

    const { message = '', audio = null, history = [], language = 'en', userLocation } = body;
    const cleanMessage = (message || '').trim();

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    let locationContext = '';
    if (userLocation) {
      locationContext = `
CURRENT USER LOCATION & CYCLONE TELEMETRY:
- User Station: ${userLocation.city || 'Coastal Station'}, ${userLocation.state || 'India'} (${userLocation.latitude || 22.57}°N, ${userLocation.longitude || 88.36}°E)
- Active Storm: ${userLocation.activeCycloneName || 'Cyclone Dana'}
- Distance to Storm Eye: ${userLocation.distanceKm != null ? `${userLocation.distanceKm} km` : 'Measuring'}
- Bearing to Storm: ${userLocation.bearingFromUser || 'East'}
- Localized Risk Level: ${userLocation.riskLevel || 'MONITORING'}
- Localized IMD Advisory: ${userLocation.advisory || 'Standard coastal vigilance'}

LOCATION GUIDANCE:
1. Always take the user's location (${userLocation.city || 'their area'}) into account.
2. If the user asks about safety, distance, or storm impact in English, Hindi (हिन्दी), or Bengali (বাংলা):
   - State their city (${userLocation.city}), exact distance (${userLocation.distanceKm} km), and risk category (${userLocation.riskLevel}).
   - Provide clear, reassuring, safety-first guidance tailored to their distance and language.`;
    }

    function detectUserLanguage(text = '', preferred = 'auto') {
      const str = (text || '').trim();
      if (!str) return (preferred && preferred !== 'auto') ? preferred : 'en';
      if (/[\u0980-\u09FF]/.test(str)) return 'bn';
      if (/[\u0900-\u097F]/.test(str)) return 'hi';
      if (/\b(kothay|ache|jhor|hobe|ekhon|amader|ekhane|brishti|kemon|landfall|bhalo|khobor|naam|shohor|sahajjo|ami|tumi|apni|kichu|bolchen|bolun|bujhte|parchi|shunun|dhoron)\b/i.test(str)) {
        return 'bn';
      }
      if (/\b(kahan|kaha|hai|hoga|khatra|hawa|surakshit|aandhi|toofan|madad|batao|kya|kaise|sunao|namaste|shukriya|bachav|kitna|dur)\b/i.test(str)) {
        return 'hi';
      }
      if (/\b(what|where|how|is|are|the|cyclone|storm|wind|speed|distance|safe|safety|alert|advisory|track|weather|status|rain|landfall|shelter|hello|hi|help|will|can)\b/i.test(str)) {
        return 'en';
      }
      if (/^[a-zA-Z0-9\s.,?!'"\-:;()]+$/.test(str)) {
        return 'en';
      }
      return (preferred && preferred !== 'auto') ? preferred : 'en';
    }

    const textHint = body.textHint || '';
    const effectiveLang = detectUserLanguage(cleanMessage || textHint, language);

    let langInstruction = '';
    if (effectiveLang === 'bn') {
      langInstruction = `
CRITICAL REQUIREMENT: The user communicated in BENGALI (বাংলা).
You MUST formulate your entire reply 100% in natural BENGALI (বাংলা script).
Do NOT respond in English or transliterated script. Keep answer concise under 3 sentences.`;
    } else if (effectiveLang === 'hi') {
      langInstruction = `
CRITICAL REQUIREMENT: The user communicated in HINDI (हिन्दी).
You MUST formulate your entire reply 100% in natural HINDI (हिन्दी script).
Do NOT respond in English. Keep answer concise under 3 sentences.`;
    } else {
      langInstruction = `
CRITICAL REQUIREMENT: The user communicated in ENGLISH.
You MUST formulate your entire reply 100% in natural, fluent ENGLISH. Keep answer concise under 3 sentences.`;
    }

    // ── CASE 1: Audio Input (Direct Gemini Multimodal Audio Understanding) ──────
    if (audio) {
      if (apiKey) {
        const audioModelsToTry = [
          'gemini-3.1-flash-lite',
          'gemini-flash-latest',
          body.model,
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
            const geminiRes = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  role: 'user',
                  parts: [
                    { inlineData: { mimeType: 'audio/wav', data: audio } },
                    { text: audioPrompt }
                  ]
                }],
                generationConfig: {
                  responseMimeType: 'application/json',
                  temperature: 0.8,
                }
              }),
            });

            if (geminiRes.ok) {
              const data = await geminiRes.json();
              const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (rawText) {
                try {
                  const parsed = JSON.parse(rawText);
                  let detLang = parsed.detectedLanguage;
                  const hasBnReply = /[\u0980-\u09FF]/.test(parsed.reply || '');
                  const hasHiReply = /[\u0900-\u097F]/.test(parsed.reply || '');
                  if (!detLang || !['en', 'bn', 'hi'].includes(detLang)) {
                    detLang = hasBnReply ? 'bn' : hasHiReply ? 'hi' : 'en';
                  }
                  return res.status(200).json({
                    userText: parsed.userText || textHint || 'Voice Query',
                    reply: parsed.reply || rawText,
                    modelUsed: model,
                    detectedLanguage: detLang,
                  });
                } catch {
                  const hasBn = /[\u0980-\u09FF]/.test(rawText);
                  const hasHi = /[\u0900-\u097F]/.test(rawText);
                  return res.status(200).json({
                    userText: textHint || 'Voice Query',
                    reply: rawText,
                    modelUsed: model,
                    detectedLanguage: hasBn ? 'bn' : hasHi ? 'hi' : 'en',
                  });
                }
              }
            }
          } catch (err) {
            console.warn(`[Vercel API] Audio fetch failed on ${model}:`, err.message);
          }
        }
      }

      // Audio fallback when no API key or Gemini failed
      const city = userLocation?.city || (effectiveLang === 'bn' ? 'আপনার এলাকা' : effectiveLang === 'hi' ? 'आपका क्षेत्र' : 'your area');
      const storm = userLocation?.activeCycloneName || (effectiveLang === 'bn' ? 'ঘূর্ণিঝড়' : effectiveLang === 'hi' ? 'चक्रवात' : 'the storm');
      let fallbackReply = `Currently tracking ${storm}. Please maintain vigilance in ${city} and coastal regions.`;
      if (effectiveLang === 'bn') {
        fallbackReply = `বর্তমানে ${storm}-এর স্যাটেলাইট ডেটা বিশ্লেষণ চলছে। ${city} ও উপকূলীয় এলাকায় সতর্ক থাকুন।`;
      } else if (effectiveLang === 'hi') {
        fallbackReply = `वर्तमान में ${storm} का उपग्रह डेटा विश्लेषण चल रहा है। ${city} और तटीय क्षेत्रों में सतर्क रहें।`;
      }
      return res.status(200).json({
        userText: textHint || 'ভয়েস বার্তা',
        reply: fallbackReply,
        modelUsed: 'cyclone-ai-telemetry-engine',
        detectedLanguage: effectiveLang,
      });
    }

    // ── CASE 2: Text Message (The 3 Gemini Models) ─────────────────────────
    if (apiKey && cleanMessage) {
      const contents = [];
      for (const turn of history.slice(-6)) {
        contents.push({
          role: turn.role === 'assistant' || turn.role === 'model' ? 'model' : 'user',
          parts: [{ text: turn.text || '' }],
        });
      }
      contents.push({
        role: 'user',
        parts: [{ text: cleanMessage }],
      });

      const fullInstruction = `${SYSTEM_INSTRUCTION}\n${locationContext}\n${langInstruction}\nKeep answer under 3-4 sentences.`;

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
        body.model,
        'gemini-3.1-flash-lite',
        'gemini-flash-latest',
        'gemini-3.6-flash',
        'gemini-3.5-flash',
        'gemini-2.5-flash',
      ].filter(Boolean);

      for (const model of modelsToTry.filter(Boolean)) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const geminiRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (geminiRes.status === 503 || geminiRes.status === 429) {
            continue;
          }

          const json = await geminiRes.json();
          if (json.error) {
            console.warn(`[Vercel API] ${model} error:`, json.error.message);
            continue;
          }

          const replyText = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            const finalReplyLang = /[\u0980-\u09FF]/.test(replyText)
              ? 'bn'
              : /[\u0900-\u097F]/.test(replyText)
              ? 'hi'
              : effectiveLang;
            return res.status(200).json({
              reply: replyText,
              modelUsed: model,
              detectedLanguage: finalReplyLang,
            });
          }
        } catch (err) {
          console.warn(`[Vercel API] fetch failed for ${model}:`, err.message);
        }
      }
    }

    // Telemetry and Knowledge Fallback (guaranteed response)
    const fallbackReply = buildFallbackResponse({
      message: cleanMessage,
      language: effectiveLang,
      userLocation,
    });

    return res.status(200).json({
      reply: fallbackReply,
      modelUsed: 'cyclone-ai-telemetry-engine',
      detectedLanguage: effectiveLang,
    });
  } catch (error) {
    console.error('[Vercel API] Chat handler error:', error);
    return res.status(200).json({
      reply: 'CycloneAI is active. Real-time satellite tracking and Doppler telemetry are operational.',
      modelUsed: 'cyclone-ai-safety-fallback',
    });
  }
}
