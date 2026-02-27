# 🔒 CORS Handling Strategy - DRMS Deployment Guide

## Overview

This document explains the CORS (Cross-Origin Resource Sharing) strategy for the DRMS application across different environments. Proper CORS configuration is critical for both **security** and **functionality**.

---

## 🎯 Strategy Summary

### Development

- ✅ **CORS Enabled** (backend handles CORS)
- ✅ Frontend: `localhost:3000` or `localhost:5173`
- ✅ Backend: `localhost:5000`
- ✅ Direct browser → backend API calls

### Production (Recommended)

- 🔒 **CORS Disabled** (Nginx handles CORS)
- 🔒 Same-origin requests (frontend and backend on same domain)
- 🔒 Nginx proxies `/api` → backend
- 🔒 More secure, better performance

### Production (Alternative - PaaS deployment)

- ⚠️ **CORS Enabled** (only if no reverse proxy available)
- ⚠️ Strict origin validation
- ⚠️ Used on platforms like Heroku, Railway, Render

---

## 🔧 Configuration

### Development Setup

**Backend (.env):**

```bash
NODE_ENV=development
ENABLE_CORS=true
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
PORT=5000
```

**Frontend (.env):**

```bash
VITE_API_BASE_URL=http://localhost:5000/api
```

**How it works:**

```
Browser (localhost:3000)
    ↓
    → Direct HTTP request to http://localhost:5000/api
    → Backend responds with CORS headers
    → Browser allows the response
```

---

### Production Setup (with Nginx) - RECOMMENDED ✅

**Backend (.env):**

```bash
NODE_ENV=production
ENABLE_CORS=false  # ← IMPORTANT: Disable backend CORS
PORT=5000
CORS_ORIGINS=      # Not used when CORS disabled
```

**Frontend (.env.production):**

```bash
VITE_API_BASE_URL=/api  # ← Same origin, no full URL needed
```

**Nginx Configuration:**
See [nginx.conf.example](nginx.conf.example) for complete setup.

**Key Points:**

```nginx
# Nginx serves both frontend and proxies /api to backend
location /api/ {
    proxy_pass http://localhost:5000;

    # Nginx adds CORS headers
    add_header Access-Control-Allow-Origin "https://your-domain.com" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, x-session-token" always;
}

location / {
    # Serve frontend static files
    root /var/www/drms/frontend/dist;
    try_files $uri $uri/ /index.html;
}
```

**How it works:**

```
Browser (https://your-domain.com)
    ↓
    → GET /api/users → Nginx
                         ↓
                         → Proxy to localhost:5000/api/users
                         → Backend responds (no CORS needed - same origin)
                         ↓
    ← Response (Nginx adds CORS headers if needed)
```

---

### Production Setup (without Nginx) - PaaS Platforms

For **Heroku, Railway, Render, Vercel** (backend), etc.

**Backend (.env):**

```bash
NODE_ENV=production
ENABLE_CORS=true  # ← Backend must handle CORS
PORT=5000
CORS_ORIGINS=https://your-app.example.com  # ← STRICT: Only your domain
```

**Frontend (.env.production):**

```bash
VITE_API_BASE_URL=https://api.your-app.example.com/api
```

**Security Note:**

- ⚠️ Only use this if you cannot use a reverse proxy
- ⚠️ Never use `CORS_ORIGINS=*` in production
- ⚠️ Always specify exact domain(s)

---

## 📋 Deployment Scenarios

### Scenario 1: VPS with Nginx (Ubuntu/Debian) ✅ RECOMMENDED

**1. Install Nginx:**

```bash
sudo apt update
sudo apt install nginx
```

**2. Configure Nginx:**

