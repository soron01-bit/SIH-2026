import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic, MicOff, Send, X, MessageSquare, ChevronDown,
  Volume2, VolumeX, Trash2, AlertCircle, Loader2, Globe, MapPin,
} from 'lucide-react';
import useGeminiLive from './useGeminiLive';
import { buildToolHandlers } from './dashboardTools';
import { useAIModel } from '../../context/AIModelContext';
import { useUserLocation } from '../../context/UserLocationContext';

const LANG_LABELS = { en: 'EN', hi: 'HI', bn: 'BN' };

// ── Animated waveform (shown while listening or speaking) ──────────────────
const Waveform = ({ active, color = '#38bdf8' }) => (
  <div className="flex items-end gap-0.5 h-5">
    {[0, 1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className={`w-0.5 rounded-full transition-all ${active ? 'animate-waveform' : ''}`}
        style={{
          height: active ? `${8 + Math.sin(i * 1.2) * 6}px` : '3px',
          backgroundColor: color,
          animationDelay: `${i * 0.08}s`,
          opacity: active ? 1 : 0.3,
        }}
      />
    ))}
  </div>
);

// ── Message bubble ─────────────────────────────────────────────────────────
const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
          isUser
            ? 'bg-sky-600 text-white rounded-tr-sm'
            : 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700'
        }`}
      >
        {msg.text}
        <div className={`text-[10px] mt-0.5 ${isUser ? 'text-sky-200' : 'text-slate-500'}`}>
          {msg.ts?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

// ── Main Widget ────────────────────────────────────────────────────────────
export const VoiceTextWidget = () => {
  const navigate = useNavigate();
  const { detectedCyclone } = useAIModel();
  const { location, getProximityToStorm, requestLocation } = useUserLocation();
  const proximity = detectedCyclone ? getProximityToStorm(detectedCyclone) : null;

  const [expanded, setExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [lang, setLang] = useState('en');
  const [muted, setMuted] = useState(false);
  const [speechListening, setSpeechListening] = useState(false);
  const transcriptEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const userLocationContext = location
    ? {
        ...location,
        distanceKm: proximity?.distanceKm,
        bearingFromUser: proximity?.bearingFromUser,
        riskLevel: proximity?.riskLevel,
        advisory: proximity?.advisory,
      }
    : null;

  // Build tool handlers
  const cyclones = detectedCyclone ? [detectedCyclone] : [];
  const toolHandlers = useCallback(
    () => buildToolHandlers({ navigate, cyclones, location, getProximityToStorm }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, detectedCyclone, location]
  );

  const live = useGeminiLive({
    toolHandlers: toolHandlers(),
    userLocation: userLocationContext,
    activeCyclone: detectedCyclone,
  });

  // Browser SpeechRecognition companion for instant speech-to-text feedback
  const startSpeechRec = useCallback(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return false;
    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = lang === 'bn' ? 'bn-IN' : lang === 'hi' ? 'hi-IN' : 'en-US';

      rec.onresult = (e) => {
        let text = '';
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
        }
        if (text) {
          setInputText(text);
        }
      };

      rec.onerror = (e) => {
        console.warn('SpeechRecognition note:', e.error);
        setSpeechListening(false);
      };

      rec.onend = () => {
        setSpeechListening(false);
      };

      rec.start();
      recognitionRef.current = rec;
      setSpeechListening(true);
      return true;
    } catch (err) {
      console.warn('SpeechRecognition init note:', err);
      return false;
    }
  }, [lang]);

  const stopSpeechRec = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setSpeechListening(false);
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [live.transcript]);

  // Auto-connect when widget opens
  useEffect(() => {
    if (expanded && !live.isConnecting) {
      live.connect();
    }
    if (!expanded) {
      stopSpeechRec();
      live.stopMic();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    live.sendText(inputText.trim(), lang);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isCurrentlyListening = live.isListening || speechListening;

  const toggleMic = () => {
    if (isCurrentlyListening) {
      stopSpeechRec();
      live.stopMic();
      if (inputText.trim()) {
        const textToSend = inputText.trim();
        setInputText('');
        live.sendText(textToSend, lang);
      }
    } else {
      startSpeechRec();
      live.startMic();
    }
  };

  // ── Collapsed pill ──
  if (!expanded) {
    return (
      <button
        id="voice-text-ai-widget"
        onClick={() => setExpanded(true)}
        className="fixed bottom-5 right-5 z-[2000] flex items-center gap-2.5 px-4 py-2.5 rounded-full
                   bg-gradient-to-r from-sky-600 to-violet-600 text-white shadow-lg shadow-sky-500/30
                   hover:shadow-sky-500/50 hover:scale-105 transition-all duration-200 group"
        aria-label="Open AI Voice and Text Assistant"
      >
        <div className="relative">
          <Mic className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <span className="text-sm font-semibold tracking-wide">Voice + Text AI</span>
        <div className="flex items-center gap-1 text-[11px] opacity-75">
          {Object.keys(LANG_LABELS).map((l) => (
            <span key={l} className={l === lang ? 'opacity-100 font-bold' : 'opacity-50'}>{LANG_LABELS[l]}</span>
          ))}
        </div>
        <div className="w-px h-4 bg-white/20" />
        <Mic className="w-3.5 h-3.5 opacity-70" />
      </button>
    );
  }

  // ── Expanded chat widget ──
  return (
    <div
      id="voice-text-ai-widget-expanded"
      className="fixed bottom-5 right-5 z-[2000] w-80 sm:w-96 flex flex-col rounded-2xl
                 bg-[#0c1220] border border-slate-700/80 shadow-2xl shadow-black/60 overflow-hidden"
      style={{ maxHeight: '520px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-sky-900/60 to-violet-900/60 border-b border-slate-700/80">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center shadow">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            {(live.isListening || live.isSpeaking) && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#0c1220] animate-pulse" />
            )}
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              CycloneAI
              {live.isConnecting && <Loader2 className="w-3 h-3 text-sky-400 animate-spin" />}
              {live.isThinking && <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />}
              {live.isSpeaking && !muted && <Volume2 className="w-3 h-3 text-emerald-400" />}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              {live.isListening ? (
                <><span className="text-emerald-400 font-medium">● 3.1 Live Listening...</span><Waveform active color="#34d399" /></>
              ) : live.isSpeaking ? (
                <><span className="text-sky-400 font-medium">● 3.1 Live Speaking</span><Waveform active color="#38bdf8" /></>
              ) : live.isThinking ? (
                <span className="text-violet-300 animate-pulse font-medium">● 3.6 Flash reasoning...</span>
              ) : (
                <span className="text-slate-400">🎙️ 3.1 Live · 💬 3.6 Flash</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Language picker */}
          <div className="flex items-center rounded-md overflow-hidden border border-slate-700 bg-slate-900/60">
            {Object.entries(LANG_LABELS).map(([code, label]) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={`px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                  lang === code ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setMuted(!muted)}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={muted ? 'Unmute audio' : 'Mute audio'}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => live.clearTranscript()}
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Clear chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              setExpanded(false);
              stopSpeechRec();
              live.stopMic();
            }}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Location Status Bar */}
      <div className="px-3.5 py-1.5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between text-[11px]">
        {location ? (
          <div className="flex items-center gap-1.5 text-slate-300 truncate">
            <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
            <span className="font-semibold text-white">{location.city}</span>
            {proximity && (
              <>
                <span className="text-slate-500">•</span>
                <span className="text-sky-300 font-mono">{proximity.distanceKm} km to {detectedCyclone?.name || 'Storm'}</span>
                <span
                  className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0"
                  style={{
                    color: proximity.color,
                    backgroundColor: `${proximity.color}20`,
                    border: `1px solid ${proximity.color}50`,
                  }}
                >
                  {proximity.riskLevel}
                </span>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-amber-400/90 flex items-center gap-1 text-[10px]">
              <AlertCircle className="w-3 h-3" /> Station location pending
            </span>
            <button
              onClick={requestLocation}
              className="text-[10px] text-sky-400 hover:underline font-bold"
            >
              Verify GPS Station
            </button>
          </div>
        )}
      </div>

      {/* Error bar */}
      {live.error && (
        <div className="px-3 py-2 bg-rose-950/60 border-b border-rose-800/60 flex items-center gap-2 text-xs text-rose-300">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>{live.error}</span>
        </div>
      )}

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 min-h-[200px] max-h-[300px]">
        {live.transcript.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center py-5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500/20 to-violet-500/20 border border-sky-500/30 flex items-center justify-center">
              <Globe className="w-5 h-5 text-sky-400" />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-200">
                Hi! I'm CycloneAI
              </div>
              <div className="text-xs text-slate-400 max-w-[240px] leading-relaxed">
                Location-aware cyclone tracking assistant. Speak or type in English, Hindi, or Bengali.
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {[
                `Am I safe in ${location?.city || 'my city'}?`,
                `Distance to ${detectedCyclone?.name || 'cyclone'}?`,
                'আমার শহরে কি ঝড় হবে?',
                'क्या मेरे शहर में ख़तरा है?',
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => { live.sendText(s, lang); }}
                  className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          live.transcript.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        )}
        <div ref={transcriptEndRef} />
      </div>

      {/* Input row */}
      <div className="p-3 border-t border-slate-800 bg-[#080c15]">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-600 transition-colors"
            disabled={live.isConnecting}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || live.isConnecting}
            className="p-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleMic}
            className={`p-2 rounded-lg transition-all ${
              isCurrentlyListening
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-110'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isCurrentlyListening ? 'Stop recording & send' : 'Start voice input'}
            disabled={live.isConnecting}
          >
            {isCurrentlyListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </form>

        {isCurrentlyListening && (
          <div className="mt-2 flex items-center justify-center gap-2 text-xs text-emerald-400">
            <Waveform active color="#34d399" />
            <span>Listening in {LANG_LABELS[lang] || 'English'} — tap mic to finish & send</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceTextWidget;
