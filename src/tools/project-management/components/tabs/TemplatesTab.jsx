import React, { useState } from 'react';
import { Plus, FileJson, MoreVertical, Edit2 } from 'lucide-react';
import TemplateBuilderModal from '../modals/TemplateBuilderModal';

const TemplatesTab = ({ templates, onRefresh, createTemplate, updateTemplate, deleteTemplate, organizationSlug }) => {
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const handleEdit = (template) => {
        setSelectedTemplate(template);
        setIsBuilderOpen(true);
    };

    const handleCreate = () => {
        setSelectedTemplate(null);
        setIsBuilderOpen(true);
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-4 mb-6 sticky top-[89px] sm:top-[93px] z-20 bg-gray-50/50 backdrop-blur-sm px-4 md:px-0">
                <h2 className="text-lg font-semibold text-gray-900">Project Templates</h2>
                <button
                    onClick={handleCreate}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm font-medium shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-4 md:px-0">
                {/* Create New Card */}
                <button
                    onClick={handleCreate}
                    className="group flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 h-full min-h-[200px]"
                >
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                        <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-600" />
                    </div>
                    <h3 className="text-gray-900 font-medium">Create New Template</h3>
                    <p className="text-sm text-gray-500 mt-1">Define custom fields and workflows</p>
                </button>

                {/* Empty State Message */}
                {templates.length === 0 && (
                    <div className="col-span-1 md:col-span-1 lg:col-span-2 flex items-center justify-center p-8 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="text-center">
                            <FileJson className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">No templates created yet.</p>
                            <p className="text-gray-400 text-xs mt-1">Templates let you standardize project fields.</p>
                        </div>
                    </div>
                )}

                {/* Template Cards */}
                {templates.map((template) => (
                    <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow relative group">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                <FileJson className="w-5 h-5" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-gray-900 font-semibold">{template.name}</h3>
                                <p className="text-xs text-gray-500">ID: {template.id}</p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fields Configured</div>
                            <div className="flex flex-wrap gap-2">
                                {template.fields.map((field, idx) => (
                                    <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                        {field.label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => handleEdit(template)}
                                className="text-sm text-gray-600 hover:text-blue-600 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center"
                            >
                                <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                                Edit
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Builder Modal */}
            {isBuilderOpen && (
                <TemplateBuilderModal
                    isOpen={isBuilderOpen}
                    onClose={() => setIsBuilderOpen(false)}
                    template={selectedTemplate}
                    onSave={() => {
                        setIsBuilderOpen(false);
                        if (onRefresh) onRefresh();
                    }}
                    createTemplate={createTemplate}
                    updateTemplate={updateTemplate}
                />
            )}
        </div>
    );
};

export default TemplatesTab;
