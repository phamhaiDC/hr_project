'use client';

import { useEffect, useState } from 'react';

export interface GeoState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;   // metres
  error: string | null;
  loading: boolean;
}

/**
 * Watches the device GPS position using the Geolocation API.
 * Updates as the position changes (watchPosition).
 * Returns null coordinates until the first fix arrives.
 */
export function useGeolocation(): GeoState {
  const [state, setState] = useState<GeoState>({
    lat: null,
    lng: null,
    accuracy: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ lat: null, lng: null, accuracy: null, error: 'Geolocation is not supported by your browser.', loading: false });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          error: null,
          loading: false,
        });
      },
      (err) => {
        const messages: Record<number, string> = {
          1: 'Location permission denied. Please allow location access.',
          2: 'Location unavailable. Check your GPS signal.',
          3: 'Location request timed out.',
        };
        setState((s) => ({
          ...s,
          error: messages[err.code] ?? err.message,
          loading: false,
        }));
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
