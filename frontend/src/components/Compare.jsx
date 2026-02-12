import { useState, useEffect, useMemo } from 'react';
import { Camera, Trash2, ArrowUpDown, TrendingDown, TrendingUp, Plus, Minus, Package, ShoppingCart } from 'lucide-react';
import { db } from '../lib/db';
import { useToast } from './Toast';

export default function Compare({ peptides }) {
  const [snapshots, setSnapshots] = useState([]);
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');
  const [snapshotA, setSnapshotA] = useState(null);
  const [snapshotB, setSnapshotB] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, decreased, increased, new, removed, unchanged
  const [sort, setSort] = useState({ field: 'change', direction: 'asc' });
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const { success, error: showError } = useToast();

  // Load snapshot list
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const list = await db.snapshots.getAll();
      setSnapshots(list);

      // Auto-select the two most recent if available
      if (list.length >= 2) {
        setSelectedA(list[1].id); // older
        setSelectedB(list[0].id); // newer
      } else if (list.length === 1) {
        setSelectedA(list[0].id);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Load full snapshot data when selections change
  useEffect(() => {
    const loadSnapshots = async () => {
      if (selectedA) {
        const a = await db.snapshots.get(selectedA);
        setSnapshotA(a);
      } else {
        setSnapshotA(null);
      }
      if (selectedB) {
        const b = await db.snapshots.get(selectedB);
        setSnapshotB(b);
      } else {
        setSnapshotB(null);
      }
    };
    loadSnapshots();
  }, [selectedA, selectedB]);

  // Take a new snapshot
  const handleTakeSnapshot = async () => {
    if (peptides.length === 0) {
      showError('No inventory data to snapshot');
      return;
    }
    const label = snapshotLabel.trim() || undefined;
    await db.snapshots.save(peptides, label);
    setSnapshotLabel('');
    const list = await db.snapshots.getAll();
    setSnapshots(list);
    success(`Snapshot saved (${peptides.length} items)`);
  };

  // Delete a snapshot
  const handleDeleteSnapshot = async (id) => {
    await db.snapshots.delete(id);
    if (selectedA === id) setSelectedA('');
    if (selectedB === id) setSelectedB('');
    const list = await db.snapshots.getAll();
    setSnapshots(list);
    success('Snapshot deleted');
  };

  // Compare the two snapshots
  const comparison = useMemo(() => {
    if (!snapshotA || !snapshotB) return null;

    // Determine which is older/newer
    const older = snapshotA.timestamp <= snapshotB.timestamp ? snapshotA : snapshotB;
    const newer = snapshotA.timestamp <= snapshotB.timestamp ? snapshotB : snapshotA;

    const olderMap = new Map(older.items.map(i => [i.peptideId, i]));
    const newerMap = new Map(newer.items.map(i => [i.peptideId, i]));

    const rows = [];
    let totalDecreased = 0;
    let totalIncreased = 0;
    let newItems = 0;
    let removedItems = 0;
    let unchangedItems = 0;
    let totalSold = 0;
    let totalAdded = 0;

    // Items in newer snapshot
    for (const [id, newItem] of newerMap) {
      const oldItem = olderMap.get(id);
      if (oldItem) {
        const change = newItem.quantity - oldItem.quantity;
        if (change < 0) {
          totalDecreased++;
          totalSold += Math.abs(change);
        } else if (change > 0) {
          totalIncreased++;
          totalAdded += change;
        } else {
          unchangedItems++;
        }
        rows.push({
          peptideId: id,
          name: newItem.nickname || newItem.peptideName || '',
          oldQty: oldItem.quantity,
          newQty: newItem.quantity,
          change,
          type: change < 0 ? 'decreased' : change > 0 ? 'increased' : 'unchanged'
        });
      } else {
        newItems++;
        totalAdded += newItem.quantity;
        rows.push({
          peptideId: id,
          name: newItem.nickname || newItem.peptideName || '',
          oldQty: null,
          newQty: newItem.quantity,
          change: newItem.quantity,
          type: 'new'
        });
      }
    }

    // Items only in older snapshot (removed)
    for (const [id, oldItem] of olderMap) {
      if (!newerMap.has(id)) {
        removedItems++;
        totalSold += oldItem.quantity;
        rows.push({
          peptideId: id,
          name: oldItem.nickname || oldItem.peptideName || '',
          oldQty: oldItem.quantity,
          newQty: null,
          change: -oldItem.quantity,
          type: 'removed'
        });
      }
    }

    return {
      older,
      newer,
      rows,
      summary: {
        totalDecreased,
        totalIncreased,
        newItems,
        removedItems,
        unchangedItems,
        totalSold,
        totalAdded
      }
    };
  }, [snapshotA, snapshotB]);

  // Filter and sort rows
  const displayRows = useMemo(() => {
    if (!comparison) return [];
    let rows = comparison.rows;

    if (filter !== 'all') {
      rows = rows.filter(r => r.type === filter);
    }

    rows = [...rows].sort((a, b) => {
      let aVal, bVal;
      if (sort.field === 'change') {
        aVal = a.change;
        bVal = b.change;
      } else if (sort.field === 'oldQty') {
        aVal = a.oldQty ?? -1;
        bVal = b.oldQty ?? -1;
      } else if (sort.field === 'newQty') {
        aVal = a.newQty ?? -1;
        bVal = b.newQty ?? -1;
      } else {
        aVal = (a.name || a.peptideId).toLowerCase();
        bVal = (b.name || b.peptideId).toLowerCase();
      }
      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return rows;
  }, [comparison, filter, sort]);

  const handleSort = (field) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading snapshots...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Take Snapshot */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Snapshots</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={snapshotLabel}
            onChange={(e) => setSnapshotLabel(e.target.value)}
            placeholder="Optional label (defaults to today's date)"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleTakeSnapshot}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            <Camera className="w-4 h-4" />
            Take Snapshot
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Snapshots are also taken automatically once per day. You have {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''} saved.
        </p>

        {/* Snapshot List */}
        {snapshots.length > 0 && (
          <div className="mt-4 max-h-48 overflow-y-auto">
            <div className="space-y-1">
              {snapshots.map(s => (
                <div key={s.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded text-sm">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">{s.label}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">({s.itemCount} items)</span>
                  </div>
                  <button
                    onClick={() => handleDeleteSnapshot(s.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Compare Selection */}
      {snapshots.length >= 2 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Compare Two Snapshots</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Older Snapshot</label>
              <select
                value={selectedA}
                onChange={(e) => setSelectedA(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select...</option>
                {snapshots.map(s => (
                  <option key={s.id} value={s.id}>{s.label} ({s.itemCount} items)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Newer Snapshot</label>
              <select
                value={selectedB}
                onChange={(e) => setSelectedB(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select...</option>
                {snapshots.map(s => (
                  <option key={s.id} value={s.id}>{s.label} ({s.itemCount} items)</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Results */}
      {comparison && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              icon={<ShoppingCart className="w-6 h-6" />}
              label="Units Sold / Used"
              value={comparison.summary.totalSold}
              color="red"
              subtitle={`${comparison.summary.totalDecreased} products`}
            />
            <SummaryCard
              icon={<TrendingUp className="w-6 h-6" />}
              label="Units Restocked"
              value={comparison.summary.totalAdded}
              color="green"
              subtitle={`${comparison.summary.totalIncreased + comparison.summary.newItems} products`}
            />
            <SummaryCard
              icon={<Plus className="w-6 h-6" />}
              label="New Products"
              value={comparison.summary.newItems}
              color="blue"
            />
            <SummaryCard
              icon={<Minus className="w-6 h-6" />}
              label="Removed"
              value={comparison.summary.removedItems}
              color="orange"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')} label="All" count={comparison.rows.length} />
            <FilterBtn active={filter === 'decreased'} onClick={() => setFilter('decreased')} label="Decreased" count={comparison.summary.totalDecreased} color="red" />
            <FilterBtn active={filter === 'increased'} onClick={() => setFilter('increased')} label="Increased" count={comparison.summary.totalIncreased} color="green" />
            <FilterBtn active={filter === 'new'} onClick={() => setFilter('new')} label="New" count={comparison.summary.newItems} color="blue" />
            <FilterBtn active={filter === 'removed'} onClick={() => setFilter('removed')} label="Removed" count={comparison.summary.removedItems} color="orange" />
            <FilterBtn active={filter === 'unchanged'} onClick={() => setFilter('unchanged')} label="Unchanged" count={comparison.summary.unchangedItems} color="gray" />
          </div>

          {/* Comparison Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Comparing <span className="font-medium text-gray-900 dark:text-white">{comparison.older.label}</span> → <span className="font-medium text-gray-900 dark:text-white">{comparison.newer.label}</span>
                {' '}({displayRows.length} items shown)
              </p>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <SortHeader field="peptideId" label="Product" sort={sort} onSort={handleSort} align="left" />
                    <SortHeader field="oldQty" label={comparison.older.label} sort={sort} onSort={handleSort} align="right" />
                    <SortHeader field="newQty" label={comparison.newer.label} sort={sort} onSort={handleSort} align="right" />
                    <SortHeader field="change" label="Change" sort={sort} onSort={handleSort} align="right" />
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {displayRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        No items match this filter
                      </td>
                    </tr>
                  ) : (
                    displayRows.map(row => (
                      <tr key={row.peptideId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-2">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{row.name || row.peptideId}</div>
                          {row.name && <div className="text-xs text-gray-500 dark:text-gray-400">{row.peptideId}</div>}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-gray-500 dark:text-gray-400">
                          {row.oldQty !== null ? row.oldQty : '-'}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-gray-500 dark:text-gray-400">
                          {row.newQty !== null ? row.newQty : '-'}
                        </td>
                        <td className="px-4 py-2 text-sm text-right font-medium">
                          <span className={
                            row.change < 0 ? 'text-red-600 dark:text-red-400' :
                            row.change > 0 ? 'text-green-600 dark:text-green-400' :
                            'text-gray-500 dark:text-gray-400'
                          }>
                            {row.change > 0 ? '+' : ''}{row.change}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <ChangeTag type={row.type} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {snapshots.length < 2 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {snapshots.length === 0 ? 'No Snapshots Yet' : 'Need One More Snapshot'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {snapshots.length === 0
              ? 'Take your first snapshot to start tracking inventory changes. A snapshot saves the current state of all your inventory data.'
              : 'Take another snapshot (e.g. tomorrow) to compare changes. Snapshots are also saved automatically once per day.'
            }
          </p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, color, subtitle }) {
  const colors = {
    red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30',
    green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function FilterBtn({ active, onClick, label, count, color = 'gray' }) {
  const colors = {
    gray: active ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800',
    red: active ? 'bg-red-200 dark:bg-red-900' : 'bg-red-100 dark:bg-red-900/50',
    green: active ? 'bg-green-200 dark:bg-green-900' : 'bg-green-100 dark:bg-green-900/50',
    blue: active ? 'bg-blue-200 dark:bg-blue-900' : 'bg-blue-100 dark:bg-blue-900/50',
    orange: active ? 'bg-orange-200 dark:bg-orange-900' : 'bg-orange-100 dark:bg-orange-900/50'
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${colors[color]} ${active ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'} hover:opacity-80`}
    >
      {label} <span className="font-bold">({count})</span>
    </button>
  );
}

function SortHeader({ field, label, sort, onSort, align }) {
  const isActive = sort.field === field;
  return (
    <th
      className={`px-4 py-2 text-${align} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600`}
      onClick={() => onSort(field)}
    >
      <div className={`flex items-center ${align === 'right' ? 'justify-end' : ''} space-x-2`}>
        <span>{label}</span>
        <ArrowUpDown className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
        {isActive && <span className="text-xs text-blue-600 dark:text-blue-400">{sort.direction === 'asc' ? '\u2191' : '\u2193'}</span>}
      </div>
    </th>
  );
}

function ChangeTag({ type }) {
  const config = {
    decreased: { label: 'Sold/Used', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    increased: { label: 'Restocked', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    new: { label: 'New', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    removed: { label: 'Removed', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
    unchanged: { label: 'No Change', className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' }
  };
  const c = config[type] || config.unchanged;
  return (
    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${c.className}`}>
      {c.label}
    </span>
  );
}
