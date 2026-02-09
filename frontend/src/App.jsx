import { useState, useEffect } from 'react';
import { Package, Upload, CheckCircle, BarChart3, Moon, Sun, FileText, Tag } from 'lucide-react';
import { useInventory } from './hooks/useInventory';
import { useDarkMode } from './hooks/useDarkMode';
import { ToastProvider } from './components/Toast';
import { db } from './lib/db';
import { authStorage, authApi } from './services/api';
import Login from './components/Login';
import CSVUpload from './components/CSVUpload';
import InventoryTable from './components/InventoryTable';
import SalesReady from './components/SalesReady';
import Reports from './components/Reports';
import Labeling from './components/Labeling';
import packageJson from '../package.json';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    // Restore active tab from localStorage on page load
    return localStorage.getItem('activeTab') || 'dashboard';
  });
  const { isDark, toggle } = useDarkMode();
  const [orders, setOrders] = useState([]);

  // Only initialize inventory if authenticated
  const inventoryHook = isAuthenticated ? useInventory() : {
    peptides: [],
    allPeptides: [],
    loading: false,
    thresholds: {},
    stats: { total: 0 },
    refresh: () => {},
    bulkExclude: () => {}
  };
  const { peptides, allPeptides, loading, thresholds, stats, refresh, bulkExclude } = inventoryHook;

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const hasToken = authStorage.isAuthenticated();
      if (hasToken) {
        try {
          await authApi.verify();
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid
          authStorage.clearToken();
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setAuthChecking(false);
    };

    checkAuth();
  }, []);

  // Listen for auth events
  useEffect(() => {
    const handleUnauthorized = () => {
      setIsAuthenticated(false);
    };

    const handleLogout = () => {
      setIsAuthenticated(false);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // Load orders
  useEffect(() => {
    const loadOrders = async () => {
      const allOrders = await db.orders.getAll();
      setOrders(allOrders);
    };
    loadOrders();
  }, [peptides]); // Reload when peptides change

  const handleImportComplete = () => {
    refresh();
    setActiveTab('inventory');
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  // Show loading while checking authentication
  if (authChecking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return (
      <ToastProvider>
        <Login onLoginSuccess={handleLoginSuccess} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors overflow-x-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Oath Research</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Peptide Inventory System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggle}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">v{packageJson.version}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 sm:space-x-8 min-w-max">
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
              icon={<Tag className="w-5 h-5" />}
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
              icon={<FileText className="w-5 h-5" />}
              label="Reports"
              active={activeTab === 'reports'}
              onClick={() => setActiveTab('reports')}
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
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <DashboardView stats={stats} onNavigate={setActiveTab} />}
            {activeTab === 'import' && <CSVUpload onImportComplete={handleImportComplete} />}
            {activeTab === 'inventory' && (
              <InventoryView
                peptides={peptides}
                allPeptides={allPeptides}
                thresholds={thresholds}
                onRefresh={refresh}
                bulkExclude={bulkExclude}
              />
            )}
            {activeTab === 'labeling' && <LabelingView peptides={peptides} onRefresh={refresh} />}
            {activeTab === 'sales' && <SalesReadyView peptides={peptides} />}
            {activeTab === 'reports' && <ReportsView peptides={peptides} orders={orders} thresholds={thresholds} />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            © 2026 Oath Research. Peptide Inventory Management System.
          </p>
        </div>
      </footer>
    </div>
    </ToastProvider>
  );
}

function NavButton({ icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-4 border-b-2 font-medium text-xs sm:text-sm transition-colors relative whitespace-nowrap
        ${active
          ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
        }
      `}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
          {badge}
        </span>
      )}
    </button>
  );
}

function DashboardView({ stats, onNavigate }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Overview of your peptide inventory</p>
      </div>

      {/* Status Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stock Status Legend</h3>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Total Peptides"
          value={stats.total.toString()}
          subtitle="In system"
          icon={<Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
        />
        <StatCard
          title="Need Ordering"
          value={stats.needsOrdering.toString()}
          subtitle="Requires attention"
          icon={<Package className="w-8 h-8 text-orange-600 dark:text-orange-400" />}
        />
      </div>

      {/* Getting Started or Actions */}
      {stats.total === 0 ? (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">Getting Started</h3>
          <p className="text-blue-800 dark:text-blue-300 mb-4">
            Welcome to the Oath Research Peptide Inventory System! To get started:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-300">
            <li>Import your inventory CSV file using the "Import CSV" tab</li>
            <li>Review your inventory in the "Inventory" tab</li>
            <li>Monitor sales-ready items in the "Sales Ready" tab</li>
            <li>View reports and analytics in the "Reports" tab</li>
          </ol>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Action Items</h3>
          <div className="space-y-3">
            {stats.needsOrdering > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg">
                <span className="text-orange-900 dark:text-orange-200 font-medium">
                  {stats.needsOrdering} peptide{stats.needsOrdering !== 1 ? 's' : ''} need ordering
                </span>
                <button
                  onClick={() => onNavigate('inventory')}
                  className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 font-medium transition-colors"
                >
                  View →
                </button>
              </div>
            )}
            {stats.needsOrdering === 0 && stats.total > 0 && (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                <span className="text-green-900 dark:text-green-200 font-medium">
                  All peptides have adequate stock levels
                </span>
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InventoryView({ peptides, allPeptides, thresholds, onRefresh, bulkExclude }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your peptide stock levels</p>
        </div>
      </div>
      <InventoryTable
        peptides={peptides}
        allPeptides={allPeptides}
        onRefresh={onRefresh}
        thresholds={thresholds}
        bulkExclude={bulkExclude}
      />
    </div>
  );
}

function LabelingView({ peptides, onRefresh }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Labeling Management</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Track labeled inventory and manage labeling tasks</p>
      </div>
      <Labeling peptides={peptides} onRefresh={onRefresh} />
    </div>
  );
}

function SalesReadyView({ peptides }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sales Ready Validation</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Three-point check: Purity, Net Weight, and Label</p>
      </div>
      <SalesReady peptides={peptides} />
    </div>
  );
}

function ImportView({ onImportComplete }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Import CSV</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Upload your inventory CSV file</p>
      </div>
      <CSVUpload onImportComplete={onImportComplete} />
    </div>
  );
}

function ReportsView({ peptides, orders, thresholds }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Comprehensive inventory analysis and exports</p>
      </div>
      <Reports peptides={peptides} orders={orders} thresholds={thresholds} />
    </div>
  );
}

function StatusCard({ color, label, action, count }) {
  const colors = {
    red: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
    teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 border-teal-200 dark:border-teal-800'
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        </div>
        <div>{icon}</div>
      </div>
    </div>
  );
}

export default App;
