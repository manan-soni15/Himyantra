'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { vessels } from '@/data/vessels';

const VesselContext = createContext({
  activeVessel: vessels[0],
  activeVesselId: vessels[0].id,
  setActiveVesselId: () => {},
  vessels: vessels,
});

export function VesselProvider({ children }) {
  const [activeVesselId, setActiveVesselIdState] = useState(vessels[0].id);

  useEffect(() => {
    const saved = localStorage.getItem('himyantra_active_vessel');
    if (saved && vessels.some((v) => v.id === saved)) {
      setActiveVesselIdState(saved);
    }
  }, []);

  const setActiveVesselId = (id) => {
    setActiveVesselIdState(id);
    localStorage.setItem('himyantra_active_vessel', id);
  };

  const activeVessel = vessels.find((v) => v.id === activeVesselId) || vessels[0];

  return (
    <VesselContext.Provider
      value={{
        activeVessel,
        activeVesselId,
        setActiveVesselId,
        vessels,
      }}
    >
      {children}
    </VesselContext.Provider>
  );
}

export function useVessel() {
  return useContext(VesselContext);
}

export default VesselContext;
