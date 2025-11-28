import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';

const FIELD_TYPES = [
    { value: 'text', label: 'Text Input' },
    { value: 'number', label: 'Number Input' },
    { value: 'checkbox', label: 'Checkbox (Yes/No)' },
    { value: 'progress', label: 'Progress Bar' },
];

const TemplateBuilderModal = ({ isOpen, onClose, template, onSave, createTemplate, updateTemplate }) => {
    const [name, setName] = useState('');
    const [fields, setFields] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (template) {
            setName(template.name);
            setFields(template.fields);
        } else {
            setName('');
            setFields([{ key: '', label: '', type: 'text' }]); // Start with one empty field
        }
    }, [template]);

    const handleAddField = () => {
        setFields([...fields, { key: '', label: '', type: 'text' }]);
    };

    const handleRemoveField = (index) => {
        const newFields = [...fields];
        newFields.splice(index, 1);
        setFields(newFields);
    };

    const handleFieldChange = (index, key, value) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], [key]: value };

        // Auto-generate key from label if key is empty
        if (key === 'label' && !newFields[index].key) {
            newFields[index].key = value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        }

        setFields(newFields);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Validate
            if (!name.trim()) throw new Error("Template name is required");
            if (fields.length === 0) throw new Error("At least one field is required");

            const validFields = fields.filter(f => f.label && f.key);
            if (validFields.length === 0) throw new Error("At least one valid field is required");

            const templateData = {
                name: name.trim(),
                fields: validFields
            };

            if (template && template.id) {
                // Update existing template
                await updateTemplate(template.id, templateData);
            } else {
                // Create new template
                await createTemplate(templateData);
            }
            onSave();
        } catch (error) {
            console.error('[TemplateBuilderModal] Save error:', error);
            alert(error.message);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                {template ? 'Edit Template' : 'Create New Template'}
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form id="template-form" onSubmit={handleSubmit}>
                            {/* Template Name */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                                    placeholder="e.g., Solar Installation V2"
                                    required
                                />
                            </div>

                            {/* Field Builder */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="block text-sm font-medium text-gray-700">Form Fields</label>
                                    <button
                                        type="button"
                                        onClick={handleAddField}
                                        className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center"
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add Field
                                    </button>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 space-y-3 max-h-[400px] overflow-y-auto">
                                    {fields.map((field, index) => (
                                        <div key={index} className="flex items-start space-x-3 bg-white p-3 rounded-md border border-gray-200 shadow-sm group">
                                            <div className="mt-2 text-gray-400 cursor-move">
                                                <GripVertical className="w-4 h-4" />
                                            </div>

                                            <div className="flex-1 grid grid-cols-12 gap-3">
                                                <div className="col-span-6">
                                                    <label className="block text-xs text-gray-500 mb-1">Label</label>
                                                    <input
                                                        type="text"
                                                        value={field.label}
                                                        onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 text-gray-900 bg-white"
                                                        placeholder="Field Label"
                                                    />
                                                </div>

                                                <div className="col-span-4">
                                                    <label className="block text-xs text-gray-500 mb-1">Type</label>
                                                    <select
                                                        value={field.type}
                                                        onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 text-gray-900 bg-white"
                                                    >
                                                        {FIELD_TYPES.map(t => (
                                                            <option key={t.value} value={t.value}>{t.label}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="col-span-2">
                                                    <label className="block text-xs text-gray-500 mb-1">Key (Auto)</label>
                                                    <input
                                                        type="text"
                                                        value={field.key}
                                                        readOnly
                                                        className="w-full px-2 py-1.5 text-sm bg-gray-100 border border-gray-300 rounded text-gray-500 cursor-not-allowed"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleRemoveField(index)}
                                                className="mt-2 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="submit"
                            form="template-form"
                            disabled={saving}
                            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm ${saving ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                            {saving ? 'Saving...' : 'Save Template'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplateBuilderModal;
