/**
 * InsideCloud Design Tokens
 * Centralized design constants for consistent styling across all tools.
 *
 * Usage:
 * import { buttonStyles, colors, badgeStyles } from '@/lib/design-tokens';
 * // or
 * import { buttonStyles } from 'src/lib/design-tokens';
 */

// ===================
// COLOR PALETTE
// ===================
export const colors = {
  primary: {
    gradient: 'bg-gradient-to-r from-gray-900 to-gray-800',
    gradientHover: 'hover:from-gray-800 hover:to-gray-700',
    solid: 'bg-gray-900',
    solidHover: 'hover:bg-gray-800',
    text: 'text-gray-900',
  },
  success: {
    gradient: 'bg-gradient-to-r from-emerald-500 to-cyan-600',
    solid: 'bg-emerald-600',
    solidHover: 'hover:bg-emerald-700',
    light: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  danger: {
    gradient: 'bg-gradient-to-r from-red-500 to-red-600',
    solid: 'bg-red-600',
    solidHover: 'hover:bg-red-700',
    light: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  warning: {
    solid: 'bg-amber-500',
    solidHover: 'hover:bg-amber-600',
    light: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  info: {
    solid: 'bg-blue-600',
    solidHover: 'hover:bg-blue-700',
    light: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  neutral: {
    solid: 'bg-gray-100',
    solidHover: 'hover:bg-gray-200',
    light: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
  },
};

// ===================
// BUTTON STYLES
// ===================
export const buttonStyles = {
  primary: `${colors.primary.gradient} ${colors.primary.gradientHover} text-white font-medium rounded-lg px-4 py-2 transition-all duration-200`,
  secondary: `bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg px-4 py-2 transition-all duration-200`,
  danger: `${colors.danger.solid} ${colors.danger.solidHover} text-white font-medium rounded-lg px-4 py-2 transition-all duration-200`,
  success: `${colors.success.solid} ${colors.success.solidHover} text-white font-medium rounded-lg px-4 py-2 transition-all duration-200`,
  ghost: `hover:bg-gray-100 text-gray-600 font-medium rounded-lg px-4 py-2 transition-all duration-200`,
  icon: `p-2 hover:bg-gray-100 rounded-lg transition-all duration-200`,
};

// ===================
// BADGE STYLES
// ===================
export const badgeStyles = {
  success: `${colors.success.light} ${colors.success.text} border ${colors.success.border} px-2 py-1 rounded-full text-xs font-medium`,
  warning: `${colors.warning.light} ${colors.warning.text} border ${colors.warning.border} px-2 py-1 rounded-full text-xs font-medium`,
  danger: `${colors.danger.light} ${colors.danger.text} border ${colors.danger.border} px-2 py-1 rounded-full text-xs font-medium`,
  info: `${colors.info.light} ${colors.info.text} border ${colors.info.border} px-2 py-1 rounded-full text-xs font-medium`,
  neutral: `${colors.neutral.light} ${colors.neutral.text} border ${colors.neutral.border} px-2 py-1 rounded-full text-xs font-medium`,
};

// ===================
// BORDER RADIUS
// ===================
export const radius = {
  modal: 'rounded-xl',
  card: 'rounded-xl',
  button: 'rounded-lg',
  input: 'rounded-md',
  badge: 'rounded-full',
  avatar: 'rounded-full',
};

// ===================
// SHADOWS
// ===================
export const shadows = {
  modal: 'shadow-2xl',
  card: 'shadow-sm hover:shadow-md transition-shadow',
  dropdown: 'shadow-lg',
  button: 'shadow-sm hover:shadow-md',
};

// ===================
// TYPOGRAPHY
// ===================
export const typography = {
  h1: 'text-2xl font-bold text-gray-900',
  h2: 'text-xl font-semibold text-gray-900',
  h3: 'text-lg font-medium text-gray-900',
  body: 'text-sm text-gray-600',
  bodyLarge: 'text-base text-gray-600',
  label: 'text-sm font-medium text-gray-700',
  error: 'text-sm text-red-600',
  muted: 'text-xs text-gray-500',
};

// ===================
// SPACING
// ===================
export const spacing = {
  modal: 'p-6',
  card: 'p-4',
  section: 'space-y-6',
  formGap: 'space-y-4',
  buttonGap: 'gap-3',
};

// ===================
// FOCUS STATES
// ===================
export const focus = {
  ring: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  ringInset: 'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500',
};
