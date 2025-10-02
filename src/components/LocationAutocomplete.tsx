import React, { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getGoogleMapsApiKey } from '@/lib/googleMaps';
interface LocationData {
  fullAddress: string;
  publicLocation: string; // Just postcode/town for public display
  latitude: number;
  longitude: number;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}
interface LocationAutocompleteProps {
  value: string;
  onChange: (locationData: LocationData) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}
const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Enter postcode or town/city...",
  label,
  required = false,
  disabled = false,
  className,
  id
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const autocompleteRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setInputValue(value);
  }, [value]);
  useEffect(() => {
    const initializeAutocomplete = async () => {
      if (!inputRef.current || !(inputRef.current instanceof HTMLInputElement)) {
        console.error('Invalid input element for Google Maps Autocomplete');
        return;
      }
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
          libraries: ['places'],
          language: 'en-GB',
          region: 'GB'
        });
        await loader.load();

        // Type guard to ensure inputRef.current is still valid HTMLInputElement
        if (!inputRef.current || !(inputRef.current instanceof HTMLInputElement)) {
          console.error('Input element became invalid during initialization');
          return;
        }

        // Create autocomplete with UK/IE restriction
        const autocompleteInstance = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
          // types removed to avoid deprecated behaviour causing freezes on some devices
          componentRestrictions: {
            country: ['gb', 'ie']
          },
          fields: ['address_components', 'formatted_address', 'geometry', 'place_id', 'name']
        });

        // Add place changed listener
        autocompleteInstance.addListener('place_changed', () => {
          const place = autocompleteInstance.getPlace();
          if (!place.geometry?.location || !place.address_components) {
            return;
          }

          // Extract address components
          const addressComponents = place.address_components;
          let town = '';
          let postcode = '';
          for (const component of addressComponents) {
            const types = component.types;
            if (types.includes('postal_town') || types.includes('locality')) {
              town = component.long_name;
            }
            if (types.includes('postal_code')) {
              postcode = component.long_name;
            }
          }

          // Create public location (postcode + town, or just town if no postcode)
          const publicLocation = postcode && town ? `${postcode}, ${town}` : town || place.formatted_address?.split(',')[0] || 'Location';
          const locationData: LocationData = {
            fullAddress: place.formatted_address || '',
            publicLocation,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
            bounds: place.geometry.viewport ? {
              north: place.geometry.viewport.getNorthEast().lat(),
              south: place.geometry.viewport.getSouthWest().lat(),
              east: place.geometry.viewport.getNorthEast().lng(),
              west: place.geometry.viewport.getSouthWest().lng()
            } : undefined
          };
          setInputValue(publicLocation);
          onChange(locationData);
        });
        autocompleteRef.current = autocompleteInstance;
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initializeAutocomplete();
    return () => {
      if (autocompleteRef.current) {
        (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    // If user clears the input, reset the location data
    if (!e.target.value.trim()) {
      onChange({
        fullAddress: '',
        publicLocation: '',
        latitude: 0,
        longitude: 0
      });
    }
  };
  return <div className="space-y-2">
      {label && <Label htmlFor={id} className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {label} {required && '*'}
        </Label>}
      <div className="relative">
        <Input ref={inputRef} id={id} value={inputValue} onChange={handleInputChange} placeholder={placeholder} required={required} disabled={disabled} className={cn(className)} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} enterKeyHint="search" />
        {isLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>}
      </div>
      {!isLoading && autocompleteRef.current}
    </div>;
};
export default LocationAutocomplete;