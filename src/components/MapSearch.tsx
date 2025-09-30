import React, { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
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
  condition?: "new" | "like_new" | "excellent" | "good" | "fair" | "salvage" | "parts_repair";
  images?: string[];
  quantity?: number;
  delivery_available?: boolean;
  pickup_available?: boolean;
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
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const idleTimeoutRef = useRef<number | null>(null);

// Debug flags
  const [debug, setDebug] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState({
    invoked: false,
    apiKeyOk: false,
    apiKeySnippet: '',
    scriptLoaded: false,
    googlePresent: false,
    containerReady: false,
    containerW: 0,
    containerH: 0,
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
      // Wait for map container to mount and have a size (Safari can be late here)
      let attempts = 0;
      while (attempts < 100) { // up to ~5s
        const el = mapRef.current;
        const ready = !!el && el.offsetWidth > 0 && el.offsetHeight > 0;
        if (ready) {
          setDebugInfo((d) => ({ ...d, containerReady: true, containerW: el!.offsetWidth, containerH: el!.offsetHeight }));
          break;
        }
        setDebugInfo((d) => ({ ...d, containerReady: false, containerW: el?.offsetWidth || 0, containerH: el?.offsetHeight || 0 }));
        await new Promise((r) => setTimeout(r, 50));
        attempts++;
      }
      if (!mapRef.current || mapRef.current.offsetWidth === 0 || mapRef.current.offsetHeight === 0) {
        setDebugInfo((d) => ({ ...d, error: 'Map container not ready (size 0)' }));
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setDebugInfo((d) => ({ ...d, error: '' }));
        const apiKey = await getGoogleMapsApiKey();
        const snippet = apiKey ? `${apiKey.slice(0,4)}…${apiKey.slice(-4)}` : '';
        setDebugInfo((d) => ({ ...d, invoked: true, apiKeyOk: !!apiKey, apiKeySnippet: snippet }));
        if (!apiKey) {
          console.error('Google Maps API key not available - check edge function');
          setIsLoading(false);
          return;
        }
        
        const loader = new Loader({
          apiKey,
          version: 'weekly',
          language: 'en-GB',
          region: 'GB',
          
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
          gestureHandling: 'greedy',
          clickableIcons: false,
        });

        // Debounced bounds update on idle for performance
        mapInstance.addListener('idle', () => {
          if (idleTimeoutRef.current) window.clearTimeout(idleTimeoutRef.current);
          idleTimeoutRef.current = window.setTimeout(() => {
            const bounds = mapInstance.getBounds();
            if (bounds && onBoundsChange) {
              onBoundsChange(bounds);
            }
          }, 250);
        });

        const infoWindowInstance = new (window as any).google.maps.InfoWindow();
        
        setMap(mapInstance);
        setInfoWindow(infoWindowInstance);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('Error loading Google Maps:', error);
        
        if (msg.includes('RefererNotAllowedMapError')) {
          setDebugInfo((d) => ({ ...d, error: `Domain authorization required. Add ${window.location.origin} to Google Cloud Console > APIs & Services > Credentials > Web Client > Authorized JavaScript origins` }));
        } else {
          setDebugInfo((d) => ({ ...d, error: msg }));
        }
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

  // Condition configuration for badges
  const conditionConfig: Record<string, { label: string; color: string }> = {
    new: { label: "NEW", color: "#22C55E" },
    like_new: { label: "LIKE NEW", color: "#10B981" },
    excellent: { label: "EXCELLENT", color: "#3B82F6" },
    good: { label: "GOOD", color: "#F59E0B" },
    fair: { label: "FAIR", color: "#64748B" },
    salvage: { label: "SALVAGE", color: "#EF4444" },
    parts_repair: { label: "PARTS/REPAIR", color: "#DC2626" }
  };

  // Update markers when listings change
  useEffect(() => {
    if (!map || !listings.length) return;

    // Clear existing clusters and markers
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }
    markers.forEach(marker => {
      marker.setMap(null);
      // Clear any listeners to prevent memory leaks
      (window as any).google.maps.event.clearInstanceListeners(marker);
    });
    
    // Close any open info windows to prevent conflicts
    if (infoWindow) {
      infoWindow.close();
    }
    
    const newMarkers: any[] = [];
    // Create bounds to fit all listings
    const bounds = new (window as any).google.maps.LatLngBounds();

    listings.forEach(listing => {
      if (!listing.latitude || !listing.longitude) return;

      const position = { lat: listing.latitude, lng: listing.longitude };
      
      // Create basic marker for simple setup
      const marker = new (window as any).google.maps.Marker({
        position,
        map,
        title: listing.title,
        label: {
          text: listing.price === 0 ? 'FREE' : `£${listing.price.toLocaleString()}`,
          color: 'white',
          fontWeight: 'bold'
        }
      });

      // Add click listener for info window
      marker.addListener('click', (e: any) => {
        // Prevent event bubbling that might cause re-renders
        e.stop?.();
        
        setSelectedListing(listing);
        
        // Get condition config
        const conditionInfo = listing.condition ? conditionConfig[listing.condition] : null;
        
        // Build delivery/pickup badges
        const deliveryOptions = [];
        if (listing.pickup_available) {
          deliveryOptions.push(`<svg class="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg> Pickup`);
        }
        if (listing.delivery_available) {
          deliveryOptions.push(`<svg class="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg> Delivery`);
        }
        
        const content = `
          <div class="p-3 max-w-[280px]">
            <h3 class="font-semibold text-sm mb-2 line-clamp-2">${listing.title}</h3>
            <p class="text-lg font-bold mb-2" style="color: hsl(var(--primary))">
              ${listing.price === 0 ? 'FREE' : `£${listing.price.toLocaleString()}`}
            </p>
            <div class="flex flex-wrap gap-1 mb-2">
              ${conditionInfo ? `<span class="inline-block px-2 py-0.5 text-[10px] font-semibold text-white rounded-full" style="background-color: ${conditionInfo.color}">${conditionInfo.label}</span>` : ''}
              ${listing.quantity && listing.quantity > 1 ? `<span class="inline-block px-2 py-0.5 text-[10px] font-semibold text-white rounded-full" style="background-color: #22C55E">${listing.quantity} UNITS</span>` : ''}
            </div>
            <p class="text-xs mb-2" style="color: hsl(var(--muted-foreground))">
              <span class="inline-flex items-center gap-1">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
                </svg>
                ${listing.public_location}
              </span>
            </p>
            ${deliveryOptions.length > 0 ? `<p class="text-xs mb-3" style="color: hsl(var(--muted-foreground))">${deliveryOptions.join(' • ')}</p>` : ''}
            <button onclick="window.selectMapListing('${listing.id}')" class="w-full mt-2 px-3 py-1.5 text-xs font-medium rounded transition-colors" style="background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground))">
              View Details
            </button>
          </div>
        `;

        if (infoWindow) {
          // Close any existing info windows first
          infoWindow.close();
          // Add a small delay to ensure clean state
          setTimeout(() => {
            infoWindow.setContent(content);
            infoWindow.open(map, marker);
          }, 50);
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
    // Cluster markers for performance
    clustererRef.current = new MarkerClusterer({ map, markers: newMarkers });

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
      // Clear any remaining markers
      newMarkers.forEach(marker => {
        (window as any).google.maps.event.clearInstanceListeners(marker);
      });
    };
  }, [map, listings?.length, infoWindow]); // Only re-run when listings count changes, not the entire array

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

  // Removed early return on loading to ensure map container always mounts for Safari/iOS


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
                <li>Container ready: <span className="font-mono">{String(debugInfo.containerReady)}</span></li>
                <li>Container size: <span className="font-mono">{debugInfo.containerW}x{debugInfo.containerH}</span></li>
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
                <li>Container ready: <span className="font-mono">{String(debugInfo.containerReady)}</span></li>
                <li>Container size: <span className="font-mono">{debugInfo.containerW}x{debugInfo.containerH}</span></li>
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