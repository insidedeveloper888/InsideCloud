import React, { useState, useEffect } from 'react';
import { X, Edit2, Save, Calendar } from 'lucide-react';
import { ProjectManagementAPI } from '../../api/project-management';
import { DynamicFieldRenderer } from '../DynamicFieldRenderer';

const ProjectDetailModal = ({ isOpen, onClose, project, templates, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (project) {
            setFormData(JSON.parse(JSON.stringify(project))); // Deep copy
        }
    }, [project]);

    if (!isOpen || !project || !formData) return null;

    const template = templates.find(t => t.id === project.template_id);

    const handleCustomDataChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            custom_data: {
                ...prev.custom_data,
                [key]: value
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await ProjectManagementAPI.updateProject(project.id, formData);
            onSave();
            setIsEditing(false);
        } catch (error) {
            alert(error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    {/* Header */}
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 border-b border-gray-200 flex justify-between items-start">
                        <div>
                            <div className="flex items-center space-x-3">
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="border-b border-gray-300 focus:border-blue-500 outline-none px-1 text-gray-900 bg-white"
                                        />
                                    ) : formData.name}
                                </h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${formData.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                    formData.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {formData.status.toUpperCase()}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                Client: {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.client}
                                        onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                                        className="border-b border-gray-300 focus:border-blue-500 outline-none px-1 w-40 text-gray-900 bg-white"
                                    />
                                ) : formData.client}
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                >
                                    <Save className="w-4 h-4 mr-1.5" />
                                    Save
                                </button>
                            )}
                            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-500 rounded-full">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-50 px-4 py-5 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Details */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Dynamic Data Section */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">
                                    Project Specifics ({template?.name || 'Unknown Template'})
                                </h4>
                                <div className="space-y-4">
                                    {template?.fields.map((field) => (
                                        <DynamicFieldRenderer
                                            key={field.key}
                                            fieldConfig={field}
                                            value={formData.custom_data[field.key]}
                                            onChange={(val) => handleCustomDataChange(field.key, val)}
                                            readOnly={!isEditing}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Meta & Staff */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Financials</h4>
                                <div>
                                    <label className="text-xs text-gray-400">Budget</label>
                                    <div className="flex items-center text-lg font-semibold text-gray-900 mt-1">
                                        {isEditing ? (
                                            <div className="relative w-full">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                <input
                                                    type="number"
                                                    value={formData.budget}
                                                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                                    className="w-full border rounded pl-6 pr-2 py-1 text-sm text-gray-900 bg-white"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        ) : (
                                            <span>
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(formData.budget || 0)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Timeline</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-gray-400">Start Date</label>
                                        <div className="flex items-center text-sm font-medium text-gray-900 mt-1">
                                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    value={formData.start_date}
                                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                                    className="border rounded px-2 py-1 text-sm text-gray-900 bg-white"
                                                />
                                            ) : (formData.start_date || 'Not set')}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400">Due Date</label>
                                        <div className="flex items-center text-sm font-medium text-gray-900 mt-1">
                                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    value={formData.due_date}
                                                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                                    className="border rounded px-2 py-1 text-sm text-gray-900 bg-white"
                                                />
                                            ) : (formData.due_date || 'Not set')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Assigned Team</h4>
                                <div className="space-y-3">
                                    {formData.assigned_staff?.map(staffId => (
                                        <div key={staffId} className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs mr-3">
                                                {staffId}
                                            </div>
                                            <span className="text-sm text-gray-700">Staff Member #{staffId}</span>
                                        </div>
                                    ))}
                                    {(!formData.assigned_staff || formData.assigned_staff.length === 0) && (
                                        <p className="text-sm text-gray-400 italic">No team members assigned</p>
                                    )}
                                    {isEditing && (
                                        <button className="w-full mt-2 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors">
                                            + Assign Staff
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailModal;
