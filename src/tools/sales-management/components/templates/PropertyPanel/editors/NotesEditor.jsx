/**
 * NotesEditor - Edit Notes Section
 */
import React from 'react';
import { FormInput, FormTextarea, FormCheckbox } from '../../ui/FormInput';

export function NotesEditor({ config, onChange }) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-900">📌 Notes Section</h4>

      <FormCheckbox
        label="Enable Notes"
        checked={config.enabled !== false}
        onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
      />

      {config.enabled !== false && (
        <>
          <FormInput
            label="Title"
            value={config.title || 'Notes'}
            onChange={(e) => onChange({ ...config, title: e.target.value })}
            placeholder="Notes"
          />

          <FormTextarea
            label="Content"
            value={config.content || ''}
            onChange={(e) => onChange({ ...config, content: e.target.value })}
            placeholder="Thank you for your business..."
            rows={5}
          />

          <FormInput
            type="number"
            label="Font Size (px)"
            value={config.fontSize || 12}
            min={8}
            max={24}
            onChange={(e) => onChange({ ...config, fontSize: parseInt(e.target.value) || 12 })}
          />
        </>
      )}
    </div>
  );
}
