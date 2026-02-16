import { useState, useRef } from 'react';
import { Camera, ScanLine, FileText, Plus, Trash2, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
// Import template images
import templateAImage from '../assets/templates/template-a.jpg';

/**
 * Pick List Scanner - Skeleton Preview
 *
 * This component will allow users to photograph paper pick lists
 * and use OCR to extract product names and quantities, automatically
 * deducting from labeled inventory counts.
 *
 * Two template modes:
 *   Template A: Structured pick list (table/grid format)
 *   Template B: Large text format with product images
 *
 * STATUS: Skeleton UI only — OCR integration pending template samples
 */

export default function PickListScanner({ peptides, onRefresh }) {
  const [template, setTemplate] = useState('structured'); // 'structured' or 'visual'
  const [scannedItems, setScannedItems] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const fileInputRef = useRef(null);

  // Placeholder — will be replaced with real OCR processing
  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // TODO: Send image to OCR engine, parse results based on selected template
    // For now, show a placeholder state
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      // Placeholder: no items extracted yet
    }, 1500);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveItem = (index) => {
    setScannedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleApplyDeductions = () => {
    // TODO: For each scanned item, deduct quantity from labeled count
    // await db.peptides.update(peptideId, { labeledCount: currentLabeled - qty })
  };

  const totalItems = scannedItems.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueProducts = new Set(scannedItems.map(i => i.productId)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <ScanLine className="w-7 h-7" />
          <h2 className="text-xl font-bold">Pick List Scanner</h2>
          <span className="px-2 py-0.5 bg-white/20 backdrop-blur rounded-full text-xs font-semibold uppercase tracking-wide">
            Coming Soon
          </span>
        </div>
        <p className="text-white/80 text-sm max-w-2xl">
          Photograph your paper pick lists and let OCR automatically read product names and quantities.
          The system aggregates totals across all scanned sheets and deducts from your labeled inventory in one tap.
        </p>
      </div>

      {/* Template Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Pick List Template</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setTemplate('structured')}
            className={`relative p-4 rounded-xl border-2 text-left transition-all ${
              template === 'structured'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-300 dark:ring-indigo-700'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Template A</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Structured Pick List</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Table/grid format with columns for product name, net weight, and quantity.
            </p>
            {template === 'structured' && (
              <div className="absolute top-3 right-3">
                <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            )}
          </button>

          <button
            onClick={() => setTemplate('visual')}
            className={`relative p-4 rounded-xl border-2 text-left transition-all ${
              template === 'visual'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-300 dark:ring-purple-700'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                <Camera className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Template B</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Visual / Large Text</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Larger text format, sometimes with product images. Less structured layout.
            </p>
            {template === 'visual' && (
              <div className="absolute top-3 right-3">
                <Check className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Template Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Template Preview - {template === 'structured' ? 'Template A (Structured)' : 'Template B (Visual)'}
            </h3>
          </div>
          {showPreview ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showPreview && (
          <div className="px-6 pb-6">
            {template === 'structured' ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This is an example of Template A - the structured pick list format with table/grid layout.
                </p>
                <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
                  <img
                    src={templateAImage}
                    alt="Template A - Structured Pick List Example"
                    className="w-full h-auto"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                  OCR will extract product names, net weights, and quantities from this format.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Template B preview will be added once a sample image is provided.
                </p>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center">
                  <Camera className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm text-gray-400 dark:text-gray-600">
                    Template B example coming soon
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scan Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Scan Pick Lists</h3>
        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
          onClick={handleCapture}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          {scanning ? (
            <>
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mb-4"></div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Scanning pick list...</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Using Template {template === 'structured' ? 'A (Structured)' : 'B (Visual)'}
              </p>
            </>
          ) : (
            <>
              <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Tap to photograph a pick list
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Or upload an image from your gallery
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-3">
                Using Template {template === 'structured' ? 'A (Structured)' : 'B (Visual)'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Running Tally */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Running Tally</h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              <span className="font-bold text-gray-900 dark:text-white">{uniqueProducts}</span> products
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              <span className="font-bold text-gray-900 dark:text-white">{totalItems}</span> total units
            </span>
          </div>
        </div>

        {scannedItems.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-600">
            <ScanLine className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">No items scanned yet</p>
            <p className="text-xs mt-1">Scan pick lists above to start building your tally</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {scannedItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.productName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.productId}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    x{item.quantity}
                  </span>
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Apply Button */}
      <div className="flex gap-3">
        <button
          onClick={handleApplyDeductions}
          disabled={scannedItems.length === 0}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check className="w-5 h-5" />
          Apply Deductions to Labeled Counts
        </button>
        {scannedItems.length > 0 && (
          <button
            onClick={() => setScannedItems([])}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">How This Will Work</h4>
            <ol className="text-sm text-amber-800 dark:text-amber-300 space-y-1 list-decimal list-inside">
              <li>Select your pick list template (A or B)</li>
              <li>Photograph each pick list sheet — scan as many as needed</li>
              <li>OCR reads product names and quantities from each photo</li>
              <li>The system aggregates totals across all scanned sheets</li>
              <li>Review the running tally, correct any OCR mistakes</li>
              <li>Tap "Apply" to deduct from labeled inventory counts</li>
            </ol>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 italic">
              OCR integration pending — template samples needed to calibrate recognition.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
