/**
 * ContactAvatar - Display contact avatar with initials fallback
 */

import React from 'react';

export default function ContactAvatar({
  firstName,
  lastName,
  avatarUrl,
  avatarColor = '#2196F3',
  size = 'md', // 'sm', 'md', 'lg'
  className = '',
}) {
  const getInitials = () => {
    const first = firstName?.charAt(0).toUpperCase() || '';
    const last = lastName?.charAt(0).toUpperCase() || '';
    return `${first}${last}` || '?';
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
  };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${firstName} ${lastName}`}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
        onError={(e) => {
          // Fallback to initials if image fails to load
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-semibold ${className}`}
      style={{ backgroundColor: avatarColor }}
    >
      {getInitials()}
    </div>
  );
}
