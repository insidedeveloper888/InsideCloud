/**
 * TagBadge Component
 *
 * Display a tag as a colored badge
 */

import React from 'react';
import { X } from 'lucide-react';

export default function TagBadge({ tag, onRemove, size = 'sm', showRemove = false }) {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-medium text-white ${sizeClasses[size]}`}
      style={{ backgroundColor: tag.color || '#3B82F6' }}
    >
      {tag.name}
      {showRemove && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tag);
          }}
          className="hover:bg-white/20 rounded-sm p-0.5 transition-colors"
        >
          <X size={size === 'xs' ? 10 : size === 'sm' ? 12 : 14} />
        </button>
      )}
    </span>
  );
}
