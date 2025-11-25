import React, { useState } from 'react';
import { Plus, Edit, Copy, Trash, Star, Eye } from 'lucide-react';
import { useTemplates } from '../../hooks/useTemplates';

/**
 * TemplateList - Display and manage document templates
 * Shows templates by document type with CRUD actions
 */
export default function TemplateList({
  documentType,
  organizationSlug,
  onEdit,
  onPreview
}) {
  const {
    templates,
    loading,
    error,
    deleteTemplate,
    setDefaultTemplate,
    duplicateTemplate
  } = useTemplates(organizationSlug, documentType);

  const [deleting, setDeleting] = useState(null);
  const [settingDefault, setSettingDefault] = useState(null);

  const handleDelete = async (templateId, templateName) => {
    if (!window.confirm(`Are you sure you want to delete "${templateName}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(templateId);
    try {
      await deleteTemplate(templateId);
    } catch (err) {
      alert(`Failed to delete template: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleSetDefault = async (templateId, templateName) => {
    setSettingDefault(templateId);
    try {
      await setDefaultTemplate(templateId);
    } catch (err) {
      alert(`Failed to set default template: ${err.message}`);
    } finally {
      setSettingDefault(null);
    }
  };

  const handleDuplicate = async (templateId, templateName) => {
    try {
      await duplicateTemplate(templateId);
    } catch (err) {
      alert(`Failed to duplicate template: ${err.message}`);
    }
  };

  const getDocumentTypeLabel = (type) => {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
        <p className="text-gray-600 mt-4">Loading templates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error loading templates: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {getDocumentTypeLabel(documentType)} Templates
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {templates.length} {templates.length === 1 ? 'template' : 'templates'} available
          </p>
        </div>
        <button
          onClick={() => onEdit(null, documentType)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          New Template
        </button>
      </div>

      {/* Template List */}
      {templates.length === 0 ? (
        <div className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium mb-2">No templates yet</p>
          <p className="text-sm text-gray-500 mb-4">
            Create your first {getDocumentTypeLabel(documentType).toLowerCase()} template
          </p>
          <button
            onClick={() => onEdit(null, documentType)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Create Template
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {templates.map(template => (
            <div
              key={template.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              {/* Template Info */}
              <div className="flex items-center gap-4 flex-1">
                {/* Preview Thumbnail Placeholder */}
                <div className="w-16 h-20 bg-gradient-to-br from-blue-50 to-gray-100 rounded border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 2 0 01-2 2z" />
                  </svg>
                </div>

                {/* Template Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 truncate">
                      {template.name}
                    </h4>
                    {template.is_default && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                        <Star size={12} fill="currentColor" />
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Updated {new Date(template.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                {/* Preview */}
                {onPreview && (
                  <button
                    onClick={() => onPreview(template)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Preview template"
                  >
                    <Eye size={16} />
                  </button>
                )}

                {/* Set as Default */}
                {!template.is_default && (
                  <button
                    onClick={() => handleSetDefault(template.id, template.name)}
                    disabled={settingDefault === template.id}
                    className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Set as default"
                  >
                    <Star size={16} />
                  </button>
                )}

                {/* Edit */}
                <button
                  onClick={() => onEdit(template.id, documentType)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit template"
                >
                  <Edit size={16} />
                </button>

                {/* Duplicate */}
                <button
                  onClick={() => handleDuplicate(template.id, template.name)}
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Duplicate template"
                >
                  <Copy size={16} />
                </button>

                {/* Delete (only if not default) */}
                {!template.is_default && (
                  <button
                    onClick={() => handleDelete(template.id, template.name)}
                    disabled={deleting === template.id}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete template"
                  >
                    <Trash size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
