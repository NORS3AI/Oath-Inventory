import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import bcrypt from 'bcryptjs';

const app = new Hono();

// CORS middleware - allow all origins for now
app.use('/*', cors());

// JWT secret from environment
const getJWTSecret = (c) => c.env.JWT_SECRET || 'oath-inventory-secret-change-in-production';

// Password hash storage (in production, move to KV or D1)
let currentPasswordHash = null;

// Initialize password hash
async function initPasswordHash(env) {
  if (!currentPasswordHash) {
    const defaultPassword = env.DEFAULT_PASSWORD || 'admin';
    currentPasswordHash = await bcrypt.hash(defaultPassword, 10);
  }
}

// ========== AUTHENTICATION MIDDLEWARE ==========

const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return c.json({ error: 'Access token required' }, 401);
  }

  try {
    const secret = getJWTSecret(c);
    const payload = await verifyJWT(token, secret);
    c.set('user', payload);
    await next();
  } catch (err) {
    return c.json({ error: 'Invalid or expired token' }, 403);
  }
};

// Simple JWT verification (since hono/jwt might not work with jsonwebtoken)
async function verifyJWT(token, secret) {
  const jwt = await import('jsonwebtoken');
  return new Promise((resolve, reject) => {
    jwt.default.verify(token, secret, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
}

async function signJWT(payload, secret, options) {
  const jwt = await import('jsonwebtoken');
  return new Promise((resolve, reject) => {
    jwt.default.sign(payload, secret, options, (err, token) => {
      if (err) reject(err);
      else resolve(token);
    });
  });
}

// ========== PUBLIC ROUTES ==========

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', message: 'Server is running' });
});

app.post('/api/auth/login', async (c) => {
  await initPasswordHash(c.env);

  const { password } = await c.req.json();

  if (!password) {
    return c.json({ error: 'Password is required' }, 400);
  }

  try {
    const isValid = await bcrypt.compare(password, currentPasswordHash);

    if (!isValid) {
      return c.json({ error: 'Invalid password' }, 401);
    }

    const secret = getJWTSecret(c);
    const token = await signJWT(
      { authenticated: true, timestamp: Date.now() },
      secret,
      { expiresIn: '24h' }
    );

    return c.json({
      success: true,
      token,
      expiresIn: '24h'
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// ========== PROTECTED ROUTES ==========

// Verify token
app.get('/api/auth/verify', authMiddleware, (c) => {
  return c.json({ valid: true });
});

// Change password
app.post('/api/auth/change-password', authMiddleware, async (c) => {
  const { currentPassword, newPassword } = await c.req.json();

  if (!currentPassword || !newPassword) {
    return c.json({ error: 'Current and new password required' }, 400);
  }

  if (newPassword.length < 6) {
    return c.json({ error: 'New password must be at least 6 characters' }, 400);
  }

  try {
    const isValid = await bcrypt.compare(currentPassword, currentPasswordHash);

    if (!isValid) {
      return c.json({ error: 'Current password is incorrect' }, 401);
    }

    currentPasswordHash = await bcrypt.hash(newPassword, 10);

    return c.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return c.json({ error: 'Failed to change password' }, 500);
  }
});

// ========== PEPTIDES ROUTES ==========

app.get('/api/peptides', authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const { results } = await db.prepare('SELECT * FROM peptides ORDER BY peptideId').all();
    return c.json(results);
  } catch (error) {
    console.error('Error fetching peptides:', error);
    return c.json({ error: 'Failed to fetch peptides' }, 500);
  }
});

app.get('/api/peptides/:id', authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    const result = await db.prepare('SELECT * FROM peptides WHERE peptideId = ?').bind(id).first();

    if (!result) {
      return c.json({ error: 'Peptide not found' }, 404);
    }

    return c.json(result);
  } catch (error) {
    console.error('Error fetching peptide:', error);
    return c.json({ error: 'Failed to fetch peptide' }, 500);
  }
});

app.post('/api/peptides', authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const peptide = await c.req.json();
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO peptides (
        peptideId, peptideName, quantity, labeledCount, batchNumber,
        shelfLocation, dateAdded, lastModified, notes, coa, sku,
        coaFile, msdsFile, sdsFile, hplcFile, tlcFile, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      peptide.peptideId,
      peptide.peptideName || '',
      peptide.quantity || 0,
      peptide.labeledCount || 0,
      peptide.batchNumber || '',
      peptide.shelfLocation || '',
      peptide.dateAdded || now,
      peptide.lastModified || now,
      peptide.notes || '',
      peptide.coa || '',
      peptide.sku || '',
      peptide.coaFile || '',
      peptide.msdsFile || '',
      peptide.sdsFile || '',
      peptide.hplcFile || '',
      peptide.tlcFile || '',
      now,
      now
    ).run();

    return c.json({ message: 'Peptide created successfully', peptideId: peptide.peptideId }, 201);
  } catch (error) {
    console.error('Error creating peptide:', error);
    if (error.message?.includes('UNIQUE')) {
      return c.json({ error: 'Peptide ID already exists' }, 409);
    }
    return c.json({ error: 'Failed to create peptide' }, 500);
  }
});

