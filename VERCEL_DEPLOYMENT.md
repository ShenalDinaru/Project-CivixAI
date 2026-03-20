# Vercel Deployment Guide - CivixAI

## Prerequisites
- Vercel account (free at https://vercel.com)
- GitHub repository with your code
- All environment variables ready

## Step 1: Prepare for Deployment

1. **Ensure environment files are NOT committed** - Add to `.gitignore`:
   ```
   .env
   .env.local
   .env.*.local
   node_modules/
   ```

2. **Commit your code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

## Step 2: Deploy to Vercel

### Option A: Using Vercel Dashboard (Recommended for first-time)

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Select **"CivixAI"** folder as project root
5. Configure environment variables:
   - Click **"Environment Variables"**
   - Add each variable from `.env.example` files:
     - `FIREBASE_PROJECT_ID`
     - `FIREBASE_PRIVATE_KEY`
     - `FIREBASE_CLIENT_EMAIL`
     - `OPENROUTER_API_KEY`
     - `CHATBOT_SCANNER_URL` (set to your Vercel deployment URL after first deploy)
   - Set `NODE_ENV=production` for ChatBotScanner
6. Click **"Deploy"**

### Option B: Using Vercel CLI (Recommended for CI/CD)

```bash
# Login to Vercel
vercel login

# Deploy (sets up for first time)
vercel --prod

# Follow prompts:
# - Set project name
# - Confirm vercel.json is used
# - Add environment variables through CLI or dashboard
```

## Step 3: Configure Environment Variables in Vercel

After initial deployment, go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

Add these variables:

**Backend variables:**
- `PORT=5000`
- `FIREBASE_PROJECT_ID=xxx`
- `FIREBASE_PRIVATE_KEY=xxx`
- `FIREBASE_CLIENT_EMAIL=xxx`
- `CHATBOT_SCANNER_URL=https://your-project.vercel.app`

**ChatBotScanner variables:**
- `PORT=3000`
- `OPENROUTER_API_KEY=xxx`
- `FIREBASE_PROJECT_ID=xxx`
- `FIREBASE_PRIVATE_KEY=xxx`
- `FIREBASE_CLIENT_EMAIL=xxx`
- `NODE_ENV=production`

## Step 4: Update Frontend Configuration

After your first deployment, update these files with your Vercel URL:

1. In `backend/server.js`, the config endpoint uses `CHATBOT_SCANNER_URL` env var - ✅ Already configured
2. Any hardcoded URLs should point to `https://your-project.vercel.app`

## Step 5: Test Deployment

Once deployed, test these endpoints:

```bash
# Health check
curl https://your-project.vercel.app/api/health

# Check config
curl https://your-project.vercel.app/config.js

# Login page
https://your-project.vercel.app/LoginPG.html
```

## Troubleshooting

### Issue: "Cannot find module" on Vercel
- **Solution**: Make sure `package.json` exists in both `backend/` and `ChatBotScanner/` (✅ Already exists)

### Issue: Environment variables not loaded
- **Solution**: Go to Vercel Dashboard → Project Settings → Environment Variables
- Ensure variables are added for correct project name
- Redeploy after adding variables

### Issue: CORS errors between backend and ChatBotScanner
- **Solution**: Both are deployed on same domain, should work automatically
- If issues persist, update CORS in both servers to accept vercel.app domain

### Issue: Static files not loading (CSS/JS not found)
- **Solution**: Verify `backend/server.js` serves `/public` and `/Resources` folders
- Check Vercel logs: `vercel logs --prod`

### Issue: Firebase auth failing
- **Solution**: Ensure Firebase credentials are correct
- Check Firebase console → Project Settings → Service Account
- Private key must be properly escaped in env var (usually handled by Vercel dashboard)

## Redeployment

To redeploy after code changes:

```bash
# Using dashboard
- Push to main/master branch (auto-deploys)

# Using CLI
vercel --prod
```

## Local Testing Before Deployment

Test your deployment locally first:

```bash
# Build locally using vercel
vercel build

# Run production build
vercel start
```

## Useful Vercel Commands

```bash
# View deployment logs
vercel logs --prod

# Check environment
vercel env ls

# Pull environment variables locally
vercel env pull

# View project info
vercel info
```

## Additional Resources

- [Vercel Node.js Documentation](https://vercel.com/docs/functions/runtimes/node-js)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Manage Deployments](https://vercel.com/docs/deployments/overview)
