
import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { ProjectManagementAPI } from '../../api/project-management';
import { DynamicFieldRenderer } from '../DynamicFieldRenderer';

const AddProjectModal = ({ isOpen, onClose, templates, onSave, organizationSlug }) => {
    const [step, setStep] = useState(1); // 1: Select Template, 2: Fill Details
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        client: '',
        budget: '',
        start_date: '',
        due_date: '',
        custom_data: {}
    });
    const [saving, setSaving] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setSelectedTemplateId('');
            setFormData({
                name: '',
                client: '',
                budget: '',
                start_date: '',
                due_date: '',
                custom_data: {}
            });
        }
    }, [isOpen]);

    const handleTemplateSelect = (templateId) => {
        setSelectedTemplateId(templateId);
        setStep(2);
    };

    const handleCustomDataChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            custom_data: {
                ...prev.custom_data,
                [key]: value
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (!formData.name || !formData.client) {
                throw new Error("Project Name and Client are required");
            }

            const projectPayload = {
                ...formData,
                template_id: selectedTemplateId,
                status: 'active'
            };

            await ProjectManagementAPI.createProject(organizationSlug, projectPayload);
            onSave();
        } catch (error) {
            alert(error.message);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                {step === 1 ? 'Select Project Template' : 'New Project Details'}
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Step 1: Template Selection */}
                        {step === 1 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
                                {templates.map(template => (
                                    <button
                                        key={template.id}
                                        onClick={() => handleTemplateSelect(template.id)}
                                        className="flex flex-col text-left p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                                    >
                                        <span className="font-semibold text-gray-900 group-hover:text-blue-700">{template.name}</span>
                                        <span className="text-sm text-gray-500 mt-1">{template.fields.length} custom fields defined</span>
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {template.fields.slice(0, 3).map((f, i) => (
                                                <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                    {f.label}
                                                </span>
                                            ))}
                                            {template.fields.length > 3 && (
                                                <span className="text-xs text-gray-400 px-1">+{template.fields.length - 3} more</span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                                {templates.length === 0 && (
                                    <div className="col-span-2 text-center py-12 text-gray-500">
                                        No templates found. Please create a template first.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Form Entry */}
                        {step === 2 && selectedTemplate && (
                            <form id="project-form" onSubmit={handleSubmit} className="space-y-6">
                                {/* Standard Fields */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">Core Information</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                                placeholder="e.g. HQ Renovation"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.client}
                                                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                                placeholder="Client Name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <span className="text-gray-500 sm:text-sm">$</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    value={formData.budget}
                                                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                            <input
                                                type="date"
                                                value={formData.start_date}
                                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                            <input
                                                type="date"
                                                value={formData.due_date}
                                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Fields */}
                                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                    <h4 className="text-sm font-medium text-blue-600 uppercase tracking-wider mb-4 flex items-center">
                                        <span className="bg-blue-100 p-1 rounded mr-2">
                                            <Check className="w-3 h-3" />
                                        </span>
                                        {selectedTemplate.name} Specifics
                                    </h4>
                                    <div className="space-y-4">
                                        {selectedTemplate.fields.map((field) => (
                                            <DynamicFieldRenderer
                                                key={field.key}
                                                fieldConfig={field}
                                                value={formData.custom_data[field.key]}
                                                onChange={(val) => handleCustomDataChange(field.key, val)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>

                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        {step === 2 && (
                            <>
                                <button
                                    type="submit"
                                    form="project-form"
                                    disabled={saving}
                                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm ${saving ? 'opacity-75 cursor-not-allowed' : ''}`}
                                >
                                    {saving ? 'Creating Project...' : 'Create Project'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Back
                                </button>
                            </>
                        )}
                        {step === 1 && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddProjectModal;
