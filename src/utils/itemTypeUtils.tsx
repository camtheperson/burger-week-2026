// Utility for consistent burger type tag styling across components
import type { ReactElement } from 'react';

export type ItemType = 'meat' | 'vegetarian' | 'vegan';

export function getTypeTagStyles(type: ItemType): string {
  switch (type) {
    case 'meat':
      return 'bg-red-100 text-red-800';
    case 'vegetarian':
      return 'bg-orange-100 text-orange-800';
    case 'vegan':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function renderTypeTags(
  primaryType: ItemType,
  allTypes?: ItemType[],
  size: 'sm' | 'md' = 'md'
): ReactElement[] {
  const types = allTypes && allTypes.length > 1 ? allTypes : [primaryType];
  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5' 
    : 'text-sm px-3 py-1';
  
  return types.map((type) => (
    <span
      key={type}
      className={`${sizeClasses} rounded-full capitalize font-medium ${getTypeTagStyles(type)}`}
    >
      {type}
    </span>
  ));
}