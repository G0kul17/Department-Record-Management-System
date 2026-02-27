# 🔧 Environment Setup Guide - DRMS

This guide walks you through setting up environment variables for **local development**, **staging**, and **production** deployments.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Backend Configuration](#backend-configuration)
3. [Frontend Configuration](#frontend-configuration)
4. [Environment-Specific Setup](#environment-specific-setup)
5. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### First Time Setup

#### Backend

```bash
cd backend

# Copy the example environment file
cp .env.example .env

# Edit .env with your actual credentials
# Use nano, vim, or your preferred editor
nano .env
```

**Required Changes:**

1. Set a strong `DB_PASS` (your PostgreSQL password)
2. Generate a secure `JWT_SECRET` (see instructions below)
3. Configure email credentials (`EMAIL_USER`, `EMAIL_PASS`)
4. Update `ADMIN_EMAILS` with your admin email(s)

#### Frontend

```bash
cd frontend

# Copy the example environment file
cp .env.example .env

# Edit if backend is not on localhost:5000
nano .env
```

**Default Frontend .env:**

```bash
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_ENV=development
VITE_DEBUG=false
```

---

## 🔐 Backend Configuration

### Environment Variables Explained

Create `backend/.env` from `backend/.env.example`:

#### 1. Database Configuration

```bash
# PostgreSQL connection details
DB_USER=postgres
DB_PASS=your_secure_password_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=drms_db
```

**Setup PostgreSQL:**

```bash
# Install PostgreSQL (if not already installed)
# Windows: Download from https://www.postgresql.org/download/
# Linux: sudo apt install postgresql
# Mac: brew install postgresql

# Create database
psql -U postgres -c "CREATE DATABASE drms_db;"

# Run migrations
psql -U postgres -d drms_db -f backend/migrations/001_initial_schema.sql
```

#### 2. JWT Secret Generation

**Generate a strong JWT secret:**

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output example (use this in your .env):
# a7f8e6d9c4b3a2e1f0d9c8b7a6e5f4d3c2b1a0e9d8c7b6a5f4e3d2c1b0a9e8d7

# Using OpenSSL
openssl rand -hex 32
```

**Add to .env:**

```bash
JWT_SECRET=a7f8e6d9c4b3a2e1f0d9c8b7a6e5f4d3c2b1a0e9d8c7b6a5f4e3d2c1b0a9e8d7
```

⚠️ **IMPORTANT:** Never use the default `replace_with_a_strong_secret`!

#### 3. Email Configuration

**Option A: Gmail with App Password**

1. Enable 2-Factor Authentication on your Google account
2. Generate App Password:
   - Visit: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password

```bash
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop  # Use the app password here
```

**Option B: Outlook/Office365**

```bash
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your_password_here
```

**Option C: Custom SMTP**

```bash
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587  # or 465 for SSL
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your_smtp_password
```

#### 4. Admin Configuration

```bash
# Comma-separated list of admin emails
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

#### 5. File Storage

```bash
FILE_STORAGE_PATH=./uploads
FILE_SIZE_LIMIT_MB=50
```

#### 6. CORS Configuration

```bash
# Development - multiple localhost ports
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173

# Production - specific domain only
# CORS_ORIGINS=https://your-production-domain.com
```

#### 7. Server Configuration

```bash
PORT=5000
NODE_ENV=development
```

### Complete Backend .env Example

```bash
# Database
DB_USER=postgres
DB_PASS=MySecurePassword123!
DB_HOST=localhost
DB_PORT=5432
DB_NAME=drms_db

# Email (Gmail example)
EMAIL_SERVICE=gmail
EMAIL_USER=myapp@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
ADMIN_EMAILS=admin@example.com

# JWT
JWT_SECRET=a7f8e6d9c4b3a2e1f0d9c8b7a6e5f4d3c2b1a0e9d8c7b6a5f4e3d2c1b0a9e8d7

# OTP
OTP_EXPIRY_MIN=5

# File Storage
FILE_STORAGE_PATH=./uploads
FILE_SIZE_LIMIT_MB=50

# Server
PORT=5000
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## ⚛️ Frontend Configuration

### Environment Variables

Create `frontend/.env`:

```bash
# API endpoint (backend URL)
VITE_API_BASE_URL=http://localhost:5000/api

# Application environment
VITE_APP_ENV=development

# Debug mode (console logs)
VITE_DEBUG=false
```

### Environment-Specific Configurations

#### Development (.env)

```bash
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_ENV=development
VITE_DEBUG=true  # Enable for debugging
```

#### Production (.env.production)

Create `frontend/.env.production`:

```bash
VITE_API_BASE_URL=https://api.your-domain.com/api
VITE_APP_ENV=production
VITE_DEBUG=false
```

**Build for production:**

```bash
npm run build -- --mode production
```

---

## 🌍 Environment-Specific Setup

### Development Environment

**Backend:**

```bash
cd backend
cp .env.example .env
# Edit .env with local database credentials
npm install
npm run dev
```

**Frontend:**

```bash
cd frontend
cp .env.example .env
# .env should point to http://localhost:5000/api
npm install
npm run dev
```

**Access:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

---

### Staging Environment

**Backend (.env):**

```bash
DB_HOST=staging-db.example.com
DB_NAME=drms_staging
NODE_ENV=staging
CORS_ORIGINS=https://staging.your-domain.com
```

**Frontend (.env.staging):**

```bash
VITE_API_BASE_URL=https://api-staging.your-domain.com/api
VITE_APP_ENV=staging
VITE_DEBUG=false
```

**Build:**

```bash
npm run build -- --mode staging
```

---

### Production Environment

**Backend:**

Use your hosting platform's environment variable system:

```bash
# Example for Railway/Render/Vercel
# Set these in the dashboard:

DB_USER=prod_user
DB_PASS=very_secure_production_password
DB_HOST=prod-db.example.com
DB_PORT=5432
DB_NAME=drms_production
JWT_SECRET=64_character_production_secret_here
EMAIL_HOST=smtp.production-mail.com
EMAIL_USER=noreply@your-domain.com
EMAIL_PASS=production_email_password
CORS_ORIGINS=https://your-production-domain.com
NODE_ENV=production
PORT=5000
```

**Frontend (.env.production):**

```bash
VITE_API_BASE_URL=https://api.your-production-domain.com/api
VITE_APP_ENV=production
VITE_DEBUG=false
```

**Build:**

```bash
npm run build
# Outputs to frontend/dist/
# Deploy dist/ folder to your hosting platform
```

---

## 🛠️ Troubleshooting

### Backend Issues

#### Database Connection Failed

**Error:** `Database connection failed: password authentication failed`

**Solution:**

```bash
# 1. Verify PostgreSQL is running
psql --version

# 2. Check credentials in .env match your PostgreSQL setup
DB_USER=postgres
DB_PASS=your_actual_password

# 3. Test connection manually
psql -U postgres -d drms_db -c "SELECT NOW();"
```

#### Email Not Sending

**Error:** `Failed to send email`

**Solution:**

```bash
# For Gmail:
# 1. Enable 2FA
# 2. Generate App Password (don't use regular password)
# 3. Use 'gmail' as EMAIL_SERVICE or proper SMTP settings

# For Outlook:
EMAIL_HOST=smtp-mail.outlook.com  # Not smtp.office365.com
EMAIL_PORT=587
```

#### CORS Errors

**Error:** `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution:**

```bash
# In backend/.env, add frontend URL to CORS_ORIGINS:
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Restart backend server after changing .env
```

#### JWT Secret Warning

**Warning:** `Using weak JWT secret`

**Solution:**

```bash
# Generate a strong secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env:
JWT_SECRET=<generated_secret_here>
```

---

### Frontend Issues

#### API Connection Failed

**Error:** `Failed to fetch` or `Network Error`

**Solution:**

```bash
# 1. Verify backend is running on http://localhost:5000
# 2. Check frontend/.env has correct API URL:
VITE_API_BASE_URL=http://localhost:5000/api

# 3. Restart frontend dev server after changing .env
npm run dev
```

#### Environment Variables Not Working

**Error:** Environment variables are `undefined`

**Solution:**

```bash
# 1. Vite requires variables to start with VITE_
VITE_API_BASE_URL=...  # ✅ Correct
API_BASE_URL=...       # ❌ Wrong

# 2. Restart dev server after creating/modifying .env
npm run dev

# 3. Check file is named exactly .env (not .env.txt)
```

---

## 🔄 Switching Environments

### Switch to Different Backend

**Frontend .env:**

```bash
# Local development
VITE_API_BASE_URL=http://localhost:5000/api

# Remote staging
VITE_API_BASE_URL=https://api-staging.example.com/api

# Production
VITE_API_BASE_URL=https://api.example.com/api
```

**Restart dev server after changing:**

```bash
npm run dev
```

---

## 📦 Deployment Platforms

### Heroku

```bash
# Set environment variables
heroku config:set DB_USER=postgres
heroku config:set DB_PASS=password
heroku config:set JWT_SECRET=your_secret

# View all config
heroku config
```

### Railway

1. Go to project settings
2. Navigate to "Variables" tab
3. Add each variable from .env.example
4. Deploy

### Vercel (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Set environment variables
vercel env add VITE_API_BASE_URL production
# Enter: https://api.your-domain.com/api

# Deploy
vercel --prod
```

### Render

1. Create Web Service
2. Go to "Environment" tab
3. Add environment variables
4. Deploy

---

## ✅ Verification

### Backend Health Check

```bash
# Start backend
cd backend
npm start

# Test endpoint
curl http://localhost:5000/
# Should return: {"message":"Auth RBAC OTP API"}

# Test with database
curl http://localhost:5000/api/auth/check
```

### Frontend Health Check

```bash
# Start frontend
cd frontend
npm run dev

# Open browser
# Navigate to: http://localhost:3000
# Should see login page
```

---

## 🔐 Security Reminders

- ✅ **NEVER** commit `.env` files
- ✅ **ALWAYS** use `.env.example` for documentation
- ✅ Use strong, unique passwords for each environment
- ✅ Rotate secrets regularly (every 90 days recommended)
- ✅ Use different credentials for dev/staging/production
- ✅ Enable 2FA and use app passwords for email
- ✅ Restrict database access to specific IPs in production

---

## 📚 Additional Resources

- [Backend .env.example](backend/.env.example) - Complete backend template
- [Frontend .env.example](frontend/.env.example) - Frontend template
- [SECURITY_GUIDELINES.md](SECURITY_GUIDELINES.md) - Security best practices
- [README.md](README.md) - Main project documentation

---

**Need Help?**

- Check [Troubleshooting](#troubleshooting) section above
- Review [SECURITY_GUIDELINES.md](SECURITY_GUIDELINES.md)
- Ensure all dependencies are installed (`npm install`)
- Verify PostgreSQL is running and accessible

---

**Last Updated:** February 24, 2026  
**Version:** 1.0.0
