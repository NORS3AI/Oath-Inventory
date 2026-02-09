// API client for backend communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(error.error || 'Request failed', response.status);
  }
  return response.json();
}

// ========== PEPTIDES API ==========

export const peptidesApi = {
  // Get all peptides
  async getAll() {
    const response = await fetch(`${API_BASE_URL}/peptides`);
    return handleResponse(response);
  },

  // Get single peptide
  async get(peptideId) {
    const response = await fetch(`${API_BASE_URL}/peptides/${encodeURIComponent(peptideId)}`);
    return handleResponse(response);
  },

  // Create new peptide
  async create(peptide) {
    const response = await fetch(`${API_BASE_URL}/peptides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(peptide),
    });
    return handleResponse(response);
  },

  // Update peptide
  async update(peptideId, peptide) {
    const response = await fetch(`${API_BASE_URL}/peptides/${encodeURIComponent(peptideId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(peptide),
    });
    return handleResponse(response);
  },

  // Delete peptide
  async delete(peptideId) {
    const response = await fetch(`${API_BASE_URL}/peptides/${encodeURIComponent(peptideId)}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Bulk import peptides
  async bulkImport(peptides) {
    const response = await fetch(`${API_BASE_URL}/peptides/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ peptides }),
    });
    return handleResponse(response);
  },
};

// ========== EXCLUSIONS API ==========

export const exclusionsApi = {
  // Get all exclusions
  async getAll() {
    const response = await fetch(`${API_BASE_URL}/exclusions`);
    return handleResponse(response);
  },

  // Add exclusion
  async add(pattern) {
    const response = await fetch(`${API_BASE_URL}/exclusions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pattern }),
    });
    return handleResponse(response);
  },

  // Delete exclusion
  async delete(pattern) {
    const response = await fetch(`${API_BASE_URL}/exclusions/${encodeURIComponent(pattern)}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Bulk set exclusions
  async bulkSet(patterns) {
    const response = await fetch(`${API_BASE_URL}/exclusions/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patterns }),
    });
    return handleResponse(response);
  },
};

// ========== LABEL HISTORY API ==========

export const labelHistoryApi = {
  // Get label history for a peptide
  async get(peptideId) {
    const response = await fetch(`${API_BASE_URL}/label-history/${encodeURIComponent(peptideId)}`);
    return handleResponse(response);
  },

  // Add label history entry
  async add(peptideId, quantity, action, notes = '') {
    const response = await fetch(`${API_BASE_URL}/label-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ peptideId, quantity, action, notes }),
    });
    return handleResponse(response);
  },
};

// ========== HEALTH CHECK ==========

export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return handleResponse(response);
  } catch (error) {
    throw new ApiError('Cannot connect to server', 0);
  }
}

export { ApiError };
