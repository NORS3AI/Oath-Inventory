import localforage from 'localforage';

// Initialize IndexedDB stores
const peptideStore = localforage.createInstance({
  name: 'OathInventory',
  storeName: 'peptides',
  description: 'Peptide inventory data'
});

const orderStore = localforage.createInstance({
  name: 'OathInventory',
  storeName: 'orders',
  description: 'Peptide orders and lifecycle tracking'
});

const labelStore = localforage.createInstance({
  name: 'OathInventory',
  storeName: 'labels',
  description: 'Label inventory and tracking'
});

const settingsStore = localforage.createInstance({
  name: 'OathInventory',
  storeName: 'settings',
  description: 'Application settings and configuration'
});

const transactionStore = localforage.createInstance({
  name: 'OathInventory',
  storeName: 'transactions',
  description: 'Sales and usage transactions for velocity tracking'
});

/**
 * Database service for Oath Inventory System
 * Uses IndexedDB via localforage for client-side data persistence
 */
export const db = {
  // Peptide operations
  peptides: {
    async getAll() {
      const peptides = [];
      await peptideStore.iterate((value) => {
        peptides.push(value);
      });
      return peptides.sort((a, b) => a.peptideId.localeCompare(b.peptideId));
    },

    async get(id) {
      return await peptideStore.getItem(id);
    },

    async set(id, data) {
      return await peptideStore.setItem(id, {
        ...data,
        id,
        updatedAt: new Date().toISOString()
      });
    },

    async update(id, updates) {
      const existing = await peptideStore.getItem(id);
      if (!existing) throw new Error(`Peptide ${id} not found`);

      return await peptideStore.setItem(id, {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      });
    },

    async delete(id) {
      return await peptideStore.removeItem(id);
    },

    async clear() {
      return await peptideStore.clear();
    },

    async bulkImport(peptides) {
      const results = [];
      for (const peptide of peptides) {
        const id = peptide.peptideId || peptide.id;
        results.push(await this.set(id, peptide));
      }
      return results;
    }
  },

  // Order/Lifecycle operations
  orders: {
    async getAll() {
      const orders = [];
      await orderStore.iterate((value) => {
        orders.push(value);
      });
      return orders.sort((a, b) =>
        new Date(b.dateOrdered || 0) - new Date(a.dateOrdered || 0)
      );
    },

    async getByPeptideId(peptideId) {
      const orders = [];
      await orderStore.iterate((value) => {
        if (value.peptideId === peptideId) {
          orders.push(value);
        }
      });
      return orders;
    },

    async get(id) {
      return await orderStore.getItem(id);
    },

    async set(id, data) {
      return await orderStore.setItem(id, {
        ...data,
        id,
        updatedAt: new Date().toISOString()
      });
    },

    async update(id, updates) {
      const existing = await orderStore.getItem(id);
      if (!existing) throw new Error(`Order ${id} not found`);

      return await orderStore.setItem(id, {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      });
    },

    async delete(id) {
      return await orderStore.removeItem(id);
    },

    async clear() {
      return await orderStore.clear();
    }
  },

  // Label operations
  labels: {
    async getInventory() {
      return await labelStore.getItem('inventory') || { count: 0, lastUpdated: null };
    },

    async setInventory(count) {
      return await labelStore.setItem('inventory', {
        count,
        lastUpdated: new Date().toISOString()
      });
    },

    async getLabeled() {
      const labeled = [];
      await labelStore.iterate((value, key) => {
        if (key !== 'inventory') {
          labeled.push(value);
        }
      });
      return labeled;
    },

    async markLabeled(peptideId, batchNumber, data = {}) {
      const id = `${peptideId}-${batchNumber}`;
      return await labelStore.setItem(id, {
        peptideId,
        batchNumber,
        dateLabeled: new Date().toISOString(),
        ...data
      });
    },

    async isLabeled(peptideId, batchNumber) {
      const id = `${peptideId}-${batchNumber}`;
      const labeled = await labelStore.getItem(id);
      return !!labeled;
    },

    async clear() {
      return await labelStore.clear();
    }
  },

  // Settings operations
  settings: {
    async get(key) {
      return await settingsStore.getItem(key);
    },

    async set(key, value) {
      return await settingsStore.setItem(key, value);
    },

    async getAll() {
      const settings = {};
      await settingsStore.iterate((value, key) => {
        settings[key] = value;
      });
      return settings;
    },

    async getStockThresholds() {
      return await settingsStore.getItem('stockThresholds') || {
        outOfStock: 0,
        nearlyOut: 10,
        lowStock: 25,
        goodStock: 50
      };
    },

    async setStockThresholds(thresholds) {
      return await settingsStore.setItem('stockThresholds', thresholds);
    }
  },

  // Transaction operations (for sales velocity tracking)
  transactions: {
    async getAll() {
      const transactions = [];
      await transactionStore.iterate((value) => {
        transactions.push(value);
      });
      return transactions.sort((a, b) =>
        new Date(b.date || 0) - new Date(a.date || 0)
      );
    },

    async getByPeptideId(peptideId) {
      const transactions = [];
      await transactionStore.iterate((value) => {
        if (value.peptideId === peptideId) {
          transactions.push(value);
        }
      });
      return transactions.sort((a, b) =>
        new Date(a.date || 0) - new Date(b.date || 0)
      );
    },

    async getByDateRange(startDate, endDate) {
      const transactions = [];
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();

      await transactionStore.iterate((value) => {
        const txDate = new Date(value.date).getTime();
        if (txDate >= start && txDate <= end) {
          transactions.push(value);
        }
      });
      return transactions.sort((a, b) =>
        new Date(a.date || 0) - new Date(b.date || 0)
      );
    },

    async record(peptideId, quantity, type = 'sale', notes = '') {
      const id = `${peptideId}-${Date.now()}`;
      const transaction = {
        id,
        peptideId,
        quantity: Number(quantity),
        type, // 'sale', 'adjustment', 'return', etc.
        date: new Date().toISOString(),
        notes,
        createdAt: new Date().toISOString()
      };

      return await transactionStore.setItem(id, transaction);
    },

    async delete(id) {
      return await transactionStore.removeItem(id);
    },

    async clear() {
      return await transactionStore.clear();
    }
  },

  // Utility operations
  async clearAll() {
    await peptideStore.clear();
    await orderStore.clear();
    await labelStore.clear();
    await settingsStore.clear();
    await transactionStore.clear();
  },

  async exportData() {
    const peptides = await this.peptides.getAll();
    const orders = await this.orders.getAll();
    const labels = await this.labels.getLabeled();
    const settings = await this.settings.getAll();
    const transactions = await this.transactions.getAll();

    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: {
        peptides,
        orders,
        labels,
        settings,
        transactions
      }
    };
  },

  async importData(exportedData) {
    if (!exportedData.data) throw new Error('Invalid export data format');

    const { peptides, orders, labels, settings, transactions } = exportedData.data;

    // Import peptides
    if (peptides) {
      for (const peptide of peptides) {
        await this.peptides.set(peptide.id, peptide);
      }
    }

    // Import orders
    if (orders) {
      for (const order of orders) {
        await this.orders.set(order.id, order);
      }
    }

    // Import labels
    if (labels) {
      for (const label of labels) {
        const id = `${label.peptideId}-${label.batchNumber}`;
        await labelStore.setItem(id, label);
      }
    }

    // Import settings
    if (settings) {
      for (const [key, value] of Object.entries(settings)) {
        await this.settings.set(key, value);
      }
    }

    // Import transactions
    if (transactions) {
      for (const transaction of transactions) {
        await transactionStore.setItem(transaction.id, transaction);
      }
    }

    return true;
  }
};

export default db;
