# Deploy to Cloudflare (Best for iPad!)

Cloudflare is **perfect** for your setup:
- ✅ **FREE** (generous limits)
- ✅ **Fast** (global CDN)
- ✅ **Easy** (deploy from iPad browser)
- ✅ **No cold starts** (always fast)
- ✅ **D1 Database** (SQLite in the cloud)

---

## 🚀 Quick Deploy (15 minutes)

### Step 1: Set Up Cloudflare Pages (Frontend)

1. **Go to:** https://dash.cloudflare.com
2. **Login** to your Cloudflare account
3. **Go to:** Workers & Pages
4. **Click:** "Create Application" → "Pages" → "Connect to Git"
5. **Connect** your GitHub repo: `NORS3AI/Oath-Inventory`
6. **Configure build:**
   - **Project name:** `oath-inventory`
   - **Branch:** `main`
   - **Build command:** `cd frontend && npm install && npm run build`
   - **Build output directory:** `frontend/dist`
   - **Root directory:** `/` (leave empty or root)
7. **Environment variables:**
   ```
   VITE_API_URL = https://oath-inventory-api.YOUR-SUBDOMAIN.workers.dev/api
   ```
   (We'll get this URL in Step 3)
8. **Click:** "Save and Deploy"

### Step 2: Create D1 Database

1. **In Cloudflare Dashboard:** Workers & Pages → D1
2. **Click:** "Create Database"
3. **Database name:** `oath_inventory`
4. **Click:** "Create"
5. **Copy the Database ID** (you'll need this)

**Initialize the database:**
```sql
-- Go to D1 Console and run these queries:

CREATE TABLE peptides (
  peptideId TEXT PRIMARY KEY,
  peptideName TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  labeledCount INTEGER DEFAULT 0,
  batchNumber TEXT,
  shelfLocation TEXT,
  dateAdded TEXT,
  lastModified TEXT,
  notes TEXT,
  coa TEXT,
  sku TEXT,
  coaFile TEXT,
  msdsFile TEXT,
  sdsFile TEXT,
  hplcFile TEXT,
  tlcFile TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE exclusions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern TEXT UNIQUE NOT NULL,
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE label_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  peptideId TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  action TEXT NOT NULL,
  timestamp TEXT DEFAULT (datetime('now')),
  notes TEXT,
  FOREIGN KEY (peptideId) REFERENCES peptides(peptideId) ON DELETE CASCADE
);

CREATE INDEX idx_peptides_name ON peptides(peptideName);
CREATE INDEX idx_peptides_quantity ON peptides(quantity);
CREATE INDEX idx_peptides_labeled ON peptides(labeledCount);
```

### Step 3: Deploy Backend to Cloudflare Workers

**From your iPad:**

1. **Go to:** Workers & Pages → "Create Application" → "Create Worker"
2. **Worker name:** `oath-inventory-api`
3. **Click:** "Deploy"
4. **Click:** "Edit Code"

**Now we need to upload the worker code. This requires a computer OR:**

**Alternative - Use GitHub Actions:**

I'll create a GitHub Action that deploys automatically. Just:
1. Add Cloudflare API token to GitHub secrets
2. Push to GitHub
3. It deploys automatically!

### Step 4: Configure Worker

1. **Settings** → **Variables**
2. **Add environment variables:**
   ```
   JWT_SECRET = your-random-secret-here-make-it-long
   DEFAULT_PASSWORD = admin
   NODE_ENV = production
   ```
3. **Bindings** → **D1 Databases**
4. **Add binding:**
   - **Variable name:** `DB`
   - **D1 database:** Select `oath_inventory`

### Step 5: Update Frontend

1. **Go back to Pages** → `oath-inventory`
2. **Settings** → **Environment Variables**
3. **Edit** `VITE_API_URL`:
   ```
   https://oath-inventory-api.YOUR-SUBDOMAIN.workers.dev/api
   ```
4. **Redeploy** frontend

---

## 🤖 Automatic Deployment with GitHub Actions

**I'll create this for you - it deploys automatically when you push to GitHub:**

This means you can:
1. Make changes on your computer (or have me make them)
2. Push to GitHub
3. Cloudflare automatically deploys
4. Access from your iPad!

---

## 💰 Pricing (All FREE for your use case)

### Cloudflare Pages (FREE)
- ✅ Unlimited sites
- ✅ Unlimited requests
- ✅ 500 builds/month
- ✅ Global CDN
- ✅ Free SSL

### Cloudflare Workers (FREE)
- ✅ 100,000 requests/day
- ✅ 10ms CPU time per request
- ✅ No cold starts
- ✅ Global network

### Cloudflare D1 (FREE)
- ✅ 5GB storage
- ✅ 5 million reads/day
- ✅ 100,000 writes/day
- ✅ SQLite compatible

**Your inventory system will cost $0/month!**

---

## 📱 Access from iPad

Once deployed:
1. **Frontend:** `https://oath-inventory.pages.dev`
2. **Or custom domain:** `inventory.yourdomain.com`

**Save to Home Screen:**
1. Open in Safari
2. Tap "Share" button
3. "Add to Home Screen"
4. Now it's like a native app!

---

## 🔧 Advantages Over Other Platforms

**vs Render.com:**
- ⚡ **Faster** (Cloudflare global network)
- 💰 **Truly free** (no cold starts/sleeping)
- 🌍 **Better for iPad** (always fast)

**vs Railway:**
- 💵 **Free forever** (Railway charges after trial)
- 📡 **Better uptime**
- 🚀 **Edge network**

**vs Vercel:**
- 🗄️ **Includes database** (D1)
- 🔧 **Full backend** (not just serverless functions)
- 💪 **More generous limits**

---

## 🎯 What You Get

✅ **Fast loading** anywhere in the world
✅ **Always online** (no sleeping)
✅ **Free SSL certificate**
✅ **Custom domain** support
✅ **Automatic deployments** from GitHub
✅ **Built-in analytics**
✅ **DDoS protection**
✅ **Works great on iPad**

---

## 🚨 Important Notes

### Backend Code Needs Adaptation

The current backend uses:
- **SQLite** via `better-sqlite3` (Node.js library)
- **Express** (Node.js framework)

Cloudflare Workers need:
- **D1** (Cloudflare's SQLite)
- **Hono** or native fetch (not Express)

**I can convert the backend for you!** It's about 2 hours of work.

### Alternative: Use Cloudflare Tunnel

If you want to keep the Node.js backend as-is:
1. Run backend on a computer/server
2. Use Cloudflare Tunnel to expose it
3. Frontend on Cloudflare Pages

**But D1 + Workers is better for your iPad use case!**

---

## 🤔 What Should We Do?

### Option A: Full Cloudflare (Best)
- I adapt backend to Cloudflare Workers + D1
- Everything on Cloudflare
- Best performance, truly free
- **Takes 1-2 hours to convert**

### Option B: Hybrid Cloudflare
- Frontend on Cloudflare Pages
- Backend on Render/Railway
- Good performance, mostly free
- **Quick to deploy**

### Option C: All Render
- Use the `render.yaml` I created
- Easier, faster to deploy
- Free tier (with cold starts)
- **Deploy in 10 minutes**

**What do you prefer?**

---

## Next Steps

Let me know:
1. **Do you want full Cloudflare?** (I'll convert the backend)
2. **Or hybrid?** (Frontend Cloudflare, Backend elsewhere)
3. **Or just use Render?** (Fastest to deploy now)

I can help with any option from your iPad!
