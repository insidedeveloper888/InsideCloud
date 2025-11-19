/**
 * Avatar Utilities
 * Generate avatars, initials, and colors
 */

export function getInitials(firstName, lastName) {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}`;
}

export function getRandomColor() {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Sky Blue
    '#F8B88B', // Orange
    '#90EE90', // Light Green
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function getInitialsAvatar(initials, color = '#1976D2', size = 48) {
  const fontSize = Math.floor(size / 2.5);
  const textX = size / 2;
  const textY = size / 2 + fontSize / 3;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="${color}"/>
    <text
      x="${textX}"
      y="${textY}"
      font-size="${fontSize}"
      font-weight="bold"
      font-family="Arial, sans-serif"
      text-anchor="middle"
      dominant-baseline="middle"
      fill="white"
    >
      ${initials}
    </text>
  </svg>`;

  return svg;
}

export function getColorForContactType(contactType) {
  const colorMap = {
    customer: '#2196F3', // Blue
    supplier: '#FF9800', // Orange
    coi: '#9C27B0', // Purple
    internal: '#4CAF50', // Green
  };
  return colorMap[contactType] || '#666';
}

export function getColorForStage(stageName) {
  const colorMap = {
    lead: '#2196F3', // Blue
    prospect: '#9C27B0', // Purple
    appointment: '#00BCD4', // Cyan
    nurture: '#FFC107', // Amber
    won: '#4CAF50', // Green
    lost: '#F44336', // Red
    cold: '#9E9E9E', // Gray
  };
  return colorMap[stageName?.toLowerCase()] || '#666';
}
