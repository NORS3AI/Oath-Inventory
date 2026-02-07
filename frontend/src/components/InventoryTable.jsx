import { useState, useMemo, useEffect } from 'react';
import { Search, ArrowUpDown, Package, Download, GripVertical, MoreVertical, List, Ban, TrendingDown } from 'lucide-react';
import { calculateStockStatus, getStatusConfig } from '../utils/stockStatus';
import { exportToCSV, downloadCSV } from '../utils/csvParser';
import { db } from '../lib/db';
import OrderManagement from './OrderManagement';
import QuickEditModal from './QuickEditModal';
import ColumnReorderModal from './ColumnReorderModal';
import ExclusionManager from './ExclusionManager';
import RecordSaleModal from './RecordSaleModal';

// Define all available columns
const DEFAULT_COLUMNS = [
  { id: 'peptideId', label: 'Product', field: 'peptideId', sortable: true },
  { id: 'peptideName', label: 'SKU', field: 'peptideName', sortable: true },
  { id: 'quantity', label: 'Quantity', field: 'quantity', sortable: true },
  { id: 'labeledCount', label: 'Labeled', field: 'labeledCount', sortable: true },
  { id: 'status', label: 'Status', field: 'status', sortable: true },
  { id: 'batchNumber', label: 'Batch #', field: 'batchNumber', sortable: true },
  { id: 'netWeight', label: 'Net Weight', field: 'netWeight', sortable: true },
  { id: 'purity', label: 'Purity', field: 'purity', sortable: true },
  { id: 'velocity', label: 'Velocity', field: 'velocity', sortable: true },
  { id: 'orderedQty', label: 'Ordered Qty', field: 'orderedQty', sortable: true },
  { id: 'orderedDate', label: 'Ordered Date', field: 'orderedDate', sortable: true },
  { id: 'notes', label: 'Notes', field: 'notes', sortable: true },
  { id: 'actions', label: 'Actions', field: 'actions', sortable: false }
];

