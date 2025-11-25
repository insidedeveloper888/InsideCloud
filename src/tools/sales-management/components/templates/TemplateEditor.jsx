import React, { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, RotateCcw, X } from 'lucide-react';
import { getDefaultConfig } from './defaultConfig';
import HeaderEditor from './sections/HeaderEditor';
import TitleEditor from './sections/TitleEditor';
import DocumentDetailsEditor from './sections/DocumentDetailsEditor';
import ItemsTableEditor from './sections/ItemsTableEditor';
import TotalsEditor from './sections/TotalsEditor';
import NotesEditor from './sections/NotesEditor';
import FooterEditor from './sections/FooterEditor';
import WatermarkEditor from './sections/WatermarkEditor';
import TemplatePreview from './TemplatePreview';

/**
 * TemplateEditor - Main template customization interface
 * Three-pane layout: section navigation, editor, live preview
 */
export default function TemplateEditor({
  template = null,
  documentType,
  onSave,
  onClose
}) {
  const [config, setConfig] = useState(
    template?.config || getDefaultConfig(documentType)
  );
  const [name, setName] = useState(template?.name || 'New Template');
  const [showPreview, setShowPreview] = useState(true);
  const [activeSection, setActiveSection] = useState('header');
  const [saving, setSaving] = useState(false);

  // Update config when template changes
  useEffect(() => {
    if (template) {
      setConfig(template.config);
      setName(template.name);
    }
  }, [template]);

  const sections = [
    { key: 'header', label: 'Header', icon: '📋', description: 'Logo & company info' },
    { key: 'title', label: 'Title', icon: '📝', description: 'Document title styling' },
    { key: 'details', label: 'Document Details', icon: '📄', description: 'Invoice #, date, etc.' },
    { key: 'items', label: 'Items Table', icon: '📊', description: 'Line items styling' },
    { key: 'totals', label: 'Totals', icon: '💰', description: 'Totals section' },
    { key: 'notes', label: 'Notes', icon: '📌', description: 'Notes/Terms section' },
    { key: 'footer', label: 'Footer', icon: '⬇️', description: 'Footer & page numbers' },
    { key: 'watermark', label: 'Watermark', icon: '🔖', description: 'Watermark overlay' },
  ];

  const updateConfig = (section, updates) => {
    setConfig(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ name, config });
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all changes to default configuration?')) {
      setConfig(getDefaultConfig(documentType));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white w-full h-full flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close editor"
            >
              <X size={20} />
            </button>
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xl font-bold text-gray-900 border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-2 py-1"
                placeholder="Template Name"
              />
              <p className="text-sm text-gray-600 px-2">
                {documentType.charAt(0).toUpperCase() + documentType.slice(1).replace('_', ' ')} Template
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RotateCcw size={16} />
              Reset
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
              {showPreview ? 'Hide' : 'Show'} Preview
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Section Navigator */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto flex-shrink-0">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Template Sections
              </h3>
              <div className="space-y-1">
                {sections.map(section => (
                  <button
                    key={section.key}
                    onClick={() => setActiveSection(section.key)}
                    className={`w-full px-3 py-3 rounded-lg text-left flex flex-col gap-1 transition-colors ${
                      activeSection === section.key
                        ? 'bg-blue-100 text-blue-700 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{section.icon}</span>
                      <span className="text-sm font-medium">{section.label}</span>
                    </div>
                    <span className="text-xs text-gray-500 ml-7">{section.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center Editor Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-6">
              <div className="max-w-3xl mx-auto bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                {activeSection === 'header' && (
                  <HeaderEditor
                    config={config.header}
                    onChange={(updates) => updateConfig('header', updates)}
                  />
                )}
                {activeSection === 'title' && (
                  <TitleEditor
                    config={config.title}
                    onChange={(updates) => updateConfig('title', updates)}
                  />
                )}
                {activeSection === 'details' && (
                  <DocumentDetailsEditor
                    config={config.documentDetails}
                    documentType={documentType}
                    onChange={(updates) => updateConfig('documentDetails', updates)}
                  />
                )}
                {activeSection === 'items' && (
                  <ItemsTableEditor
                    config={config.itemsTable}
                    documentType={documentType}
                    onChange={(updates) => updateConfig('itemsTable', updates)}
                  />
                )}
                {activeSection === 'totals' && (
                  <TotalsEditor
                    config={config.totals}
                    documentType={documentType}
                    onChange={(updates) => updateConfig('totals', updates)}
                  />
                )}
                {activeSection === 'notes' && (
                  <NotesEditor
                    config={config.notes}
                    onChange={(updates) => updateConfig('notes', updates)}
                  />
                )}
                {activeSection === 'footer' && (
                  <FooterEditor
                    config={config.footer}
                    onChange={(updates) => updateConfig('footer', updates)}
                  />
                )}
                {activeSection === 'watermark' && (
                  <WatermarkEditor
                    config={config.watermark}
                    onChange={(updates) => updateConfig('watermark', updates)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Preview Panel */}
          {showPreview && (
            <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Live Preview
                  </h3>
                  <span className="text-xs text-gray-500">A4 Size</span>
                </div>
                <TemplatePreview
                  config={config}
                  documentType={documentType}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
