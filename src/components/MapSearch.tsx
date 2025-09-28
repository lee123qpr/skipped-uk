import React, { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getGoogleMapsApiKey } from '@/lib/googleMaps';

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
}

const MapSearch: React.FC<MapSearchProps> = ({
  listings,
  onListingSelect,
  onBoundsChange,
  className,
  height = '400px',
  showSearchButton = true
}) => {
  const [map, setMap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [infoWindow, setInfoWindow] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return;

      try {
        setIsLoading(true);
        
        const apiKey = await getGoogleMapsApiKey();
        if (!apiKey) {
          console.error('Google Maps API key not available');
          return;
        }
        
        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['maps']
        });

        await loader.load();

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
        console.error('Error loading Google Maps:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeMap();
  }, [onBoundsChange]);

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