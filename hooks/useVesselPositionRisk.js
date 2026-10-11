'use client';

import { useEffect, useState } from 'react';

export function useVesselPositionRisk(vessel) {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!vessel?.currentPosition) return;

    const controller =
      new AbortController();

    const [lat, lon] =
      vessel.currentPosition;

    async function loadRisk() {
      setState(previous => ({
        ...previous,
        loading: true,
        error: null,
      }));

      try {
        const params =
          new URLSearchParams({
            vesselId: vessel.id,
            lat: String(lat),
            lon: String(lon),
            iceClass:
              vessel.iceClass ||
              'UNCLASSED',
          });

        const response =
          await fetch(
            `/api/vessel-risk?${params}`,
            {
              signal:
                controller.signal,
              cache: 'no-store',
            }
          );

        if (!response.ok) {
          throw new Error(
            `Risk API returned ${response.status}`
          );
        }

        const data =
          await response.json();

        if (!data?.success) {
          throw new Error(
            data?.error ||
              'Risk calculation failed'
          );
        }

        setState({
          data,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (
          error?.name ===
          'AbortError'
        ) {
          return;
        }

        setState({
          data: null,
          loading: false,
          error:
            error?.message ||
            'Unknown risk error',
        });
      }
    }

    loadRisk();

    return () =>
      controller.abort();
  }, [vessel]);

  return state;
}

export default useVesselPositionRisk;