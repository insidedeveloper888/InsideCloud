import React, { useState, useEffect } from 'react';
import { X, Edit2, Save, Calendar, Trash2, UserPlus, Building2, Users, User } from 'lucide-react';
import { DynamicFieldRenderer } from '../DynamicFieldRenderer';
import { SearchableSelect } from '../../../../components/ui/searchable-select';
import { useCustomers, useOrganizationMembers, useProjectMembers } from '../../hooks';

const ProjectDetailModal = ({
    isOpen,
    onClose,
    project,
    templates,
    statuses = [],
    onSave,
    organizationSlug,
    individualId,
    updateProject,
    deleteProject,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showMemberSelect, setShowMemberSelect] = useState(false);
    const [formData, setFormData] = useState(null);

    // Fetch customers for SearchableSelect
    const { customers, isLoading: customersLoading, getCustomerDisplayName } = useCustomers(organizationSlug);

    // Fetch organization members for assignment dropdown
    const { members: orgMembers, isLoading: orgMembersLoading } = useOrganizationMembers(organizationSlug);

    // Fetch and manage project members
    const {
        members: projectMembers,
        addMember,
        removeMember,
        isLoading: projectMembersLoading
    } = useProjectMembers(project?.id, organizationSlug);

    // Update formData when project changes
    useEffect(() => {
        if (project) {
            setFormData({
                ...project,
                customer_contact_id: project.customer_contact_id || project.customer?.id || null,
            });
            setIsEditing(false);
        } else {
            setFormData(null);
        }
    }, [project]);

    console.log('ProjectDetailModal render:', { isOpen, project: !!project, formData: !!formData });

    if (!isOpen || !project || !formData) return null;

    const template = templates.find(t => t.id === project.template_id);

    console.log('Modal rendering with:', {
        template: template?.name,
        formDataKeys: Object.keys(formData),
        formData: formData
    });

    // Get status info
    const getStatusInfo = (statusId) => {
        return statuses.find(s => s.id === statusId) || { name: 'Unknown', color: '#6B7280' };
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

    const handleSave = async () => {
        setSaving(true);
        try {
            const updateData = {
                name: formData.name,
                description: formData.description,
                customer_contact_id: formData.customer_contact_id,
                status_id: formData.status_id,
                visibility: formData.visibility || 'organization',
                budget: formData.budget ? parseFloat(formData.budget) : null,
                start_date: formData.start_date || null,
                due_date: formData.due_date || null,
                custom_data: formData.custom_data,
                progress_current: formData.progress_current,
                progress_total: formData.progress_total,
                progress_unit: formData.progress_unit,
            };
            await updateProject(project.id, updateData);
            onSave();
            setIsEditing(false);
        } catch (error) {
            alert(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this project?')) return;
        setDeleting(true);
        try {
            await deleteProject(project.id);
            onSave();
        } catch (error) {
            alert(error.message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:p-0">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={onClose}
                ></div>

                {/* Modal panel */}
                <div className="relative w-full max-w-4xl transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all flex flex-col max-h-[90vh]">
                    {/* Header - Fixed */}
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 border-b border-gray-200 flex justify-between items-start flex-shrink-0">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 flex-wrap gap-y-2">
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
                                {isEditing ? (
                                    <SearchableSelect
                                        value={formData.status_id}
                                        onChange={(value) => setFormData({ ...formData, status_id: value })}
                                        options={statuses}
                                        getOptionValue={(s) => s.id}
                                        getOptionLabel={(s) => s.name}
                                        placeholder="Status..."
                                        searchable={false}
                                        className="w-40"
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
                                ) : (
                                    <span
                                        className="px-2.5 py-0.5 rounded-full text-xs font-medium border"
                                        style={{
                                            backgroundColor: `${getStatusInfo(formData.status_id).color}20`,
                                            color: getStatusInfo(formData.status_id).color,
                                            borderColor: `${getStatusInfo(formData.status_id).color}40`,
                                        }}
                                    >
                                        {getStatusInfo(formData.status_id).name}
                                    </span>
                                )}
                            </div>
                            <div className="text-sm text-gray-500 mt-2">
                                {isEditing ? (
                                    <div className="w-64">
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
                                ) : (
                                    <>Customer: {formData.customer ? getCustomerDisplayName(formData.customer) : 'None'}</>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                            {!isEditing ? (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                    >
                                        <Save className="w-4 h-4 mr-1.5" />
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                </>
                            )}
                            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-500 rounded-full">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="bg-gray-50 px-4 py-5 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-scroll flex-1">
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
                        <div className="space-y-4">
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

                            {/* Visibility */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Visibility</h4>
                                {isEditing ? (
                                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, visibility: 'organization' })}
                                            className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all flex-1 justify-center ${formData.visibility === 'organization'
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                        >
                                            <Building2 className="w-3 h-3" />
                                            <span>All</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, visibility: 'team' })}
                                            className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all flex-1 justify-center ${formData.visibility === 'team'
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                        >
                                            <Users className="w-3 h-3" />
                                            <span>Team</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, visibility: 'personal' })}
                                            className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all flex-1 justify-center ${formData.visibility === 'personal'
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                        >
                                            <User className="w-3 h-3" />
                                            <span>Private</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        {formData.visibility === 'organization' && (
                                            <>
                                                <Building2 className="w-4 h-4 text-gray-400" />
                                                <span>Visible to all</span>
                                            </>
                                        )}
                                        {formData.visibility === 'team' && (
                                            <>
                                                <Users className="w-4 h-4 text-gray-400" />
                                                <span>Team only</span>
                                            </>
                                        )}
                                        {formData.visibility === 'personal' && (
                                            <>
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span>Private</span>
                                            </>
                                        )}
                                        {!formData.visibility && (
                                            <>
                                                <Building2 className="w-4 h-4 text-gray-400" />
                                                <span>Visible to all</span>
                                            </>
                                        )}
                                    </div>
                                )}
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

                            {/* Progress Tracking */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Progress</h4>
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="text-xs text-gray-400">Current</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={formData.progress_current || 0}
                                                    onChange={(e) => setFormData({ ...formData, progress_current: e.target.value })}
                                                    className="w-full border rounded px-2 py-1 text-sm text-gray-900 bg-white mt-1"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400">Total</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={formData.progress_total || 100}
                                                    onChange={(e) => setFormData({ ...formData, progress_total: e.target.value })}
                                                    className="w-full border rounded px-2 py-1 text-sm text-gray-900 bg-white mt-1"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400">Unit</label>
                                                <select
                                                    value={formData.progress_unit || '%'}
                                                    onChange={(e) => setFormData({ ...formData, progress_unit: e.target.value })}
                                                    className="w-full border rounded px-2 py-1 text-sm text-gray-900 bg-white mt-1"
                                                >
                                                    <option value="%">%</option>
                                                    <option value="tasks">tasks</option>
                                                    <option value="hours">hours</option>
                                                    <option value="units">units</option>
                                                    <option value="phases">phases</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-600">
                                                {formData.progress_current || 0} / {formData.progress_total || 100} {formData.progress_unit || '%'}
                                            </span>
                                            <span className="font-semibold text-gray-900">
                                                {formData.progress_total > 0 ? Math.round(((formData.progress_current || 0) / formData.progress_total) * 100) : 0}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all"
                                                style={{
                                                    width: `${formData.progress_total > 0 ? Math.min(100, ((formData.progress_current || 0) / formData.progress_total) * 100) : 0}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned Team</h4>
                                    {isEditing && (
                                        <button
                                            onClick={() => setShowMemberSelect(true)}
                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                            title="Add member"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {projectMembersLoading ? (
                                        <div className="text-sm text-gray-400">Loading...</div>
                                    ) : (
                                        <>
                                            {projectMembers.map(member => (
                                                <div key={member.id} className="flex items-center justify-between group">
                                                    <div className="flex items-center">
                                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs mr-3">
                                                            {member.individual?.display_name?.charAt(0) || '?'}
                                                        </div>
                                                        <div>
                                                            <span className="text-sm text-gray-700">{member.individual?.display_name || 'Unknown'}</span>
                                                            <span className="text-xs text-gray-400 ml-2">({member.role || 'member'})</span>
                                                        </div>
                                                    </div>
                                                    {isEditing && (
                                                        <button
                                                            onClick={() => removeMember(member.individual_id)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                                            title="Remove member"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            {projectMembers.length === 0 && (
                                                <p className="text-sm text-gray-400 italic">No team members assigned</p>
                                            )}
                                        </>
                                    )}

                                    {/* Member Assignment Dropdown */}
                                    {showMemberSelect && isEditing && (
                                        <div className="mt-3 border-t pt-3">
                                            <SearchableSelect
                                                value={null}
                                                onChange={async (memberId) => {
                                                    if (memberId) {
                                                        try {
                                                            await addMember(memberId, 'member');
                                                            setShowMemberSelect(false);
                                                        } catch (err) {
                                                            console.error('Failed to add member:', err);
                                                        }
                                                    }
                                                }}
                                                options={orgMembers.filter(m =>
                                                    !projectMembers.some(pm => pm.individual_id === m.id)
                                                )}
                                                getOptionValue={(m) => m.id}
                                                getOptionLabel={(m) => m.display_name}
                                                placeholder="Select team member..."
                                                searchPlaceholder="Search members..."
                                                loading={orgMembersLoading}
                                                maxHeight="200px"
                                                minDropdownWidth="100%"
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
                                            <button
                                                onClick={() => setShowMemberSelect(false)}
                                                className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                                            >
                                                Cancel
                                            </button>
                                        </div>
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
