import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Truck, MapPin } from 'lucide-react';

interface DeliveryMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  deliveryCost: number;
  deliveryRadius?: number;
  sellerLocation?: string;
  onConfirm: (method: 'delivery' | 'pickup') => void;
}

export function DeliveryMethodDialog({
  open,
  onOpenChange,
  deliveryAvailable,
  pickupAvailable,
  deliveryCost,
  deliveryRadius,
  sellerLocation,
  onConfirm
}: DeliveryMethodDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<'delivery' | 'pickup'>(
    pickupAvailable ? 'pickup' : 'delivery'
  );

  const handleConfirm = () => {
    onConfirm(selectedMethod);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Delivery Method</DialogTitle>
          <DialogDescription>
            Choose how you would like to receive this item.
          </DialogDescription>
        </DialogHeader>
        
        <RadioGroup value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as 'delivery' | 'pickup')}>
          <div className="space-y-4">
            {pickupAvailable && (
              <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer">
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Collection / Pickup</p>
                      <p className="text-sm text-muted-foreground">Free - Collect from seller</p>
                    </div>
                  </div>
                </Label>
              </div>
            )}
            
            {deliveryAvailable && (
              <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                  <div className="flex items-start gap-2">
                    <Truck className="h-5 w-5 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">Delivery</p>
                      <p className="text-sm text-muted-foreground">
                        {deliveryCost > 0 ? `£${deliveryCost.toFixed(2)} delivery charge` : 'Free delivery'}
                      </p>
                      {deliveryRadius && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Available within {deliveryRadius} miles{sellerLocation ? ` of ${sellerLocation}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </Label>
              </div>
            )}
          </div>
        </RadioGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Continue to Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}