import { useState, useMemo } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Package, Search } from 'lucide-react';
import { checkSalesReadiness, getReadinessStats, filterByReadiness } from '../utils/salesReadiness';

export default function SalesReady({ peptides }) {
  const [filter, setFilter] = useState('ALL'); // 'ALL', 'READY', 'BLOCKED'
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate statistics
  const stats = useMemo(() => getReadinessStats(peptides), [peptides]);

  // Filter and search
  const filteredPeptides = useMemo(() => {
    let filtered = filterByReadiness(peptides, filter);

    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.peptideId?.toLowerCase().includes(searchLower) ||
        p.peptideName?.toLowerCase().includes(searchLower) ||
        p.batchNumber?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [peptides, filter, searchTerm]);

  if (peptides.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No inventory data yet. Import a CSV to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sales Ready */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Sales Ready</p>
              <p className="text-3xl font-bold text-green-900">{stats.ready}</p>
              <p className="text-xs text-green-600 mt-1">All requirements met</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </div>

        {/* Blocked */}
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Blocked</p>
              <p className="text-3xl font-bold text-red-900">{stats.blocked}</p>
              <p className="text-xs text-red-600 mt-1">Missing requirements</p>
            </div>
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
        </div>

        {/* Total */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Items</p>
              <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              <p className="text-xs text-blue-600 mt-1">In inventory</p>
            </div>
            <Package className="w-12 h-12 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Missing Requirements Summary */}
      {stats.blocked > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-900 mb-2">
                Missing Requirements Summary
              </h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-yellow-700">Missing Purity: </span>
                  <span className="font-semibold text-yellow-900">{stats.missingPurity}</span>
                </div>
                <div>
                  <span className="text-yellow-700">Missing Net Weight: </span>
                  <span className="font-semibold text-yellow-900">{stats.missingNetWeight}</span>
                </div>
                <div>
                  <span className="text-yellow-700">Missing Label: </span>
                  <span className="font-semibold text-yellow-900">{stats.missingLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

          {/* Filter */}
          <div className="sm:w-48">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Items ({stats.total})</option>
              <option value="READY">Sales Ready ({stats.ready})</option>
              <option value="BLOCKED">Blocked ({stats.blocked})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="text-sm text-gray-600 mb-2">
        Showing {filteredPeptides.length} of {peptides.length} items
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Weight
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Label
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Missing
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPeptides.map((peptide) => {
                const readiness = checkSalesReadiness(peptide);
                return (
                  <tr key={peptide.id} className="hover:bg-gray-50">
                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {readiness.isReady ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Ready</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Blocked</span>
                        </span>
                      )}
                    </td>

                    {/* Product */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {peptide.peptideId}
                    </td>

                    {/* SKU */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {peptide.peptideName || '-'}
                    </td>

                    {/* Batch # */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {peptide.batchNumber || '-'}
                    </td>

                    {/* Purity */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {peptide.purity ? (
                        <span className="text-green-600 font-medium">✓ {peptide.purity}</span>
                      ) : (
                        <span className="text-red-600">✗ Missing</span>
                      )}
                    </td>

                    {/* Net Weight */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {peptide.netWeight ? (
                        <span className="text-green-600 font-medium">✓ {peptide.netWeight}</span>
                      ) : (
                        <span className="text-red-600">✗ Missing</span>
                      )}
                    </td>

                    {/* Label */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {peptide.isLabeled ? (
                        <span className="text-green-600 font-medium">✓ Applied</span>
                      ) : (
                        <span className="text-red-600">✗ Not Applied</span>
                      )}
                    </td>

                    {/* Missing Requirements */}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {readiness.missing.length > 0 ? (
                        <span className="text-red-600">{readiness.missing.join(', ')}</span>
                      ) : (
                        <span className="text-green-600">None</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredPeptides.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No items match your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
