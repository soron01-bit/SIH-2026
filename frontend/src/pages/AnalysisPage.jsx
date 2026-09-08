import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  X,
  Play,
  CheckCircle2,
  Layers,
  MapPin,
  Wind,
  Gauge,
  Activity,
  ArrowRight,
  Radio,
  RefreshCw,
  Trash2,
  TrendingUp,
  AlertTriangle,
  Info,
  Compass,
} from 'lucide-react';
import analysisService from '../services/analysisService';
import { analyzeSatelliteCapture, METEOROLOGICAL_SECTORS } from '../services/imageAnalysisEngine';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { useAIModel } from '../context/AIModelContext';

const SENSOR_CHANNELS = [
  { id: 'TIR1', name: 'Thermal IR (10.8 µm)', satellite: 'INSAT-3DR', desc: 'Cloud top temperature & eyewall deep convection' },
  { id: 'WV', name: 'Water Vapor (6.7 µm)', satellite: 'INSAT-3D', desc: 'Mid-tropospheric steering flow & dry air intrusion' },
  { id: 'VIS', name: 'Visible (0.65 µm)', satellite: 'NOAA-20', desc: 'High-resolution daytime cloud texture & spiral banding' },
];

export const AnalysisPage = () => {
  const {
    setIsDetecting,
    setIsModelConnected,
    registerCycloneAnalysis,
    clearCycloneAnalysis,
    detectedCyclone,
  } = useAIModel();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(SENSOR_CHANNELS[0].id);
  const [selectedSector, setSelectedSector] = useState('AUTO');
  const [analyzing, setAnalyzing] = useState(false);
  
  // Analysis Output State - initialize from detectedCyclone if present
  const [analysisResult, setAnalysisResult] = useState(() => {
    if (detectedCyclone) {
      return {
        cycloneDetected: true,
        stormName: detectedCyclone.name,
        confidence: detectedCyclone.detectionConfidence || 92,
        confidenceRating: 'High Confidence',
        classification: detectedCyclone.classification || 'Severe Cyclonic Storm (SCS)',
        category: detectedCyclone.classificationCode === 'VSCS' ? 'Category 3' : 'Category 2',
        intensityTrend: 'Increasing',
        windSpeedKmh: detectedCyclone.windSpeedKmh || 120,
        windSpeedKnots: detectedCyclone.windSpeedKnots || 65,
        pressureHpa: detectedCyclone.pressureHpa || 980,
        eyeLocation: { latitude: detectedCyclone.latitude, longitude: detectedCyclone.longitude },
        movement: detectedCyclone.movementDirection || 'North-West',
        movementSpeed: `${detectedCyclone.movementSpeedKmh || 14} km/h`,
        riskLevel: detectedCyclone.riskLevel || 'MODERATE',
        basin: detectedCyclone.basin || 'Bay of Bengal',
        analyzedAt: detectedCyclone.detectedAt,
        humanSummary: detectedCyclone.summary,
      };
    }
    return null;
  });

  const fileInputRef = useRef(null);

  const handleFileChange = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClearAll = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    clearCycloneAnalysis();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    setIsDetecting(true);
    try {
      // 1. Run real image-driven satellite capture analysis with sector & pixel hash
      const imageResult = await analyzeSatelliteCapture(selectedFile, previewUrl, selectedChannel, selectedSector);

      // 2. Query backend service with quick 1.2s timeout so UI never hangs
      let backendRes = null;
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Backend offline')), 1200)
        );
        backendRes = await Promise.race([
          analysisService.analyzeImage(selectedFile || new Blob()),
          timeoutPromise,
        ]);
      } catch (e) {
        // Standalone client mode
      }

      const analysisData = {
        ...imageResult,
        ...(backendRes && backendRes.cyclone_detected
          ? {
              stormName: backendRes.name || imageResult.stormName,
              confidence: backendRes.confidence || imageResult.confidence,
              classification: backendRes.classification || imageResult.classification,
              classificationCode: backendRes.classification_code || imageResult.classificationCode,
              windSpeedKmh: backendRes.wind_speed_kmh || imageResult.windSpeedKmh,
              windSpeedKnots: backendRes.wind_speed_knots || imageResult.windSpeedKnots,
              pressureHpa: backendRes.pressure_hpa || imageResult.pressureHpa,
              eyeLocation: backendRes.eye_location || imageResult.eyeLocation,
              movement: backendRes.movement || imageResult.movement,
              riskLevel: backendRes.risk_level || imageResult.riskLevel,
              basin: backendRes.basin || imageResult.basin,
            }
          : {}),
      };

      setIsModelConnected(true);
      setAnalysisResult(analysisData);
      registerCycloneAnalysis(analysisData);
    } catch (err) {
      console.error('Analysis execution error:', err);
    } finally {
      setAnalyzing(false);
      setIsDetecting(false);
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            AI Cyclone Analysis
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload or inspect multi-spectral satellite imagery to detect cyclonic organization, classify intensity, and estimate movement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {analysisResult && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1.5 border border-slate-750 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear</span>
            </button>
          )}
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            AI Model: Ready
          </span>
        </div>
      </div>

      {/* SENSOR CHANNEL & METEOROLOGICAL SECTOR CONTROLS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* SENSOR CHANNEL SELECTOR */}
        <div className="md:col-span-7 flex items-center gap-2 overflow-x-auto text-xs bg-[#0c1220] border border-slate-800 p-2.5 rounded-lg">
          <span className="text-slate-400 whitespace-nowrap font-medium">Channel:</span>
          {SENSOR_CHANNELS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setSelectedChannel(ch.id)}
              className={`px-2.5 py-1 rounded border whitespace-nowrap transition-colors text-xs ${
                selectedChannel === ch.id
                  ? 'bg-slate-800 text-white border-slate-700 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {ch.name}
            </button>
          ))}
        </div>

        {/* METEOROLOGICAL SECTOR SELECTOR */}
        <div className="md:col-span-5 flex items-center justify-between gap-2 text-xs bg-[#0c1220] border border-slate-800 p-2.5 rounded-lg">
          <span className="text-slate-400 whitespace-nowrap font-medium flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            Sector:
          </span>
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none w-full cursor-pointer truncate"
          >
            {METEOROLOGICAL_SECTORS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT: SATELLITE IMAGE VIEWPORT & UPLOAD (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card
            icon={Layers}
            title="Satellite Imagery Preview"
            subtitle={selectedFile ? selectedFile.name : SENSOR_CHANNELS.find((c) => c.id === selectedChannel)?.desc}
            action={
              selectedFile && (
                <button
                  onClick={handleClearAll}
                  className="p-1 rounded text-slate-400 hover:text-white"
                  title="Remove uploaded image"
                >
                  <X className="w-4 h-4" />
                </button>
              )
            }
          >
            {/* Image Preview Box */}
            <div className="relative min-h-[320px] max-h-[380px] rounded-md overflow-hidden bg-[#080c15] border border-slate-800 flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Satellite Ingest Preview"
                  className="max-h-[360px] w-auto object-contain"
                />
              ) : (
                <div
                  className={`w-full h-[320px] flex flex-col items-center justify-center p-6 text-center transition-all ${
                    selectedChannel === 'TIR1'
                      ? 'bg-[radial-gradient(ellipse_at_50%_50%,_rgba(239,68,68,0.2)_0%,_rgba(234,179,8,0.15)_25%,_rgba(14,165,233,0.1)_50%,_rgba(15,23,42,0.95)_80%)]'
                      : selectedChannel === 'WV'
                      ? 'bg-[radial-gradient(ellipse_at_50%_50%,_rgba(147,51,234,0.2)_0%,_rgba(59,130,246,0.15)_35%,_rgba(15,23,42,0.95)_80%)]'
                      : 'bg-[radial-gradient(ellipse_at_50%_50%,_rgba(241,245,249,0.15)_0%,_rgba(148,163,184,0.1)_30%,_rgba(15,23,42,0.95)_80%)]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
                    <Layers className="w-6 h-6 text-sky-400" />
                  </div>
                  <div className="text-sm font-semibold text-slate-200">
                    {SENSOR_CHANNELS.find((c) => c.id === selectedChannel)?.name}
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    {SENSOR_CHANNELS.find((c) => c.id === selectedChannel)?.desc}. Ready for AI inference or upload your own satellite capture below.
                  </p>
                </div>
              )}

              {/* Viewport Meta Stamp */}
              <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-sm px-2.5 py-1.5 rounded border border-slate-800 text-[11px] text-slate-300">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-sky-400" />
                  {selectedFile ? 'Custom Upload' : SENSOR_CHANNELS.find((c) => c.id === selectedChannel)?.satellite}
                </div>
                <div className="text-slate-400">Resolution: 4km Nadir</div>
              </div>
            </div>

            {/* Upload Button */}
            <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
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
                className="px-3 py-2 rounded bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs flex items-center gap-2 border border-slate-750 transition-colors"
              >
                <UploadCloud className="w-4 h-4 text-sky-400" />
                <span>Upload Custom Satellite Imagery</span>
              </button>

              <span className="text-[11px] text-slate-500 font-mono">
                PNG, JPEG, WebP, GeoTIFF up to 25MB
              </span>
            </div>
          </Card>

          {/* Action: Run Analysis */}
          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="w-full py-3 px-5 rounded-md font-semibold text-sm flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white transition-colors disabled:opacity-75 shadow-sm"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Analyzing satellite imagery...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current text-white" />
                <span>Run AI Cyclone Analysis</span>
              </>
            )}
          </button>
        </div>

        {/* RIGHT: STRUCTURED INSIGHTS (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card
            icon={Activity}
            title="AI Cyclone Analysis Insights"
            subtitle="Identification, intensity classification, and risk evaluation"
          >
            {!analysisResult ? (
              /* CLEAN EMPTY STATE */
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-lg bg-slate-850 border border-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                  <Activity className="w-6 h-6 text-slate-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-200">
                    Awaiting Analysis Run
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Select a sensor channel or upload a satellite image, then click <strong className="text-slate-200">"Run AI Cyclone Analysis"</strong> to generate the meteorological assessment.
                  </p>
                </div>
              </div>
            ) : (
              /* POPULATED CLEAN RESULT */
              <div className="space-y-4">
                {/* Status banner */}
                <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                      Detection Result
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-sm font-bold text-white">
                        {analysisResult.stormName || 'Tropical Cyclone Identified'}
                      </span>
                      <span className="text-xs text-sky-400 font-medium">
                        • {analysisResult.basin}
                      </span>
                    </div>
                  </div>
                  <Badge severity={analysisResult.riskLevel}>
                    {analysisResult.riskLevel} RISK
                  </Badge>
                </div>

                {/* Key Insights Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 block">Detection Confidence</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-bold font-mono text-white">{analysisResult.confidence}%</span>
                      <span className="text-[11px] text-emerald-400 font-medium">High</span>
                    </div>
                    {/* Visual progress bar */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-sky-500 h-full rounded-full" style={{ width: `${analysisResult.confidence}%` }} />
                    </div>
                  </div>

                  <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 block">Estimated Intensity</span>
                    <div className="text-sm font-bold text-white">
                      {analysisResult.category}
                    </div>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      {analysisResult.classification}
                    </span>
                  </div>

                  <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 block">Intensity Trend</span>
                    <div className="text-sm font-semibold text-amber-400 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{analysisResult.intensityTrend}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block">
                      Winds: {analysisResult.windSpeedKmh} km/h ({analysisResult.windSpeedKnots} kt)
                    </span>
                  </div>

                  <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 block">Movement</span>
                    <div className="text-sm font-semibold text-white">
                      {analysisResult.movement}
                    </div>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      Speed: {analysisResult.movementSpeed || '14 km/h'}
                    </span>
                  </div>
                </div>

                {/* Plain-English Human Explanation */}
                <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                    <Info className="w-3.5 h-3.5 text-sky-400" />
                    <span>Meteorological Assessment</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {analysisResult.humanSummary}
                  </p>
                </div>

                {/* Projected Coastal Landfall Target */}
                {analysisResult.landfallTarget && (
                  <div className="p-3 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                      <Compass className="w-3.5 h-3.5 text-amber-400" />
                      Projected Landfall Zone:
                    </span>
                    <span className="text-amber-300 font-medium text-right text-[11px] max-w-[200px] truncate">
                      {analysisResult.landfallTarget}
                    </span>
                  </div>
                )}

                {/* Estimated Coordinates */}
                <div className="p-3 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    Estimated Eye Center:
                  </span>
                  <span className="text-white font-semibold">
                    {analysisResult.eyeLocation.latitude}°N, {analysisResult.eyeLocation.longitude}°E
                  </span>
                </div>

                {/* View on Tracking Map - Prominent CTA */}
                <Link
                  to="/tracking"
                  className="w-full py-2.5 px-4 rounded bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <span>Track {analysisResult.stormName || 'Cyclone'} on Live Geospatial Map</span>
                  <ArrowRight className="w-4 h-4" />
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
