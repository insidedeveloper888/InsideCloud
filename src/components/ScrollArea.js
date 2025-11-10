import React from 'react';

const ScrollArea = ({ 
  children, 
  className = '', 
  style = {},
  height = '400px'
}) => {
  const defaultStyles = {
    height: height,
    overflowY: 'auto',
    overflowX: 'hidden',
    position: 'relative',
    ...style
  };

  const scrollbarStyles = `
    .scroll-area::-webkit-scrollbar {
      width: 8px;
    }
    
    .scroll-area::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    
    .scroll-area::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }
    
    .scroll-area::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
  `;

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div 
        className={`scroll-area ${className}`}
        style={defaultStyles}
      >
        {children}
      </div>
    </>
  );
};

export default ScrollArea;