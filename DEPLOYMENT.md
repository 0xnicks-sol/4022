# Deployment Guide

## 🚀 Deploying Your x402 Payment Gateway

This app consists of two parts that need to be deployed separately:

### Part 1: Backend (Express Server)

The Express server in `server.js` needs to be deployed to a Node.js hosting service.

#### Option A: Deploy to Railway

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login and deploy:
   ```bash
   railway login
   railway init
   railway up
   ```

3. Add environment variable in Railway dashboard:
   ```
   WALLET_ADDRESS=0x1f0184dc26a675008383f6c4c50CE53fB0473645
   ```

4. Get your Railway URL (e.g., `https://your-app.railway.app`)

#### Option B: Deploy to Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Set build command: `npm install`
4. Set start command: `node server.js`
5. Add environment variable:
   ```
   WALLET_ADDRESS=0x1f0184dc26a675008383f6c4c50CE53fB0473645
   ```
6. Deploy and get your URL

#### Option C: Deploy to Heroku

1. Install Heroku CLI and login:
   ```bash
   heroku login
   heroku create your-app-name
   ```

2. Set environment variable:
   ```bash
   heroku config:set WALLET_ADDRESS=0x1f0184dc26a675008383f6c4c50CE53fB0473645
   ```

3. Deploy:
   ```bash
   git push heroku main
   ```

---

### Part 2: Frontend (Next.js App)

Deploy to Vercel (recommended for Next.js):

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. **IMPORTANT:** Add environment variable in Vercel dashboard:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.com
   ```
   Replace with your actual deployed backend URL from Part 1.

4. Redeploy after adding the environment variable:
   ```bash
   vercel --prod
   ```

---

## ⚙️ Configuration Steps

### 1. Update Backend CORS

After deploying the frontend, update `server.js` CORS origin:

```javascript
app.use(cors({
  origin: 'https://your-frontend-url.vercel.app', // Update this
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Transaction-Hash']
}));
```

Or allow multiple origins:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend-url.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Transaction-Hash']
}));
```

### 2. Environment Variables Summary

**Backend (.env):**
```
WALLET_ADDRESS=0x1f0184dc26a675008383f6c4c50CE53fB0473645
```

**Frontend (Vercel Environment Variables):**
```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

---

## 🧪 Testing Production

1. Open your Vercel URL: `https://your-app.vercel.app`
2. Connect Coinbase Wallet
3. Try the payment flow
4. Check browser console for any errors

---

## 🐛 Common Issues

### Error: `net::ERR_CONNECTION_REFUSED`
- **Cause:** Frontend trying to connect to `localhost:3001`
- **Fix:** Set `NEXT_PUBLIC_API_URL` in Vercel to your backend URL

### Error: CORS Policy Error
- **Cause:** Backend CORS not allowing your frontend domain
- **Fix:** Update `server.js` CORS origin to include your Vercel URL

### Error: Payment not working
- **Cause:** Wrong network or insufficient funds
- **Fix:** Ensure you're on Base Sepolia testnet with ETH

---

## 📝 Quick Deploy Commands

```bash
# Deploy backend to Railway
railway login
railway init
railway up

# Deploy frontend to Vercel
vercel

# Set frontend env var
# Go to Vercel Dashboard → Project → Settings → Environment Variables
# Add: NEXT_PUBLIC_API_URL = https://your-backend.railway.app
```

---

## 🔗 Resources

- [Railway Docs](https://docs.railway.app/)
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
