import Papa from 'papaparse';

/**
 * CSV parsing utilities for Oath Inventory System
 * Handles parsing, validation, and transformation of inventory CSV files
 */

/**
 * Parse CSV file and extract peptide data
 * @param {File} file - CSV file to parse
 * @param {object} options - Parsing options
 * @returns {Promise<array>} Parsed and validated peptide data
 */
export async function parseInventoryCSV(file, options = {}) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        try {
          const peptides = transformPeptideData(results.data, options);
          const validation = validatePeptideData(peptides);

          if (!validation.valid) {
            reject(new Error(`Validation failed: ${validation.errors.join(', ')}`));
            return;
          }

          resolve({
            peptides,
            meta: {
              totalRows: results.data.length,
              validRows: peptides.length,
              errors: results.errors
            }
          });
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

/**
 * Transform raw CSV data into peptide objects
 * @param {array} rawData - Raw CSV rows
 * @param {object} options - Transformation options
 * @returns {array} Transformed peptide objects
 */
export function transformPeptideData(rawData, options = {}) {
  const { fieldMapping = getDefaultFieldMapping() } = options;

  // List of test/system products to exclude from import
  const excludedProducts = [
    'OATH-A1-TEST',
    'OATH-GH-FRAGMENT-176-191-5MG',
    'OATH-GIFT-CARD',
    'OATH-NAD+-1000MG',
    'OATH-SS-31-10MG',
    'OATH-TESA-IPA-10-5'
  ];

  return rawData
    .filter(row => row && Object.keys(row).length > 0)
    .filter(row => {
      // Filter out excluded products
      const productId = extractField(row, fieldMapping.peptideId);
      return !excludedProducts.includes(productId);
    })
    .map((row, index) => {
      const peptide = {
        // Core fields
        peptideId: extractField(row, fieldMapping.peptideId),
        peptideName: extractField(row, fieldMapping.peptideName),
        quantity: parseNumber(extractField(row, fieldMapping.quantity)),
        unit: extractField(row, fieldMapping.unit) || 'mg',

        // Lifecycle & Testing fields
        batchNumber: extractField(row, fieldMapping.batchNumber),
        purity: extractField(row, fieldMapping.purity),
        netWeight: extractField(row, fieldMapping.netWeight),

        // Order tracking fields
        orderedDate: extractField(row, fieldMapping.orderedDate),
        orderedQty: parseNumber(extractField(row, fieldMapping.orderedQty)),

        // Operational fields
        velocity: extractField(row, fieldMapping.velocity),
        notes: extractField(row, fieldMapping.notes),
        supplier: extractField(row, fieldMapping.supplier),
        location: extractField(row, fieldMapping.location),

        // Metadata
        importedAt: new Date().toISOString(),
        rowNumber: index + 1
      };

      // Remove undefined fields
      Object.keys(peptide).forEach(key => {
        if (peptide[key] === undefined || peptide[key] === null) {
          delete peptide[key];
        }
      });

      return peptide;
    });
}

/**
 * Extract field from row using flexible matching
 * @param {object} row - CSV row
 * @param {array} possibleHeaders - Possible header names
 * @returns {any} Field value
 */
function extractField(row, possibleHeaders) {
  if (!possibleHeaders || !Array.isArray(possibleHeaders)) {
    return undefined;
  }

  for (const header of possibleHeaders) {
    // Exact match
    if (row[header] !== undefined && row[header] !== '') {
      return row[header];
    }

    // Case-insensitive match
    const key = Object.keys(row).find(
      k => k.toLowerCase() === header.toLowerCase()
    );
    if (key && row[key] !== undefined && row[key] !== '') {
      return row[key];
    }
  }

  return undefined;
}

/**
 * Parse numeric value from string
 * @param {any} value - Value to parse
 * @returns {number} Parsed number or 0
 */
function parseNumber(value) {
  if (value === undefined || value === null || value === '') {
    return 0;
  }

  const num = Number(String(value).replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? 0 : num;
}

/**
 * Get default field mapping for CSV headers
 * @returns {object} Field mapping configuration
 */
export function getDefaultFieldMapping() {
  return {
    // Core identification - maps to your CSV columns
    peptideId: ['Product', 'Peptide ID', 'ID', 'Item ID'],
    peptideName: ['SKU', 'Peptide Name', 'Name', 'Product Name'],
    quantity: ['Quantity', 'Qty', 'On Hand', 'Stock', 'Available', 'Amount'],
    unit: ['Unit', 'UOM', 'Unit of Measure'],

    // Lifecycle & Testing
    batchNumber: ['Batch Number', 'Batch', 'Batch #', 'Lot Number', 'Lot'],
    purity: ['Purity', 'Purity %', 'Purity Percentage'],
    netWeight: ['Size', 'Net Weight', 'Weight', 'Net Wt'],

    // Order tracking
    orderedDate: ['Incoming Arrival', 'Ordered Date', 'Order Date', 'Date Ordered'],
    orderedQty: ['Incoming Qty', 'Ordered Qty', 'Order Quantity', 'Qty Ordered'],

    // Operational
    velocity: ['Velocity', 'Usage Rate', 'Demand'],
    notes: ['Status', 'Notes', 'Comments', 'Remarks'],
    supplier: ['Supplier', 'Vendor', 'Manufacturer', 'Lab'],
    location: ['Location', 'Warehouse', 'Storage', 'Bin']
  };
}

/**
 * Validate parsed peptide data
 * @param {array} peptides - Peptides to validate
 * @returns {object} Validation result
 */
export function validatePeptideData(peptides) {
  const errors = [];
  const warnings = [];

  if (!peptides || peptides.length === 0) {
    errors.push('No peptide data found');
    return { valid: false, errors, warnings };
  }

  peptides.forEach((peptide, index) => {
    const rowNum = peptide.rowNumber || index + 1;

    // Required fields
    if (!peptide.peptideId) {
      errors.push(`Row ${rowNum}: Missing Peptide ID`);
    }

    if (!peptide.peptideName) {
      warnings.push(`Row ${rowNum}: Missing Peptide Name`);
    }

    if (peptide.quantity === undefined || peptide.quantity === null) {
      warnings.push(`Row ${rowNum}: Missing quantity, defaulting to 0`);
    }

    // Data type validation
    if (typeof peptide.quantity !== 'number') {
      errors.push(`Row ${rowNum}: Quantity must be a number`);
    }

    // Note: Negative quantities are allowed for back-ordering
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generate sample CSV template
 * @returns {string} CSV content
 */
export function generateSampleCSV() {
  const headers = ['Peptide ID', 'Peptide Name', 'Quantity', 'Unit', 'Category', 'Supplier'];
  const sampleRows = [
    ['PT-001', 'BPC-157', '150', 'mg', 'Healing', 'Lab A'],
    ['PT-002', 'TB-500', '200', 'mg', 'Healing', 'Lab A'],
    ['PT-003', 'Melanotan II', '100', 'mg', 'Cosmetic', 'Lab B'],
    ['PT-004', 'Ipamorelin', '250', 'mg', 'Growth', 'Lab C'],
    ['PT-005', 'CJC-1295', '75', 'mg', 'Growth', 'Lab C']
  ];

  return Papa.unparse({
    fields: headers,
    data: sampleRows
  });
}

/**
 * Export peptides to CSV
 * @param {array} peptides - Peptides to export
 * @param {array} fields - Fields to include
 * @returns {string} CSV content
 */
export function exportToCSV(peptides, fields = null) {
  const defaultFields = [
    'peptideId',
    'peptideName',
    'quantity',
    'unit',
    'category',
    'supplier',
    'location'
  ];

  const exportFields = fields || defaultFields;

  return Papa.unparse(peptides, {
    fields: exportFields,
    header: true
  });
}

/**
 * Download CSV file
 * @param {string} content - CSV content
 * @param {string} filename - File name
 */
export function downloadCSV(content, filename = 'inventory-export.csv') {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
