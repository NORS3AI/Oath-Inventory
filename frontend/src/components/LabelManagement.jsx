import { useState, useMemo, useEffect } from 'react';
import { Tags, Plus, Minus, CheckCircle, AlertCircle, TrendingUp, Package } from 'lucide-react';
import { db } from '../lib/db';
import { useToast } from './Toast';

export default function LabelManagement({ peptides, onRefresh }) {
  const [labelInventory, setLabelInventory] = useState(0);
  const [adjustAmount, setAdjustAmount] = useState('');
  const { success, error: showError } = useToast();

  // Load label inventory
  useEffect(() => {
    const loadLabelInventory = async () => {
      const inventory = await db.labels.getInventory();
      setLabelInventory(inventory);
    };
    loadLabelInventory();
  }, []);

  // Calculate priority queue
  const priorityQueue = useMemo(() => {
    // Filter: only peptides with inventory > 0 and not yet labeled
    const unlabeled = peptides.filter(p =>
      (Number(p.quantity) || 0) > 0 && !p.isLabeled
    );

    // Calculate priority score for each peptide
    const withPriority = unlabeled.map(peptide => {
      let score = 0;
      const quantity = Number(peptide.quantity) || 0;

      // Higher quantity = higher priority (more stock to move)
      score += quantity * 2;

      // Has purity and net weight = higher priority (closer to sales ready)
      if (peptide.purity && peptide.purity.trim()) score += 100;
      if (peptide.netWeight && peptide.netWeight.trim()) score += 100;

      // Low stock status = higher priority (need to sell what we have)
      if (peptide.quantity <= 10) score += 50;
      else if (peptide.quantity <= 25) score += 25;

      // Has velocity data = higher priority (known seller)
      if (peptide.velocity && peptide.velocity.trim()) score += 30;

      return {
        ...peptide,
        priorityScore: score,
        readyForSales: !!(peptide.purity && peptide.purity.trim() && peptide.netWeight && peptide.netWeight.trim())
      };
    });

    // Sort by priority score (highest first)
    return withPriority.sort((a, b) => b.priorityScore - a.priorityScore);
  }, [peptides]);

  const labeledPeptides = useMemo(() => {
    return peptides.filter(p => p.isLabeled && (Number(p.quantity) || 0) > 0);
  }, [peptides]);

  const stats = {
    totalUnlabeled: priorityQueue.length,
    totalLabeled: labeledPeptides.length,
    readyForSales: priorityQueue.filter(p => p.readyForSales).length,
    labelInventory
  };

  const handleAddLabels = async () => {
    const amount = parseInt(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      showError('Please enter a valid positive number');
      return;
    }

    try {
      const newInventory = labelInventory + amount;
      await db.labels.setInventory(newInventory);
      setLabelInventory(newInventory);
      setAdjustAmount('');
      success(`Added ${amount} labels to inventory`);
    } catch (err) {
      showError('Failed to update label inventory');
    }
  };

  const handleRemoveLabels = async () => {
    const amount = parseInt(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      showError('Please enter a valid positive number');
      return;
    }

    if (amount > labelInventory) {
      showError('Cannot remove more labels than available');
      return;
    }

    try {
      const newInventory = labelInventory - amount;
      await db.labels.setInventory(newInventory);
      setLabelInventory(newInventory);
      setAdjustAmount('');
      success(`Removed ${amount} labels from inventory`);
    } catch (err) {
      showError('Failed to update label inventory');
    }
  };

  const handleMarkLabeled = async (peptide) => {
    if (labelInventory <= 0) {
      showError('No labels available in inventory');
      return;
    }

    try {
      // Mark as labeled
      await db.peptides.update(peptide.peptideId, {
        isLabeled: true,
        dateLabeled: new Date().toISOString()
      });

      // Decrease label inventory
      await db.labels.setInventory(labelInventory - 1);
      setLabelInventory(labelInventory - 1);

      success(`${peptide.peptideId} marked as labeled`);
      if (onRefresh) onRefresh();
    } catch (err) {
      showError('Failed to mark peptide as labeled');
    }
  };

  const handleUnmarkLabeled = async (peptide) => {
    try {
      // Remove label status
      await db.peptides.update(peptide.peptideId, {
        isLabeled: false,
        dateLabeled: null
      });

      // Increase label inventory (return the label)
      await db.labels.setInventory(labelInventory + 1);
      setLabelInventory(labelInventory + 1);

      success(`Label removed from ${peptide.peptideId}`);
      if (onRefresh) onRefresh();
    } catch (err) {
      showError('Failed to remove label');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Label Inventory"
          value={stats.labelInventory}
          subtitle="Available"
          icon={<Tags className="w-8 h-8 text-purple-600" />}
          color="purple"
        />
        <StatCard
          title="Need Labels"
          value={stats.totalUnlabeled}
          subtitle="In queue"
          icon={<Package className="w-8 h-8 text-orange-600" />}
          color="orange"
        />
        <StatCard
          title="Already Labeled"
          value={stats.totalLabeled}
          subtitle="Complete"
          icon={<CheckCircle className="w-8 h-8 text-green-600" />}
          color="green"
        />
        <StatCard
          title="Ready for Sales"
          value={stats.readyForSales}
          subtitle="After labeling"
          icon={<TrendingUp className="w-8 h-8 text-blue-600" />}
          color="blue"
        />
      </div>

      {/* Label Inventory Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Manage Label Inventory
        </h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quantity
            </label>
            <input
              type="number"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              min="1"
            />
          </div>
          <button
            onClick={handleAddLabels}
            disabled={!adjustAmount}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Labels</span>
          </button>
          <button
            onClick={handleRemoveLabels}
            disabled={!adjustAmount}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="w-4 h-4" />
            <span>Remove Labels</span>
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
          Current inventory: <span className="font-bold text-purple-600 dark:text-purple-400">{labelInventory}</span> labels available
        </p>
      </div>

      {/* Labeling Priority Queue */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Labeling Priority Queue
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Sorted by priority - label high-priority items first
              </p>
            </div>
            {labelInventory === 0 && (
              <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">No labels available</span>
              </div>
            )}
          </div>
        </div>

        {priorityQueue.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              All peptides with inventory are labeled!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Sales Ready
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {priorityQueue.map((peptide, index) => (
                  <tr key={peptide.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          index < 3
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                            : index < 10
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
                        }`}>
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {peptide.peptideId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {peptide.peptideName || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white font-medium">
                      {peptide.quantity}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {peptide.readyForSales ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto" />
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">After label</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleMarkLabeled(peptide)}
                        disabled={labelInventory === 0}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        <Tags className="w-4 h-4" />
                        <span>Apply Label</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Labeled Peptides */}
      {labeledPeptides.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Labeled Peptides
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {labeledPeptides.length} item{labeledPeptides.length !== 1 ? 's' : ''} currently labeled
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Date Labeled
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {labeledPeptides.map((peptide) => (
                  <tr key={peptide.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {peptide.peptideId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {peptide.peptideName || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                      {peptide.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {peptide.dateLabeled
                        ? new Date(peptide.dateLabeled).toLocaleDateString()
                        : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleUnmarkLabeled(peptide)}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                      >
                        Remove Label
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
  };

  return (
    <div className={`rounded-lg border p-4 transition-colors ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        </div>
        <div>{icon}</div>
      </div>
    </div>
  );
}
