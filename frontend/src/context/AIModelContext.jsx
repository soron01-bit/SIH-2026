import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AIModelContext = createContext();

export const AIModelProvider = ({ children }) => {
  // Model connection and live detection state
  const [isModelConnected, setIsModelConnected] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [modelTelemetry, setModelTelemetry] = useState(null);

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
        // Backend or model not yet connected; remains in standby
        if (isMounted) {
          setIsModelConnected(false);
          setIsDetecting(false);
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

  return (
    <AIModelContext.Provider
      value={{
        isModelConnected,
        setIsModelConnected,
        isDetecting,
        setIsDetecting,
        modelTelemetry,
        setModelTelemetry,
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
