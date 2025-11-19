/**
 * Contact Form Dialog - Add/Edit Contact
 */

import React, { useState, useEffect, useMemo } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { useOrganizationMembers } from '../hooks/useOrganizationMembers';
import MemberSelect from './MemberSelect';
import TagInput from './TagInput';
import StarRating from './StarRating';
import { createClient } from '@supabase/supabase-js';
import { tagAPI } from '../api';
import { MALAYSIA_CITIES, getCitiesByState, getCityCoordinates } from '../utils/malaysiaCities';

// Initialize Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || '',
  process.env.REACT_APP_SUPABASE_ANON_KEY || ''
);

export default function ContactFormDialog({
  isOpen,
  onClose,
  onSave,
  onRefresh,
  contact = null,
  contacts = [],
  stages = [],
  channels = [],
  availableTags = [],
  onCreateTag,
  organizationSlug,
  maxRatingScale = 10,
}) {
  // Fetch organization members for assignment dropdowns
  const { members } = useOrganizationMembers(organizationSlug);

  // Avatar upload state
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Tag state
  const [selectedTags, setSelectedTags] = useState([]);

  // City autocomplete state
  const [citySearchText, setCitySearchText] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const [formData, setFormData] = useState({
    // Personal Information
    first_name: '',
    last_name: '',
    nickname: '',
    gender: '',

    // Contact Information
    email: '',
    phone_1: '',
    phone_2: '',

    // Business Information
    company_name: '',
    industry: '',
    entity_type: 'individual',
    contact_type: 'customer',

    // Contact Person (for company entities)
    contact_person_name: '',
    contact_person_phone: '',

    // Address Information
    address_line_1: '',
    address_line_2: '',
    postal_code: '',
    city: '',
    state: '',

    // Source & Assignment
    traffic_source_id: '',
    sales_person_individual_id: '',
    customer_service_individual_id: '',

    // Referral
    referred_by_contact_id: '',

    // Pipeline Status
    current_stage_id: '',

    // Avatar
    avatar_url: '',

    // Rating (for customers only)
    rating: null,

    // Notes
    notes: '',
  });

  // Set avatar preview when contact has avatar_url
  useEffect(() => {
    if (contact?.avatar_url) {
      setAvatarPreview(contact.avatar_url);
    } else {
      setAvatarPreview(null);
    }
  }, [contact]);

  // Load contact tags when editing
  useEffect(() => {
    if (contact?.id && organizationSlug) {
      // Fetch tags for this contact
      tagAPI.getContactTags(contact.id, organizationSlug)
        .then((tags) => {
          setSelectedTags(tags || []);
        })
        .catch((err) => {
          console.error('Error fetching contact tags:', err);
          setSelectedTags([]);
        });
    } else {
      // Clear tags when creating new contact
      setSelectedTags([]);
    }
  }, [contact?.id, organizationSlug]);

  // Populate form when editing existing contact
  useEffect(() => {
    if (contact) {
      // ONLY populate editable fields, NOT system/readonly fields
      setFormData({
        // Personal Information
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        nickname: contact.nickname || '',
        gender: contact.gender || '',
        // Contact Information
        email: contact.email || '',
        phone_1: contact.phone_1 || '',
        phone_2: contact.phone_2 || '',
        // Business Information
        company_name: contact.company_name || '',
        industry: contact.industry || '',
        entity_type: contact.entity_type || 'individual',
        contact_type: contact.contact_type || 'customer',
        // Contact Person (for company entities)
        contact_person_name: contact.contact_person_name || '',
        contact_person_phone: contact.contact_person_phone || '',
        // Address Information
        address_line_1: contact.address_line_1 || '',
        address_line_2: contact.address_line_2 || '',
        postal_code: contact.postal_code || '',
        city: contact.city || '',
        state: contact.state || '',
        // Source & Assignment
        traffic_source_id: contact.traffic_source_id || '',
        sales_person_individual_id: contact.sales_person_individual_id || '',
        customer_service_individual_id: contact.customer_service_individual_id || '',
        // Referral
        referred_by_contact_id: contact.referred_by_contact_id || '',
        // Pipeline Status
        current_stage_id: contact.current_stage_id || '',
        // Avatar
        avatar_url: contact.avatar_url || '',
        // Rating
        rating: contact.rating || null,
        // Notes
        notes: contact.notes || '',
      });
    } else {
      // Reset form for new contact
      setFormData({
        first_name: '',
        last_name: '',
        nickname: '',
        gender: '',
        email: '',
        phone_1: '',
        phone_2: '',
        company_name: '',
        industry: '',
        entity_type: 'individual',
        contact_type: 'customer',
        contact_person_name: '',
        contact_person_phone: '',
        address_line_1: '',
        address_line_2: '',
        postal_code: '',
        city: '',
        state: '',
        traffic_source_id: channels[0]?.id || '',
        sales_person_individual_id: '',
        customer_service_individual_id: '',
        referred_by_contact_id: '',
        current_stage_id: stages[0]?.id || '',
        avatar_url: '',
        rating: null,
        notes: '',
      });
    }
  }, [contact, isOpen, stages, channels]);

  // Filter cities based on selected state and search text
  const filteredCities = useMemo(() => {
    let cities = formData.state
      ? getCitiesByState(formData.state)
      : MALAYSIA_CITIES;

    // Further filter by search text
    if (citySearchText) {
      const search = citySearchText.toLowerCase();
      cities = cities.filter(c =>
        c.city.toLowerCase().includes(search)
      );
    }

    return cities;
  }, [formData.state, citySearchText]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle state change - clear city if it doesn't belong to new state
  const handleStateChange = (e) => {
    const newState = e.target.value;
    setFormData((prev) => {
      // Check if current city belongs to the new state
      if (prev.city && newState) {
        const cityData = getCityCoordinates(prev.city);
        if (cityData && cityData.state !== newState) {
          // Clear city if it doesn't match new state
          return { ...prev, state: newState, city: '' };
        }
      }
      return { ...prev, state: newState };
    });
  };

  // Handle city selection - auto-fill state
  const handleCitySelect = (cityName) => {
    const cityData = getCityCoordinates(cityName);

    setFormData((prev) => ({
      ...prev,
      city: cityName,
      state: cityData ? cityData.state : prev.state,
    }));

    setCitySearchText('');
    setShowCityDropdown(false);
  };

  // Handle city search input
  const handleCitySearchChange = (e) => {
    const value = e.target.value;
    setCitySearchText(value);
    setFormData((prev) => ({ ...prev, city: value }));
    setShowCityDropdown(true);
  };

  // Handle rating change
  const handleRatingChange = (rating) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, GIF, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return;
    }

    console.log('📤 [AvatarUpload] Starting upload:', file.name, file.size, 'bytes');

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
    setUploading(true);
    setUploadProgress(0);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${organizationSlug}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      console.log('📤 [AvatarUpload] Uploading to:', fileName);

      // Upload file
      const { data, error } = await supabase.storage
        .from('contact-avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('❌ [AvatarUpload] Upload error:', error);
        throw error;
      }

      console.log('✅ [AvatarUpload] Upload successful:', data);

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('contact-avatars')
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;
      console.log('🔗 [AvatarUpload] Public URL:', publicUrl);

      // Update form data with URL
      setFormData((prev) => ({
        ...prev,
        avatar_url: publicUrl,
      }));

      setUploadProgress(100);
      console.log('✅ [AvatarUpload] Avatar URL saved to form');

    } catch (error) {
      console.error('❌ [AvatarUpload] Upload failed:', error);
      alert(`Upload failed: ${error.message}`);
      setAvatarPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setFormData((prev) => ({
      ...prev,
      avatar_url: '',
    }));
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      alert('请输入姓和名');
      return;
    }

    console.log('📋 [ContactFormDialog] Submitting form data:', formData);
    console.log('📋 [ContactFormDialog] Nickname value:', formData.nickname);
    console.log('📋 [ContactFormDialog] Avatar URL:', formData.avatar_url);
    console.log('📋 [ContactFormDialog] Selected tags:', selectedTags);

    try {
      // Save contact (create or update)
      const savedContact = await onSave(formData);

      // Assign tags to the contact
      const contactId = savedContact?.id || contact?.id;
      if (contactId && selectedTags.length >= 0) {
        const tagIds = selectedTags.map((tag) => tag.id);
        await tagAPI.assignTagsToContact(contactId, tagIds);
        console.log('✅ [ContactFormDialog] Tags assigned successfully');
      }

      // Refresh the contacts list to show updated tags
      if (onRefresh) {
        console.log('🔄 [ContactFormDialog] Refreshing contacts list...');
        await onRefresh();
      }

      onClose();
    } catch (error) {
      console.error('❌ [ContactFormDialog] Form submission error:', error);
      alert(`保存失败: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  const isCompanyEntity = formData.entity_type === 'company';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            {contact ? 'Edit contact' : 'Add contact'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    placeholder="Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nickname
                  </label>
                  <input
                    type="text"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    placeholder="Optional nickname"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="">Not specified</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact type
                  </label>
                  <select
                    name="contact_type"
                    value={formData.contact_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="customer">Customer</option>
                    <option value="supplier">Supplier</option>
                    <option value="coi">COI</option>
                    <option value="internal">Internal</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone 1
                  </label>
                  <input
                    type="tel"
                    name="phone_1"
                    value={formData.phone_1}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    placeholder="+60 12-345 6789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone 2
                  </label>
                  <input
                    type="tel"
                    name="phone_2"
                    value={formData.phone_2}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    placeholder="+60 3-1234 5678"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  placeholder="john@example.com"
                />
              </div>
            </div>
            {/* Business Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Business information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entity type
                  </label>
                  <select
                    name="entity_type"
                    value={formData.entity_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="individual">Individual</option>
                    <option value="company">Company</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company name
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    placeholder="Acme Inc."
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    placeholder="e.g. Technology, Finance, Manufacturing"
                  />
                </div>
              </div>

              {/* Contact Person Section (only for companies) */}
              {isCompanyEntity && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Contact person (company representative)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact person name
                      </label>
                      <input
                        type="text"
                        name="contact_person_name"
                        value={formData.contact_person_name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 bg-white"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact person phone
                      </label>
                      <input
                        type="tel"
                        name="contact_person_phone"
                        value={formData.contact_person_phone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 bg-white"
                        placeholder="Phone number"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Address Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Address information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address line 1
                  </label>
                  <input
                    type="text"
                    name="address_line_1"
                    value={formData.address_line_1}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address line 2
                  </label>
                  <input
                    type="text"
                    name="address_line_2"
                    value={formData.address_line_2}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    placeholder="Apartment, Suite, etc. (optional)"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal code
                    </label>
                    <input
                      type="text"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                      placeholder="50000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleStateChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">Select state...</option>
                      <optgroup label="States">
                        <option value="Johor">Johor</option>
                        <option value="Kedah">Kedah</option>
                        <option value="Kelantan">Kelantan</option>
                        <option value="Melaka">Melaka</option>
                        <option value="Negeri Sembilan">Negeri Sembilan</option>
                        <option value="Pahang">Pahang</option>
                        <option value="Penang">Penang</option>
                        <option value="Perak">Perak</option>
                        <option value="Perlis">Perlis</option>
                        <option value="Sabah">Sabah</option>
                        <option value="Sarawak">Sarawak</option>
                        <option value="Selangor">Selangor</option>
                        <option value="Terengganu">Terengganu</option>
                      </optgroup>
                      <optgroup label="Federal Territories">
                        <option value="Kuala Lumpur">Kuala Lumpur</option>
                        <option value="Labuan">Labuan</option>
                        <option value="Putrajaya">Putrajaya</option>
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={formData.city || citySearchText}
                        onChange={handleCitySearchChange}
                        onFocus={() => setShowCityDropdown(true)}
                        placeholder={formData.state ? `Search cities in ${formData.state}...` : "Search city or select state first..."}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                        autoComplete="off"
                      />

                      {/* City Dropdown */}
                      {showCityDropdown && filteredCities.length > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            maxHeight: '200px',
                            overflowY: 'auto',
                            backgroundColor: 'white',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            marginTop: '4px',
                            zIndex: 1000,
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          }}
                        >
                          {filteredCities.slice(0, 20).map((city) => (
                            <div
                              key={city.city}
                              onClick={() => handleCitySelect(city.city)}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f0f0f0',
                                fontSize: '14px',
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                            >
                              <div style={{ fontWeight: '500', color: '#333' }}>
                                {city.city}
                              </div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                {city.state}
                              </div>
                            </div>
                          ))}
                          {filteredCities.length > 20 && (
                            <div style={{ padding: '8px 12px', fontSize: '12px', color: '#999', textAlign: 'center' }}>
                              ... and {filteredCities.length - 20} more (keep typing to filter)
                            </div>
                          )}
                        </div>
                      )}

                      {/* Click outside to close dropdown */}
                      {showCityDropdown && (
                        <div
                          onClick={() => setShowCityDropdown(false)}
                          style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 999,
                          }}
                        />
                      )}
                    </div>

                    {formData.city && (
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        ✓ Selected: {formData.city} {getCityCoordinates(formData.city) && `(${getCityCoordinates(formData.city)?.state})`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Source & Assignment Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Source and assignment</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current stage
                  </label>
                  <select
                    name="current_stage_id"
                    value={formData.current_stage_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="">Not selected</option>
                    {stages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Traffic source
                  </label>
                  <select
                    name="traffic_source_id"
                    value={formData.traffic_source_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="">Not selected</option>
                    {channels.map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        {channel.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Sales Person Assignment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sales Person
                  </label>
                  <MemberSelect
                    name="sales_person_individual_id"
                    value={formData.sales_person_individual_id}
                    onChange={handleChange}
                    members={members}
                    placeholder="Not assigned"
                  />
                </div>

                {/* Customer Service Assignment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Service
                  </label>
                  <MemberSelect
                    name="customer_service_individual_id"
                    value={formData.customer_service_individual_id}
                    onChange={handleChange}
                    members={members}
                    placeholder="Not assigned"
                  />
                </div>

                {/* Referred By */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referred by (contact)
                  </label>
                  <select
                    name="referred_by_contact_id"
                    value={formData.referred_by_contact_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="">No referral</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.first_name} {contact.last_name} {contact.company_name ? `(${contact.company_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Customer Rating Section - Only for customers */}
            {formData.contact_type === 'customer' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer conversion rating</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Rate the probability of converting this customer to sales (1-{maxRatingScale})
                  </label>
                  <StarRating
                    rating={formData.rating || 0}
                    onChange={handleRatingChange}
                    maxRating={maxRatingScale}
                    size={24}
                    readonly={false}
                    showLabel={true}
                  />
                  <p className="text-xs text-gray-600 mt-3">
                    Higher rating = Higher probability of conversion
                  </p>
                </div>
              </div>
            )}

            {/* Avatar Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Avatar</h3>

              <div className="space-y-4">
                {/* Avatar Preview */}
                {avatarPreview && (
                  <div className="flex items-center gap-4">
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Avatar Image
                  </label>

                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="avatar-upload"
                      className={`
                        px-4 py-2 border border-gray-300 rounded-lg cursor-pointer
                        flex items-center gap-2 font-medium transition-colors
                        ${uploading ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50 text-gray-700'}
                      `}
                    >
                      {uploading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={18} />
                          <span>Choose Image</span>
                        </>
                      )}
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                      className="hidden"
                    />

                    {uploading && (
                      <span className="text-sm text-gray-600">
                        {uploadProgress}%
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    Recommended: 200x200 pixels, JPG or PNG, max 5MB
                  </p>

                  {/* Upload Progress Bar */}
                  {uploading && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Alternative: Paste URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Or paste image URL
                  </label>
                  <input
                    type="url"
                    name="avatar_url"
                    value={formData.avatar_url}
                    onChange={(e) => {
                      handleChange(e);
                      // Update preview when URL is pasted
                      if (e.target.value) {
                        setAvatarPreview(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If no avatar is provided, a colored circle with initials will be shown
                  </p>
                </div>
              </div>
            </div>

            {/* Tags Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
              <div>
                <TagInput
                  selectedTags={selectedTags}
                  availableTags={availableTags}
                  onChange={setSelectedTags}
                  onCreateTag={onCreateTag}
                  placeholder="Type to add tags (press Enter to create new)..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  Add tags to categorize and filter contacts. Type to search existing tags or create new ones.
                </p>
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
              <div>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 resize-none"
                  placeholder="Add notes..."
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {contact ? 'Save' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
