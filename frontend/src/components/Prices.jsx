import { useState, useEffect, useCallback, useMemo } from 'react';
import { List } from 'lucide-react';
import { db } from '../lib/db';
import ColumnReorderModal from './ColumnReorderModal';

// Define all available columns for the pricing table
const DEFAULT_COLUMNS = [
  { id: 'product', label: 'Product' },
  { id: 'price', label: 'Price' },
  { id: 'axx26', label: 'Axx26' },
  { id: 'bxx26', label: 'Bxx26' },
  { id: 'cxx26', label: 'Cxx26' }
];

export default function Prices({ peptides }) {
  const [prices, setPrices] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [columnOrder, setColumnOrder] = useState(DEFAULT_COLUMNS);
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [showReorderModal, setShowReorderModal] = useState(false);

  // Load saved prices from IndexedDB
  useEffect(() => {
    const load = async () => {
      const saved = await db.settings.get('priceData');
      if (saved && typeof saved === 'object') {
        setPrices(saved);
      }
      setLoaded(true);
    };
    load();
  }, []);

  // Save prices to IndexedDB whenever they change (after initial load)
  useEffect(() => {
    if (!loaded) return;
    db.settings.set('priceData', prices);
  }, [prices, loaded]);

  // Load column settings from database
  useEffect(() => {
    const loadColumnSettings = async () => {
      const savedOrder = await db.settings.get('pricesColumnOrder');
      if (savedOrder && Array.isArray(savedOrder)) {
        const orderedColumns = savedOrder
          .map(id => DEFAULT_COLUMNS.find(col => col.id === id))
          .filter(Boolean);
        const newColumns = DEFAULT_COLUMNS.filter(
          col => !savedOrder.includes(col.id)
        );
        setColumnOrder([...orderedColumns, ...newColumns]);
      }

      const savedHidden = await db.settings.get('pricesHiddenColumns');
      if (savedHidden && Array.isArray(savedHidden)) {
        setHiddenColumns(savedHidden);
      }
    };
    loadColumnSettings();
  }, []);

  // Save column order
  const saveColumnOrder = async (newOrder) => {
    const orderIds = newOrder.map(col => col.id);
    await db.settings.set('pricesColumnOrder', orderIds);
  };

  const handleColumnReorder = (newOrder) => {
    setColumnOrder(newOrder);
    saveColumnOrder(newOrder);
  };

  const handleVisibilityChange = async (hidden) => {
    setHiddenColumns(hidden);
    await db.settings.set('pricesHiddenColumns', hidden);
  };

  // Get visible columns
  const visibleColumns = useMemo(() => {
    return columnOrder.filter(col => !hiddenColumns.includes(col.id));
  }, [columnOrder, hiddenColumns]);

  const handleChange = useCallback((productKey, col, value) => {
    setPrices(prev => ({
      ...prev,
      [productKey]: {
        ...prev[productKey],
        [col]: value,
      },
    }));
  }, []);

  // Deduplicate products by peptideId, sorted alphabetically by display name
  const products = Array.from(
    new Map(
      peptides.map(p => [
        p.peptideId,
        { key: p.peptideId, label: p.nickname || p.peptideId, sub: p.nickname ? p.peptideId : (p.peptideName || '') }
      ])
    ).values()
  ).sort((a, b) => a.label.localeCompare(b.label));

  // Map column IDs to their data keys
  const getColumnKey = (columnId) => {
    const keyMap = {
      'product': 'Product',
      'price': 'Price',
      'axx26': 'Axx26',
      'bxx26': 'Bxx26',
      'cxx26': 'Cxx26'
    };
    return keyMap[columnId];
  };

  return (
    <div className="space-y-4">
      {/* Reorder Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowReorderModal(true)}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <List className="w-4 h-4" />
          <span className="hidden sm:inline">Reorder</span>
        </button>
      </div>

      {/* Pricing Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
              <tr>
                {visibleColumns.map(column => (
                  <th
                    key={column.id}
                    className={`px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[110px]
                      ${column.id === 'product' ? 'text-left' : 'text-center'}
                    `}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length}
                    className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    No products found. Import inventory data first.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const rowPrices = prices[product.key] || {};
                  return (
                    <tr
                      key={product.key}
                      className="border-b border-gray-100 dark:border-gray-700"
                    >
                      {visibleColumns.map(column => {
                        if (column.id === 'product') {
                          return (
                            <td key={column.id} className="px-4 py-2">
                              <div className="font-medium text-gray-900 dark:text-white">{product.label}</div>
                              {product.sub && product.sub !== product.label && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">{product.sub}</div>
                              )}
                            </td>
                          );
                        } else {
                          const colKey = getColumnKey(column.id);
                          return (
                            <td key={column.id} className="px-2 py-1.5 text-center">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={rowPrices[colKey] ?? ''}
                                onChange={e => handleChange(product.key, colKey, e.target.value)}
                                onFocus={e => e.target.select()}
                                placeholder="—"
                                className="w-full text-center px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                              />
                            </td>
                          );
                        }
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
    </div>
  );
}
