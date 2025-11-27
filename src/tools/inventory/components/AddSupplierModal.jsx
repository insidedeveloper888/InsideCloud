import React from 'react';
import { Users, X } from 'lucide-react';

/**
 * Modal for adding a new supplier with complete contact and business information
 */
export default function AddSupplierModal({
  isOpen,
  onClose,
  newSupplier,
  setNewSupplier,
  onSubmit
}) {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    setNewSupplier({
      first_name: '', last_name: '', phone_1: '', phone_2: '', email: '',
      entity_type: 'company', company_name: '', industry: '',
      contact_person_name: '', contact_person_phone: '',
      address_line_1: '', address_line_2: '', postal_code: '', state: '', city: '',
      notes: ''
    });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-8 w-full max-w-2xl border border-gray-200/50 transform transition-all max-h-[95vh] md:max-h-[90vh] overflow-y-auto my-auto mx-2 md:mx-auto animate-in zoom-in-95 fade-in duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Add Supplier</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                <input
                  type="text"
                  value={newSupplier.first_name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, first_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                <input
                  type="text"
                  value={newSupplier.last_name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, last_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                  placeholder="Doe"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone 1 *</label>
                <input
                  type="tel"
                  value={newSupplier.phone_1}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone_1: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                  placeholder="+60 12-345 6789"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone 2</label>
                <input
                  type="tel"
                  value={newSupplier.phone_2}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone_2: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                  placeholder="+60 3-1234 5678"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={newSupplier.email}
                onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                placeholder="john@example.com"
              />
            </div>
          </div>

          {/* Business Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Business Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Entity Type</label>
                <select
                  value={newSupplier.entity_type}
                  onChange={(e) => setNewSupplier({ ...newSupplier, entity_type: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                >
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  value={newSupplier.company_name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, company_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                  placeholder="Acme Inc."
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Industry</label>
              <input
                type="text"
                value={newSupplier.industry}
                onChange={(e) => setNewSupplier({ ...newSupplier, industry: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                placeholder="e.g., Technology, Finance, Manufacturing"
              />
            </div>
            {newSupplier.entity_type === 'company' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Person Name</label>
                  <input
                    type="text"
                    value={newSupplier.contact_person_name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, contact_person_name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                    placeholder="Contact person"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Person Phone</label>
                  <input
                    type="tel"
                    value={newSupplier.contact_person_phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, contact_person_phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                    placeholder="Contact phone"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Address Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Address Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 1</label>
                <input
                  type="text"
                  value={newSupplier.address_line_1}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address_line_1: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                  placeholder="Street address"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 2</label>
                <input
                  type="text"
                  value={newSupplier.address_line_2}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address_line_2: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                  placeholder="Apartment, Suite, etc. (optional)"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code</label>
                  <input
                    type="text"
                    value={newSupplier.postal_code}
                    onChange={(e) => setNewSupplier({ ...newSupplier, postal_code: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                  <select
                    value={newSupplier.state}
                    onChange={(e) => setNewSupplier({ ...newSupplier, state: e.target.value, city: '' })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={newSupplier.city}
                    onChange={(e) => setNewSupplier({ ...newSupplier, city: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
                    placeholder="City"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
            <textarea
              value={newSupplier.notes}
              onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all resize-none"
              rows="2"
              placeholder="Additional notes..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-8 pt-6 border-t-2 border-gray-100">
          <button
            onClick={handleClose}
            className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!newSupplier.first_name || !newSupplier.last_name || !newSupplier.phone_1}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Add Supplier
          </button>
        </div>
      </div>
    </div>
  );
}
