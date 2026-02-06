import { useState, useRef, useEffect } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';

export default function ColumnReorderModal({ columns, onReorder, onClose }) {
  const [columnList, setColumnList] = useState([...columns]);
  const modalRef = useRef(null);

  // Move column up in the list
  const moveUp = (index) => {
    if (index === 0) return;
    const newList = [...columnList];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    setColumnList(newList);
  };

  // Move column down in the list
  const moveDown = (index) => {
    if (index === columnList.length - 1) return;
    const newList = [...columnList];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    setColumnList(newList);
  };

  // Apply changes
  const handleSave = () => {
    onReorder(columnList);
    onClose();
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

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-30 z-[999]" />

      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col z-[1000]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Reorder Columns</h3>
            <p className="text-sm text-gray-600">Use arrows to change order</p>
          </div>
          <button
            onClick={onClose}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Column List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {columnList.map((column, index) => (
              <div
                key={column.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                {/* Order Number */}
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>

                {/* Column Label */}
                <div className="flex-1 font-medium text-gray-900">
                  {column.label}
                </div>

                {/* Up/Down Buttons */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className={`p-1.5 rounded transition-colors ${
                      index === 0
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                    }`}
                    aria-label="Move up"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === columnList.length - 1}
                    className={`p-1.5 rounded transition-colors ${
                      index === columnList.length - 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                    }`}
                    aria-label="Move down"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Apply Order
          </button>
        </div>
      </div>
    </>
  );
}
