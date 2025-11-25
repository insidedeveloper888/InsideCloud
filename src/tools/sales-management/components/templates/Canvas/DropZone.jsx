/**
 * Canvas - Drop Zone for Template Sections
 *
 * Main canvas area where sections can be dropped and reordered.
 */
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { SectionRenderer } from './SectionRenderer';
import { FileQuestion } from 'lucide-react';

export function Canvas({
  sections,
  onEditSection,
  onDeleteSection,
  onReorderSections,
  activeSection
}) {
  const { setNodeRef } = useDroppable({
    id: 'canvas'
  });

  // Handle section reorder via drag-and-drop
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex(s => s.id === active.id);
    const newIndex = sections.findIndex(s => s.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newSections = arrayMove(sections, oldIndex, newIndex);
      onReorderSections(newSections);
    }
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
          You can reorder sections by dragging them up or down.
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
        <SortableContext
          items={sections.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {sections.map((section) => (
            <SectionRenderer
              key={section.id}
              section={section}
              onEdit={() => onEditSection(section)}
              onDelete={() => onDeleteSection(section.id)}
              isActive={activeSection?.id === section.id}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
