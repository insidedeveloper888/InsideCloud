/**
 * ComponentCard - Draggable component card with type info
 */
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';

export function ComponentCard({ type, label, icon, description, defaultWidth, defaultHeight }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `component-${type}`,
    data: { type, defaultWidth, defaultHeight }
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        bg-white border-2 border-gray-200 rounded-lg p-3
        cursor-grab active:cursor-grabbing
        hover:border-blue-400 hover:shadow-md
        transition-all
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-blue-600 flex-shrink-0">
              {icon}
            </div>
            <div className="font-medium text-sm text-gray-900">
              {label}
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {description}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {defaultWidth} × {defaultHeight} px
          </div>
        </div>
      </div>
    </div>
  );
}
