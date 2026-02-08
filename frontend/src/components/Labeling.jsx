import { useState, useMemo, useEffect } from 'react';
import { Tag, CheckCircle2, AlertCircle, Package, Calendar, TrendingUp, Search, Download } from 'lucide-react';
import { db } from '../lib/db';
import { exportToCSV, downloadCSV } from '../utils/csvParser';
import { useToast } from './Toast';

export default function Labeling({ peptides, onRefresh }) {
  const [labeledItems, setLabeledItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState(() => {
    // Restore search term from localStorage
    return localStorage.getItem('labeling-searchTerm') || '';
  });
  const [filterView, setFilterView] = useState('all'); // all, labeled, unlabeled, partial
  const [loading, setLoading] = useState(true);
  const { success, error: showError } = useToast();

  // Persist search term to localStorage
  useEffect(() => {
    localStorage.setItem('labeling-searchTerm', searchTerm);
  }, [searchTerm]);

  // Clear search term when component unmounts (tab change)
  useEffect(() => {
    return () => {
      // Only clear if user is navigating away, not just re-rendering
      const currentTab = localStorage.getItem('activeTab');
      if (currentTab !== 'labeling') {
        localStorage.setItem('labeling-searchTerm', '');
      }
    };
  }, []);

  // Load labeled items from database
  useEffect(() => {
    const loadLabels = async () => {
      setLoading(true);
      try {
        const labels = await db.labels.getLabeled();
        setLabeledItems(labels);
      } catch (err) {
        console.error('Failed to load labels:', err);
        showError('Failed to load label data');
      } finally {
        setLoading(false);
      }
    };
    loadLabels();
  }, [peptides]);

  // Calculate labeling statistics and categorize peptides
  const stats = useMemo(() => {
    const labeled = [];
    const unlabeled = [];
    const partial = [];
    const newProducts = [];

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    peptides.forEach(peptide => {
      const quantity = Number(peptide.quantity) || 0;
      const labeledCount = Number(peptide.labeledCount) || 0;
      const receivedDate = peptide.receivedDate ? new Date(peptide.receivedDate).getTime() : null;

      // Check if it's a new product (received in last 7 days)
      if (receivedDate && receivedDate > sevenDaysAgo) {
        newProducts.push({
          ...peptide,
          daysAgo: Math.floor((now - receivedDate) / (24 * 60 * 60 * 1000))
        });
      }

      // Categorize by labeling status
      if (labeledCount === 0 && quantity > 0) {
        unlabeled.push(peptide);
      } else if (labeledCount >= quantity) {
        labeled.push(peptide);
      } else if (labeledCount > 0 && labeledCount < quantity) {
        partial.push({
          ...peptide,
          remaining: quantity - labeledCount
        });
      }
    });

    const totalQuantity = peptides.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
    const totalLabeled = peptides.reduce((sum, p) => sum + (Number(p.labeledCount) || 0), 0);
    const labeledPercentage = totalQuantity > 0 ? Math.round((totalLabeled / totalQuantity) * 100) : 0;

    return {
      labeled,
      unlabeled,
      partial,
      newProducts,
      totalQuantity,
      totalLabeled,
      totalUnlabeled: totalQuantity - totalLabeled,
      labeledPercentage,
      totalProducts: peptides.length,
      fullyLabeledProducts: labeled.length,
      unlabeledProducts: unlabeled.length,
      partiallyLabeledProducts: partial.length
    };
  }, [peptides]);

  // Filter and search
  const filteredPeptides = useMemo(() => {
    let items = [];

    switch (filterView) {
      case 'labeled':
        items = stats.labeled;
        break;
      case 'unlabeled':
        items = stats.unlabeled;
        break;
      case 'partial':
        items = stats.partial;
        break;
      case 'new':
        items = stats.newProducts;
        break;
      default:
        items = peptides;
    }

    if (!searchTerm) return items;

    const searchLower = searchTerm.toLowerCase();
    return items.filter(p =>
      p.peptideId?.toLowerCase().includes(searchLower) ||
      p.peptideName?.toLowerCase().includes(searchLower) ||
      p.batchNumber?.toLowerCase().includes(searchLower)
    );
  }, [peptides, stats, filterView, searchTerm]);

  // Mark items as labeled
  const handleMarkLabeled = async (peptide, count) => {
    try {
      const labeledCount = (Number(peptide.labeledCount) || 0) + count;
      await db.peptides.update(peptide.id, { labeledCount });

      // Record in label tracking
      await db.labels.markLabeled(peptide.peptideId, peptide.batchNumber, {
        quantity: count,
        labeledBy: 'User',
        dateLabeled: new Date().toISOString()
      });

      success(`Marked ${count} unit(s) as labeled`);
      onRefresh();
    } catch (err) {
      console.error('Failed to mark as labeled:', err);
      showError('Failed to update label status');
    }
  };

  // Export labeling report
  const handleExportReport = () => {
    const reportData = peptides.map(p => ({
      'Product ID': p.peptideId || '',
      'SKU': p.peptideName || '',
      'Batch Number': p.batchNumber || '',
      'Total Quantity': p.quantity || 0,
      'Labeled Count': p.labeledCount || 0,
      'Unlabeled Count': (Number(p.quantity) || 0) - (Number(p.labeledCount) || 0),
      'Status': getLabelStatus(p),
      'Received Date': p.receivedDate || '',
      'Net Weight': p.netWeight || '',
      'Purity': p.purity || ''
    }));

    const csv = exportToCSV(reportData);
    const filename = `labeling-report-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csv, filename);
    success('Labeling report exported');
  };

  const getLabelStatus = (peptide) => {
    const quantity = Number(peptide.quantity) || 0;
    const labeledCount = Number(peptide.labeledCount) || 0;

    if (quantity === 0) return 'No Stock';
    if (labeledCount === 0) return 'Unlabeled';
    if (labeledCount >= quantity) return 'Fully Labeled';
    return `Partial (${labeledCount}/${quantity})`;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading labeling data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Tag className="w-6 h-6" />}
          title="Total Labeled"
          value={stats.totalLabeled.toString()}
          subtitle={`${stats.labeledPercentage}% of ${stats.totalQuantity}`}
          color="green"
        />
        <StatCard
          icon={<AlertCircle className="w-6 h-6" />}
          title="Needs Labeling"
          value={stats.totalUnlabeled.toString()}
          subtitle={`${stats.unlabeledProducts} products`}
          color="orange"
        />
        <StatCard
          icon={<Package className="w-6 h-6" />}
          title="Partially Labeled"
          value={stats.partiallyLabeledProducts.toString()}
          subtitle="Needs completion"
          color="yellow"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="New Products"
          value={stats.newProducts.length.toString()}
          subtitle="Last 7 days"
          color="blue"
        />
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Overall Labeling Progress</h3>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.labeledPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div
            className="bg-blue-600 dark:bg-blue-400 h-4 rounded-full transition-all duration-500"
            style={{ width: `${stats.labeledPercentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
          <span>{stats.totalLabeled} labeled</span>
          <span>{stats.totalUnlabeled} remaining</span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            <FilterButton
              active={filterView === 'all'}
              onClick={() => setFilterView('all')}
              label="All"
              count={peptides.length}
            />
            <FilterButton
              active={filterView === 'unlabeled'}
              onClick={() => setFilterView('unlabeled')}
              label="Unlabeled"
              count={stats.unlabeledProducts}
              color="orange"
            />
            <FilterButton
              active={filterView === 'partial'}
              onClick={() => setFilterView('partial')}
              label="Partial"
              count={stats.partiallyLabeledProducts}
              color="yellow"
            />
            <FilterButton
              active={filterView === 'labeled'}
              onClick={() => setFilterView('labeled')}
              label="Labeled"
              count={stats.fullyLabeledProducts}
              color="green"
            />
            <FilterButton
              active={filterView === 'new'}
              onClick={() => setFilterView('new')}
              label="New"
              count={stats.newProducts.length}
              color="blue"
            />
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Batch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Labeled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPeptides.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No products found matching your search' : 'No products to display'}
                  </td>
                </tr>
              ) : (
                filteredPeptides.map((peptide) => (
                  <ProductRow
                    key={peptide.id}
                    peptide={peptide}
                    onMarkLabeled={handleMarkLabeled}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, color = 'blue' }) {
  const colors = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
    green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30',
    yellow: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, label, count, color = 'gray' }) {
  const colors = {
    gray: active ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800',
    orange: active ? 'bg-orange-200 dark:bg-orange-900' : 'bg-orange-100 dark:bg-orange-900/50',
    yellow: active ? 'bg-yellow-200 dark:bg-yellow-900' : 'bg-yellow-100 dark:bg-yellow-900/50',
    green: active ? 'bg-green-200 dark:bg-green-900' : 'bg-green-100 dark:bg-green-900/50',
    blue: active ? 'bg-blue-200 dark:bg-blue-900' : 'bg-blue-100 dark:bg-blue-900/50'
  };

  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-lg font-medium text-sm transition-colors
        ${colors[color]}
        ${active ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}
        hover:opacity-80
      `}
    >
      {label} <span className="ml-1 font-bold">({count})</span>
    </button>
  );
}

function ProductRow({ peptide, onMarkLabeled }) {
  const [quickLabel, setQuickLabel] = useState(false);
  const [labelCount, setLabelCount] = useState(1);

  const quantity = Number(peptide.quantity) || 0;
  const labeledCount = Number(peptide.labeledCount) || 0;
  const remaining = quantity - labeledCount;
  const percentage = quantity > 0 ? Math.round((labeledCount / quantity) * 100) : 0;

  const getStatusBadge = () => {
    if (quantity === 0) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">No Stock</span>;
    }
    if (labeledCount === 0) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200">Unlabeled</span>;
    }
    if (labeledCount >= quantity) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Complete
        </span>
      );
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200">Partial ({percentage}%)</span>;
  };

  const handleQuickLabel = () => {
    if (labelCount > 0 && labelCount <= remaining) {
      onMarkLabeled(peptide, labelCount);
      setQuickLabel(false);
      setLabelCount(1);
    }
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <td className="px-6 py-4">
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{peptide.peptideId}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{peptide.peptideName}</div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
        {peptide.batchNumber || '-'}
      </td>
      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
        {quantity}
      </td>
      <td className="px-6 py-4">
        <div className="text-sm">
          <div className="font-medium text-gray-900 dark:text-white">{labeledCount}</div>
          {remaining > 0 && (
            <div className="text-xs text-orange-600 dark:text-orange-400">{remaining} remaining</div>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        {getStatusBadge()}
      </td>
      <td className="px-6 py-4">
        {remaining > 0 && !quickLabel && (
          <button
            onClick={() => setQuickLabel(true)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm"
          >
            Mark Labeled
          </button>
        )}
        {quickLabel && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max={remaining}
              value={labelCount}
              onChange={(e) => setLabelCount(Number(e.target.value))}
              className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              autoFocus
            />
            <button
              onClick={handleQuickLabel}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
            >
              Save
            </button>
            <button
              onClick={() => {
                setQuickLabel(false);
                setLabelCount(1);
              }}
              className="px-3 py-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 text-sm rounded"
            >
              Cancel
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
