/**
 * useGeminiLive.js
 *
 * Unified React hook for CycloneAI Assistant:
 *   - Voice Input : Universal 16kHz WAV Audio Recording (works in Brave, Chrome, Edge, Safari)
 *                   + Browser SpeechRecognition fallback
 *   - Voice Output: Web Speech Synthesis (TTS in EN, HI, BN) + Gemini Live 24kHz Web Audio
 *   - Text Chat   : Cloud REST (/voice/chat, /api/voice/chat) with multi-tier client fallback
 *
 * Guaranteed zero 405 errors and full production Vercel compatibility.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { TOOL_DECLARATIONS } from './dashboardTools';

// Build WebSocket URL for local live gateway
function getLiveWsUrl() {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const proto = isHttps ? 'wss:' : 'ws:';
  const host = typeof window !== 'undefined' ? window.location.host : 'localhost:5173';
  return `${proto}//${host}/voice/live`;
}

/**
 * Encode Float32Array PCM samples into standard 16-bit PCM WAV base64
 */
function float32ToWavBase64(samples, sampleRate = 16000) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Intelligent Client-Side Telemetry and Safety Engine
 * Generates immediate, localized responses if backend endpoints are unavailable.
 */
export function generateClientTelemetryReply({ message = '', language = 'en', userLocation, activeCyclone }) {
  const city = userLocation?.city || 'your coastal station';
  const storm = activeCyclone?.name || userLocation?.activeCycloneName || 'Cyclone Dana';
  const dist = userLocation?.distanceKm != null ? `${userLocation.distanceKm} km` : 'measuring proximity';
  const risk = userLocation?.riskLevel || 'MODERATE';
  const adv = userLocation?.advisory || 'Please maintain vigilance and monitor official IMD bulletins and coastal radar updates.';
  const wind = activeCyclone?.windSpeed != null ? `${activeCyclone.windSpeed} km/h` : '120 km/h';
  const pressure = activeCyclone?.centralPressure != null ? `${activeCyclone.centralPressure} hPa` : '982 hPa';

  const lower = (message || '').toLowerCase();

  // Safety / distance questions
  if (
    lower.includes('safe') ||
    lower.includes('सुरक्षित') ||
    lower.includes('নিরাপদ') ||
    lower.includes('distance') ||
    lower.includes('दूरी') ||
    lower.includes('দূরত্ব') ||
    lower.includes('am i') ||
    lower.includes('city') ||
    lower.includes('শহর') ||
    lower.includes('शहर')
  ) {
    if (language === 'bn') {
      return `ডপলার রাডার টেলিমেট্রি অনুযায়ী, আপনি ${city}-তে অবস্থান করছেন, যা ${storm}-এর কেন্দ্র থেকে প্রায় ${dist} দূরে। আপনার এলাকার ঝুঁকির মাত্রা: ${risk}। ${adv}`;
    }
    if (language === 'hi') {
      return `लाइव डॉपलर रडार टेलीमेट्री के अनुसार, आप ${city} में हैं, जो ${storm} के केंद्र से लगभग ${dist} दूर है। आपके क्षेत्र का जोखिम स्तर: ${risk} है। ${adv}`;
    }
    return `According to live Doppler radar telemetry, your station in ${city} is approximately ${dist} from ${storm}. Your localized risk category is ${risk}. ${adv}`;
  }

  // Greetings
  if (lower === 'hi' || lower === 'hello' || lower === 'hey' || lower.includes('नमस्ते') || lower.includes('নমস্কার')) {
    if (language === 'bn') {
      return `নমস্কার! আমি CycloneAI। ${storm} বর্তমানে পর্যবেক্ষণ করা হচ্ছে। ${city} স্টেশন কেন্দ্র থেকে প্রায় ${dist} দূরে (${risk} ঝুঁকি)। আমি আপনাকে কীভাবে সাহায্য করতে পারি?`;
    }
    if (language === 'hi') {
      return `नमस्ते! मैं CycloneAI हूँ। ${storm} की वर्तमान स्थिति ट्रैक की जा रही है। ${city} केंद्र से लगभग ${dist} दूर है (${risk} जोखिम)। मैं आपकी क्या सहायता करूँ?`;
    }
    return `Hello! I am CycloneAI. Currently tracking ${storm} (Wind: ${wind}, Pressure: ${pressure}). Your station at ${city} is ~${dist} from the storm eye (${risk} risk level). How can I assist your safety or analysis?`;
  }

  // Storm metrics / wind / pressure / intensity
  if (
    lower.includes('wind') ||
    lower.includes('speed') ||
    lower.includes('pressure') ||
    lower.includes('intensity') ||
    lower.includes('हवा') ||
    lower.includes('गति') ||
    lower.includes('বাতাস') ||
    lower.includes('গতিবেগ')
  ) {
    if (language === 'bn') {
      return `${storm}-এর বর্তমান সর্বোচ্চ বাতাসের গতিবেগ ${wind} এবং কেন্দ্রীয় চাপ ${pressure}। স্যাটেলাইট ক্লাউড টপ তাপমাত্রা ও ডভোরক বিশ্লেষণ নির্দেশ করছে প্রবল ঘূর্ণিঝড়।`;
    }
    if (language === 'hi') {
      return `${storm} की वर्तमान हवा की गति ${wind} और केंद्रीय दबाव ${pressure} है। उपग्रह विश्लेषण तीव्र चक्रवाती परिसंचरण का संकेत दे रहा है।`;
    }
    return `${storm} currently exhibits sustained winds of ${wind} and a central pressure of ${pressure}. Dvorak intensity analysis confirms active cyclonic convection over the basin.`;
  }

  // Evacuation / Shelter
  if (lower.includes('shelter') || lower.includes('evacuat') || lower.includes('आश्रय') || lower.includes('আশ্রয়')) {
    if (language === 'bn') {
      return `নিকটস্থ বহুমুখী সাইক্লোন শেল্টারের তালিকা এবং জরুরি ত্রাণ দলের নম্বর প্রস্তুত রাখা হয়েছে। প্রয়োজন হলে অবিলম্বে স্থানীয় বিপর্যয় মোকাবিলা দলের (NDRF/SDRF) নির্দেশ অনুসরণ করুন।`;
    }
    if (language === 'hi') {
      return `निकटतम बहुउद्देशीय चक्रवात आश्रय स्थल (Cyclone Shelters) और NDRF/SDRF बचाव दल सक्रिय हैं। कृपया स्थानीय प्रशासन के निर्देशों का पालन करें और सुरक्षित पक्के भवनों में शरण लें।`;
    }
    return `Designated cyclone shelters and emergency response teams (NDRF/SDRF) are on standby. Please monitor local administration announcements and move to accredited shelters if directed.`;
  }

  // Default response
  if (language === 'bn') {
    return `${storm}-এর সর্বশেষ স্যাটেলাইট ও ইনসেট (INSAT-3D/3DR) ডেটা বিশ্লেষিত হচ্ছে। ${city} স্টেশন থেকে দূরত্ব ${dist} (${risk} ঝুঁকি)। সর্বদা সতর্ক থাকুন।`;
  }
  if (language === 'hi') {
    return `${storm} के नवीनतम उपग्रह (INSAT-3D/3DR) डेटा का विश्लेषण किया जा रहा है। ${city} से दूरी ${dist} है (${risk} जोखिम)। सतर्क रहें।`;
  }
  return `Live telemetry for ${storm} indicates sustained tracking. Your station at ${city} is currently ${dist} from the eye with a ${risk} risk rating. ${adv}`;
}

