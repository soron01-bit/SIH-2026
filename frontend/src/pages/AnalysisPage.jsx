import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  X,
  Play,
  Cpu,
  CheckCircle2,
  Layers,
  MapPin,
  Wind,
  Gauge,
  Activity,
  ArrowRight,
  Crosshair,
  Radio,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import analysisService from '../services/analysisService';
import { SAMPLE_SATELLITE_PRESETS } from '../data/mockSatelliteImages';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { useAIModel } from '../context/AIModelContext';

export const AnalysisPage = () => {
  const { setIsDetecting, setIsModelConnected } = useAIModel();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [activePreset, setActivePreset] = useState(SAMPLE_SATELLITE_PRESETS[0]);
  const [channelFilter, setChannelFilter] = useState('ir-enhanced');
  const [analyzing, setAnalyzing] = useState(false);
  
  // Clean initial state: NO PREVIOUS CYCLONE REPORT OR ANALYSIS!
  const [analysisResult, setAnalysisResult] = useState(null);

  const fileInputRef = useRef(null);

  const handleFileChange = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setActivePreset(null);
    setPreviewUrl(URL.createObjectURL(file));
    setAnalysisResult(null); // Clear any previous result
  };

  const handleSelectPreset = (preset) => {
    setActivePreset(preset);
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null); // Clear any previous result
  };

  const handleClearAll = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setActivePreset(SAMPLE_SATELLITE_PRESETS[0]);
    setAnalysisResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    setIsDetecting(true);
    try {
      const res = await analysisService.analyzeImage(selectedFile || new Blob());
      if (res && res.cyclone_detected) {
        setIsModelConnected(true);
        setAnalysisResult({
          cyclone_detected: res.cyclone_detected,
          confidence: res.confidence,
          classification: res.classification,
          classification_code: res.classification_code,
          wind_speed_knots: res.wind_speed_knots,
          wind_speed_kmh: res.wind_speed_kmh,
          pressure_hpa: res.pressure_hpa,
          eye_location: res.eye_location,
          movement: res.movement,
          risk_level: res.risk_level,
          basin: res.basin || 'North Indian Ocean',
          analyzed_at: new Date().toISOString(),
        });
      }
    } finally {
      setTimeout(() => {
        setAnalyzing(false);
        setIsDetecting(false);
      }, 500);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-meteor-border/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-wide text-white">
            AI Satellite Cyclone Analysis
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Upload or select satellite imagery to identify, classify, and track cyclonic circulations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {analysisResult && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear Analysis</span>
            </button>
          )}
          <Badge variant="emerald" size="sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            AI MODEL READY
          </Badge>
        </div>
      </div>

      {/* SATELLITE CHANNELS SELECTOR */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
        <span className="text-slate-400 whitespace-nowrap">Select Sensor Channel:</span>
        {SAMPLE_SATELLITE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleSelectPreset(preset)}
            className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all ${
              activePreset?.id === preset.id
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-semibold'
                : 'bg-slate-900 border-meteor-border text-slate-400 hover:text-white'
            }`}
          >
            {preset.satellite} ({preset.band})
          </button>
        ))}
      </div>

      {/* TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: SATELLITE VIEWPORT & CONTROLS (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card
            icon={Layers}
            title="Satellite Imagery Viewport"
            subtitle={activePreset ? `${activePreset.title}` : selectedFile?.name}
            action={
              selectedFile && (
                <button
                  onClick={handleClearAll}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                  title="Remove uploaded image"
                >
                  <X className="w-4 h-4" />
                </button>
              )
            }
          >
            {/* Viewport Frame */}
            <div className="relative min-h-[340px] max-h-[400px] rounded-xl overflow-hidden bg-slate-950 border border-meteor-border flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Satellite Capture"
                  className={`max-h-[380px] w-auto object-contain ${
                    channelFilter === 'ir-enhanced' ? 'filter hue-rotate-180 contrast-125 saturate-150' : ''
                  }`}
                />
              ) : (
                <div
                  className={`w-full h-[340px] flex items-center justify-center relative transition-all duration-300 ${
                    channelFilter === 'ir-enhanced'
                      ? 'bg-[radial-gradient(circle_at_50%_50%,_#f43f5e_0%,_#eab308_25%,_#06b6d4_45%,_#0f172a_80%)]'
                      : 'bg-[radial-gradient(circle_at_50%_50%,_#a855f7_0%,_#3b82f6_35%,_#0f172a_80%)]'
                  }`}
                >
                  {/* Cyclone Eye Reticle Target */}
                  <div className="relative flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full border border-dashed border-white/60 animate-spin-slow" />
                    <div className="absolute w-7 h-7 rounded-full border-2 border-rose-400 bg-rose-500/40 flex items-center justify-center">
                      <Crosshair className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* Viewport HUD stamps */}
              <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded border border-slate-700 font-mono text-[10px] text-slate-300">
                <div className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-cyan-400" />
                  {activePreset ? activePreset.satellite : 'UPLOADED SATELLITE IMAGE'}
                </div>
                <div className="text-slate-400">{activePreset?.basin || 'North Indian Ocean'}</div>
              </div>

              <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded border border-slate-700 font-mono text-[10px] text-slate-300">
                Resolution: 4km Nadir
              </div>
            </div>

            {/* Viewport controls & upload button */}
            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">Enhancement:</span>
                <button
                  onClick={() => setChannelFilter('ir-enhanced')}
                  className={`px-2.5 py-1 rounded text-[10px] uppercase ${
                    channelFilter === 'ir-enhanced'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-slate-400 bg-slate-900'
                  }`}
                >
                  Thermal IR
                </button>
                <button
                  onClick={() => setChannelFilter('standard')}
                  className={`px-2.5 py-1 rounded text-[10px] uppercase ${
                    channelFilter === 'standard'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-slate-400 bg-slate-900'
                  }`}
                >
                  Water Vapor
                </button>
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/tiff"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Upload Satellite Image</span>
                </button>
              </div>
            </div>
          </Card>

          {/* Run Analysis Action Button */}
          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.25)]"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Running AI Model Analysis...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current text-slate-950" />
                <span>Analyze Satellite Capture with AI Model</span>
              </>
            )}
          </button>
        </div>

        {/* RIGHT: AI INFERENCE RESULTS (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card
            icon={Cpu}
            title="AI Model Analysis Output"
            subtitle="Identification, classification, and coordinate estimation"
          >
            {!analysisResult ? (
              /* CLEAN EMPTY / WAITING STATE */
              <div className="py-14 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-500 mx-auto">
                  <Cpu className="w-7 h-7 text-slate-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-200">
                    No Active Analysis Loaded
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Upload an image or select a sensor channel, then click <strong className="text-cyan-400">"Analyze Satellite Capture with AI Model"</strong> to generate the real-time detection report.
                  </p>
                </div>
              </div>
            ) : (
              /* ACTIVE FRESH ANALYSIS RESULTS */
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Primary detection status banner */}
                <div className="p-4 rounded-xl bg-slate-950 border border-meteor-border flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                      Detection Result
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-base font-bold text-emerald-400 font-mono">
                        Tropical Cyclone Detected
                      </span>
                    </div>
                  </div>
                  <Badge severity={analysisResult.riskLevel}>
                    {analysisResult.riskLevel} RISK
                  </Badge>
                </div>

                {/* Telemetry Metric Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-meteor-border space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-purple-400" />
                      Classification
                    </span>
                    <div className="text-sm font-bold text-white font-mono">
                      {analysisResult.classification}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-meteor-border space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                      Confidence
                    </span>
                    <div className="text-sm font-bold text-cyan-400 font-mono">
                      {analysisResult.confidence}%
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-meteor-border space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Wind className="w-3 h-3 text-rose-400" />
                      Sustained Winds
                    </span>
                    <div className="text-sm font-bold text-rose-400 font-mono">
                      {analysisResult.wind_speed_knots} kt
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {analysisResult.wind_speed_kmh} km/h
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-meteor-border space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-amber-400" />
                      Central Pressure
                    </span>
                    <div className="text-sm font-bold text-amber-400 font-mono">
                      {analysisResult.pressure_hpa} hPa
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      Barometric Eye Depth
                    </span>
                  </div>
                </div>

                {/* Eye Coordinates & Movement Box */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-meteor-border space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      Estimated Eye Center:
                    </span>
                    <span className="text-white font-bold">
                      {analysisResult.eye_location.latitude}°N, {analysisResult.eye_location.longitude}°E
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-slate-400">Movement Vector:</span>
                    <span className="text-slate-200 font-semibold">{analysisResult.movement}</span>
                  </div>
                </div>

                {/* Direct Navigation to Tracking Map */}
                <Link
                  to="/tracking"
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all group"
                >
                  <span>View on Geospatial Tracking Map</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;
