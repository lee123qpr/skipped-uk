import React, { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getGoogleMapsApiKey } from '@/lib/googleMaps';
import { supabase } from '@/integrations/supabase/client';

interface Listing {
  id: string;
  title: string;
  price: number;
  public_location: string;
  latitude: number;
  longitude: number;
  category?: string;
  condition?: string;
  images?: string[];
}

interface MapSearchProps {
  listings: Listing[];
  onListingSelect?: (listing: Listing) => void;
  onBoundsChange?: (bounds: any) => void;
  className?: string;
  height?: string;
  showSearchButton?: boolean;
  showDebug?: boolean;
}

const MapSearch: React.FC<MapSearchProps> = ({
  listings,
  onListingSelect,
  onBoundsChange,
  className,
  height = '400px',
  showSearchButton = true,
  showDebug = false,
}) => {
  const [map, setMap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [infoWindow, setInfoWindow] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);

// Debug flags
  const [debug, setDebug] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState({
    invoked: false,
    apiKeyOk: false,
    apiKeySnippet: '',
    scriptLoaded: false,
    googlePresent: false,
    error: ''
  });

  const debugEnabled = debug || showDebug;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDebug(params.get('debug') === 'maps');
  }, []);

  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return;

      try {
        setIsLoading(true);
        setDebugInfo((d) => ({ ...d, error: '' }));
        const apiKey = await getGoogleMapsApiKey();
        const snippet = apiKey ? `${apiKey.slice(0,4)}…${apiKey.slice(-4)}` : '';
        if (debugEnabled) console.log('Google Maps API Key Status:', apiKey ? 'Retrieved' : 'Not available', snippet);
        setDebugInfo((d) => ({ ...d, invoked: true, apiKeyOk: !!apiKey, apiKeySnippet: snippet }));
        if (!apiKey) {
          console.error('Google Maps API key not available - check edge function');
          setIsLoading(false);
          return;
        }
        
        const loader = new Loader({
          apiKey,
          version: 'weekly'
        });

        await loader.load();
        setDebugInfo((d) => ({ ...d, scriptLoaded: true, googlePresent: !!(window as any).google?.maps }));

        // Default to UK center
        const mapInstance = new (window as any).google.maps.Map(mapRef.current, {
          center: { lat: 54.5, lng: -2.5 }, // UK center
          zoom: 6,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        // Add bounds change listener
        mapInstance.addListener('bounds_changed', () => {
          const bounds = mapInstance.getBounds();
          if (bounds && onBoundsChange) {
            onBoundsChange(bounds);
          }
        });

        const infoWindowInstance = new (window as any).google.maps.InfoWindow();
        
        setMap(mapInstance);
        setInfoWindow(infoWindowInstance);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('Error loading Google Maps:', error);
        setDebugInfo((d) => ({ ...d, error: msg }));
      } finally {
        setIsLoading(false);
      }
    };

    initializeMap();
  }, [onBoundsChange]);

  // Debug: capture script errors
  useEffect(() => {
    if (!debugEnabled) return;
    const handler = (e: ErrorEvent) => {
      try {
        if (typeof (e as any).filename === 'string' && (e as any).filename.includes('maps.googleapis.com')) {
          setDebugInfo((d) => ({ ...d, error: e.message }));
        }
      } catch {}
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, [debugEnabled]);

  // Update markers when listings change
  useEffect(() => {
    if (!map || !listings.length) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: any[] = [];

    // Create bounds to fit all listings
    const bounds = new (window as any).google.maps.LatLngBounds();

    listings.forEach(listing => {
      if (!listing.latitude || !listing.longitude) return;

      const position = { lat: listing.latitude, lng: listing.longitude };
      
      // Create custom marker
      const marker = new (window as any).google.maps.Marker({
        position,
        map,
        title: listing.title,
        icon: {
          url: '/api/placeholder/32/32', // This would be a custom marker icon
          scaledSize: new (window as any).google.maps.Size(32, 32),
          anchor: new (window as any).google.maps.Point(16, 32)
        },
        animation: (window as any).google.maps.Animation.DROP
      });

      // Add click listener for info window
      marker.addListener('click', () => {
        setSelectedListing(listing);
        
        const content = `
          <div class="p-3 max-w-xs">
            <h3 class="font-semibold text-sm mb-1">${listing.title}</h3>
            <p class="text-lg font-bold text-primary mb-2">£${listing.price.toLocaleString()}</p>
            <p class="text-xs text-muted-foreground mb-2">
              <span class="inline-flex items-center gap-1">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
                </svg>
                ${listing.public_location}
              </span>
            </p>
            ${listing.condition ? `<span class="inline-block px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-full mb-2">${listing.condition}</span>` : ''}
            <button onclick="window.selectMapListing('${listing.id}')" class="w-full mt-2 px-3 py-1 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90">
              View Details
            </button>
          </div>
        `;

        if (infoWindow) {
          infoWindow.setContent(content);
          infoWindow.open(map, marker);
        }

        if (onListingSelect) {
          onListingSelect(listing);
        }
      });

      newMarkers.push(marker);
      bounds.extend(position);
    });

    // Fit map to show all markers
    if (listings.length > 0) {
      map.fitBounds(bounds);
      
      // Zoom out a bit if only one listing
      if (listings.length === 1) {
        map.setZoom(12);
      }
    }

    setMarkers(newMarkers);

    // Add global function for info window button clicks
    (window as any).selectMapListing = (listingId: string) => {
      const listing = listings.find(l => l.id === listingId);
      if (listing && onListingSelect) {
        onListingSelect(listing);
      }
    };

    return () => {
      // Cleanup global function
      delete (window as any).selectMapListing;
    };
  }, [map, listings, onListingSelect, infoWindow]);

  // Debug helper to call edge function directly
  const testEdge = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-google-maps-key');
      const apiKey = data?.apiKey as string | undefined;
      setDebugInfo((d) => ({
        ...d,
        invoked: true,
        apiKeyOk: !!apiKey && !error,
        apiKeySnippet: apiKey ? `${apiKey.slice(0,4)}…${apiKey.slice(-4)}` : '',
        error: error?.message || ''
      }));
      console.log('Edge function response', { hasKey: !!apiKey, error });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setDebugInfo((d) => ({ ...d, error: msg }));
    }
  };

  const handleSearchThisArea = () => {
    if (!map) return;
    
    const bounds = map.getBounds();
    if (bounds && onBoundsChange) {
      onBoundsChange(bounds);
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("relative", className)}>
        <CardContent className="p-0">
          <div 
            className="flex items-center justify-center bg-muted/20"
            style={{ height }}
          >
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-0">
        <div 
          ref={mapRef}
          className="w-full"
          style={{ height }}
        />
        
        {debugEnabled && (
          <>
            <div className="hidden sm:block absolute top-2 left-2 right-2 sm:top-2 sm:right-2 sm:left-auto z-50 rounded-md border border-border bg-background/95 backdrop-blur p-3 sm:p-4 text-sm sm:text-xs shadow-lg max-w-sm" data-testid="maps-debug">
              <div className="font-medium mb-2 text-primary">Maps Debug</div>
              <ul className="space-y-1 text-foreground">
                <li>Edge called: <span className="font-mono">{String(debugInfo.invoked)}</span></li>
                <li>API key: <span className="font-mono">{debugInfo.apiKeyOk ? `OK (${debugInfo.apiKeySnippet})` : 'Missing/blocked'}</span></li>
                <li>SDK loaded: <span className="font-mono">{String(debugInfo.scriptLoaded)}</span></li>
                <li>google.maps: <span className="font-mono">{String(debugInfo.googlePresent)}</span></li>
                <li>Markers: <span className="font-mono">{listings.length}</span></li>
                {debugInfo.error && <li className="text-destructive font-medium">Error: {debugInfo.error}</li>}
              </ul>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={testEdge} className="text-xs">Test API key</Button>
              </div>
            </div>

            <div className="sm:hidden border-t border-border bg-background/95 p-3 text-sm" data-testid="maps-debug-mobile" role="region" aria-label="Maps debug information">
              <div className="font-medium mb-2 text-primary">Maps Debug</div>
              <ul className="space-y-1 text-foreground">
                <li>Edge called: <span className="font-mono">{String(debugInfo.invoked)}</span></li>
                <li>API key: <span className="font-mono">{debugInfo.apiKeyOk ? `OK (${debugInfo.apiKeySnippet})` : 'Missing/blocked'}</span></li>
                <li>SDK loaded: <span className="font-mono">{String(debugInfo.scriptLoaded)}</span></li>
                <li>google.maps: <span className="font-mono">{String(debugInfo.googlePresent)}</span></li>
                <li>Markers: <span className="font-mono">{listings.length}</span></li>
                {debugInfo.error && <li className="text-destructive font-medium">Error: {debugInfo.error}</li>}
              </ul>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={testEdge} className="text-xs">Test API key</Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-xs"
                  onClick={() => {
                    const payload = JSON.stringify({
                      invoked: debugInfo.invoked,
                      apiKeyOk: debugInfo.apiKeyOk,
                      apiKeySnippet: debugInfo.apiKeySnippet,
                      scriptLoaded: debugInfo.scriptLoaded,
                      googlePresent: debugInfo.googlePresent,
                      markers: listings.length,
                      error: debugInfo.error,
                    }, null, 2);
                    navigator.clipboard?.writeText(payload).catch(() => {});
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
          </>
        )}
        
        {showSearchButton && (
          <div className="absolute top-4 left-4 right-4">
            <Button 
              onClick={handleSearchThisArea}
              variant="secondary"
              size="sm"
              className="shadow-lg"
            >
              <Search className="h-4 w-4 mr-2" />
              Search this area
            </Button>
          </div>
        )}

        <div className="absolute bottom-4 left-4">
          <Badge variant="secondary" className="shadow-lg">
            {listings.length} listing{listings.length !== 1 ? 's' : ''} shown
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapSearch;