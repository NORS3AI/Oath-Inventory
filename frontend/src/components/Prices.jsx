import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/db';

export default function Prices({ peptides }) {
  const [prices, setPrices] = useState({});
  const [loaded, setLoaded] = useState(false);

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

  const cols = ['Price', 'Axx26', 'Bxx26', 'Cxx26'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Product
              </th>
              {cols.map(col => (
                <th
                  key={col}
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[110px]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
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
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-900 dark:text-white">{product.label}</div>
                      {product.sub && product.sub !== product.label && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{product.sub}</div>
                      )}
                    </td>
                    {cols.map(col => (
                      <td key={col} className="px-2 py-1.5 text-center">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={rowPrices[col] ?? ''}
                          onChange={e => handleChange(product.key, col, e.target.value)}
                          onFocus={e => e.target.select()}
                          placeholder="—"
                          className="w-full text-center px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
