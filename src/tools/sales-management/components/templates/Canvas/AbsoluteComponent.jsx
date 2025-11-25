/**
 * AbsoluteComponent - Draggable and resizable component
 *
 * Features:
 * - Drag to move
 * - Resize handles (8 points)
 * - Selection highlight
 * - Delete button
 */
import React, { useState, useRef } from 'react';
import { Trash2, Move } from 'lucide-react';

export function AbsoluteComponent({
  component,
  isSelected,
  onSelect,
  onDrag,
  onResize,
  onDragEnd,
  onDelete
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialSize = useRef({ width: 0, height: 0 });

  // Handle mouse down for dragging
  const handleMouseDown = (e) => {
    if (e.target.dataset.handle) return; // Don't drag when clicking resize handle

    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - component.x,
      y: e.clientY - component.y
    };
  };

  // Handle mouse down for resizing
  const handleResizeMouseDown = (e, handle) => {
    e.stopPropagation();
    onSelect();
    setIsResizing(true);
    setResizeHandle(handle);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    initialSize.current = { width: component.width, height: component.height };
  };

  // Handle mouse move
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStartPos.current.x - component.x;
        const deltaY = e.clientY - dragStartPos.current.y - component.y;
        onDrag(component.id, deltaX, deltaY);
      } else if (isResizing) {
        const deltaX = e.clientX - dragStartPos.current.x;
        const deltaY = e.clientY - dragStartPos.current.y;

        let newWidth = initialSize.current.width;
        let newHeight = initialSize.current.height;

        // Calculate new size based on handle
        switch (resizeHandle) {
          case 'se': // Bottom-right
            newWidth = initialSize.current.width + deltaX;
            newHeight = initialSize.current.height + deltaY;
            break;
          case 'sw': // Bottom-left
            newWidth = initialSize.current.width - deltaX;
            newHeight = initialSize.current.height + deltaY;
            break;
          case 'ne': // Top-right
            newWidth = initialSize.current.width + deltaX;
            newHeight = initialSize.current.height - deltaY;
            break;
          case 'nw': // Top-left
            newWidth = initialSize.current.width - deltaX;
            newHeight = initialSize.current.height - deltaY;
            break;
          case 'e': // Right
            newWidth = initialSize.current.width + deltaX;
            break;
          case 'w': // Left
            newWidth = initialSize.current.width - deltaX;
            break;
          case 's': // Bottom
            newHeight = initialSize.current.height + deltaY;
            break;
          case 'n': // Top
            newHeight = initialSize.current.height - deltaY;
            break;
          default:
            // No resize for unknown handle
            break;
        }

        onResize(component.id, newWidth, newHeight);
      }
    };

    const handleMouseUp = () => {
      if (isDragging || isResizing) {
        setIsDragging(false);
        setIsResizing(false);
        setResizeHandle(null);
        onDragEnd?.();
      }
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, component, resizeHandle, onDrag, onResize, onDragEnd]);

  // Render component content based on type
  const renderContent = () => {
    const { type, config, dataKey } = component;

    switch (type) {
      case 'text':
        return (
          <div
            className="w-full h-full flex items-center px-2 text-gray-900"
            style={{
              fontSize: `${config?.fontSize || 14}px`,
              fontWeight: config?.fontWeight || 'normal',
              textAlign: config?.textAlign || 'left'
            }}
          >
            {dataKey ? `{${dataKey}}` : 'Text Component'}
          </div>
        );

      case 'multiline':
        return (
          <div
            className="w-full h-full p-2 text-gray-900 overflow-hidden"
            style={{
              fontSize: `${config?.fontSize || 12}px`,
              whiteSpace: 'pre-wrap'
            }}
          >
            {dataKey ? `{${dataKey}}` : 'Multiline Text'}
          </div>
        );

      case 'number':
        return (
          <div
            className="w-full h-full flex items-center justify-end px-2 text-gray-900 font-mono"
            style={{ fontSize: `${config?.fontSize || 14}px` }}
          >
            {dataKey ? `{${dataKey}}` : '0.00'}
          </div>
        );

      case 'date':
        return (
          <div
            className="w-full h-full flex items-center px-2 text-gray-900"
            style={{ fontSize: `${config?.fontSize || 12}px` }}
          >
            {dataKey ? `{${dataKey}}` : '2025-11-24'}
          </div>
        );

      case 'image':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 border border-gray-300">
            {component.config?.logoUrl ? (
              <img
                src={component.config.logoUrl}
                alt="Component"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <span className="text-gray-400 text-xs">Image</span>
            )}
          </div>
        );

      case 'qrcode':
        return (
          <div className="w-full h-full flex items-center justify-center bg-white border border-gray-300">
            <div className="w-3/4 h-3/4 bg-gray-900 opacity-20" />
          </div>
        );

      case 'signature':
        return (
          <div className="w-full h-full border-b-2 border-gray-900 flex items-end justify-center pb-1">
            <span className="text-xs text-gray-500">Signature</span>
          </div>
        );

      default:
        return (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
            {type}
          </div>
        );
    }
  };

  const resizeHandles = [
    { position: 'nw', cursor: 'nw-resize', className: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2' },
    { position: 'n', cursor: 'n-resize', className: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' },
    { position: 'ne', cursor: 'ne-resize', className: 'top-0 right-0 translate-x-1/2 -translate-y-1/2' },
    { position: 'e', cursor: 'e-resize', className: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2' },
    { position: 'se', cursor: 'se-resize', className: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2' },
    { position: 's', cursor: 's-resize', className: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' },
    { position: 'sw', cursor: 'sw-resize', className: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2' },
    { position: 'w', cursor: 'w-resize', className: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2' }
  ];

  return (
    <div
      className={`absolute border-2 ${
        isSelected
          ? 'border-blue-500 shadow-lg'
          : 'border-transparent hover:border-blue-300'
      } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: `${component.x}px`,
        top: `${component.y}px`,
        width: `${component.width}px`,
        height: `${component.height}px`,
        backgroundColor: component.type === 'image' ? 'transparent' : '#ffffff',
        zIndex: isSelected ? 10 : 1
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Content */}
      {renderContent()}

      {/* Selection Controls */}
      {isSelected && (
        <>
          {/* Drag Handle */}
          <div className="absolute -top-8 left-0 bg-blue-600 text-white px-2 py-1 rounded-t text-xs flex items-center gap-2">
            <Move className="w-3 h-3" />
            <span>{component.type}</span>
            <span className="text-blue-200">
              {component.width} × {component.height}
            </span>
          </div>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute -top-8 right-0 bg-red-600 text-white p-1 rounded-t hover:bg-red-700"
            title="Delete Component"
          >
            <Trash2 className="w-3 h-3" />
          </button>

          {/* Resize Handles */}
          {resizeHandles.map(({ position, cursor, className }) => (
            <div
              key={position}
              data-handle={position}
              className={`absolute w-3 h-3 bg-blue-600 border-2 border-white rounded-full ${className}`}
              style={{ cursor }}
              onMouseDown={(e) => handleResizeMouseDown(e, position)}
            />
          ))}
        </>
      )}
    </div>
  );
}
