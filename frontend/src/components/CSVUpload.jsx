import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { parseInventoryCSV, generateSampleCSV, downloadCSV } from '../utils/csvParser';
import { db } from '../lib/db';

export default function CSVUpload({ onImportComplete }) {
  const [dragActive, setDragActive] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer?.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      // Parse CSV
      const parseResult = await parseInventoryCSV(file);

      // Import to database
      await db.peptides.bulkImport(parseResult.peptides);

      setResult({
        success: true,
        imported: parseResult.peptides.length,
        meta: parseResult.meta
      });

      // Notify parent component
      if (onImportComplete) {
        onImportComplete(parseResult.peptides);
      }

    } catch (err) {
      setError(err.message || 'Failed to import CSV');
      setResult(null);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadSample = () => {
    const sampleCSV = generateSampleCSV();
    downloadCSV(sampleCSV, 'oath-inventory-sample.csv');
  };

  const clearResult = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}
          ${importing ? 'opacity-50 pointer-events-none' : 'hover:border-gray-400'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="csv-upload"
          accept=".csv"
          onChange={handleChange}
          className="hidden"
          disabled={importing}
        />

        <Upload className={`w-16 h-16 mx-auto mb-4 ${dragActive ? 'text-blue-600' : 'text-gray-400'}`} />

        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900">
            {importing ? 'Importing...' : 'Drop your CSV file here'}
          </p>
          <p className="text-sm text-gray-600">
            or{' '}
            <label
              htmlFor="csv-upload"
              className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium"
            >
              browse to upload
            </label>
          </p>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Supports CSV files with Peptide ID, Name, and Quantity columns
        </p>
      </div>

      {/* Download Sample Button */}
      <div className="text-center">
        <button
          onClick={handleDownloadSample}
          className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>Download Sample CSV</span>
        </button>
      </div>

      {/* Success Result */}
      {result && result.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-green-900">Import Successful!</h3>
              <div className="mt-2 text-sm text-green-800">
                <p>Successfully imported <strong>{result.imported}</strong> peptides.</p>
                {result.meta.validRows < result.meta.totalRows && (
                  <p className="mt-1">
                    Skipped {result.meta.totalRows - result.meta.validRows} invalid rows.
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={clearResult}
              className="ml-3 text-green-600 hover:text-green-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Error Result */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-900">Import Failed</h3>
              <div className="mt-2 text-sm text-red-800">
                <p>{error}</p>
              </div>
            </div>
            <button
              onClick={clearResult}
              className="ml-3 text-red-600 hover:text-red-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">CSV Format Requirements</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Required columns: Peptide ID, Peptide Name, Quantity</li>
          <li>Optional columns: Unit, Category, Supplier, Location</li>
          <li>First row must contain headers</li>
          <li>All Peptide IDs must be unique</li>
          <li>Download the sample CSV to see the correct format</li>
        </ul>
      </div>
    </div>
  );
}
