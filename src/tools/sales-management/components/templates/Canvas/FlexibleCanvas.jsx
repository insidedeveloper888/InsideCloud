/**
 * FlexibleCanvas - Grid-based canvas with flexible 2D positioning
 *
 * Allows sections to be placed side-by-side, not just vertically
 */
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SectionRenderer } from './SectionRenderer';
import { FileQuestion, Plus } from 'lucide-react';

export function FlexibleCanvas({
  sections,
  onEditSection,
  onDeleteSection,
  onReorderSections,
  activeSection
}) {
  const { setNodeRef } = useDroppable({
    id: 'canvas'
  });

  // Group sections into rows
  const rows = [];
  let currentRow = [];

  sections.forEach((section, index) => {
    // Check if section should start a new row
    if (section.newRow || currentRow.length === 0) {
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }
      currentRow = [section];
    } else {
      currentRow.push(section);
    }
  });

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  // Handle adding section to same row
  const handleAddToRow = (rowIndex) => {
    const updatedSections = [...sections];
    const sectionIndex = rows.slice(0, rowIndex + 1).reduce((sum, row) => sum + row.length, 0);

    if (sectionIndex < updatedSections.length) {
      // Mark next section to NOT start a new row
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        newRow: false
      };
      onReorderSections(updatedSections);
    }
  };

  // Handle moving section to new row
  const handleMoveToNewRow = (sectionId) => {
    const updatedSections = sections.map(s =>
      s.id === sectionId ? { ...s, newRow: true } : s
    );
    onReorderSections(updatedSections);
  };

  // Empty state
  if (sections.length === 0) {
    return (
      <div
        ref={setNodeRef}
        className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-12 text-center"
        style={{ minHeight: '500px' }}
      >
        <FileQuestion className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Sections Yet
        </h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Drag sections from the library on the left to start building your template.
          Sections can be placed side-by-side or stacked vertically.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      style={{ minHeight: '500px' }}
    >
      <div className="space-y-4">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="space-y-2">
            {/* Row */}
            <div className="flex gap-4">
              {row.map((section, colIndex) => (
                <div
                  key={section.id}
                  className="flex-1 min-w-0"
                  style={{
                    width: section.width ? `${section.width}%` : `${100 / row.length}%`
                  }}
                >
                  <SectionRenderer
                    section={section}
                    onEdit={() => onEditSection(section)}
                    onDelete={() => onDeleteSection(section.id)}
                    isActive={activeSection?.id === section.id}
                    onMoveToNewRow={() => handleMoveToNewRow(section.id)}
                    showLayoutControls={true}
                  />
                </div>
              ))}
            </div>

            {/* Add to Same Row hint */}
            {row.length < 3 && (
              <div className="text-center">
                <button
                  onClick={() => handleAddToRow(rowIndex)}
                  className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 mx-auto"
                >
                  <Plus className="w-3 h-3" />
                  Next section will appear here (side-by-side)
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