```bash
# Copy template
sudo cp nginx.conf.example /etc/nginx/sites-available/drms

# Edit configuration
sudo nano /etc/nginx/sites-available/drms
# Update: server_name, SSL paths, upstream port

# Enable site
sudo ln -s /etc/nginx/sites-available/drms /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

**3. Configure Backend:**

```bash
cd /var/www/drms/backend
nano .env
```

```bash
NODE_ENV=production
ENABLE_CORS=false  # ← Key: Let Nginx handle CORS
PORT=5000
```

**4. Deploy Frontend:**

```bash
cd /var/www/drms/frontend
npm run build
# Build output goes to dist/
# Nginx serves from /var/www/drms/frontend/dist
```

**5. Start Backend:**

```bash
# Using PM2
pm2 start backend/src/server.js --name drms-backend
pm2 save
pm2 startup
```

---

### Scenario 2: Heroku Deployment

**Backend Configuration:**

```bash
# Set environment variables in Heroku dashboard or CLI
heroku config:set NODE_ENV=production
heroku config:set ENABLE_CORS=true
heroku config:set CORS_ORIGINS=https://your-frontend.herokuapp.com
heroku config:set JWT_SECRET=<your-secret>
heroku config:set DB_USER=<db-user>
# ... other variables
```

**Frontend Configuration:**

`.env.production`:

```bash
VITE_API_BASE_URL=https://your-backend.herokuapp.com/api
```

Deploy:

```bash
# Frontend
npm run build
# Deploy dist/ to Heroku or static host (Netlify, Vercel)

# Backend
git push heroku main
```

---

### Scenario 3: Railway Deployment

**Backend:**

1. Connect GitHub repository
2. Set environment variables in Railway dashboard:
   ```
   NODE_ENV=production
   ENABLE_CORS=true
   CORS_ORIGINS=https://your-frontend.railway.app
   JWT_SECRET=<generate-new>
   ```

**Frontend:**

1. Build with production env:
   ```bash
   VITE_API_BASE_URL=https://your-backend.railway.app/api npm run build
   ```
2. Deploy dist/ to Railway or static hosting

---

### Scenario 4: Docker with Nginx

**docker-compose.yml:**

```yaml
version: "3.8"

services:
  # Backend
  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
      - ENABLE_CORS=false # Nginx handles it
      - PORT=5000
      - DB_HOST=postgres
      - DB_USER=${DB_USER}
      - DB_PASS=${DB_PASS}
      - JWT_SECRET=${JWT_SECRET}
    networks:
      - app-network
    depends_on:
      - postgres

  # Nginx
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
    ports:
      - "80:80"
      - "443:443"
    networks:
      - app-network
    depends_on:
      - backend

  # Database
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASS}
      - POSTGRES_DB=drms_db
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:
```

---

## 🧪 Testing CORS Configuration

### Test 1: Development CORS

```bash
# Start backend
cd backend
npm run dev

# In another terminal, test CORS
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:5000/api/auth/login

# Should return CORS headers:
# Access-Control-Allow-Origin: http://localhost:3000
# Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

### Test 2: Production CORS (Nginx)

```bash
# Test from browser console at https://your-domain.com
fetch('/api/users', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error)

# Should work without CORS errors
# Response comes from same origin (Nginx proxy)
```

### Test 3: Check CORS is Disabled in Backend

```bash
# In backend logs, you should see:
# 🔒 CORS disabled - expecting reverse proxy (Nginx/Apache) to handle /api routing

# NOT:
# 🔓 CORS enabled for origins: ...
```

---

## 🚨 Common Issues & Solutions

### Issue 1: CORS Error in Production

**Error:**

```
Access to fetch at 'https://api.example.com/api/users' from origin 'https://example.com'
has been blocked by CORS policy
```

**Causes:**

1. Backend has `ENABLE_CORS=false` but Nginx not configured
2. Nginx CORS headers not set correctly
3. Frontend making requests to wrong API URL

**Solutions:**

**Check 1: Backend Configuration**

```bash
# Should be ONE of these:

# Option A: Nginx handles CORS
ENABLE_CORS=false

# Option B: Backend handles CORS
ENABLE_CORS=true
CORS_ORIGINS=https://example.com
```

**Check 2: Nginx Configuration**

```nginx
location /api/ {
    # These headers MUST be present
    add_header Access-Control-Allow-Origin "https://example.com" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, x-session-token" always;

    proxy_pass http://localhost:5000;
    proxy_set_header Host $host;
}
```

**Check 3: Frontend API URL**

```bash
# .env.production should be:
VITE_API_BASE_URL=/api  # Same origin

# OR if using subdomain:
VITE_API_BASE_URL=https://api.example.com/api
```

---

### Issue 2: Preflight OPTIONS Request Failing

**Error:**

```
Response to preflight request doesn't pass access control check
```

**Solution:**

**In Nginx:**

```nginx
location /api/ {
    # Handle OPTIONS requests
    if ($request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin "https://example.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, x-session-token" always;
        add_header Access-Control-Max-Age 3600 always;
        add_header Content-Length 0;
        add_header Content-Type text/plain;
        return 204;
    }

    # Regular requests
    proxy_pass http://localhost:5000;
}
```

