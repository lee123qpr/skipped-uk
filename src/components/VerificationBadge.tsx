import { CheckCircle, Mail, DollarSign, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VerificationBadgeProps {
  type: 'email' | 'stripe' | 'identity';
  verified: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const badgeConfig = {
  email: {
    icon: Mail,
    label: 'Email Verified',
    color: 'bg-blue-500/10 text-blue-700 border-blue-200',
    description: 'Email address verified'
  },
  stripe: {
    icon: DollarSign,
    label: 'Payment Verified',
    color: 'bg-green-500/10 text-green-700 border-green-200',
    description: 'Stripe payment account verified'
  },
  identity: {
    icon: ShieldCheck,
    label: 'ID Verified',
    color: 'bg-purple-500/10 text-purple-700 border-purple-200',
    description: 'Identity verified by Skipped'
  }
};

const sizeConfig = {
  sm: { icon: 'h-3 w-3', badge: 'px-2 py-0.5 text-xs' },
  md: { icon: 'h-3.5 w-3.5', badge: 'px-2.5 py-1 text-xs' },
  lg: { icon: 'h-4 w-4', badge: 'px-3 py-1.5 text-sm' }
};

export function VerificationBadge({ 
  type, 
  verified, 
  size = 'md', 
  showLabel = true,
  className = '' 
}: VerificationBadgeProps) {
  if (!verified) return null;

  const config = badgeConfig[type];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`${config.color} ${sizes.badge} font-medium flex items-center gap-1.5 ${className}`}
          >
            <Icon className={sizes.icon} />
            {showLabel && <span>{config.label}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface VerificationBadgesProps {
  emailVerified?: boolean;
  stripeVerified?: boolean;
  identityVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function VerificationBadges({
  emailVerified = false,
  stripeVerified = false,
  identityVerified = false,
  size = 'md',
  showLabel = true,
  className = ''
}: VerificationBadgesProps) {
  const hasAnyVerification = emailVerified || stripeVerified || identityVerified;

  if (!hasAnyVerification) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <VerificationBadge type="email" verified={emailVerified} size={size} showLabel={showLabel} />
      <VerificationBadge type="stripe" verified={stripeVerified} size={size} showLabel={showLabel} />
      <VerificationBadge type="identity" verified={identityVerified} size={size} showLabel={showLabel} />
    </div>
  );
}