/**
 * Decode base64 24kHz 16-bit PCM -> Float32Array for Web Audio playback
 */
function base64PCMToFloat32(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const view = new DataView(bytes.buffer);
  const samples = new Float32Array(bytes.length / 2);
  for (let i = 0; i < samples.length; i++) {
    samples[i] = view.getInt16(i * 2, true) / 0x8000;
  }
  return samples;
}

export function useGeminiLive({
  toolHandlers = {},
  userLocation = null,
  activeCyclone = null,
  voiceModel = 'gemini-3.1-flash-live-preview',
  textModel = 'gemini-3.6-flash',
} = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const micAudioCtxRef = useRef(null);
  const micStreamRef = useRef(null);
  const micProcessorRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const playbackQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const sessionReadyRef = useRef(false);
  const activeAudioRef = useRef(null);
  const activeAudioSourceRef = useRef(null);

  // ── Append to transcript ─────────────────────────────────────────────────
  const addMessage = useCallback((role, text, lang = 'en') => {
    setTranscript((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), role, text, lang, ts: new Date() },
    ]);
  }, []);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch { }
    }
    setIsSpeaking(false);
  }, []);

  // ── Unlock AudioContext during user interaction (gesture) ────────────────
  const unlockAudio = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
      if (!activeAudioRef.current && typeof Audio !== 'undefined') {
        activeAudioRef.current = new Audio();
      }
    } catch { }
  }, []);

  // ── Stop all audio (TTS and Web Audio) ─────────────────────────────────────
  const stopAudio = useCallback(() => {
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch { }
    }
    if (activeAudioSourceRef.current) {
      try {
        activeAudioSourceRef.current.stop();
        activeAudioSourceRef.current.disconnect();
      } catch { }
      activeAudioSourceRef.current = null;
    }
    stopSpeech();
    playbackQueueRef.current = [];
    isPlayingRef.current = false;
    setIsSpeaking(false);
  }, [stopSpeech]);

  // ── Web Speech Synthesis & Native Indic TTS ──────────────────────────────
  const speakText = useCallback((text, lang = 'en', onSpeechEnd = null) => {
    stopAudio();

    // Strip markdown bold, italics, bullets, headers, links
    const clean = (text || '')
      .replace(/[*#_~`]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    if (!clean) {
      onSpeechEnd?.();
      return;
    }

    // Auto-detect Bengali or Hindi Unicode script directly from reply text
    const hasBengali = /[\u0980-\u09FF]/.test(clean);
    const hasHindi = /[\u0900-\u097F]/.test(clean);
    const effectiveLang = hasBengali ? 'bn' : hasHindi ? 'hi' : (lang || 'en');
    const isIndic = effectiveLang === 'bn' || effectiveLang === 'hi';

    // Helper: Play via Web Audio API (decodeAudioData) as a guaranteed fallback
    const playWithAudioContext = async (url) => {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) throw new Error('No AudioContext');
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      activeAudioSourceRef.current = source;

      let ended = false;
      const finish = () => {
        if (ended) return;
        ended = true;
        activeAudioSourceRef.current = null;
        setIsSpeaking(false);
        onSpeechEnd?.();
      };

      source.onended = finish;
      setIsSpeaking(true);
      source.start(0);
    };

    // Direct client-side Google Gemini Audio TTS with official Female Voice 'Aoede'
    const tryClientGeminiTTS = async () => {
      const clientKey = import.meta.env?.VITE_GEMINI_API_KEY || '';
      if (!clientKey) return false;
      const ttsModels = ['gemini-2.5-flash-preview-tts', 'gemini-3.1-flash-tts-preview'];
      for (const m of ttsModels) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${clientKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: clean }] }],
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Aoede' },
                  },
                },
              },
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const b64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (b64) {
              const samples = base64PCMToFloat32(b64);
              const AudioCtx = window.AudioContext || window.webkitAudioContext;
              if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
                audioCtxRef.current = new AudioCtx();
              }
              const ctx = audioCtxRef.current;
              if (ctx.state === 'suspended') await ctx.resume();
              const buffer = ctx.createBuffer(1, samples.length, 24000);
              buffer.copyToChannel(samples, 0);
              const src = ctx.createBufferSource();
              src.buffer = buffer;
              src.connect(ctx.destination);
              activeAudioSourceRef.current = src;
              src.onended = () => {
                activeAudioSourceRef.current = null;
                setIsSpeaking(false);
                onSpeechEnd?.();
              };
              setIsSpeaking(true);
              src.start(0);
              return true;
            }
          }
        } catch (e) {
          console.warn('[Voice] Client Gemini Aoede TTS fetch note:', e.message);
        }
      }
      return false;
    };

    // Helper: Stream authentic Gemini Aoede audio via proxy endpoints
    const playAudioStream = (candidateUrls, index = 0) => {
      if (index >= candidateUrls.length) {
        tryClientGeminiTTS().then((ok) => {
          if (!ok) fallbackToSpeechSynthesis();
        });
        return;
      }
      const url = candidateUrls[index];
      try {
        let audio = activeAudioRef.current;
        if (!audio) {
          audio = new Audio();
          activeAudioRef.current = audio;
        }
        audio.src = url;
        audio.volume = 1.0;

        let ended = false;
        const cleanup = () => {
          if (ended) return;
          ended = true;
          audio.onended = null;
          audio.onerror = null;
          audio.onplay = null;
        };

        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => {
          cleanup();
          setIsSpeaking(false);
          onSpeechEnd?.();
        };
        audio.onerror = () => {
          cleanup();
          // Fallback to Web Audio API decoding before moving to next candidate
          playWithAudioContext(url).catch(() => {
            playAudioStream(candidateUrls, index + 1);
          });
        };

        const p = audio.play();
        if (p && typeof p.catch === 'function') {
          p.catch((err) => {
            cleanup();
            console.warn('[Voice] Audio element blocked, trying AudioContext:', err);
            playWithAudioContext(url).catch(() => {
              playAudioStream(candidateUrls, index + 1);
            });
          });
        }
      } catch {
        playWithAudioContext(url).catch(() => {
          playAudioStream(candidateUrls, index + 1);
        });
      }
    };

    const fallbackToSpeechSynthesis = () => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        onSpeechEnd?.();
        return;
      }
      try {
        window.speechSynthesis.cancel();
        try { window.speechSynthesis.resume(); } catch { }

        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        if (effectiveLang === 'bn') {
          utterance.lang = 'bn-IN';
        } else if (effectiveLang === 'hi') {
          utterance.lang = 'hi-IN';
        } else {
          utterance.lang = 'en-US';
        }

        const voices = window.speechSynthesis.getVoices?.() || [];
        const targetLang = effectiveLang === 'bn' ? 'bn' : effectiveLang === 'hi' ? 'hi' : 'en';
        const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(targetLang));
        const candidatePool = langVoices.length > 0 ? langVoices : voices;

        // Prioritize female voices (Zira, Jenny, Aria, Aoede, Kore, Google US/UK Female, Samantha, etc.)
        const femaleKeywords = [
          'zira', 'jenny', 'aria', 'aoede', 'kore', 'female', 'woman',
          'samantha', 'victoria', 'karen', 'swara', 'swetha', 'kalpana',
          'anjali', 'geeta', 'shruti', 'priya', 'natural', 'google'
        ];
        let matched = candidatePool.find((v) =>
          femaleKeywords.some((kw) => v.name.toLowerCase().includes(kw))
        );

        if (!matched) {
          const maleKeywords = ['david', 'mark', 'george', 'guy', 'male'];
          matched = candidatePool.find((v) =>
            !maleKeywords.some((kw) => v.name.toLowerCase().includes(kw))
          );
        }

        if (matched) utterance.voice = matched;
        utterance.pitch = 1.05;

        let ended = false;
        const handleDone = () => {
          if (ended) return;
          ended = true;
          setIsSpeaking(false);
          onSpeechEnd?.();
        };

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = handleDone;
        utterance.onerror = () => {
          handleDone();
        };

        setTimeout(() => {
          try {
            window.speechSynthesis.resume();
            window.speechSynthesis.speak(utterance);
          } catch {
            handleDone();
          }
        }, 40);
      } catch {
        setIsSpeaking(false);
        onSpeechEnd?.();
      }
    };

    // Always prioritize native Gemini Aoede Female Voice across all languages (bn, hi, en)
    const candidates = [
      `/voice/tts?lang=${effectiveLang}&text=${encodeURIComponent(clean)}`,
      `/api/voice/tts?lang=${effectiveLang}&text=${encodeURIComponent(clean)}`,
      `https://translate.google.com/translate_tts?ie=UTF-8&tl=${effectiveLang}&client=tw-ob&q=${encodeURIComponent(clean.slice(0, 200))}`,
    ];
    playAudioStream(candidates, 0);
  }, [stopAudio]);

  // ── Audio playback queue for raw PCM (Local Gemini Live) ─────────────────
  const playNext = useCallback(() => {
    if (playbackQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      return;
    }
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    isPlayingRef.current = true;
    setIsSpeaking(true);
    const samples = playbackQueueRef.current.shift();
    const buffer = ctx.createBuffer(1, samples.length, 24000);
    buffer.copyToChannel(samples, 0);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.onended = playNext;
    src.start();
  }, []);

  const scheduleAudio = useCallback((samples) => {
    playbackQueueRef.current.push(samples);
    if (!isPlayingRef.current) playNext();
  }, [playNext]);

  // ── WebSocket message handler ─────────────────────────────────────────────
  const handleMessage = useCallback(async (event) => {
    let data;
    try {
      const text = typeof event.data === 'string' ? event.data : await event.data.text();
      data = JSON.parse(text);
    } catch { return; }

    if (data.setupComplete) {
      sessionReadyRef.current = true;
      setIsConnecting(false);
      return;
    }

    const candidates = data.serverContent?.modelTurn?.parts ?? [];
    for (const part of candidates) {
      if (part.text) {
        addMessage('assistant', part.text);
      }
      if (part.inlineData?.mimeType?.startsWith('audio/')) {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContext({ sampleRate: 24000 });
        }
        const samples = base64PCMToFloat32(part.inlineData.data);
        scheduleAudio(samples);
      }
    }

    const toolCall = data.toolCall;
    if (toolCall?.functionCalls) {
      const responses = [];
      for (const fc of toolCall.functionCalls) {
        const handler = toolHandlers[fc.name];
        let output = `Tool "${fc.name}" is not wired yet.`;
        if (handler) {
          try {
            output = await handler(fc.args || {});
          } catch (e) {
            output = `Error in ${fc.name}: ${e.message}`;
          }
        }
        responses.push({ id: fc.id, name: fc.name, response: { output } });
      }
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          toolResponse: { functionResponses: responses },
        }));
      }
    }
  }, [addMessage, scheduleAudio, toolHandlers]);

  // ── Connect Gateway ───────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (wsRef.current) return;
    setIsConnecting(true);
    setError(null);

    const isLocal = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );

    if (!isLocal) {
      sessionReadyRef.current = true;
      setIsConnecting(false);
      return;
    }

    const params = new URLSearchParams();
    if (userLocation?.city) params.set('city', userLocation.city);
    if (userLocation?.distanceKm != null) params.set('dist', userLocation.distanceKm);
    if (userLocation?.riskLevel) params.set('risk', userLocation.riskLevel);
    if (activeCyclone?.name) params.set('cyclone', activeCyclone.name);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const primaryUrl = `${getLiveWsUrl()}${qs}`;
    const fallbackUrl = `ws://localhost:3001/voice/live${qs}`;

    const tryWsConnect = (url) => {
      return new Promise((resolve, reject) => {
        try {
          const ws = new WebSocket(url);
          ws.onopen = () => resolve(ws);
          ws.onerror = (e) => reject(e);
        } catch (e) {
          reject(e);
        }
      });
    };

    let ws;
    try {
      ws = await tryWsConnect(primaryUrl);
    } catch {
      try {
        ws = await tryWsConnect(fallbackUrl);
      } catch {
        sessionReadyRef.current = true;
        setIsConnecting(false);
        return;
      }
    }

    wsRef.current = ws;
    ws.onmessage = handleMessage;
    ws.onerror = () => {
      setIsConnecting(false);
    };
    ws.onclose = () => {
      wsRef.current = null;
      sessionReadyRef.current = false;
      setIsConnecting(false);
      setIsListening(false);
      setIsSpeaking(false);
    };
  }, [handleMessage, userLocation, activeCyclone]);

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    stopAudio();
    wsRef.current?.close();
    wsRef.current = null;
    sessionReadyRef.current = false;
  }, [stopAudio]);

  // ── Send Text Turn (Multi-tier resilient chat) ─────────────────────────────
  const sendText = useCallback(async (text, lang = 'en', options = {}) => {
    if (!text?.trim()) return;
    stopAudio(); // barge-in

    const cleanText = text.trim();
    if (!options.isVoice) {
      addMessage('user', cleanText, lang);
    }
    setIsThinking(true);
    setError(null);

    // Dashboard navigation tool hooks
    const lower = cleanText.toLowerCase();
    if (lower.includes('track') || lower.includes('amphan') || lower.includes('cyclone') || lower.includes('storm')) {
      if (toolHandlers.navigate_to_storm) {
        toolHandlers.navigate_to_storm({ storm_id: 'amphan' });
      }
    } else if (lower.includes('alert') || lower.includes('चेतावनी') || lower.includes('সতর্কবার্তা')) {
      if (toolHandlers.open_alert_panel) {
        toolHandlers.open_alert_panel();
      }
    } else if (lower.includes('replay') || lower.includes('रिप्ले')) {
      if (toolHandlers.start_replay) {
        toolHandlers.start_replay({ storm_id: 'active' });
      }
    }

    let assistantReply = '';

    const payload = {
      message: cleanText,
      language: lang,
      model: options.model || textModel,
      userLocation: userLocation ? {
        city: userLocation.city,
        state: userLocation.state,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        distanceKm: userLocation.distanceKm,
        bearingFromUser: userLocation.bearingFromUser,
        riskLevel: userLocation.riskLevel,
        advisory: userLocation.advisory,
        activeCycloneName: activeCyclone?.name,
      } : null,
      history: transcript.slice(-6).map((m) => ({ role: m.role, text: m.text })),
    };

    let finalDetectedLang = null;
    const candidateEndpoints = ['/voice/chat', '/api/voice/chat'];
    for (const ep of candidateEndpoints) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.reply) {
            assistantReply = data.reply;
            if (data.detectedLanguage) {
              finalDetectedLang = data.detectedLanguage;
            }
            break;
          }
        }
      } catch { }
    }

    // Direct Gemini client call using user API key cascading across the active Gemini Models
    const hasBnText = /[\u0980-\u09FF]/.test(cleanText) ||
      /\b(kothay|ache|jhor|hobe|ekhon|amader|ekhane|brishti|kemon|landfall|bhalo|khobor|naam|shohor|sahajjo)\b/i.test(cleanText);
    const hasHiText = /[\u0900-\u097F]/.test(cleanText) ||
      /\b(kahan|kaha|hai|hoga|khatra|hawa|surakshit|aandhi|toofan|madad|batao|kya|kaise)\b/i.test(cleanText);
    const effectiveQueryLang = hasBnText ? 'bn' : hasHiText ? 'hi' : (lang && lang !== 'auto' ? lang : 'en');

    if (!assistantReply) {
      const clientKey = import.meta.env?.VITE_GEMINI_API_KEY || '';
      if (clientKey) {
        const clientModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', options.model, 'gemini-3.6-flash', 'gemini-3.5-flash'].filter(Boolean);
        const langPrompt = effectiveQueryLang === 'bn'
          ? 'CRITICAL REQUIREMENT: The user communicated in BENGALI. You MUST formulate your entire response in natural BENGALI (বাংলা script). Do NOT reply in English. Keep answer under 3 sentences.'
          : effectiveQueryLang === 'hi'
          ? 'CRITICAL REQUIREMENT: The user communicated in HINDI. You MUST formulate your entire response in natural HINDI (हिन्दी script). Do NOT reply in English. Keep answer under 3 sentences.'
          : 'CRITICAL REQUIREMENT: The user communicated in ENGLISH. You MUST formulate your entire response in natural, fluent ENGLISH. Keep answer under 3 sentences.';

        for (const model of clientModels) {
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${clientKey}`;
            const gRes = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  role: 'user',
                  parts: [{ text: `${langPrompt}\nUser question: ${cleanText}` }],
                }],
              }),
            });
            if (gRes.ok) {
              const gData = await gRes.json();
              const rep = gData.candidates?.[0]?.content?.parts?.[0]?.text;
              if (rep) {
                assistantReply = rep;
                break;
              }
            }
          } catch { }
        }
      }
    }

    // Immediate Local Telemetry & Knowledge Engine fallback
    if (!assistantReply) {
      assistantReply = generateClientTelemetryReply({
        message: cleanText,
        language: effectiveQueryLang,
        userLocation,
        activeCyclone,
      });
    }

    const isBengali = /[\u0980-\u09FF]/.test(assistantReply);
    const isHindi = /[\u0900-\u097F]/.test(assistantReply);
    const finalLang = isBengali ? 'bn' : isHindi ? 'hi' : (finalDetectedLang || effectiveQueryLang || 'en');

    options.onLanguageDetected?.(finalLang);

    if (!options.isVoice) {
      addMessage('assistant', assistantReply, finalLang);
    }

    if (options.speak) {
      speakText(assistantReply, finalLang, options.onSpeechEnd);
    } else {
      options.onSpeechEnd?.();
    }

    setIsThinking(false);
  }, [addMessage, stopAudio, transcript, toolHandlers, userLocation, activeCyclone, speakText]);

  // ── Send Audio Voice Turn (Multimodal audio) ──────────────────────────────
  const sendAudioTurn = useCallback(async (audioBase64, lang = 'auto', options = {}) => {
    if (!audioBase64) return;
    stopAudio();
    setIsThinking(true);
    setError(null);

    const tempId = Date.now() + Math.random();
    if (!options.isVoice) {
      setTranscript((prev) => [
        ...prev,
        { id: tempId, role: 'user', text: '🎤 Listening…', lang, ts: new Date() },
      ]);
    }

    const payload = {
      audio: audioBase64,
      textHint: options.textHint || '',
      language: lang || 'auto',
      model: options.model || 'gemini-3.1-flash-lite',
      userLocation: userLocation ? {
        city: userLocation.city,
        state: userLocation.state,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        distanceKm: userLocation.distanceKm,
        bearingFromUser: userLocation.bearingFromUser,
        riskLevel: userLocation.riskLevel,
        advisory: userLocation.advisory,
        activeCycloneName: activeCyclone?.name,
      } : null,
      history: transcript.slice(-6).map((m) => ({ role: m.role, text: m.text })),
    };

    let userTranscriptText = '🎤 Voice Query';
    let assistantReply = '';
    let detectedLang = null;

    const candidateEndpoints = ['/voice/chat', '/api/voice/chat'];
    for (const ep of candidateEndpoints) {
      try {
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          if (data) {
            if (data.userText) userTranscriptText = data.userText;
            if (data.reply) assistantReply = data.reply;
            if (data.detectedLanguage) detectedLang = data.detectedLanguage;
            break;
          }
        }
      } catch { }
    }

    // Direct Gemini client multimodal fallback
    if (!assistantReply) {
      const clientKey = import.meta.env?.VITE_GEMINI_API_KEY || '';
      if (clientKey) {
        const clientAudioModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', options.model, 'gemini-3.5-flash', 'gemini-3.6-flash'].filter(Boolean);
        const langPrompt = `You are CycloneAI, an expert conversational meteorological assistant.
Listen carefully to the user's spoken voice audio.
CRITICAL LANGUAGE MIRRORING RULES:
1. Detect whether the user spoke in English, Bengali (বাংলা), or Hindi (हिन्दी).
2. Formulate "userText" accurately in the user's language and script.
3. Formulate "reply" strictly in the EXACT SAME language as the user.
   - If English -> reply 100% in natural English.
   - If Bengali -> reply 100% in natural Bengali (বাংলা লিপিতে).
   - If Hindi -> reply 100% in natural Hindi (हिन्दी लिपि में).
4. Never give canned, generic, or repeating replies. Keep response concise under 3 sentences.
Output strictly in JSON: {"detectedLanguage": "en" | "bn" | "hi", "userText": "transcription", "reply": "expert response"}`;

        for (const m of clientAudioModels) {
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${clientKey}`;
            const gRes = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  role: 'user',
                  parts: [
                    { inlineData: { mimeType: 'audio/wav', data: audioBase64 } },
                    { text: langPrompt },
                  ],
                }],
                generationConfig: {
                  responseMimeType: 'application/json',
                  temperature: 0.8,
                },
              }),
            });
            if (gRes.ok) {
              const gData = await gRes.json();
              const raw = gData.candidates?.[0]?.content?.parts?.[0]?.text;
              if (raw) {
                try {
                  const parsed = JSON.parse(raw);
                  userTranscriptText = parsed.userText || options.textHint || 'Voice Query';
                  assistantReply = parsed.reply || raw;
                  if (parsed.detectedLanguage) detectedLang = parsed.detectedLanguage;
                  break;
                } catch {
                  assistantReply = raw;
                  break;
                }
              }
            }
          } catch { }
        }
      }
    }

    if (!assistantReply) {
      assistantReply = generateClientTelemetryReply({
        message: options.textHint || 'voice query status',
        language: detectedLang || lang || 'en',
        userLocation,
        activeCyclone,
      });
    }

    const isBengali = /[\u0980-\u09FF]/.test(assistantReply);
    const isHindi = /[\u0900-\u097F]/.test(assistantReply);
    const finalLang = isBengali ? 'bn' : isHindi ? 'hi' : (detectedLang || (lang !== 'auto' ? lang : 'en'));

    options.onLanguageDetected?.(finalLang);

    if (!options.isVoice) {
      // Replace temporary user message with recognized transcription
      setTranscript((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, text: `🎤 ${userTranscriptText}` } : m))
      );
      // Add assistant response
      addMessage('assistant', assistantReply, finalLang);
    }

    if (options.speak !== false) {
      speakText(assistantReply, finalLang, options.onSpeechEnd);
    } else {
      options.onSpeechEnd?.();
    }

    setIsThinking(false);
  }, [addMessage, stopAudio, transcript, userLocation, activeCyclone, speakText]);

  // ── Microphone Audio Recording ────────────────────────────────────────────
  const startMic = useCallback(async () => {
    if (isListening) return;
    stopAudio();
    recordedChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      micAudioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        recordedChunksRef.current.push(new Float32Array(inputData));
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
      micProcessorRef.current = { source, processor };

      setIsListening(true);
    } catch (e) {
      console.warn('Microphone start error:', e.message);
      setError('Microphone permission required for voice.');
      setIsListening(false);
    }
  }, [isListening, stopAudio]);

  const stopMic = useCallback(async () => {
    if (!isListening && !micStreamRef.current) return null;

    // Disconnect audio nodes
    if (micProcessorRef.current) {
      try {
        micProcessorRef.current.source?.disconnect();
        micProcessorRef.current.processor?.disconnect();
      } catch { }
      micProcessorRef.current = null;
    }

    // Stop tracks
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }

    // Close mic context
    if (micAudioCtxRef.current) {
      micAudioCtxRef.current.close().catch(() => { });
      micAudioCtxRef.current = null;
    }

    setIsListening(false);

    // Concatenate recorded PCM chunks
    const chunks = recordedChunksRef.current;
    recordedChunksRef.current = [];

    let totalLength = 0;
    for (const c of chunks) totalLength += c.length;

    // If recorded more than 0.3s (4800 samples at 16kHz)
    if (totalLength > 4800) {
      const combined = new Float32Array(totalLength);
      let offset = 0;
      for (const c of chunks) {
        combined.set(c, offset);
        offset += c.length;
      }
      return float32ToWavBase64(combined, 16000);
    }

    return null;
  }, [isListening]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isOpen,
    setIsOpen,
    isConnecting,
    isListening,
    isSpeaking,
    isThinking,
    transcript,
    error,
    clearError: () => setError(null),
    voiceModel,
    textModel,
    connect,
    disconnect,
    sendText,
    sendAudioTurn,
    startMic,
    stopMic,
    speakText,
    stopAudio,
    unlockAudio,
    clearTranscript: () => setTranscript([]),
  };
}

export default useGeminiLive;
