import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Plane, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface HolidayBannerProps {
  holidayMessage?: string;
  holidayStartDate?: string;
  holidayEndDate?: string;
  variant?: 'listing' | 'conversation' | 'compact';
}

export const HolidayBanner = ({ 
  holidayMessage, 
  holidayStartDate, 
  holidayEndDate,
  variant = 'listing'
}: HolidayBannerProps) => {
  if (variant === 'compact') {
    return (
      <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300">
        <Plane className="h-3 w-3 mr-1" />
        On Holiday
      </Badge>
    );
  }

  if (variant === 'conversation') {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-md border border-amber-200 dark:border-amber-800">
        <Plane className="h-4 w-4 flex-shrink-0" />
        <span className="font-medium">This seller is currently on holiday</span>
      </div>
    );
  }

  return (
    <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700">
      <div className="flex items-start gap-3">
        <Plane className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="flex-1 space-y-2">
          <AlertDescription className="text-amber-900 dark:text-amber-200 font-medium">
            Seller is currently on holiday
          </AlertDescription>
          {holidayMessage && (
            <p className="text-sm text-amber-800 dark:text-amber-300">
              {holidayMessage}
            </p>
          )}
          {(holidayStartDate || holidayEndDate) && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
              <Calendar className="h-4 w-4" />
              {holidayStartDate && holidayEndDate && (
                <span>
                  {format(new Date(holidayStartDate), 'dd MMM')} - {format(new Date(holidayEndDate), 'dd MMM yyyy')}
                </span>
              )}
              {holidayStartDate && !holidayEndDate && (
                <span>Since {format(new Date(holidayStartDate), 'dd MMM yyyy')}</span>
              )}
              {!holidayStartDate && holidayEndDate && (
                <span>Until {format(new Date(holidayEndDate), 'dd MMM yyyy')}</span>
              )}
            </div>
          )}
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Messages will receive an automatic response. Response times may be delayed.
          </p>
        </div>
      </div>
    </Alert>
  );
};
