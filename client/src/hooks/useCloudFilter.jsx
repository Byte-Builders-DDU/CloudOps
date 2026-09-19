import React, { createContext, useContext, useState, useCallback } from 'react';

const CloudFilterContext = createContext(null);

export function CloudFilterProvider({ children }) {
  const [selectedProvider, setSelectedProvider] = useState('ALL'); // 'ALL' | 'AWS' | 'Azure' | 'GCP'
  const [selectedRegion, setSelectedRegion] = useState('ALL'); // 'ALL' | 'Mumbai' | 'Singapore' | 'East US' | 'Frankfurt'
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const resetFilters = useCallback(() => {
    setSelectedProvider('ALL');
    setSelectedRegion('ALL');
  }, []);

  const value = {
    selectedProvider,
    setSelectedProvider,
    selectedRegion,
    setSelectedRegion,
    refreshKey,
    triggerRefresh,
    resetFilters,
  };

  return (
    <CloudFilterContext.Provider value={value}>
      {children}
    </CloudFilterContext.Provider>
  );
}

export function useCloudFilter() {
  const context = useContext(CloudFilterContext);
  if (!context) {
    throw new Error('useCloudFilter must be used within a CloudFilterProvider');
  }
  return context;
}
