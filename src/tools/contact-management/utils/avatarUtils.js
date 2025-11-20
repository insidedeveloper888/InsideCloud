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
  // Softer, more professional pastel palette
  const colors = [
    '#DBEAFE', // Light Blue
    '#E0E7FF', // Light Indigo
    '#FCE7F3', // Light Pink
    '#FEF3C7', // Light Amber
    '#D1FAE5', // Light Emerald
    '#DDD6FE', // Light Violet
    '#FBCFE8', // Light Rose
    '#BAE6FD', // Light Sky
    '#FED7AA', // Light Orange
    '#BBF7D0', // Light Green
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Text color mapping for each background color
const getTextColorForBackground = (bgColor) => {
  const textColorMap = {
    '#DBEAFE': '#1E40AF', // Blue 800
    '#E0E7FF': '#4338CA', // Indigo 700
    '#FCE7F3': '#9F1239', // Rose 800
    '#FEF3C7': '#92400E', // Amber 800
    '#D1FAE5': '#065F46', // Emerald 800
    '#DDD6FE': '#5B21B6', // Violet 800
    '#FBCFE8': '#9F1239', // Rose 800
    '#BAE6FD': '#075985', // Sky 800
    '#FED7AA': '#9A3412', // Orange 800
    '#BBF7D0': '#166534', // Green 800
  };
  return textColorMap[bgColor] || '#374151'; // Gray 700 as fallback
};

export function getInitialsAvatar(initials, color = '#DBEAFE', size = 48) {
  const fontSize = Math.floor(size / 2.5);
  const textX = size / 2;
  const textY = size / 2 + fontSize / 3;
  const textColor = getTextColorForBackground(color);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="${color}" rx="${size / 8}"/>
    <text
      x="${textX}"
      y="${textY}"
      font-size="${fontSize}"
      font-weight="600"
      font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      text-anchor="middle"
      dominant-baseline="middle"
      fill="${textColor}"
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