app.put('/api/peptides/:id', authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    const peptide = await c.req.json();
    const now = new Date().toISOString();

    const result = await db.prepare(`
      UPDATE peptides SET
        peptideName = ?,
        quantity = ?,
        labeledCount = ?,
        batchNumber = ?,
        shelfLocation = ?,
        dateAdded = ?,
        lastModified = ?,
        notes = ?,
        coa = ?,
        sku = ?,
        coaFile = ?,
        msdsFile = ?,
        sdsFile = ?,
        hplcFile = ?,
        tlcFile = ?,
        updatedAt = ?
      WHERE peptideId = ?
    `).bind(
      peptide.peptideName || '',
      peptide.quantity || 0,
      peptide.labeledCount || 0,
      peptide.batchNumber || '',
      peptide.shelfLocation || '',
      peptide.dateAdded || now,
      peptide.lastModified || now,
      peptide.notes || '',
      peptide.coa || '',
      peptide.sku || '',
      peptide.coaFile || '',
      peptide.msdsFile || '',
      peptide.sdsFile || '',
      peptide.hplcFile || '',
      peptide.tlcFile || '',
      now,
      id
    ).run();

    if (result.meta.changes === 0) {
      return c.json({ error: 'Peptide not found' }, 404);
    }

    return c.json({ message: 'Peptide updated successfully' });
  } catch (error) {
    console.error('Error updating peptide:', error);
    return c.json({ error: 'Failed to update peptide' }, 500);
  }
});

app.delete('/api/peptides/:id', authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');

    const result = await db.prepare('DELETE FROM peptides WHERE peptideId = ?').bind(id).run();

    if (result.meta.changes === 0) {
      return c.json({ error: 'Peptide not found' }, 404);
    }

    return c.json({ message: 'Peptide deleted successfully' });
  } catch (error) {
    console.error('Error deleting peptide:', error);
    return c.json({ error: 'Failed to delete peptide' }, 500);
  }
});

app.post('/api/peptides/bulk', authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const { peptides } = await c.req.json();
    const now = new Date().toISOString();

    // D1 doesn't support batch operations the same way, so we'll do individual inserts
    // In a transaction-like manner using batch
    const statements = peptides.map(peptide => {
      return db.prepare(`
        INSERT INTO peptides (
          peptideId, peptideName, quantity, labeledCount, batchNumber,
          shelfLocation, dateAdded, lastModified, notes, coa, sku,
          coaFile, msdsFile, sdsFile, hplcFile, tlcFile, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(peptideId) DO UPDATE SET
          peptideName = excluded.peptideName,
          quantity = excluded.quantity,
          batchNumber = excluded.batchNumber,
          shelfLocation = excluded.shelfLocation,
          dateAdded = excluded.dateAdded,
          lastModified = excluded.lastModified,
          notes = excluded.notes,
          coa = excluded.coa,
          sku = excluded.sku,
          coaFile = excluded.coaFile,
          msdsFile = excluded.msdsFile,
          sdsFile = excluded.sdsFile,
          hplcFile = excluded.hplcFile,
          tlcFile = excluded.tlcFile,
          updatedAt = excluded.updatedAt
      `).bind(
        peptide.peptideId,
        peptide.peptideName || '',
        peptide.quantity || 0,
        peptide.labeledCount || 0,
        peptide.batchNumber || '',
        peptide.shelfLocation || '',
        peptide.dateAdded || now,
        peptide.lastModified || now,
        peptide.notes || '',
        peptide.coa || '',
        peptide.sku || '',
        peptide.coaFile || '',
        peptide.msdsFile || '',
        peptide.sdsFile || '',
        peptide.hplcFile || '',
        peptide.tlcFile || '',
        now,
        now
      );
    });

    await db.batch(statements);

    return c.json({ message: `Successfully imported ${peptides.length} peptides` });
  } catch (error) {
    console.error('Error bulk importing peptides:', error);
    return c.json({ error: 'Failed to bulk import peptides' }, 500);
  }
});

