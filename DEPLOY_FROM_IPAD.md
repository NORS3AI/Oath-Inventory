# Deploy Oath Inventory from iPad

Since you're on iPad, you need to deploy to the cloud. Here's how:

## 🚀 Option 1: Render.com (Recommended - FREE)

### Step 1: Push Code to GitHub
Your code is already on GitHub at: `NORS3AI/Oath-Inventory`

### Step 2: Deploy on Render.com

1. **Go to:** https://render.com
2. **Sign up/Login** with GitHub
3. **Click:** "New" → "Blueprint"
4. **Connect** your `NORS3AI/Oath-Inventory` repository
5. **Select branch:** `main` or `claude/oath-peptide-inventory-system-ztxv6`
6. **Render will detect** `render.yaml` and create 2 services:
   - Backend API (oath-inventory-api)
   - Frontend (oath-inventory-frontend)
7. **Click:** "Apply"
8. **Wait** 5-10 minutes for deployment

### Step 3: Access Your App

Once deployed, you'll get URLs like:
- **Frontend:** `https://oath-inventory-frontend.onrender.com`
- **Backend:** `https://oath-inventory-api.onrender.com`

**Access your inventory at the frontend URL!**

### Step 4: Login

- **Password:** `admin`
- **⚠️ Change immediately after login!**

---

## 🚀 Option 2: Railway.app (FREE Tier)

### Step 1: Deploy

1. **Go to:** https://railway.app
2. **Login** with GitHub
3. **Click:** "New Project" → "Deploy from GitHub repo"
4. **Select:** `NORS3AI/Oath-Inventory`
5. **Add services:**
   - Backend: Root directory = `backend`
   - Frontend: Root directory = `frontend`

### Step 2: Configure Backend

**Backend settings:**
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment Variables:**
  ```
  NODE_ENV=production
  JWT_SECRET=your-random-secret-here
  DEFAULT_PASSWORD=admin
  PORT=3001
  ```

### Step 3: Configure Frontend

**Frontend settings:**
- **Build Command:** `npm install && npm run build`
- **Start Command:** Leave empty (static site)
- **Environment Variables:**
  ```
  VITE_API_URL=https://YOUR-BACKEND-URL.railway.app/api
  ```

### Step 4: Access

Railway will give you a URL for your frontend.

---

## 🚀 Option 3: Fly.io (FREE Allowance)

### Step 1: Install Fly CLI (from computer)

Someone with a desktop/laptop needs to run:
```bash
curl -L https://fly.io/install.sh | sh
```

### Step 2: Deploy

```bash
cd /home/user/Oath-Inventory
fly launch
fly deploy
```

### Step 3: Access

Fly will give you a URL like: `https://oath-inventory.fly.dev`

---

## 📱 From Your iPad - What You Can Do

### Using Safari/Chrome on iPad:

1. **Access GitHub** on your iPad
2. **Go to Settings** → Pages
3. **Deploy** won't work for backend apps
4. **Instead:** Use Render or Railway (above)

### Render.com on iPad:

✅ Can sign up with GitHub
✅ Can connect repository
✅ Can deploy with one click
✅ Can access web dashboard
✅ Can view logs
✅ Can restart services
✅ Can update environment variables

### What You CANNOT Do on iPad:

❌ Run `npm start` locally
❌ Run Node.js backend
❌ Use `./start-dev.sh`
❌ Access `localhost:3001`

**You MUST use cloud hosting!**

---

## ⚡ Fastest Path (5 minutes)

1. Open Safari on iPad
2. Go to **https://render.com**
3. Sign in with GitHub
4. New → Blueprint
5. Select `NORS3AI/Oath-Inventory`
6. Click "Apply"
7. Wait for deployment
8. Open frontend URL
9. Login with `admin`

**Done!** You can now access your inventory from your iPad.

---

## 🔧 Troubleshooting

### Frontend can't connect to backend

**Check API URL:**
1. In Render dashboard, get backend URL
2. Should be: `https://oath-inventory-api.onrender.com`
3. Frontend must use this URL

**Fix in Render:**
- Frontend → Environment
- Add: `VITE_API_URL=https://oath-inventory-api.onrender.com/api`
- Redeploy frontend

### "This site can't be reached"

- Wait 2-3 minutes after deployment
- Render free tier may take longer
- Check deploy logs for errors

### Login not working

- Check backend is deployed and running
- Check backend health: `https://YOUR-BACKEND.onrender.com/api/health`
- Should return: `{"status":"ok","message":"Server is running"}`

### Database is empty

- First deployment starts with empty database
- Import your CSV through the UI
- Or restore from backup

---

## 💾 Backing Up Your Data

### Download from Render

Your database is at: `backend/data/inventory.db`

**To backup:**
1. Render dashboard → oath-inventory-api
2. Shell → Open shell
3. Run: `cat data/inventory.db | base64`
4. Copy output
5. Save to file on iPad
6. To restore: `echo "BASE64_DATA" | base64 -d > data/inventory.db`

**Or use CSV:**
- Export from UI → Import/Export tab
- Save CSV to iPad
- Import to new deployment

---

## 📞 Support

**If deployment fails:**
- Check Render/Railway logs
- Ensure GitHub repo is public or connected
- Verify `render.yaml` is in root directory
- Check that both `backend/` and `frontend/` folders exist

**Need help?**
Let me know which platform you chose and any error messages!

---

## ✅ After Successful Deployment

1. **Save your frontend URL** (bookmark it)
2. **Login** with `admin`
3. **Change password** immediately
4. **Import your inventory** CSV
5. **Start using** from your iPad!

Your inventory system is now accessible from anywhere! 🎉
