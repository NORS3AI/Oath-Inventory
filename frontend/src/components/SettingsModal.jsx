import { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, X, Type } from 'lucide-react';

const FONT_SIZES = [12, 13, 14, 15, 16, 18, 20, 22, 24];

export default function SettingsModal({ isOpen, onClose }) {
  const [fontSize, setFontSize] = useState(() => {
    return Number(localStorage.getItem('app-font-size')) || 16;
  });
  const modalRef = useRef(null);

  // Apply font size to document
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem('app-font-size', fontSize.toString());
  }, [fontSize]);

  // Load saved font size on mount
  useEffect(() => {
    const saved = Number(localStorage.getItem('app-font-size'));
    if (saved && FONT_SIZES.includes(saved)) {
      setFontSize(saved);
      document.documentElement.style.fontSize = `${saved}px`;
    }
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999] p-4">
      <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <SettingsIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Settings</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Font Size Control */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Type className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Font Size</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Adjust the base font size for the entire application.
              </p>

              {/* Size Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                {FONT_SIZES.map(size => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`min-w-[3rem] px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      fontSize === size
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    {size}pt
                  </button>
                ))}
              </div>

              {/* Preview */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Preview</p>
                <p style={{ fontSize: `${fontSize}px` }} className="text-gray-900 dark:text-white">
                  The quick brown fox jumps over the lazy dog.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    style={{ fontSize: `${Math.max(fontSize * 0.875, 11)}px` }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg whitespace-nowrap"
                  >
                    Sample Button
                  </button>
                  <button
                    style={{ fontSize: `${Math.max(fontSize * 0.875, 11)}px` }}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg whitespace-nowrap"
                  >
                    Save All
                  </button>
                  <button
                    style={{ fontSize: `${Math.max(fontSize * 0.875, 11)}px` }}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg whitespace-nowrap"
                  >
                    Bulk Edit
                  </button>
                </div>
              </div>

              {/* Reset */}
              <button
                onClick={() => setFontSize(16)}
                className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Reset to default (16pt)
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 dark:bg-blue-600 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-blue-700 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