// ========== EXCLUSIONS ROUTES ==========

app.get('/api/exclusions', authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const { results } = await db.prepare('SELECT pattern FROM exclusions ORDER BY pattern').all();
    return c.json(results.map(e => e.pattern));
  } catch (error) {
    console.error('Error fetching exclusions:', error);
    return c.json({ error: 'Failed to fetch exclusions' }, 500);
  }
});

app.post('/api/exclusions', authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const { pattern } = await c.req.json();

    await db.prepare('INSERT INTO exclusions (pattern) VALUES (?)').bind(pattern).run();

    return c.json({ message: 'Exclusion added successfully' }, 201);
  } catch (error) {
    console.error('Error adding exclusion:', error);
    if (error.message?.includes('UNIQUE')) {
      return c.json({ error: 'Exclusion already exists' }, 409);
    }
    return c.json({ error: 'Failed to add exclusion' }, 500);
  }
});

app.delete('/api/exclusions/:pattern', authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const pattern = decodeURIComponent(c.req.param('pattern'));

    const result = await db.prepare('DELETE FROM exclusions WHERE pattern = ?').bind(pattern).run();

    if (result.meta.changes === 0) {
      return c.json({ error: 'Exclusion not found' }, 404);
    }

    return c.json({ message: 'Exclusion deleted successfully' });
  } catch (error) {
    console.error('Error deleting exclusion:', error);
    return c.json({ error: 'Failed to delete exclusion' }, 500);
  }
});

app.post('/api/exclusions/bulk', authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const { patterns } = await c.req.json();

    // Delete all existing
    await db.prepare('DELETE FROM exclusions').run();

    // Insert new ones
    const statements = patterns.map(pattern =>
      db.prepare('INSERT INTO exclusions (pattern) VALUES (?)').bind(pattern)
    );

    await db.batch(statements);

    return c.json({ message: 'Exclusions updated successfully' });
  } catch (error) {
    console.error('Error updating exclusions:', error);
    return c.json({ error: 'Failed to update exclusions' }, 500);
  }
});

// ========== LABEL HISTORY ROUTES ==========

app.get('/api/label-history/:peptideId', authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const peptideId = c.req.param('peptideId');

    const { results } = await db.prepare(`
      SELECT * FROM label_history
      WHERE peptideId = ?
      ORDER BY timestamp DESC
    `).bind(peptideId).all();

    return c.json(results);
  } catch (error) {
    console.error('Error fetching label history:', error);
    return c.json({ error: 'Failed to fetch label history' }, 500);
  }
});

app.post('/api/label-history', authMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const { peptideId, quantity, action, notes } = await c.req.json();

    await db.prepare(`
      INSERT INTO label_history (peptideId, quantity, action, notes)
      VALUES (?, ?, ?, ?)
    `).bind(peptideId, quantity, action, notes || '').run();

    return c.json({ message: 'Label history entry added successfully' }, 201);
  } catch (error) {
    console.error('Error adding label history:', error);
    return c.json({ error: 'Failed to add label history entry' }, 500);
  }
});

// Export the app
export default app;
