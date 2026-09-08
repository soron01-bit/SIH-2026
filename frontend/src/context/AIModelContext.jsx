import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import cycloneService, { createTrackedCycloneFromAnalysis } from '../services/cycloneService';
import alertService, { createAlertFromCyclone } from '../services/alertService';

const AIModelContext = createContext();

export const AIModelProvider = ({ children }) => {
  // Model connection and live detection state
  const [isModelConnected, setIsModelConnected] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [modelTelemetry, setModelTelemetry] = useState(null);
  const [detectedCyclone, setDetectedCyclone] = useState(() => {
    const stored = cycloneService.getStoredCyclones();
    return stored.length > 0 ? stored[0] : null;
  });

  // Check backend model status if available
  useEffect(() => {
    let isMounted = true;

    const checkModelStatus = async () => {
      try {
        const res = await api.get('/model/status/');
        if (isMounted && res.data && res.data.connected) {
          setIsModelConnected(true);
          setIsDetecting(res.data.is_detecting || false);
          setModelTelemetry(res.data);
        }
      } catch (err) {
        // Backend or model not yet connected
        if (isMounted) {
          // Keep connected if user ran client-side inference
          const stored = cycloneService.getStoredCyclones();
          if (stored.length > 0) {
            setIsModelConnected(true);
          }
        }
      }
    };

    checkModelStatus();
    const interval = setInterval(checkModelStatus, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Sync with window events from cycloneService
  useEffect(() => {
    const handleCycloneUpdate = (e) => {
      setDetectedCyclone(e.detail);
      if (e.detail) {
        setIsModelConnected(true);
      }
    };

    window.addEventListener('cyclonex:cyclone-updated', handleCycloneUpdate);
    return () => window.removeEventListener('cyclonex:cyclone-updated', handleCycloneUpdate);
  }, []);

  const registerCycloneAnalysis = (analysisData) => {
    const trackedStorm = createTrackedCycloneFromAnalysis(analysisData);
    cycloneService.saveDetectedCyclone(trackedStorm);

    const alert = createAlertFromCyclone(trackedStorm);
    alertService.saveAlert(alert);

    setDetectedCyclone(trackedStorm);
    setIsModelConnected(true);
    return trackedStorm;
  };

  const clearCycloneAnalysis = () => {
    cycloneService.clearDetectedCyclone();
    alertService.clearAlerts();
    setDetectedCyclone(null);
  };

  return (
    <AIModelContext.Provider
      value={{
        isModelConnected,
        setIsModelConnected,
        isDetecting,
        setIsDetecting,
        modelTelemetry,
        setModelTelemetry,
        detectedCyclone,
        registerCycloneAnalysis,
        clearCycloneAnalysis,
      }}
    >
      {children}
    </AIModelContext.Provider>
  );
};

export const useAIModel = () => {
  const context = useContext(AIModelContext);
  if (!context) {
    throw new Error('useAIModel must be used within an AIModelProvider');
  }
  return context;
};

export default AIModelContext;
