import { useState, useEffect } from 'react';
import { Ban, Plus, Trash2, X } from 'lucide-react';
import { db } from '../lib/db';

// Default exclusions
const DEFAULT_EXCLUSIONS = [
  'OATH-A1-TEST',
  'a1 test',
  'OATH-GH-FRAGMENT-176-191-5MG',
  'OATH-GIFT-CARD',
  'gift card',
  'OATH-NAD+-1000MG',
  'OATH-SS-31-10MG',
  'OATH-TESA-IPA-10-5'
];

export default function ExclusionManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [exclusions, setExclusions] = useState([]);
  const [newExclusion, setNewExclusion] = useState('');
  const [loading, setLoading] = useState(true);

  // Load exclusions from settings
  useEffect(() => {
    const loadExclusions = async () => {
      try {
        const saved = await db.settings.get('excludedProducts');
        setExclusions(saved || DEFAULT_EXCLUSIONS);
      } catch (error) {
        console.error('Failed to load exclusions:', error);
        setExclusions(DEFAULT_EXCLUSIONS);
      } finally {
        setLoading(false);
      }
    };
    loadExclusions();
  }, []);

  // Save exclusions to settings
  const saveExclusions = async (newList) => {
    try {
      await db.settings.set('excludedProducts', newList);
      setExclusions(newList);
    } catch (error) {
      console.error('Failed to save exclusions:', error);
    }
  };

  const handleAdd = () => {
    if (newExclusion.trim() && !exclusions.includes(newExclusion.trim())) {
      const updated = [...exclusions, newExclusion.trim()];
      saveExclusions(updated);
      setNewExclusion('');
    }
  };

  const handleRemove = (exclusion) => {
    const updated = exclusions.filter(e => e !== exclusion);
    saveExclusions(updated);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
      >
        <Ban className="w-4 h-4" />
        <span>Product Exclusions ({exclusions.length})</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Ban className="w-6 h-6 text-red-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Product Exclusions</h2>
              <p className="text-sm text-gray-600">Products that will be skipped during CSV import</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Add New */}
        <div className="p-6 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Product to Exclude
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newExclusion}
              onChange={(e) => setNewExclusion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter product ID or name (e.g., OATH-A1-TEST)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleAdd}
              disabled={!newExclusion.trim()}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Tip: Matching is case-insensitive. "a1 test" will match "A1 Test", "OATH-A1-TEST", etc.
          </p>
        </div>

        {/* Exclusion List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : exclusions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Ban className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No exclusions configured</p>
              <p className="text-sm mt-1">Add products above to exclude them from imports</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Currently Excluding ({exclusions.length})
              </p>
              {exclusions.map((exclusion, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Ban className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm font-mono text-gray-900">{exclusion}</span>
                  </div>
                  <button
                    onClick={() => handleRemove(exclusion)}
                    className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                    title="Remove exclusion"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Changes are saved automatically
            </p>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to get current exclusions for CSV parser
export function useExclusions() {
  const [exclusions, setExclusions] = useState(DEFAULT_EXCLUSIONS);

  useEffect(() => {
    const loadExclusions = async () => {
      try {
        const saved = await db.settings.get('excludedProducts');
        if (saved) setExclusions(saved);
      } catch (error) {
        console.error('Failed to load exclusions:', error);
      }
    };
    loadExclusions();
  }, []);

  return exclusions;
}
