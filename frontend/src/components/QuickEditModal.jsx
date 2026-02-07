import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { db } from '../lib/db';

export default function QuickEditModal({ peptide, onClose, onUpdate, position }) {
  const [activeTab, setActiveTab] = useState('peptideId');
  const [formData, setFormData] = useState({ ...peptide });
  const [isExcluded, setIsExcluded] = useState(false);
  const modalRef = useRef(null);

  // Define editable fields with their display names
  const editableFields = [
    { id: 'peptideId', label: 'Product', type: 'text' },
    { id: 'peptideName', label: 'SKU', type: 'text' },
    { id: 'isLabeled', label: 'Labeled', type: 'checkbox' },
    { id: 'quantity', label: 'Quantity', type: 'number' },
    { id: 'batchNumber', label: 'Batch #', type: 'text' },
    { id: 'netWeight', label: 'Net Weight', type: 'text' },
    { id: 'purity', label: 'Purity', type: 'text' },
    { id: 'velocity', label: 'Velocity', type: 'text' },
    { id: 'orderedQty', label: 'Ordered Qty', type: 'number' },
    { id: 'orderedDate', label: 'Ordered Date', type: 'date' },
    { id: 'notes', label: 'Notes', type: 'textarea' },
    { id: 'supplier', label: 'Supplier', type: 'text' },
    { id: 'location', label: 'Location', type: 'text' }
  ];

  // Auto-save when field value changes
  const handleFieldChange = async (field, value) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);

    // Auto-save to database
    try {
      let saveValue = value;
      if (field === 'quantity' || field === 'orderedQty') {
        saveValue = Number(value);
      } else if (field === 'isLabeled') {
        saveValue = Boolean(value);
      }
      const saveData = { [field]: saveValue };
      await db.peptides.update(peptide.peptideId, saveData);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  // Handle exclude checkbox
  const handleExcludeChange = async (checked) => {
    setIsExcluded(checked);

    if (checked) {
      try {
        // Get current exclusions
        const currentExclusions = await db.settings.get('excludedProducts') || [];

        // Add peptide ID to exclusions if not already there
        if (!currentExclusions.includes(peptide.peptideId)) {
          const updatedExclusions = [...currentExclusions, peptide.peptideId];
          await db.settings.set('excludedProducts', updatedExclusions);
        }

        // Delete peptide from database
        await db.peptides.delete(peptide.peptideId);

        // Close modal and refresh
        if (onUpdate) onUpdate();
        onClose();
      } catch (error) {
        console.error('Failed to exclude peptide:', error);
        setIsExcluded(false);
      }
    }
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [onClose]);

  // Calculate modal position (centered on screen)
  const modalStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    maxHeight: '80vh',
    zIndex: 1000
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-30 z-[999]" />

      {/* Modal */}
      <div
        ref={modalRef}
        style={modalStyle}
        className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Quick Edit</h3>
            <p className="text-sm text-gray-600">{peptide.peptideId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs - Scrollable on mobile */}
        <div className="flex overflow-x-auto border-b border-gray-200 scrollbar-thin">
          {editableFields.map((field) => (
            <button
              key={field.id}
              onClick={() => setActiveTab(field.id)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === field.id
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {field.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {editableFields.map((field) => (
            <div
              key={field.id}
              className={activeTab === field.id ? 'block' : 'hidden'}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  value={formData[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  autoFocus
                />
              ) : field.type === 'checkbox' ? (
                <div className="flex items-center space-x-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData[field.id] || false}
                      onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      {formData[field.id] ? 'Yes' : 'No'}
                    </span>
                  </label>
                </div>
              ) : (
                <input
                  type={field.type}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  autoFocus
                />
              )}

              <p className="text-xs text-gray-500 mt-2">
                Changes save automatically
              </p>
            </div>
          ))}
        </div>

        {/* Footer with Exclude option */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isExcluded}
                onChange={(e) => handleExcludeChange(e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Exclude from inventory
              </span>
            </label>
            <p className="text-xs text-gray-500">
              Tap outside to close
            </p>
          </div>
          {isExcluded && (
            <p className="text-xs text-red-600 mt-2">
              Item will be removed and excluded from future imports
            </p>
          )}
        </div>
      </div>
    </>
  );
}
