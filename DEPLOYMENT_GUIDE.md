# SmartKhata Deployment Guide

This guide will help you deploy SmartKhata to production with all data saved in MongoDB Atlas.

## Prerequisites
- GitHub account
- MongoDB Atlas account (free tier)
- Render account (free tier)
- Vercel account (free tier)

---

## Step 1: Set up MongoDB Atlas (Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up and create a free account
3. Create a new cluster:
   - Click "Build a Database"
   - Select "M0 Sandbox" (free)
   - Choose a region closest to you
   - Cluster name: `smartkhata-cluster`
4. Create database user:
   - Go to Database Access → Add New Database User
   - Username: `smartkhata`
   - Password: (generate a strong password)
   - Save the password!
5. Whitelist IP addresses:
   - Go to Network Access → Add IP Address
   - Select "Allow Access from Anywhere" (0.0.0.0/0)
6. Get connection string:
   - Click "Connect" → "Connect your application"
   - Select Node.js version 4.1 or later
   - Copy the connection string

**Connection string format:**
```
mongodb+srv://smartkhata:PASSWORD@smartkhata-cluster.xxxxx.mongodb.net/smartkhata?retryWrites=true&w=majority
```

---

## Step 2: Deploy Backend to Render

1. Push your code to GitHub:
   ```bash
   cd d:/project_2
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/smartkhata.git
   git push -u origin main
   ```

2. Go to [Render](https://render.com)
3. Sign up and create a new account
4. Click "New" → "Web Service"
5. Connect your GitHub repository
6. Configure the service:
   - Name: `smartkhata-backend`
   - Region: Singapore (or closest to you)
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `node server.js`
7. Add Environment Variables:
   - `PORT`: `5000`
   - `MONGODB_URI`: (your MongoDB Atlas connection string)
   - `SESSION_SECRET`: (generate a random string - use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: (will be filled after frontend deployment)
8. Click "Create Web Service"
9. Wait for deployment to complete
10. Copy the backend URL (e.g., `https://smartkhata-backend.onrender.com`)

---

## Step 3: Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com)
2. Sign up and create a new account
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Configure the project:
   - Framework Preset: Create React App
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`
6. Add Environment Variables:
   - `REACT_APP_API_URL`: `https://smartkhata-backend.onrender.com/api` (replace with your actual backend URL)
7. Click "Deploy"
8. Wait for deployment to complete
9. Copy the frontend URL (e.g., `https://smartkhata.vercel.app`)

---

## Step 4: Update Backend CORS

After getting the frontend URL, update the backend:

1. Go to Render dashboard → smartkhata-backend
2. Edit Environment Variables
3. Update `FRONTEND_URL` to your Vercel URL
4. Save and redeploy

---

## Step 5: Test the Deployment

1. Open your Vercel URL in browser
2. Try logging in with a new phone number
3. Check if data is being saved in MongoDB Atlas
4. Test all features:
   - Add customer
   - Add transaction
   - View dashboard
   - Check reminders

---

## Important Notes

### MongoDB Atlas Free Tier Limits
- 512 MB storage
- Shared RAM
- Good for development and small production use

### Render Free Tier Limits
- Spins down after 15 minutes of inactivity
- Takes ~30 seconds to wake up
- Good for development and small apps

### Vercel Free Tier
- Always online
- Fast CDN
- SSL certificate included
- Custom domain support

### Twilio (SMS Reminders)
If you want SMS reminders to work in production:
1. Get a Twilio account
2. Add these environment variables to Render:
   - `TWILIO_ACCOUNT_SID`: your Twilio SID
   - `TWILIO_AUTH_TOKEN`: your Twilio token
   - `TWILIO_PHONE_NUMBER`: your Twilio phone number

---

## Troubleshooting

### Backend not connecting to MongoDB
- Check MongoDB Atlas connection string
- Ensure IP whitelist includes 0.0.0.0/0
- Verify database user credentials

### Frontend not connecting to backend
- Check REACT_APP_API_URL in Vercel
- Verify CORS settings in backend
- Check backend is running on Render

### Session issues
- Ensure SESSION_SECRET is set in Render
- Check cookie settings in backend
- Verify NODE_ENV is set to production

---

## Custom Domain (Optional)

### For Vercel (Frontend)
1. Go to Vercel project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### For Render (Backend)
1. Go to Render service → Settings → Custom Domains
2. Add your custom domain
3. Update DNS records as instructed

---

## Backup Strategy

### MongoDB Atlas Backup
- Atlas automatically takes snapshots
- Configure backup policy in Atlas dashboard

### Code Backup
- Code is stored in GitHub
- Always push changes to main branch

---

## Monitoring

### Render Dashboard
- View logs
- Monitor CPU/memory usage
- Check deployment status

### MongoDB Atlas Dashboard
- View database metrics
- Monitor connection count
- Check storage usage

---

## Cost Summary (Free Tier)

| Service | Cost | Features |
|---------|------|----------|
| MongoDB Atlas | Free | 512MB storage |
| Render | Free | Web service with sleep |
| Vercel | Free | Hosting + CDN |
| GitHub | Free | Code repository |
| **Total** | **$0/month** | Full deployment |

---

## Next Steps

1. Follow the steps above to deploy
2. Test thoroughly
3. Share the Vercel URL with users
4. Monitor usage in dashboards
5. Upgrade tiers if needed for production

---

## Support

If you encounter issues:
- Check Render logs
- Check MongoDB Atlas logs
- Check browser console for frontend errors
- Review environment variables
