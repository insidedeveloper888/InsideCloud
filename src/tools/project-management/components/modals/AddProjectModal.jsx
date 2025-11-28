
import React, { useState, useEffect } from 'react';
import { X, Check, Building2, Users, User } from 'lucide-react';
import { DynamicFieldRenderer } from '../DynamicFieldRenderer';
import { SearchableSelect } from '../../../../components/ui/searchable-select';
import { useCustomers, useOrganizationMembers } from '../../hooks';

const AddProjectModal = ({
    isOpen,
    onClose,
    templates,
    statuses = [],
    onSave,
    organizationSlug,
    individualId,
    createProject,
}) => {
    const [step, setStep] = useState(1); // 1: Select Template, 2: Fill Details
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        customer_contact_id: null,
        status_id: null,
        visibility: 'organization', // 'organization', 'team', 'personal'
        budget: '',
        start_date: '',
        due_date: '',
        progress_current: 0,
        progress_total: 100,
        progress_unit: '%',
        custom_data: {}
    });
    const [saving, setSaving] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState([]);

    // Fetch customers for SearchableSelect
    const { customers, isLoading: customersLoading, getCustomerDisplayName } = useCustomers(organizationSlug);

    // Fetch organization members for team assignment
    const { members: orgMembers, isLoading: membersLoading } = useOrganizationMembers(organizationSlug);

    // Get default status (first status or one marked as default)
    const getDefaultStatusId = () => {
        const defaultStatus = statuses.find(s => s.is_default);
        return defaultStatus?.id || statuses[0]?.id || null;
    };

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setSelectedTemplateId('');
            setSelectedMembers([]);
            setFormData({
                name: '',
                customer_contact_id: null,
                status_id: getDefaultStatusId(),
                visibility: 'organization',
                budget: '',
                start_date: '',
                due_date: '',
                progress_current: 0,
                progress_total: 100,
                progress_unit: '%',
                custom_data: {}
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, statuses]);

    // Team member handlers
    const handleAddMember = (memberId) => {
        const member = orgMembers.find(m => m.id === memberId);
        if (member && !selectedMembers.some(m => m.id === memberId)) {
            setSelectedMembers(prev => [...prev, member]);
        }
    };

    const handleRemoveMember = (memberId) => {
        setSelectedMembers(prev => prev.filter(m => m.id !== memberId));
    };

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
            if (!formData.name) {
                throw new Error("Project Name is required");
            }

            const projectPayload = {
                name: formData.name,
                customer_contact_id: formData.customer_contact_id,
                status_id: formData.status_id,
                visibility: formData.visibility || 'organization',
                budget: formData.budget ? parseFloat(formData.budget) : null,
                start_date: formData.start_date || null,
                due_date: formData.due_date || null,
                template_id: selectedTemplateId,
                custom_data: formData.custom_data,
                progress_current: parseInt(formData.progress_current) || 0,
                progress_total: parseInt(formData.progress_total) || 100,
                progress_unit: formData.progress_unit || '%',
                // Backend expects members: [{ individual_id, role }]
                members: selectedMembers.map(m => ({ individual_id: m.id, role: 'member' })),
            };

            await createProject(projectPayload);
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
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                                            <SearchableSelect
                                                value={formData.customer_contact_id}
                                                onChange={(value) => setFormData({ ...formData, customer_contact_id: value })}
                                                options={customers}
                                                getOptionValue={(c) => c.id}
                                                getOptionLabel={(c) => getCustomerDisplayName(c)}
                                                placeholder="Select customer..."
                                                searchPlaceholder="Search customers..."
                                                searchKeys={['first_name', 'last_name', 'company_name', 'email']}
                                                clearable={true}
                                                loading={customersLoading}
                                                renderOption={(customer) => (
                                                    <div>
                                                        <div className="font-medium text-gray-900">
                                                            {getCustomerDisplayName(customer)}
                                                        </div>
                                                        {customer.email && (
                                                            <div className="text-xs text-gray-500">{customer.email}</div>
                                                        )}
                                                    </div>
                                                )}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                            <SearchableSelect
                                                value={formData.status_id}
                                                onChange={(value) => setFormData({ ...formData, status_id: value })}
                                                options={statuses}
                                                getOptionValue={(s) => s.id}
                                                getOptionLabel={(s) => s.name}
                                                placeholder="Select status..."
                                                searchable={false}
                                                renderOption={(status) => (
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: status.color || '#6B7280' }}
                                                        />
                                                        <span className="text-gray-900">{status.name}</span>
                                                    </div>
                                                )}
                                                renderSelected={(status) => (
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: status.color || '#6B7280' }}
                                                        />
                                                        <span className="text-gray-900">{status.name}</span>
                                                    </div>
                                                )}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                                            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, visibility: 'organization' })}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all flex-1 justify-center ${
                                                        formData.visibility === 'organization'
                                                            ? 'bg-white text-blue-600 shadow-sm'
                                                            : 'text-gray-600 hover:text-gray-900'
                                                    }`}
                                                    title="Visible to entire organization"
                                                >
                                                    <Building2 className="w-3.5 h-3.5" />
                                                    <span>All</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, visibility: 'team' })}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all flex-1 justify-center ${
                                                        formData.visibility === 'team'
                                                            ? 'bg-white text-blue-600 shadow-sm'
                                                            : 'text-gray-600 hover:text-gray-900'
                                                    }`}
                                                    title="Visible to assigned team members"
                                                >
                                                    <Users className="w-3.5 h-3.5" />
                                                    <span>Team</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, visibility: 'personal' })}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all flex-1 justify-center ${
                                                        formData.visibility === 'personal'
                                                            ? 'bg-white text-blue-600 shadow-sm'
                                                            : 'text-gray-600 hover:text-gray-900'
                                                    }`}
                                                    title="Only visible to you"
                                                >
                                                    <User className="w-3.5 h-3.5" />
                                                    <span>Private</span>
                                                </button>
                                            </div>
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

                                {/* Team Assignment */}
                                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wider">
                                            Assigned Team
                                            <span className="text-gray-400 text-xs font-normal ml-2">(Optional)</span>
                                        </h4>
                                    </div>

                                    {/* Selected Members */}
                                    {selectedMembers.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {selectedMembers.map(member => (
                                                <div
                                                    key={member.id}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg"
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                                                        {member.display_name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <span className="text-sm text-gray-900">{member.display_name || member.email}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveMember(member.id)}
                                                        className="text-gray-400 hover:text-gray-600"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add Member Dropdown */}
                                    <SearchableSelect
                                        value={null}
                                        onChange={handleAddMember}
                                        options={orgMembers.filter(m => !selectedMembers.some(sm => sm.id === m.id))}
                                        getOptionValue={(m) => m.id}
                                        getOptionLabel={(m) => m.display_name || m.email}
                                        placeholder="Add team member..."
                                        searchPlaceholder="Search members..."
                                        searchKeys={['display_name', 'email']}
                                        loading={membersLoading}
                                        renderOption={(member) => (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-[10px]">
                                                    {member.display_name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-900">{member.display_name}</div>
                                                    {member.email && (
                                                        <div className="text-xs text-gray-500">{member.email}</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    />
                                </div>

                                {/* Progress Tracking */}
                                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                    <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">Progress Tracking</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Current</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.progress_current}
                                                onChange={(e) => setFormData({ ...formData, progress_current: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={formData.progress_total}
                                                onChange={(e) => setFormData({ ...formData, progress_total: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                                placeholder="100"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                            <select
                                                value={formData.progress_unit}
                                                onChange={(e) => setFormData({ ...formData, progress_unit: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                            >
                                                <option value="%">Percentage (%)</option>
                                                <option value="tasks">Tasks</option>
                                                <option value="hours">Hours</option>
                                                <option value="units">Units</option>
                                                <option value="phases">Phases</option>
                                            </select>
                                        </div>
                                    </div>
                                    {/* Progress Preview */}
                                    <div className="mt-4">
                                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                                            <span>Progress</span>
                                            <span>
                                                {formData.progress_current} / {formData.progress_total} {formData.progress_unit}
                                                {' '}({formData.progress_total > 0 ? Math.round((formData.progress_current / formData.progress_total) * 100) : 0}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all"
                                                style={{ width: `${formData.progress_total > 0 ? Math.min(100, (formData.progress_current / formData.progress_total) * 100) : 0}%` }}
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
