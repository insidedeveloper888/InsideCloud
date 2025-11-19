/**
 * StarRating Component
 * Interactive or read-only star rating display
 * Used for customer conversion probability rating (1-10)
 */

import React, { useState } from 'react';
import { Star } from 'lucide-react';

export default function StarRating({
  rating = 0,
  onChange,
  maxRating = 10,
  size = 20,
  readonly = false,
  showLabel = true,
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (value) => {
    if (!readonly && onChange) {
      onChange(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (!readonly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating || 0;

  // Calculate color based on rating (dynamic based on maxRating)
  const getColor = (value) => {
    const percentage = value / maxRating;
    if (percentage >= 0.7) return '#10b981'; // green-500 (high - 70%+)
    if (percentage >= 0.4) return '#f59e0b'; // amber-500 (medium - 40-69%)
    return '#ef4444'; // red-500 (low - below 40%)
  };

  const color = getColor(displayRating);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= displayRating;

          return (
            <button
              key={starValue}
              type="button"
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onMouseLeave={handleMouseLeave}
              disabled={readonly}
              className={`
                ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
                transition-transform duration-100
                ${readonly ? '' : 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded'}
              `}
              style={{ padding: '2px' }}
            >
              <Star
                size={size}
                fill={isFilled ? color : 'none'}
                stroke={isFilled ? color : '#d1d5db'}
                strokeWidth={2}
              />
            </button>
          );
        })}
      </div>

      {showLabel && rating > 0 && (
        <span
          className="text-sm font-medium"
          style={{ color }}
        >
          {rating}/{maxRating}
        </span>
      )}

      {!readonly && hoverRating > 0 && (
        <span className="text-xs text-gray-500">
          {hoverRating === maxRating ? 'Excellent' :
           hoverRating >= Math.ceil(maxRating * 0.8) ? 'Very High' :
           hoverRating >= Math.ceil(maxRating * 0.6) ? 'High' :
           hoverRating >= Math.ceil(maxRating * 0.4) ? 'Medium' :
           'Low'}
        </span>
      )}
    </div>
  );
}