export default function InventoryTable({ peptides, onRefresh, thresholds }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('peptideId');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [columnOrder, setColumnOrder] = useState(DEFAULT_COLUMNS);
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [selectedPeptide, setSelectedPeptide] = useState(null);
  const [quickEditPeptide, setQuickEditPeptide] = useState(null);
  const [recordSalePeptide, setRecordSalePeptide] = useState(null);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [showExclusionsModal, setShowExclusionsModal] = useState(false);

  // Load column order and hidden columns from settings
  useEffect(() => {
    const loadColumnSettings = async () => {
      const savedOrder = await db.settings.get('columnOrder');
      if (savedOrder && Array.isArray(savedOrder)) {
        // Merge saved order with default columns (in case new columns were added)
        const orderedColumns = savedOrder
          .map(id => DEFAULT_COLUMNS.find(col => col.id === id))
          .filter(Boolean);

        // Add any new columns that weren't in saved order
        const newColumns = DEFAULT_COLUMNS.filter(
          col => !savedOrder.includes(col.id)
        );

        setColumnOrder([...orderedColumns, ...newColumns]);
      }

      // Load hidden columns
      const savedHidden = await db.settings.get('hiddenColumns');
      if (savedHidden && Array.isArray(savedHidden)) {
        setHiddenColumns(savedHidden);
      }
    };
    loadColumnSettings();
  }, []);

  // Save column order to settings
  const saveColumnOrder = async (newOrder) => {
    const orderIds = newOrder.map(col => col.id);
    await db.settings.set('columnOrder', orderIds);
  };

  // Handle column reorder from modal
  const handleColumnReorder = (newOrder) => {
    setColumnOrder(newOrder);
    saveColumnOrder(newOrder);
  };

  // Handle column visibility change
  const handleVisibilityChange = async (hidden) => {
    setHiddenColumns(hidden);
    await db.settings.set('hiddenColumns', hidden);
  };

  // Get visible columns only
  const visibleColumns = useMemo(() => {
    return columnOrder.filter(col => !hiddenColumns.includes(col.id));
  }, [columnOrder, hiddenColumns]);

  // Calculate status for each peptide
  const peptidesWithStatus = useMemo(() => {
    return peptides.map(peptide => ({
      ...peptide,
      status: calculateStockStatus(peptide.quantity, thresholds, peptide.hasActiveOrder || false)
    }));
  }, [peptides, thresholds]);

  // Filter and search
  const filteredPeptides = useMemo(() => {
    return peptidesWithStatus.filter(peptide => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        peptide.peptideId?.toLowerCase().includes(searchLower) ||
        peptide.peptideName?.toLowerCase().includes(searchLower) ||
        peptide.batchNumber?.toLowerCase().includes(searchLower) ||
        peptide.notes?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = filterStatus === 'all' || peptide.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [peptidesWithStatus, searchTerm, filterStatus]);

  // Sort
  const sortedPeptides = useMemo(() => {
    const sorted = [...filteredPeptides];
    sorted.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle numeric sorting
      if (sortField === 'quantity' || sortField === 'orderedQty') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }

      // Handle labeled count sorting (by percentage)
      if (sortField === 'labeledCount') {
        const aQty = Number(a.quantity) || 1;
        const bQty = Number(b.quantity) || 1;
        const aLabeled = Number(a.labeledCount) || (a.isLabeled ? aQty : 0);
        const bLabeled = Number(b.labeledCount) || (b.isLabeled ? bQty : 0);
        aVal = (aLabeled / aQty) * 100;
        bVal = (bLabeled / bQty) * 100;
      }

      // Handle status sorting (by priority)
      if (sortField === 'status') {
        const statusPriority = {
          'OUT_OF_STOCK': 1,
          'NEARLY_OUT': 2,
          'LOW_STOCK': 3,
          'GOOD_STOCK': 4,
          'ON_ORDER': 5
        };
        aVal = statusPriority[aVal] || 999;
        bVal = statusPriority[bVal] || 999;
      }

      // Handle string sorting
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      // Handle null/undefined values
      if (aVal === undefined || aVal === null || aVal === '') aVal = '';
      if (bVal === undefined || bVal === null || bVal === '') bVal = '';

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredPeptides, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExport = () => {
    const csvContent = exportToCSV(peptides);
    downloadCSV(csvContent, `oath-inventory-${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Drag and drop handlers
  const handleDragStart = (e, columnIndex) => {
    setDraggedColumn(columnIndex);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedColumn === null) return;

    const newOrder = [...columnOrder];
    const draggedItem = newOrder[draggedColumn];
    newOrder.splice(draggedColumn, 1);
    newOrder.splice(dropIndex, 0, draggedItem);

    setColumnOrder(newOrder);
    saveColumnOrder(newOrder);
    setDraggedColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
  };

  // Count by status
  const statusCounts = useMemo(() => {
    const counts = {
      OUT_OF_STOCK: 0,
      NEARLY_OUT: 0,
      LOW_STOCK: 0,
      GOOD_STOCK: 0,
      ON_ORDER: 0
    };
    peptidesWithStatus.forEach(p => {
      if (counts[p.status] !== undefined) counts[p.status]++;
    });
    return counts;
  }, [peptidesWithStatus]);

  // Render cell content based on column type
  const renderCell = (peptide, column) => {
    if (column.id === 'status') {
      const statusConfig = getStatusConfig(peptide.status);
      return (
        <span className={`status-badge ${statusConfig.className}`}>
          {statusConfig.label}
        </span>
      );
    }

    if (column.id === 'labeledCount') {
      const quantity = Number(peptide.quantity) || 0;
      const labeledCount = Number(peptide.labeledCount) || (peptide.isLabeled ? quantity : 0);
      const percentage = quantity > 0 ? Math.round((labeledCount / quantity) * 100) : 0;

      // Color coding based on percentage labeled
      let colorClass = '';
      if (percentage === 0) {
        colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'; // Not started
      } else if (percentage <= 40) {
        colorClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'; // 0-40%
      } else if (percentage <= 80) {
        colorClass = 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'; // 41-80%
      } else if (percentage < 100) {
        colorClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'; // 81-99%
      } else {
        colorClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'; // 100%
      }

      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
          {labeledCount} / {quantity} ({percentage}%)
        </span>
      );
    }

    if (column.id === 'actions') {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRecordSalePeptide(peptide);
            }}
            className="inline-flex items-center space-x-1 px-2 py-1 text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
            title="Record Sale"
          >
            <TrendingDown className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPeptide(peptide);
            }}
            className="inline-flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
            <span>Manage</span>
          </button>
        </div>
      );
    }

    const value = peptide[column.field];
    return value !== undefined && value !== null && value !== '' ? value : '-';
  };

  if (peptides.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No inventory data yet. Import a CSV to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search peptides..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status ({peptides.length})</option>
              <option value="OUT_OF_STOCK">Out of Stock ({statusCounts.OUT_OF_STOCK})</option>
              <option value="NEARLY_OUT">Nearly Out ({statusCounts.NEARLY_OUT})</option>
              <option value="LOW_STOCK">Low Stock ({statusCounts.LOW_STOCK})</option>
              <option value="GOOD_STOCK">Good Stock ({statusCounts.GOOD_STOCK})</option>
            </select>
          </div>

          {/* Exclusions Button */}
          <button
            onClick={() => setShowExclusionsModal(true)}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Ban className="w-4 h-4" />
            <span className="hidden sm:inline">Exclusions</span>
          </button>

          {/* Reorder Columns Button */}
          <button
            onClick={() => setShowReorderModal(true)}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Reorder</span>
          </button>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>Showing {sortedPeptides.length} of {peptides.length} peptides</span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {visibleColumns.map((column, index) => (
                  <th
                    key={column.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider
                      ${column.sortable ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' : ''}
                      ${draggedColumn === index ? 'opacity-50' : ''}
                    `}
                    onClick={() => column.sortable && handleSort(column.field)}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{column.label}</span>
                      {column.sortable && (
                        <>
                          <ArrowUpDown
                            className={`w-4 h-4 ${sortField === column.field ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}
                          />
                          {sortField === column.field && (
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedPeptides.map((peptide) => (
                <tr
                  key={peptide.id}
                  onClick={() => setQuickEditPeptide(peptide)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  {visibleColumns.map((column) => (
                    <td
                      key={column.id}
                      className={`px-6 py-4 text-sm ${
                        column.id === 'peptideId' ? 'font-medium text-gray-900 dark:text-white' :
                        column.id === 'status' ? '' :
                        column.id === 'notes' ? 'max-w-xs truncate text-gray-500 dark:text-gray-400' :
                        'text-gray-500 dark:text-gray-400'
                      } ${column.id === 'notes' ? '' : 'whitespace-nowrap'}`}
                    >
                      {renderCell(peptide, column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedPeptides.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No peptides match your search criteria</p>
          </div>
        )}
      </div>

      {/* Order Management Modal */}
      {selectedPeptide && (
        <OrderManagement
          peptide={selectedPeptide}
          onClose={() => setSelectedPeptide(null)}
          onUpdate={onRefresh}
        />
      )}

      {/* Quick Edit Modal */}
      {quickEditPeptide && (
        <QuickEditModal
          peptide={quickEditPeptide}
          onClose={() => setQuickEditPeptide(null)}
          onUpdate={onRefresh}
        />
      )}

      {/* Column Reorder Modal */}
      {showReorderModal && (
        <ColumnReorderModal
          columns={columnOrder}
          hiddenColumns={hiddenColumns}
          onReorder={handleColumnReorder}
          onVisibilityChange={handleVisibilityChange}
          onClose={() => setShowReorderModal(false)}
        />
      )}

      {/* Exclusions Manager Modal */}
      <ExclusionManager
        isOpen={showExclusionsModal}
        onClose={() => setShowExclusionsModal(false)}
        onUpdate={onRefresh}
      />

      {/* Record Sale Modal */}
      {recordSalePeptide && (
        <RecordSaleModal
          peptide={recordSalePeptide}
          onClose={() => setRecordSalePeptide(null)}
          onComplete={onRefresh}
        />
      )}
    </div>
  );
}
