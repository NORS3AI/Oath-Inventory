import { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, X, Type, ScrollText } from 'lucide-react';

// Complete patch history with timestamps
const PATCH_NOTES = [
  { version: '0.0.104', date: '2026-02-14 00:00', title: 'Compare: CSV import for snapshots, multi-day trend view (1wk/2wk/1mo), 1000-item limit' },
  { version: '0.0.103', date: '2026-02-11 00:00', title: 'Add sortable/hideable columns to Labeling tab, add Top 100 Needs Labeling report' },
  { version: '0.0.102', date: '2026-02-10 14:30', title: 'Add nickname field for products - displays under product name, used as display name when set' },
  { version: '0.0.101', date: '2026-02-10 11:10', title: 'Add bulk edit modal for mass editing all peptides at once' },
  { version: '0.0.100', date: '2026-02-10 10:15', title: 'Update docs/ build to match IndexedDB-only frontend' },
  { version: '0.0.99', date: '2026-02-10 09:59', title: 'Revert frontend to IndexedDB storage, remove backend API/auth dependency' },
  { version: '0.0.98', date: '2026-02-09 12:44', title: 'Claude/oath peptide inventory system merge (#36)' },
  { version: '0.0.97', date: '2026-02-09 19:40', title: 'Add comprehensive security documentation' },
  { version: '0.0.96', date: '2026-02-09 19:39', title: 'Add password authentication system (v0.0.100-alpha)' },
  { version: '0.0.95', date: '2026-02-09 17:31', title: 'Add deployment documentation and development startup script' },
  { version: '0.0.94', date: '2026-02-09 17:30', title: 'Migrate from browser storage to permanent backend database' },
  { version: '0.0.93', date: '2026-02-09 17:14', title: 'Merge main into feature branch and resolve version conflict' },
  { version: '0.0.92', date: '2026-02-09 10:09', title: 'Revert "Improve ExclusionManager display for better visibility"' },
  { version: '0.0.91', date: '2026-02-09 17:07', title: 'Fix overly broad exclusion matching that was hiding products' },
  { version: '0.0.90', date: '2026-02-09 05:16', title: 'Improve ExclusionManager display for better visibility' },
  { version: '0.0.89', date: '2026-02-08 21:51', title: 'Persist sort order across page refreshes in Inventory' },
  { version: '0.0.88', date: '2026-02-09 04:48', title: 'Persist sort order across page refreshes in Inventory' },
  { version: '0.0.87', date: '2026-02-09 04:14', title: 'Add ability to create new product rows in Inventory' },
  { version: '0.0.86', date: '2026-02-09 01:58', title: 'Fix OFF BOOKS calculation for negative quantities (backorders)' },
  { version: '0.0.85', date: '2026-02-08 18:34', title: 'Fix OFF BOOKS calculation for zero quantity items' },
  { version: '0.0.84', date: '2026-02-09 00:48', title: 'Add OFF BOOKS column to track extra labeled inventory' },
  { version: '0.0.83', date: '2026-02-08 14:55', title: 'Persist search terms across page refreshes' },
  { version: '0.0.82', date: '2026-02-08 21:42', title: 'Persist search terms across page refreshes' },
  { version: '0.0.81', date: '2026-02-08 21:40', title: 'Add automatic version tracking and bump script' },
  { version: '0.0.80', date: '2026-02-08 14:37', title: 'Disable autocorrect on all search inputs' },
  { version: '0.0.79', date: '2026-02-08 21:34', title: 'Disable autocorrect on all search inputs' },
  { version: '0.0.78', date: '2026-02-08 14:33', title: 'Add Labeling tab with comprehensive tracking and management' },
  { version: '0.0.77', date: '2026-02-08 21:30', title: 'Add Labeling tab with comprehensive tracking and management' },
  { version: '0.0.76', date: '2026-02-08 13:18', title: 'Implement bulk exclusion with checkboxes and site-wide filtering' },
  { version: '0.0.75', date: '2026-02-08 17:29', title: 'Merge main into feature branch' },
  { version: '0.0.74', date: '2026-02-08 17:22', title: 'Implement bulk exclusion with checkboxes and site-wide filtering' },
  { version: '0.0.73', date: '2026-02-08 10:15', title: 'Remove labeling page, fix dashboard actions, improve mobile scrolling' },
  { version: '0.0.72', date: '2026-02-08 17:12', title: 'Remove labeling page, fix dashboard actions, improve mobile scrolling' },
  { version: '0.0.71', date: '2026-02-08 10:03', title: 'Enhance Sales Ready and Reports pages with sorting and dark mode' },
  { version: '0.0.70', date: '2026-02-08 17:01', title: 'Enhance Sales Ready and Reports pages with sorting and dark mode' },
  { version: '0.0.69', date: '2026-02-08 16:48', title: 'Move Import CSV to last menu item and add Labeling debug' },
  { version: '0.0.68', date: '2026-02-08 16:44', title: 'Fix label color for negative quantities' },
  { version: '0.0.67', date: '2026-02-08 09:39', title: 'Make app mobile/iPhone friendly with horizontal navigation scrolling' },
  { version: '0.0.66', date: '2026-02-08 16:38', title: 'Make app mobile/iPhone friendly with horizontal navigation scrolling' },
  { version: '0.0.65', date: '2026-02-08 16:33', title: 'Fix labeledCount to always display as numbers, not text' },
  { version: '0.0.64', date: '2026-02-08 09:29', title: 'Update README with comprehensive documentation and GitHub Pages link' },
  { version: '0.0.63', date: '2026-02-08 16:26', title: 'Update README with comprehensive documentation and GitHub Pages link' },
  { version: '0.0.62', date: '2026-02-06 22:10', title: 'Persist active tab across page refreshes' },
  { version: '0.0.61', date: '2026-02-07 05:07', title: 'Persist active tab across page refreshes' },
  { version: '0.0.60', date: '2026-02-06 21:58', title: 'Redesign Labeling tab with better focus and visuals' },
  { version: '0.0.59', date: '2026-02-07 04:56', title: 'Redesign Labeling tab with better focus and visuals' },
  { version: '0.0.58', date: '2026-02-06 21:55', title: 'Show gray label color when quantity is zero' },
  { version: '0.0.57', date: '2026-02-07 04:52', title: 'Show gray label color when quantity is zero' },
  { version: '0.0.56', date: '2026-02-06 21:49', title: 'Preserve scroll position when closing modals and refreshing' },
  { version: '0.0.55', date: '2026-02-07 04:48', title: 'Preserve scroll position when closing modals and refreshing' },
  { version: '0.0.54', date: '2026-02-06 21:38', title: 'Prevent page jump on label update and add scroll controls' },
  { version: '0.0.53', date: '2026-02-07 04:37', title: 'Prevent page jump on label update and add scroll controls' },
  { version: '0.0.52', date: '2026-02-06 21:32', title: 'Change default import mode to Update and add Replace All confirmation' },
  { version: '0.0.51', date: '2026-02-07 04:30', title: 'Change default import mode to Update and add Replace All confirmation' },
  { version: '0.0.50', date: '2026-02-06 21:24', title: 'Fix label column position and add velocity history tracking' },
  { version: '0.0.49', date: '2026-02-07 04:22', title: 'Fix label column position to be after quantity column' },
  { version: '0.0.48', date: '2026-02-07 04:21', title: 'Add velocity history tracking for sales velocity analysis' },
  { version: '0.0.47', date: '2026-02-06 21:20', title: 'Update label field colors to percentage-based thresholds' },
  { version: '0.0.46', date: '2026-02-07 04:18', title: 'Update label field colors to percentage-based thresholds' },
  { version: '0.0.45', date: '2026-02-06 21:10', title: 'Preserve manually edited fields during CSV update imports' },
  { version: '0.0.44', date: '2026-02-07 04:06', title: 'Preserve manually edited fields during CSV update imports' },
  { version: '0.0.43', date: '2026-02-06 21:05', title: 'Fix Quick Edit modal behavior and reorder Labeled column' },
  { version: '0.0.42', date: '2026-02-07 04:03', title: 'Fix Quick Edit modal behavior and reorder Labeled column' },
  { version: '0.0.41', date: '2026-02-06 21:01', title: 'Add dark mode support to Dashboard status cards' },
  { version: '0.0.40', date: '2026-02-07 03:59', title: 'Add dark mode support to Dashboard status cards and stat squares' },
  { version: '0.0.39', date: '2026-02-06 20:56', title: 'Fix GitHub Pages deployment with proper workflow permissions' },
  { version: '0.0.38', date: '2026-02-07 03:55', title: 'Fix GitHub Pages deployment with proper workflow permissions' },
  { version: '0.0.37', date: '2026-02-07 03:47', title: 'Add sales velocity tracking and analytics system' },
  { version: '0.0.36', date: '2026-02-06 20:36', title: 'Convert Labeled column from boolean to numeric count' },
  { version: '0.0.35', date: '2026-02-07 03:33', title: 'Convert Labeled column from boolean to numeric count with percentage-based color coding' },
  { version: '0.0.34', date: '2026-02-06 20:27', title: 'Add interactive charts and complete dark mode support' },
  { version: '0.0.33', date: '2026-02-07 03:24', title: 'Add interactive charts and complete dark mode support' },
  { version: '0.0.32', date: '2026-02-06 20:20', title: 'Add Import CSV tab with Replace/Update modes' },
  { version: '0.0.31', date: '2026-02-07 03:19', title: 'Add Import CSV tab with Replace/Update modes' },
  { version: '0.0.30', date: '2026-02-06 20:15', title: 'Deploy dark mode fixes to GitHub Pages' },
  { version: '0.0.29', date: '2026-02-07 03:12', title: 'Deploy dark mode fixes to GitHub Pages' },
  { version: '0.0.28', date: '2026-02-07 03:11', title: 'Merge dark mode branch' },
  { version: '0.0.27', date: '2026-02-07 02:54', title: 'Complete dark mode support across all components' },
  { version: '0.0.26', date: '2026-02-07 02:50', title: 'Add dark mode support to CSVUpload component' },
  { version: '0.0.25', date: '2026-02-06 19:48', title: 'Merge feature branch with core improvements' },
  { version: '0.0.24', date: '2026-02-07 02:47', title: 'Remove Import CSV navigation tab' },
  { version: '0.0.23', date: '2026-02-07 01:51', title: 'CRITICAL FIX: ExclusionManager modal control and closing' },
  { version: '0.0.22', date: '2026-02-07 01:36', title: 'Fix: ExclusionManager modal not closing' },
  { version: '0.0.21', date: '2026-02-07 01:35', title: 'Add Labeled column and enable sorting for all columns' },
  { version: '0.0.20', date: '2026-02-07 01:22', title: 'Add deploy script for GitHub Pages' },
  { version: '0.0.19', date: '2026-02-07 01:20', title: 'Fix: ExclusionManager auto-opening on Import CSV tab' },
  { version: '0.0.18', date: '2026-02-06 20:26', title: 'Complete Phase 9: E2E Testing & UAT Framework' },
  { version: '0.0.17', date: '2026-02-06 20:18', title: 'Add comprehensive testing documentation' },
  { version: '0.0.16', date: '2026-02-06 20:17', title: 'Add comprehensive testing infrastructure - Phase 9' },
  { version: '0.0.15', date: '2026-02-06 19:57', title: 'Complete Phase 5: Label Management System' },
  { version: '0.0.14', date: '2026-02-06 19:44', title: 'Complete Phase 8: Reporting & Analytics' },
  { version: '0.0.13', date: '2026-02-06 19:38', title: 'Complete Phase 7: UI/UX Enhancement' },
  { version: '0.0.12', date: '2026-02-06 18:58', title: 'Complete Phase 6: Sales Readiness Validation' },
  { version: '0.0.11', date: '2026-02-06 18:26', title: 'Add column visibility controls to Reorder modal' },
  { version: '0.0.10', date: '2026-02-06 18:22', title: 'Add inline exclusion feature and Exclusions management button' },
  { version: '0.0.9', date: '2026-02-06 18:19', title: 'Add mobile-friendly column reordering with up/down buttons' },
  { version: '0.0.8', date: '2026-02-06 17:55', title: 'Add Quick Edit functionality for inline row editing' },
  { version: '0.0.7', date: '2026-02-06 16:29', title: 'Add GitHub Pages deployment in docs folder' },
  { version: '0.0.6', date: '2026-02-06 09:22', title: 'Complete Phase 2: CSV Import & Basic Display' },
  { version: '0.0.5', date: '2026-02-06 16:05', title: 'Complete Phase 2: CSV Import & Basic Display' },
  { version: '0.0.4', date: '2026-02-06 08:57', title: 'Merge: Project Setup & Foundation' },
  { version: '0.0.3', date: '2026-02-06 15:41', title: 'Complete Phase 1: Project Setup & Foundation' },
  { version: '0.0.2', date: '2026-02-06 15:27', title: 'Add comprehensive project documentation' },
  { version: '0.0.1', date: '2026-02-06 08:07', title: 'Initial commit' },
];

const FONT_SIZES = [12, 13, 14, 15, 16, 18, 20, 22, 24];

export default function SettingsModal({ isOpen, onClose }) {
  const [activeSection, setActiveSection] = useState('display');
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
      <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col">
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

        {/* Section Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={() => setActiveSection('display')}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeSection === 'display'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Display</span>
          </button>
          <button
            onClick={() => setActiveSection('patchnotes')}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeSection === 'patchnotes'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <ScrollText className="w-4 h-4" />
            <span>Patch Notes ({PATCH_NOTES.length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === 'display' && (
            <div className="space-y-6">
              {/* Font Size Control */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Font Size</h3>
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
          )}

          {activeSection === 'patchnotes' && (
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Complete history of all {PATCH_NOTES.length} patches since initial commit.
              </p>
              <div className="space-y-0">
                {PATCH_NOTES.map((patch, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 px-3 py-2 rounded ${
                      index === 0 ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'hover:bg-gray-50 dark:hover:bg-gray-750'
                    }`}
                  >
                    <span className="text-xs font-mono text-blue-600 dark:text-blue-400 whitespace-nowrap min-w-[4rem]">
                      v{patch.version}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap min-w-[8rem]">
                      {patch.date}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {patch.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