---

### Issue 3: Backend Logs Show CORS Enabled in Production

**Problem:** Backend logs show:

```
🔓 CORS enabled for origins: ...
```

**Solution:**

```bash
# Update .env
ENABLE_CORS=false

# Restart backend
pm2 restart drms-backend

# Verify logs now show:
# 🔒 CORS disabled - expecting reverse proxy...
```

---

### Issue 4: Nginx Not Proxying API Requests

**Problem:** 404 for /api/\* requests

**Check Nginx Configuration:**

```bash
# Test Nginx config
sudo nginx -t

# Check if location /api/ exists
sudo cat /etc/nginx/sites-enabled/drms | grep -A 10 "location /api/"

# Check Nginx is running
sudo systemctl status nginx

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

**Solutions:**

```bash
# Reload Nginx after config changes
sudo systemctl reload nginx

# Restart if needed
sudo systemctl restart nginx

# Check backend is reachable from Nginx
curl http://localhost:5000/api/
```

---

## 🔐 Security Best Practices

### DO ✅

1. **Use Nginx in Production**
   - More secure than backend CORS
   - Better performance
   - Centralized security headers

2. **Disable Backend CORS with Nginx**

   ```bash
   ENABLE_CORS=false
   ```

3. **Specific Origins Only**

   ```bash
   # If backend handles CORS
   CORS_ORIGINS=https://your-domain.com

   # NOT
   CORS_ORIGINS=*
   ```

4. **Use HTTPS in Production**
   - SSL/TLS for all requests
   - Nginx handles SSL termination

5. **Rate Limiting**
   ```nginx
   limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
   limit_req zone=api_limit burst=20 nodelay;
   ```

### DON'T ❌

1. **Never Use Wildcard in Production**

   ```bash
   # ❌ DANGEROUS
   CORS_ORIGINS=*
   ```

2. **Don't Enable CORS if Using Nginx**

   ```bash
   # ❌ WRONG
   ENABLE_CORS=true  # with Nginx
   ```

3. **Don't Skip OPTIONS Handling**
   - Always handle preflight requests in Nginx

4. **Don't Expose Backend Port Publicly**
   - Backend should only listen on localhost
   - Nginx handles external requests

---

## 📊 CORS Decision Matrix

| Environment              | Setup  | ENABLE_CORS | CORS_ORIGINS                    | Frontend URL          | Backend URL          |
| ------------------------ | ------ | ----------- | ------------------------------- | --------------------- | -------------------- |
| **Development**          | Direct | `true`      | `localhost:3000,localhost:5173` | `localhost:3000`      | `localhost:5000/api` |
| **Staging (Nginx)**      | Nginx  | `false`     | -                               | `staging.example.com` | Same origin `/api`   |
| **Production (Nginx)**   | Nginx  | `false`     | -                               | `example.com`         | Same origin `/api`   |
| **Production (Heroku)**  | Direct | `true`      | `https://app.example.com`       | `app.example.com`     | `api.example.com`    |
| **Production (Railway)** | Direct | `true`      | `https://app.railway.app`       | `app.railway.app`     | `api.railway.app`    |

---

## 📚 Additional Resources

- **Nginx Config Template:** [nginx.conf.example](nginx.conf.example)
- **Environment Setup:** [ENV_SETUP.md](ENV_SETUP.md)
- **Security Guidelines:** [SECURITY_GUIDELINES.md](SECURITY_GUIDELINES.md)
- **Backend .env Template:** [backend/.env.example](backend/.env.example)

---

## ✅ Deployment Checklist

### Before Deployment

- [ ] Choose deployment strategy (Nginx vs PaaS)
- [ ] Set `ENABLE_CORS` correctly for your strategy
- [ ] Configure `CORS_ORIGINS` if CORS enabled
- [ ] Test CORS in staging environment
- [ ] Review Nginx configuration
- [ ] Enable HTTPS/SSL
- [ ] Set up rate limiting
- [ ] Configure security headers

### After Deployment

- [ ] Verify no CORS errors in browser console
- [ ] Test all API endpoints
- [ ] Check backend logs for CORS status
- [ ] Verify Nginx is proxying correctly
- [ ] Test file uploads
- [ ] Test with different browsers
- [ ] Monitor for CORS-related errors

---

**Last Updated:** February 24, 2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
