/**
 * AbsoluteCanvas - pdfme-style absolute positioning canvas
 *
 * Features:
 * - A4 dimensions (210mm × 297mm = 794px × 1123px at 96dpi)
 * - Absolute positioning with x, y coordinates
 * - Grid snapping (10px)
 * - Drag and drop components
 * - Resize handles
 * - Alignment guides
 */
import React, { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { AbsoluteComponent } from './AbsoluteComponent';
import { FileQuestion, Grid, Ruler } from 'lucide-react';

// A4 dimensions at 96 DPI (pixels)
const A4_WIDTH = 794;  // 210mm
const A4_HEIGHT = 1123; // 297mm
const GRID_SIZE = 10;   // px

export function AbsoluteCanvas({
  components,
  onUpdateComponent,
  onDeleteComponent,
  onSelectComponent,
  selectedComponent,
  showGrid,
  showRuler
}) {
  const canvasRef = useRef(null);
  const { setNodeRef } = useDroppable({ id: 'absolute-canvas' });

  const [alignmentGuides, setAlignmentGuides] = useState([]);
  const [scale, setScale] = useState(1); // For zoom in/out

  // Snap value to grid
  const snapToGrid = (value) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  // Calculate alignment guides when dragging
  const calculateAlignmentGuides = (draggingComponent) => {
    const guides = [];
    const threshold = 5; // px

    components.forEach(comp => {
      if (comp.id === draggingComponent.id) return;

      // Vertical alignment (x-axis)
      if (Math.abs(comp.x - draggingComponent.x) < threshold) {
        guides.push({ type: 'vertical', position: comp.x });
      }
      if (Math.abs((comp.x + comp.width) - (draggingComponent.x + draggingComponent.width)) < threshold) {
        guides.push({ type: 'vertical', position: comp.x + comp.width });
      }

      // Horizontal alignment (y-axis)
      if (Math.abs(comp.y - draggingComponent.y) < threshold) {
        guides.push({ type: 'horizontal', position: comp.y });
      }
      if (Math.abs((comp.y + comp.height) - (draggingComponent.y + draggingComponent.height)) < threshold) {
        guides.push({ type: 'horizontal', position: comp.y + comp.height });
      }
    });

    setAlignmentGuides(guides);
  };

  // Handle component drag
  const handleDrag = (componentId, deltaX, deltaY) => {
    const component = components.find(c => c.id === componentId);
    if (!component) return;

    let newX = component.x + deltaX;
    let newY = component.y + deltaY;

    // Keep within canvas bounds
    newX = Math.max(0, Math.min(newX, A4_WIDTH - component.width));
    newY = Math.max(0, Math.min(newY, A4_HEIGHT - component.height));

    // Snap to grid
    newX = snapToGrid(newX);
    newY = snapToGrid(newY);

    const updatedComponent = { ...component, x: newX, y: newY };

    // Calculate alignment guides
    calculateAlignmentGuides(updatedComponent);

    onUpdateComponent(componentId, updatedComponent);
  };

  // Handle component resize
  const handleResize = (componentId, newWidth, newHeight) => {
    const component = components.find(c => c.id === componentId);
    if (!component) return;

    // Snap to grid
    newWidth = snapToGrid(newWidth);
    newHeight = snapToGrid(newHeight);

    // Minimum size
    newWidth = Math.max(50, newWidth);
    newHeight = Math.max(20, newHeight);

    // Keep within canvas bounds
    newWidth = Math.min(newWidth, A4_WIDTH - component.x);
    newHeight = Math.min(newHeight, A4_HEIGHT - component.y);

    onUpdateComponent(componentId, { ...component, width: newWidth, height: newHeight });
  };

  // Clear alignment guides when drag ends
  const handleDragEnd = () => {
    setAlignmentGuides([]);
  };

  // Empty state
  if (components.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: '100%' }}>
        <div
          ref={setNodeRef}
          className="bg-white shadow-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
          style={{
            width: `${A4_WIDTH * scale}px`,
            height: `${A4_HEIGHT * scale}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top center'
          }}
        >
          <div className="text-center p-12">
            <FileQuestion className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Empty Template
            </h3>
            <p className="text-sm text-gray-500 max-w-md">
              Drag components from the library to start building your template.
              Position them anywhere on the page with pixel-perfect precision.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-start justify-center overflow-auto p-8">
      {/* Canvas Container */}
      <div
        ref={setNodeRef}
        className="relative bg-white shadow-2xl"
        style={{
          width: `${A4_WIDTH}px`,
          height: `${A4_HEIGHT}px`,
          backgroundImage: showGrid
            ? `repeating-linear-gradient(0deg, transparent, transparent ${GRID_SIZE - 1}px, #e5e7eb ${GRID_SIZE - 1}px, #e5e7eb ${GRID_SIZE}px),
               repeating-linear-gradient(90deg, transparent, transparent ${GRID_SIZE - 1}px, #e5e7eb ${GRID_SIZE - 1}px, #e5e7eb ${GRID_SIZE}px)`
            : 'none'
        }}
      >
        {/* Ruler - Top */}
        {showRuler && (
          <div className="absolute top-0 left-0 right-0 h-6 bg-gray-100 border-b border-gray-300 flex items-center text-xs text-gray-600">
            {Array.from({ length: Math.floor(A4_WIDTH / 100) + 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{ left: `${i * 100}px` }}
              >
                <div className="border-l border-gray-400 h-2" />
                <span className="ml-1">{i * 100}</span>
              </div>
            ))}
          </div>
        )}

        {/* Ruler - Left */}
        {showRuler && (
          <div className="absolute top-0 left-0 bottom-0 w-6 bg-gray-100 border-r border-gray-300 flex flex-col items-center text-xs text-gray-600">
            {Array.from({ length: Math.floor(A4_HEIGHT / 100) + 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{ top: `${i * 100}px` }}
              >
                <div className="border-t border-gray-400 w-2" />
                <span className="mt-1 transform -rotate-90">{i * 100}</span>
              </div>
            ))}
          </div>
        )}

        {/* Components */}
        <div className="relative" style={{ marginLeft: showRuler ? '24px' : 0, marginTop: showRuler ? '24px' : 0 }}>
          {components.map(component => (
            <AbsoluteComponent
              key={component.id}
              component={component}
              isSelected={selectedComponent?.id === component.id}
              onSelect={() => onSelectComponent(component)}
              onDrag={handleDrag}
              onResize={handleResize}
              onDragEnd={handleDragEnd}
              onDelete={() => onDeleteComponent(component.id)}
            />
          ))}
        </div>

        {/* Alignment Guides */}
        {alignmentGuides.map((guide, index) => (
          <div
            key={index}
            className="absolute pointer-events-none"
            style={{
              ...(guide.type === 'vertical'
                ? {
                    left: `${guide.position}px`,
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    backgroundColor: '#3B82F6'
                  }
                : {
                    top: `${guide.position}px`,
                    left: 0,
                    right: 0,
                    height: '1px',
                    backgroundColor: '#3B82F6'
                  })
            }}
          />
        ))}
      </div>

      {/* Canvas Info */}
      <div className="absolute bottom-4 right-4 bg-white px-3 py-2 rounded shadow-lg text-xs text-gray-600 border border-gray-200">
        <div>A4: {A4_WIDTH} × {A4_HEIGHT} px</div>
        <div>Grid: {showGrid ? `${GRID_SIZE}px` : 'Off'}</div>
        <div>Components: {components.length}</div>
      </div>
    </div>
  );
}
