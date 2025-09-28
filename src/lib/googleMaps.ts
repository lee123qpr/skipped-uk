import { supabase } from '@/integrations/supabase/client';

export async function getGoogleMapsApiKey(): Promise<string> {
  // In development, use a placeholder - this will be replaced by the edge function
  if (process.env.NODE_ENV === 'development') {
    return 'GOOGLE_MAPS_API_KEY_PLACEHOLDER';
  }
  
  try {
    // Get the API key from Supabase edge function which has access to secrets
    const { data, error } = await supabase.functions.invoke('get-google-maps-key');
    
    if (error) {
      console.error('Error fetching Google Maps API key:', error);
      return '';
    }
    
    return data?.apiKey || '';
  } catch (error) {
    console.error('Error fetching Google Maps API key:', error);
    return '';
  }
}

export interface LocationBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export function isLocationWithinBounds(
  lat: number,
  lng: number,
  bounds: LocationBounds
): boolean {
  return lat >= bounds.south && lat <= bounds.north && 
         lng >= bounds.west && lng <= bounds.east;
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function geocodeAddress(address: string): Promise<{latitude: number, longitude: number} | null> {
  return new Promise((resolve) => {
    if (!(window as any).google?.maps?.Geocoder) {
      resolve(null);
      return;
    }

    const geocoder = new (window as any).google.maps.Geocoder();
    geocoder.geocode({ address }, (results: any, status: string) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        resolve({
          latitude: location.lat(),
          longitude: location.lng()
        });
      } else {
        resolve(null);
      }
    });
  });
}