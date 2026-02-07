import { useMemo, useState } from 'react';
import { Download, TrendingUp, Clock, Package, CheckCircle, AlertTriangle, FileText, PieChart as PieChartIcon, BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon } from 'lucide-react';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { calculateStockStatus } from '../utils/stockStatus';
import { checkSalesReadiness } from '../utils/salesReadiness';
import { exportToCSV, downloadCSV } from '../utils/csvParser';

export default function Reports({ peptides, orders = [], thresholds }) {
  const [chartType, setChartType] = useState('pie'); // pie, bar, line, area

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    const peptidesWithStatus = peptides.map(p => ({
      ...p,
      status: calculateStockStatus(p.quantity, thresholds, p.hasActiveOrder),
      readiness: checkSalesReadiness(p)
    }));

    const statusCounts = {
      outOfStock: 0,
      nearlyOut: 0,
      lowStock: 0,
      goodStock: 0,
      onOrder: 0
    };

    let totalValue = 0;
    let lowStockItems = [];
    let salesReadyCount = 0;
    let needsAttention = [];

    peptidesWithStatus.forEach(p => {
      // Status counts
      if (p.status === 'OUT_OF_STOCK') statusCounts.outOfStock++;
      else if (p.status === 'NEARLY_OUT') statusCounts.nearlyOut++;
      else if (p.status === 'LOW_STOCK') statusCounts.lowStock++;
      else if (p.status === 'GOOD_STOCK') statusCounts.goodStock++;
      else if (p.status === 'ON_ORDER') statusCounts.onOrder++;

      // Total inventory value (quantity as proxy)
      totalValue += Number(p.quantity) || 0;

      // Low stock items
      if (p.status === 'OUT_OF_STOCK' || p.status === 'NEARLY_OUT' || p.status === 'LOW_STOCK') {
        lowStockItems.push(p);
      }

      // Sales ready count
      if (p.readiness.isReady) {
        salesReadyCount++;
      } else if (p.quantity > 0) {
        needsAttention.push(p);
      }
    });

    // Operational metrics from orders
    const completedOrders = orders.filter(o => o.dateResultsReceived);
    let avgOrderToDelivery = 0;
    let avgTestingTurnaround = 0;

    if (completedOrders.length > 0) {
      const orderToDeliveryTimes = completedOrders
        .filter(o => o.dateOrdered && o.dateArrived)
        .map(o => {
          const ordered = new Date(o.dateOrdered);
          const arrived = new Date(o.dateArrived);
          return Math.ceil((arrived - ordered) / (1000 * 60 * 60 * 24)); // days
        });

      const testingTimes = completedOrders
        .filter(o => o.dateSentForTesting && o.dateResultsReceived)
        .map(o => {
          const sent = new Date(o.dateSentForTesting);
          const received = new Date(o.dateResultsReceived);
          return Math.ceil((received - sent) / (1000 * 60 * 60 * 24)); // days
        });

      if (orderToDeliveryTimes.length > 0) {
        avgOrderToDelivery = Math.round(
          orderToDeliveryTimes.reduce((a, b) => a + b, 0) / orderToDeliveryTimes.length
        );
      }

      if (testingTimes.length > 0) {
        avgTestingTurnaround = Math.round(
          testingTimes.reduce((a, b) => a + b, 0) / testingTimes.length
        );
      }
    }

    return {
      total: peptides.length,
      statusCounts,
      totalValue,
      lowStockItems: lowStockItems.slice(0, 10), // Top 10
      salesReadyCount,
      salesReadyPercent: peptides.length > 0 ? Math.round((salesReadyCount / peptides.length) * 100) : 0,
      needsAttention: needsAttention.slice(0, 10), // Top 10
      avgOrderToDelivery,
      avgTestingTurnaround,
      activeOrders: orders.filter(o => !o.dateResultsReceived).length,
      completedOrders: completedOrders.length
    };
  }, [peptides, orders, thresholds]);

  // Chart data
  const chartData = useMemo(() => {
    const COLORS = {
      outOfStock: '#ef4444',
      nearlyOut: '#f97316',
      lowStock: '#eab308',
      goodStock: '#22c55e',
      onOrder: '#14b8a6'
    };

    // Stock Status Data
    const stockData = [
      { name: 'Out of Stock', value: stats.statusCounts.outOfStock, color: COLORS.outOfStock },
      { name: 'Nearly Out', value: stats.statusCounts.nearlyOut, color: COLORS.nearlyOut },
      { name: 'Low Stock', value: stats.statusCounts.lowStock, color: COLORS.lowStock },
      { name: 'Good Stock', value: stats.statusCounts.goodStock, color: COLORS.goodStock },
      { name: 'On Order', value: stats.statusCounts.onOrder, color: COLORS.onOrder }
    ].filter(d => d.value > 0);

    // Sales Readiness Data
    const salesData = [
      { name: 'Sales Ready', value: stats.salesReadyCount, color: '#22c55e' },
      { name: 'Need Attention', value: stats.total - stats.salesReadyCount, color: '#f97316' }
    ].filter(d => d.value > 0);

    return { stockData, salesData, COLORS };
  }, [stats]);

  const handleExportInventory = () => {
    const csvContent = exportToCSV(peptides);
    downloadCSV(csvContent, `oath-inventory-report-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportSummary = () => {
    const summary = `Oath Research Inventory Summary Report
Generated: ${new Date().toLocaleString()}

=== INVENTORY OVERVIEW ===
Total Peptides: ${stats.total}
Total Inventory Units: ${stats.totalValue}
Sales Ready: ${stats.salesReadyCount} (${stats.salesReadyPercent}%)

=== STOCK STATUS ===
Out of Stock: ${stats.statusCounts.outOfStock}
Nearly Out: ${stats.statusCounts.nearlyOut}
Low Stock: ${stats.statusCounts.lowStock}
Good Stock: ${stats.statusCounts.goodStock}
On Order: ${stats.statusCounts.onOrder}

=== OPERATIONAL METRICS ===
Active Orders: ${stats.activeOrders}
Completed Orders: ${stats.completedOrders}
Avg Order-to-Delivery: ${stats.avgOrderToDelivery} days
Avg Testing Turnaround: ${stats.avgTestingTurnaround} days

=== ITEMS NEEDING ATTENTION ===
${stats.needsAttention.map(p =>
  `${p.peptideId} - Missing: ${p.readiness.missing.join(', ')}`
).join('\n')}
`;

    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oath-summary-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Export Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleExportInventory}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Full Inventory (CSV)</span>
        </button>
        <button
          onClick={handleExportSummary}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>Export Summary Report (TXT)</span>
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Peptides"
          value={stats.total}
          subtitle="In system"
          icon={<Package className="w-8 h-8 text-blue-600" />}
          color="blue"
        />
        <MetricCard
          title="Sales Ready"
          value={`${stats.salesReadyPercent}%`}
          subtitle={`${stats.salesReadyCount} of ${stats.total}`}
          icon={<CheckCircle className="w-8 h-8 text-green-600" />}
          color="green"
        />
        <MetricCard
          title="Need Attention"
          value={stats.lowStockItems.length}
          subtitle="Low or out of stock"
          icon={<AlertTriangle className="w-8 h-8 text-orange-600" />}
          color="orange"
        />
        <MetricCard
          title="Total Units"
          value={stats.totalValue}
          subtitle="In inventory"
          icon={<TrendingUp className="w-8 h-8 text-purple-600" />}
          color="purple"
        />
      </div>

      {/* Operational Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Operational Metrics</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Orders</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeOrders}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Completed Orders</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedOrders}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Order→Delivery</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.avgOrderToDelivery > 0 ? `${stats.avgOrderToDelivery}d` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Testing Time</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.avgTestingTurnaround > 0 ? `${stats.avgTestingTurnaround}d` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Stock Status Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Stock Status Breakdown</h3>
        <div className="space-y-3">
          <StatusBar
            label="Out of Stock"
            count={stats.statusCounts.outOfStock}
            total={stats.total}
            color="bg-red-500"
          />
          <StatusBar
            label="Nearly Out"
            count={stats.statusCounts.nearlyOut}
            total={stats.total}
            color="bg-orange-500"
          />
          <StatusBar
            label="Low Stock"
            count={stats.statusCounts.lowStock}
            total={stats.total}
            color="bg-yellow-500"
          />
          <StatusBar
            label="Good Stock"
            count={stats.statusCounts.goodStock}
            total={stats.total}
            color="bg-green-500"
          />
          <StatusBar
            label="On Order"
            count={stats.statusCounts.onOrder}
            total={stats.total}
            color="bg-teal-500"
          />
        </div>
      </div>

      {/* Interactive Charts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-0">
            Data Visualizations
          </h3>

          {/* Chart Type Toggle */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setChartType('pie')}
              className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                chartType === 'pie'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <PieChartIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Pie</span>
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                chartType === 'bar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">Bar</span>
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                chartType === 'line'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <LineChartIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Line</span>
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                chartType === 'area'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <AreaChartIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Area</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Status Chart */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Stock Status Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'pie' ? (
                <PieChart>
                  <Pie
                    data={chartData.stockData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.stockData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              ) : chartType === 'bar' ? (
                <BarChart data={chartData.stockData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="value" name="Count">
                    {chartData.stockData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              ) : chartType === 'line' ? (
                <LineChart data={chartData.stockData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} name="Count" />
                </LineChart>
              ) : (
                <AreaChart data={chartData.stockData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                  <Legend />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Count" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Sales Readiness Chart */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Sales Readiness Status</h4>
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'pie' ? (
                <PieChart>
                  <Pie
                    data={chartData.salesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.salesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              ) : chartType === 'bar' ? (
                <BarChart data={chartData.salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="value" name="Count">
                    {chartData.salesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              ) : chartType === 'line' ? (
                <LineChart data={chartData.salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} name="Count" />
                </LineChart>
              ) : (
                <AreaChart data={chartData.salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                  <Legend />
                  <Area type="monotone" dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} name="Count" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Low Stock Items */}
      {stats.lowStockItems.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Items Needing Immediate Attention
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Product
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {stats.lowStockItems.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
                      {item.peptideId}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-gray-500 dark:text-gray-400">
                      {item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Items Missing Requirements */}
      {stats.needsAttention.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Items Missing Sales Requirements
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Product
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Missing Requirements
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {stats.needsAttention.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
                      {item.peptideId}
                    </td>
                    <td className="px-4 py-2 text-sm text-red-600 dark:text-red-400">
                      {item.readiness.missing.join(', ')}
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-gray-500 dark:text-gray-400">
                      {item.quantity}
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

function MetricCard({ title, value, subtitle, icon, color }) {
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

function StatusBar({ label, count, total, color }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-600 dark:text-gray-400">
          {count} ({percentage}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    OUT_OF_STOCK: { label: 'Out', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    NEARLY_OUT: { label: 'Nearly Out', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
    LOW_STOCK: { label: 'Low', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    GOOD_STOCK: { label: 'Good', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    ON_ORDER: { label: 'On Order', className: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' }
  };

  const { label, className } = config[status] || config.GOOD_STOCK;

  return (
    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${className}`}>
      {label}
    </span>
  );
}
