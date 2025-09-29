import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format condition to proper case with explanation
export function formatCondition(condition: string): string {
  if (!condition) return '';
  
  const conditionMap: Record<string, string> = {
    'new': 'New (unopened/unused)',
    'like_new': 'Like New (minimal use, excellent condition)',
    'excellent': 'Excellent (lightly used, very good condition)',
    'good': 'Good (used with normal wear)',
    'fair': 'Fair (used with visible wear but functional)',
    'salvage': 'Salvage (heavily used, suitable for repurposing)',
    'parts_repair': 'Parts/Repair (damaged, may need repair or for parts only)',
  };
  
  return conditionMap[condition] || condition
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Format reason for selling to human-readable text with explanation
export function formatReasonForSelling(reason: string): string {
  if (!reason) return '';
  
  const reasonMap: Record<string, string> = {
    'surplus': 'Surplus (excess materials from project)',
    'incorrect_order': 'Incorrect Order (wrong item ordered)',
    'saving_from_skip': 'Saving from Skip (rescued from waste)',
    'no_longer_needed': 'No Longer Needed (project cancelled/changed)',
    'downsizing': 'Downsizing (clearing space)',
    'end_of_project': 'End of Project (leftover materials)',
    'upgrading': 'Upgrading (replacing with better materials)',
    'other': 'Other',
    // Legacy database values
    'excess_materials': 'Surplus (excess materials from project)',
    'wrong_specification': 'Incorrect Order (wrong item ordered)',
    'project_completion': 'End of Project (leftover materials)',
    'downsizing_business': 'Downsizing (clearing space)',
    'equipment_upgrade': 'Upgrading (replacing with better materials)',
    'seasonal_clearance': 'Downsizing (clearing space)',
  };
  
  return reasonMap[reason] || reason
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
