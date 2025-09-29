import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format condition to proper case
export function formatCondition(condition: string): string {
  if (!condition) return '';
  
  return condition
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Format reason for selling to human-readable text
export function formatReasonForSelling(reason: string): string {
  if (!reason) return '';
  
  const reasonMap: Record<string, string> = {
    'saving_from_skip': 'Saving from Skip',
    'excess_materials': 'Excess Materials',
    'wrong_specification': 'Wrong Specification',
    'project_completion': 'Project Completion',
    'downsizing_business': 'Downsizing Business',
    'equipment_upgrade': 'Equipment Upgrade',
    'seasonal_clearance': 'Seasonal Clearance',
    'other': 'Other',
  };
  
  return reasonMap[reason] || reason
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
