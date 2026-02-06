import { useState, useMemo } from 'react';
import { Search, ArrowUpDown, Package, Download, Trash2 } from 'lucide-react';
import { calculateStockStatus, getStatusConfig } from '../utils/stockStatus';
import { exportToCSV, downloadCSV } from '../utils/csvParser';

export default function InventoryTable({ peptides, onRefresh, thresholds }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('peptideId');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('all');

  // Calculate status for each peptide
  const peptidesWithStatus = useMemo(() => {
    return peptides.map(peptide => ({
      ...peptide,
      status: calculateStockStatus(peptide.quantity, thresholds, false)
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
        peptide.category?.toLowerCase().includes(searchLower) ||
        peptide.supplier?.toLowerCase().includes(searchLower);

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
      if (sortField === 'quantity') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }

      // Handle string sorting
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

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

  if (peptides.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No inventory data yet. Import a CSV to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search peptides..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status ({peptides.length})</option>
              <option value="OUT_OF_STOCK">Out of Stock ({statusCounts.OUT_OF_STOCK})</option>
              <option value="NEARLY_OUT">Nearly Out ({statusCounts.NEARLY_OUT})</option>
              <option value="LOW_STOCK">Low Stock ({statusCounts.LOW_STOCK})</option>
              <option value="GOOD_STOCK">Good Stock ({statusCounts.GOOD_STOCK})</option>
            </select>
          </div>

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
      <div className="text-sm text-gray-600">
        Showing {sortedPeptides.length} of {peptides.length} peptides
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <SortableHeader
                  label="Peptide ID"
                  field="peptideId"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Name"
                  field="peptideName"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Quantity"
                  field="quantity"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                />
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedPeptides.map((peptide) => {
                const statusConfig = getStatusConfig(peptide.status);
                return (
                  <tr key={peptide.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {peptide.peptideId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {peptide.peptideName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {peptide.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {peptide.unit || 'mg'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`status-badge ${statusConfig.className}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {peptide.category || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {peptide.supplier || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {sortedPeptides.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No peptides match your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SortableHeader({ label, field, currentField, direction, onSort }) {
  const isActive = currentField === field;

  return (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        <ArrowUpDown
          className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
        />
        {isActive && (
          <span className="text-xs text-blue-600">
            {direction === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );
}
