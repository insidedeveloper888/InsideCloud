import React from 'react';

const ProgressiveBlur = ({ 
  position = 'bottom', 
  height = '40%', 
  className = '',
  blurIntensity = 10 
}) => {
  const getGradientDirection = () => {
    switch (position) {
      case 'top':
        return 'to bottom';
      case 'bottom':
        return 'to top';
      case 'left':
        return 'to right';
      case 'right':
        return 'to left';
      default:
        return 'to top';
    }
  };

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'absolute',
      pointerEvents: 'none',
      zIndex: 10,
    };

    switch (position) {
      case 'top':
        return {
          ...baseStyles,
          top: 0,
          left: 0,
          right: 0,
          height: height,
        };
      case 'bottom':
        return {
          ...baseStyles,
          bottom: 0,
          left: 0,
          right: 0,
          height: height,
        };
      case 'left':
        return {
          ...baseStyles,
          top: 0,
          bottom: 0,
          left: 0,
          width: height,
        };
      case 'right':
        return {
          ...baseStyles,
          top: 0,
          bottom: 0,
          right: 0,
          width: height,
        };
      default:
        return {
          ...baseStyles,
          bottom: 0,
          left: 0,
          right: 0,
          height: height,
        };
    }
  };

  const gradientStops = [
    'rgba(255, 255, 255, 0) 0%',
    'rgba(255, 255, 255, 0.1) 20%',
    'rgba(255, 255, 255, 0.3) 40%',
    'rgba(255, 255, 255, 0.6) 60%',
    'rgba(255, 255, 255, 0.8) 80%',
    'rgba(255, 255, 255, 1) 100%'
  ];

  const blurStops = Array.from({ length: 6 }, (_, i) => {
    const blurValue = (i * blurIntensity) / 5;
    return `blur(${blurValue}px)`;
  });

  return (
    <div
      className={className}
      style={{
        ...getPositionStyles(),
        background: `linear-gradient(${getGradientDirection()}, ${gradientStops.join(', ')})`,
        backdropFilter: `blur(${blurIntensity}px)`,
        WebkitBackdropFilter: `blur(${blurIntensity}px)`,
      }}
    />
  );
};

export default ProgressiveBlur;