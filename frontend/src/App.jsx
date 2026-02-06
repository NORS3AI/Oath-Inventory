import { useState } from 'react';
import { Package, Upload, Tags, CheckCircle, BarChart3 } from 'lucide-react';
import { useInventory } from './hooks/useInventory';
import CSVUpload from './components/CSVUpload';
import InventoryTable from './components/InventoryTable';
import SalesReady from './components/SalesReady';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { peptides, loading, thresholds, stats, refresh } = useInventory();

  const handleImportComplete = () => {
    refresh();
    setActiveTab('inventory');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Oath Research</h1>
                <p className="text-sm text-gray-600">Peptide Inventory System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">v1.0.0</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <NavButton
              icon={<BarChart3 className="w-5 h-5" />}
              label="Dashboard"
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
            />
            <NavButton
              icon={<Package className="w-5 h-5" />}
              label="Inventory"
              active={activeTab === 'inventory'}
              onClick={() => setActiveTab('inventory')}
              badge={stats.total}
            />
            <NavButton
              icon={<Tags className="w-5 h-5" />}
              label="Labeling"
              active={activeTab === 'labeling'}
              onClick={() => setActiveTab('labeling')}
            />
            <NavButton
              icon={<CheckCircle className="w-5 h-5" />}
              label="Sales Ready"
              active={activeTab === 'sales'}
              onClick={() => setActiveTab('sales')}
            />
            <NavButton
              icon={<Upload className="w-5 h-5" />}
              label="Import CSV"
              active={activeTab === 'import'}
              onClick={() => setActiveTab('import')}
            />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <DashboardView stats={stats} />}
            {activeTab === 'inventory' && (
              <InventoryView
                peptides={peptides}
                thresholds={thresholds}
                onRefresh={refresh}
              />
            )}
            {activeTab === 'labeling' && <LabelingView peptides={peptides} />}
            {activeTab === 'sales' && <SalesReadyView peptides={peptides} />}
            {activeTab === 'import' && <ImportView onImportComplete={handleImportComplete} />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            © 2026 Oath Research. Peptide Inventory Management System.
          </p>
        </div>
      </footer>
    </div>
  );
}

function NavButton({ icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center space-x-2 px-3 py-4 border-b-2 font-medium text-sm transition-colors relative
        ${active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
        }
      `}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {badge}
        </span>
      )}
    </button>
  );
}

function DashboardView({ stats }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">Overview of your peptide inventory</p>
      </div>

      {/* Status Legend */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Stock Status Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <StatusCard
            color="red"
            label="Out of Stock"
            action="Order Immediately"
            count={stats.outOfStock}
          />
          <StatusCard
            color="orange"
            label="Nearly Out"
            action="Order Urgently"
            count={stats.nearlyOut}
          />
          <StatusCard
            color="yellow"
            label="Low Stock"
            action="Order Soon"
            count={stats.lowStock}
          />
          <StatusCard
            color="green"
            label="Good Stock"
            action="No Action Needed"
            count={stats.goodStock}
          />
          <StatusCard
            color="teal"
            label="On Order"
            action="Monitor Delivery"
            count={stats.onOrder}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Peptides"
          value={stats.total.toString()}
          subtitle="In system"
          icon={<Package className="w-8 h-8 text-blue-600" />}
        />
        <StatCard
          title="Need Ordering"
          value={stats.needsOrdering.toString()}
          subtitle="Requires attention"
          icon={<Package className="w-8 h-8 text-orange-600" />}
        />
        <StatCard
          title="Need Labeling"
          value="0"
          subtitle="Awaiting labels"
          icon={<Tags className="w-8 h-8 text-purple-600" />}
        />
      </div>

      {/* Getting Started or Actions */}
      {stats.total === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Getting Started</h3>
          <p className="text-blue-800 mb-4">
            Welcome to the Oath Research Peptide Inventory System! To get started:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Import your inventory CSV file using the "Import CSV" tab</li>
            <li>Review your inventory in the "Inventory" tab</li>
            <li>Track peptides that need labeling in the "Labeling" tab</li>
            <li>Monitor sales-ready items in the "Sales Ready" tab</li>
          </ol>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Action Items</h3>
          <div className="space-y-3">
            {stats.needsOrdering > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <span className="text-orange-900 font-medium">
                  {stats.needsOrdering} peptide{stats.needsOrdering !== 1 ? 's' : ''} need ordering
                </span>
                <button className="text-orange-600 hover:text-orange-800 font-medium">
                  View →
                </button>
              </div>
            )}
            {stats.needsOrdering === 0 && stats.total > 0 && (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-900 font-medium">
                  All peptides have adequate stock levels
                </span>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InventoryView({ peptides, thresholds, onRefresh }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory</h2>
          <p className="text-gray-600 mt-1">Manage your peptide stock levels</p>
        </div>
      </div>
      <InventoryTable
        peptides={peptides}
        onRefresh={onRefresh}
        thresholds={thresholds}
      />
    </div>
  );
}

function LabelingView({ peptides }) {
  const peptidesNeedingLabels = peptides.filter(p => p.quantity > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Labeling Queue</h2>
        <p className="text-gray-600 mt-1">Track peptides that need to be labeled</p>
      </div>
      {peptidesNeedingLabels.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Tags className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No labeling tasks yet. Import inventory to see what needs labels.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-4">
            {peptidesNeedingLabels.length} peptide{peptidesNeedingLabels.length !== 1 ? 's' : ''} with inventory
          </p>
          <p className="text-sm text-gray-500">
            Full labeling functionality coming in Phase 5!
          </p>
        </div>
      )}
    </div>
  );
}

function SalesReadyView({ peptides }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Sales Ready Validation</h2>
        <p className="text-gray-600 mt-1">Three-point check: Purity, Net Weight, and Label</p>
      </div>
      <SalesReady peptides={peptides} />
    </div>
  );
}

function ImportView({ onImportComplete }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Import CSV</h2>
        <p className="text-gray-600 mt-1">Upload your inventory CSV file</p>
      </div>
      <CSVUpload onImportComplete={onImportComplete} />
    </div>
  );
}

function StatusCard({ color, label, action, count }) {
  const colors = {
    red: 'bg-red-100 text-red-800 border-red-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    teal: 'bg-teal-100 text-teal-800 border-teal-200'
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[color]}`}>
      <div className="text-2xl font-bold">{count}</div>
      <div className="font-semibold mt-1">{label}</div>
      <div className="text-sm mt-1 opacity-80">{action}</div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div>{icon}</div>
      </div>
    </div>
  );
}

export default App;
