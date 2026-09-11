/**
 * useGeminiLive.js
 *
 * Unified React hook for CycloneAI Assistant:
 *   - Voice Mode: gemini-3.1-flash-live-preview (WebSocket Live Streaming Audio, 16kHz mic -> 24kHz playback)
 *   - Text Mode : gemini-3.6-flash (REST GenerateContent via backend proxy with Tool/XAI support)
 *
 * Security:
 *   - GEMINI_API_KEY remains strictly on the server in .env (never transmitted to client).
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { TOOL_DECLARATIONS } from './dashboardTools';

// Build WebSocket URL for local secure live gateway
function getLiveWsUrl() {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const proto = isHttps ? 'wss:' : 'ws:';
  const host = typeof window !== 'undefined' ? window.location.host : 'localhost:5173';
  return `${proto}//${host}/voice/live`;
}

/**
 * Encode Float32Array PCM -> base64 16-bit little-endian PCM
 */
function float32ToBase64PCM(float32) {
  const buffer = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
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
  const micStreamRef = useRef(null);
  const micProcessorRef = useRef(null);
  const playbackQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const sessionReadyRef = useRef(false);

  // ── Append to transcript ─────────────────────────────────────────────────
  const addMessage = useCallback((role, text, lang = 'en') => {
    setTranscript((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), role, text, lang, ts: new Date() },
    ]);
  }, []);

  // ── Audio playback queue ─────────────────────────────────────────────────
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

  const stopAudio = useCallback(() => {
    playbackQueueRef.current = [];
    isPlayingRef.current = false;
    setIsSpeaking(false);
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  // ── WebSocket message handler ─────────────────────────────────────────────
  const handleMessage = useCallback(async (event) => {
    let data;
    try {
      const text = typeof event.data === 'string' ? event.data : await event.data.text();
      data = JSON.parse(text);
    } catch { return; }

    // Live session setup complete
    if (data.setupComplete) {
      sessionReadyRef.current = true;
      setIsConnecting(false);
      return;
    }

    // Audio / Text candidates from Google Live
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

    // Function/tool calls
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

  // ── Connect to Voice Live Gateway ─────────────────────────────────────────
  const connect = useCallback(async () => {
    if (wsRef.current) return;
    setIsConnecting(true);
    setError(null);

    const params = new URLSearchParams();
    if (userLocation?.city) params.set('city', userLocation.city);
    if (userLocation?.state) params.set('state', userLocation.state);
    if (userLocation?.latitude != null) params.set('lat', userLocation.latitude);
    if (userLocation?.longitude != null) params.set('lon', userLocation.longitude);
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
      } catch (err) {
        console.warn('Voice WebSocket connection attempt failed:', err.message);
        setError('Voice server offline. Run "node token-server.mjs" in the frontend directory.');
        setIsConnecting(false);
        return;
      }
    }

    wsRef.current = ws;
    ws.onmessage = handleMessage;
    ws.onerror = () => {
      setError('Voice Live connection error.');
      setIsConnecting(false);
    };
    ws.onclose = () => {
      wsRef.current = null;
      sessionReadyRef.current = false;
      setIsConnecting(false);
      setIsListening(false);
      setIsSpeaking(false);
    };
  }, [handleMessage]);

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    stopMic();
    stopAudio();
    wsRef.current?.close();
    wsRef.current = null;
    sessionReadyRef.current = false;
  }, [stopAudio]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send Text Turn (Uses gemini-3.6-flash via /voice/chat) ────────────────
  const sendText = useCallback(async (text, lang = 'en') => {
    if (!text?.trim()) return;
    stopAudio(); // barge-in

    const cleanText = text.trim();
    addMessage('user', cleanText, lang);
    setIsThinking(true);
    setError(null);

    // Check for quick direct dashboard intents client-side
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

    try {
      const res = await fetch('/voice/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanText,
          language: lang,
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
        }),
      });

      if (!res.ok) {
        throw new Error(`Chat returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.reply) {
        addMessage('assistant', data.reply, lang);
      } else {
        addMessage('assistant', 'I received your query. Tracking storm metrics now.', lang);
      }
    } catch (e) {
      console.error('Chat endpoint error:', e);
      addMessage('assistant', `CycloneAI is active. (${e.message})`, lang);
    } finally {
      setIsThinking(false);
    }
  }, [addMessage, stopAudio, transcript, toolHandlers, userLocation, activeCyclone]);

  // ── Mic Input (gemini-3.1-flash-live-preview) ──────────────────────────────
  const startMic = useCallback(async () => {
    if (isListening) return;
    stopAudio(); // barge-in

    if (!wsRef.current) {
      await connect();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1 },
      });
      micStreamRef.current = stream;

      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext({ sampleRate: 24000 });
      const micCtx = new AudioContext({ sampleRate: 16000 });

      const source = micCtx.createMediaStreamSource(stream);
      const processor = micCtx.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        const samples = e.inputBuffer.getChannelData(0);
        const b64 = float32ToBase64PCM(samples);
        // Correct Gemini Live API schema (deprecates mediaChunks)
        wsRef.current.send(JSON.stringify({
          realtimeInput: {
            audio: { mimeType: 'audio/pcm;rate=16000', data: b64 },
          },
        }));
      };

      source.connect(processor);
      processor.connect(micCtx.destination);
      micProcessorRef.current = { processor, source, ctx: micCtx };

      setIsListening(true);
      addMessage('user', '🎤 [Voice Input Active]');
    } catch (e) {
      setError(`Microphone access error: ${e.message}`);
    }
  }, [isListening, stopAudio, connect, addMessage]);

  const stopMic = useCallback(() => {
    if (!isListening) return;
    const p = micProcessorRef.current;
    if (p) {
      p.source?.disconnect();
      p.processor?.disconnect();
      p.ctx?.close().catch(() => {});
      micProcessorRef.current = null;
    }
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    setIsListening(false);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ clientContent: { turnComplete: true } }));
    }
  }, [isListening]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isOpen,
    setIsOpen,
    isConnecting,
    isListening,
    isSpeaking,
    isThinking,
    transcript,
    error,
    voiceModel,
    textModel,
    connect,
    disconnect,
    sendText,
    startMic,
    stopMic,
    clearTranscript: () => setTranscript([]),
  };
}

export default useGeminiLive;
