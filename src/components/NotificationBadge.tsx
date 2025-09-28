import React from 'react';
import { Badge } from '@/components/ui/badge';

interface NotificationBadgeProps {
  count: number;
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ 
  count, 
  className = '',
  variant = 'destructive'
}) => {
  if (count === 0) return null;

  return (
    <Badge 
      variant={variant}
      className={`ml-1 px-1.5 py-0.5 text-xs font-medium ${className}`}
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
};

export default NotificationBadge;