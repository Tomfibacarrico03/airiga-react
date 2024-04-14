import React, { createContext, useState, useContext } from 'react';

const ReloadContext = createContext();

export const useReload = () => useContext(ReloadContext);

export const ReloadProvider = ({ children }) => {
  const [key, setKey] = useState(0);

  const triggerReload = () => {
    setKey(prev => prev + 1);
  };

  return (
    <ReloadContext.Provider value={{ triggerReload, key }}>
      {children}
    </ReloadContext.Provider>
  );
};