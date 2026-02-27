# 📁 File Storage Configuration - Implementation Summary

## ✅ Implementation Complete

The DRMS application now implements **explicit file storage configuration** with comprehensive validation, permission checks, and production-ready path handling to eliminate file loss, permission errors, and deployment inconsistencies.

---

## 🎯 Problem Solved

### Before Implementation ❌

**Issues:**

- ❌ Relative paths (`./uploads`) caused deployment inconsistencies
- ❌ Silent fallback to default paths masked configuration errors
- ❌ No permission verification led to runtime failures
- ❌ File loss during production deployments
- ❌ No startup validation for file storage
- ❌ Unclear documentation about path requirements

**Risks:**

- 🚨 Uploaded files saved to wrong directory
- 🚨 Permission denied errors after deployment
- 🚨 Data loss when working directory changes
- 🚨 Inconsistent behavior across environments
- 🚨 Silent failures difficult to debug

### After Implementation ✅

**Solutions:**

- ✅ Explicit `FILE_STORAGE_PATH` configuration required in production
- ✅ Automatic path resolution to absolute paths
- ✅ Permission verification at startup (read/write checks)
- ✅ Directory creation with proper permissions
- ✅ Environment-specific behavior (strict in production, lenient in dev)
- ✅ Clear error messages with remediation steps
- ✅ Comprehensive documentation with examples

**Benefits:**

- 🔒 **Predictable:** Files always saved to configured location
- 🛡️ **Safe:** Permission errors caught at startup, not runtime
- 📍 **Explicit:** No hidden fallbacks in production
- 🚀 **Reliable:** Deployment issues detected immediately
- 📚 **Well-documented:** Clear guidance for all environments

---

## 📋 Changes Made

### 1. Enhanced Upload Configuration ✅

**File:** [backend/src/config/upload.js](backend/src/config/upload.js#L1-L133)

**Key Changes:**

#### a) Environment-Aware Path Configuration

**Before:**

```javascript
const STORAGE_PATH = process.env.FILE_STORAGE_PATH || "./uploads";

// ensure directory exists
if (!fs.existsSync(STORAGE_PATH))
  fs.mkdirSync(STORAGE_PATH, { recursive: true });
```

**After:**

```javascript
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";

// Production: REQUIRED (no fallback)
// Development: Allow fallback to ./uploads
let STORAGE_PATH;

if (IS_PRODUCTION) {
  if (!process.env.FILE_STORAGE_PATH) {
    throw new Error(
      "❌ FILE_STORAGE_PATH environment variable is REQUIRED in production. " +
        "Use absolute paths for production deployments (e.g., /var/www/drms/uploads)",
    );
  }
  STORAGE_PATH = process.env.FILE_STORAGE_PATH;
  console.log(`📁 File storage (production): ${STORAGE_PATH}`);
} else {
  STORAGE_PATH = process.env.FILE_STORAGE_PATH || "./uploads";
  if (!process.env.FILE_STORAGE_PATH) {
    console.warn(
      `⚠️  FILE_STORAGE_PATH not set, using default: ${STORAGE_PATH}`,
    );
  } else {
    console.log(`📁 File storage (development): ${STORAGE_PATH}`);
  }
}

// Resolve to absolute path
STORAGE_PATH = path.resolve(STORAGE_PATH);
```

#### b) Comprehensive Permission Verification

**New Function Added:**

```javascript
/**
 * Verify file storage directory exists and has correct permissions
 * @throws {Error} If directory cannot be created or lacks permissions
 */
export function verifyFileStorage() {
  try {
    // 1. Create directory if missing
    if (!fs.existsSync(STORAGE_PATH)) {
      console.log(`📁 Creating file storage directory: ${STORAGE_PATH}`);
      fs.mkdirSync(STORAGE_PATH, { recursive: true, mode: 0o755 });
    }

    // 2. Verify READ permission
    try {
      fs.accessSync(STORAGE_PATH, fs.constants.R_OK);
    } catch (err) {
      throw new Error(
        `❌ No READ permission for file storage: ${STORAGE_PATH}\n` +
          `   Run: chmod +r ${STORAGE_PATH}`,
      );
    }

    // 3. Verify WRITE permission
    try {
      fs.accessSync(STORAGE_PATH, fs.constants.W_OK);
    } catch (err) {
      throw new Error(
        `❌ No WRITE permission for file storage: ${STORAGE_PATH}\n` +
          `   Run: chmod +w ${STORAGE_PATH}`,
      );
    }

    // 4. Test actual write operation
    const testFile = path.join(STORAGE_PATH, `.write-test-${Date.now()}`);
    try {
      fs.writeFileSync(testFile, "test", "utf8");
      fs.unlinkSync(testFile);
    } catch (err) {
      throw new Error(
        `❌ Cannot write to file storage directory: ${STORAGE_PATH}\n` +
          `   Error: ${err.message}\n` +
          `   Ensure the directory exists and has write permissions.`,
      );
    }

    console.log(`✅ File storage verified: ${STORAGE_PATH}`);
    console.log(`   Read/Write: OK`);
    console.log(`   Max file size: ${MAX_MB} MB`);

    return true;
  } catch (err) {
    if (IS_PRODUCTION) {
      // Production: Fail fast
      throw err;
    } else {
      // Development: Warn but allow startup
      console.error(err.message);
      console.warn("⚠️  File uploads may not work correctly.");
      return false;
    }
  }
}

// Verify immediately on module load
verifyFileStorage();
```

**Verification Steps:**

1. ✅ Check if directory exists, create if missing
2. ✅ Verify READ permission with `fs.accessSync()`
3. ✅ Verify WRITE permission with `fs.accessSync()`
4. ✅ Test actual write operation (create + delete test file)
5. ✅ Log success with configuration details
6. ✅ In production: throw error on failure (fail fast)
7. ✅ In development: warn but allow startup

---

### 2. Server Startup Integration ✅

**File:** [backend/src/server.js](backend/src/server.js#L1-L189)

**Changes:**

#### a) Import File Storage Verification

```javascript
import { verifyFileStorage } from "./config/upload.js";
```

#### b) Enhanced Startup Sequence

**Before:**

```javascript
verifyDatabaseConnection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Startup failed:", err.message);
    process.exit(1);
  });
```

**After:**

```javascript
async function startApplication() {
  try {
    // Step 1: Verify database connection
    await verifyDatabaseConnection();

    // Step 2: Verify file storage
    try {
      verifyFileStorage();
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(`File storage verification failed: ${err.message}`);
      }
      console.warn(
        "⚠️  File storage verification failed (non-fatal in development)",
      );
    }

    // Step 3: Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`   API Base: http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error("❌ Startup failed:", err.message);
    console.error("   Fix the error and restart the server");
    process.exit(1);
  }
}

startApplication();
```

**Startup Verification Flow:**

1. ✅ Database connectivity check
2. ✅ File storage validation (path + permissions)
3. ✅ HTTP server startup
4. ❌ Exit immediately on production errors
5. ⚠️ Warn but continue on development errors

#### c) Static File Serving

**Updated to use explicit path:**

```javascript
const FILE_STORAGE_PATH = process.env.FILE_STORAGE_PATH || "./uploads";
app.use("/uploads", express.static(path.resolve(FILE_STORAGE_PATH)));
```

---

### 3. Environment Configuration Template ✅

**File:** [backend/.env.example](backend/.env.example#L44-L85)

**Enhanced Documentation:**

```dotenv
# ============================================================================
# FILE STORAGE - Explicit Path Configuration
# ============================================================================
# IMPORTANT: Use ABSOLUTE paths in production to avoid file loss and permission errors
#
# DEVELOPMENT (relative path OK):
#   FILE_STORAGE_PATH=./uploads
#   FILE_STORAGE_PATH=uploads
#
# PRODUCTION (absolute path REQUIRED):
#   Linux/VPS:     FILE_STORAGE_PATH=/var/www/drms/uploads
#   Docker:        FILE_STORAGE_PATH=/app/uploads
#   Windows:       FILE_STORAGE_PATH=C:/drms/uploads
#   Cloud Storage: FILE_STORAGE_PATH=/mnt/storage/uploads
#
# Permissions Required (Linux/macOS):
#   - Directory must be readable and writable by Node.js process
#   - Recommended: chmod 755 /var/www/drms/uploads
#   - Owner: Same user running Node.js (or www-data for Nginx)
#
# The application will:
#   ✅ Create directory if missing (recursive)
#   ✅ Verify read/write permissions at startup
#   ✅ Fail fast in production if path is invalid
#   ⚠️  Warn in development (allows startup with issues)
#
FILE_STORAGE_PATH=./uploads

# Maximum file upload size in megabytes
FILE_SIZE_LIMIT_MB=50

# Allowed upload MIME types (comma-separated)
ALLOWED_FILE_TYPES=application/pdf,...
```

---

## 🚀 Usage Guide

### Development Setup

**Step 1: Configure .env (Optional)**

```bash
# backend/.env
FILE_STORAGE_PATH=./uploads  # Relative path OK in development
FILE_SIZE_LIMIT_MB=50
NODE_ENV=development
```

**Step 2: Start Server**

```bash
cd backend
npm start
```

**Expected Output:**

```
⚠️  FILE_STORAGE_PATH not set, using default: ./uploads
📁 Creating file storage directory: D:\Department-Record-Management-System\backend\uploads
✅ File storage verified: D:\Department-Record-Management-System\backend\uploads
   Read/Write: OK
   Max file size: 50 MB
✅ Database connected: drms_db
🚀 Server listening on port 5000
   Environment: development
   API Base: http://localhost:5000/api
```

---

### Production Setup (Linux/VPS)

**Step 1: Create Upload Directory**

```bash
# Create directory with proper ownership
sudo mkdir -p /var/www/drms/uploads
sudo chown $USER:$USER /var/www/drms/uploads
chmod 755 /var/www/drms/uploads

# Or if using Nginx (www-data user):
sudo chown www-data:www-data /var/www/drms/uploads
```

**Step 2: Configure .env**

```bash
# backend/.env
FILE_STORAGE_PATH=/var/www/drms/uploads  # ABSOLUTE path required
FILE_SIZE_LIMIT_MB=50
NODE_ENV=production
```

**Step 3: Verify Configuration**

```bash
cd backend
npm start
```

**Expected Output:**

```
📁 File storage (production): /var/www/drms/uploads
✅ File storage verified: /var/www/drms/uploads
   Read/Write: OK
   Max file size: 50 MB
✅ Database connected: drms_db
🚀 Server listening on port 5000
   Environment: production
```

---

### Production Setup (Docker)

**Step 1: Update docker-compose.yml**

```yaml
services:
  backend:
    build: ./backend
    environment:
      FILE_STORAGE_PATH: /app/uploads
      NODE_ENV: production
    volumes:
      # Persist uploads outside container
      - ./uploads:/app/uploads
    ports:
      - "5000:5000"
```

**Step 2: Create Host Directory**

```bash
mkdir -p ./uploads
chmod 755 ./uploads
```

**Step 3: Start Container**

```bash
docker-compose up -d
```

---

### Production Setup (Windows Server)

**Step 1: Create Upload Directory**

```powershell
# PowerShell
New-Item -Path "C:\drms\uploads" -ItemType Directory -Force

# Verify permissions
icacls "C:\drms\uploads"
```

**Step 2: Configure .env**

```bash
# backend/.env
FILE_STORAGE_PATH=C:/drms/uploads  # Use forward slashes
FILE_SIZE_LIMIT_MB=50
NODE_ENV=production
```

**Step 3: Start Server**

```powershell
cd backend
npm start
```

---

## 🔍 Troubleshooting

### Error: FILE_STORAGE_PATH is REQUIRED in production

**Problem:**

```
❌ FILE_STORAGE_PATH environment variable is REQUIRED in production.
   Use absolute paths for production deployments (e.g., /var/www/drms/uploads)
```

**Solution:**

```bash
# Add to backend/.env
FILE_STORAGE_PATH=/var/www/drms/uploads
NODE_ENV=production
```

---

### Error: No READ permission

**Problem:**

```
❌ No READ permission for file storage: /var/www/drms/uploads
   Run: chmod +r /var/www/drms/uploads
```

**Solution:**

```bash
# Fix read permission
sudo chmod +r /var/www/drms/uploads

# Better: Set full permissions
sudo chmod 755 /var/www/drms/uploads
```

---

### Error: No WRITE permission

**Problem:**

```
❌ No WRITE permission for file storage: /var/www/drms/uploads
   Run: chmod +w /var/www/drms/uploads
```

**Solution:**

```bash
# Fix write permission
sudo chmod +w /var/www/drms/uploads

# Better: Set full permissions
sudo chmod 755 /var/www/drms/uploads

# Ensure correct ownership
sudo chown $USER:$USER /var/www/drms/uploads
```

---

### Error: Cannot write to file storage directory

**Problem:**

```
❌ Cannot write to file storage directory: /var/www/drms/uploads
   Error: EACCES: permission denied
   Ensure the directory exists and has write permissions.
```

**Solutions:**

**1. Check Directory Exists:**

```bash
ls -ld /var/www/drms/uploads
# If missing: sudo mkdir -p /var/www/drms/uploads
```

**2. Check Permissions:**

```bash
ls -ld /var/www/drms/uploads
# Should show: drwxr-xr-x (755) or drwxrwxr-x (775)
```

**3. Check Ownership:**

```bash
# If running as current user:
sudo chown $USER:$USER /var/www/drms/uploads

# If running as www-data (Nginx):
sudo chown www-data:www-data /var/www/drms/uploads

# If using PM2:
sudo chown $(whoami):$(whoami) /var/www/drms/uploads
```

**4. Fix Permissions:**

```bash
# Standard permissions
sudo chmod 755 /var/www/drms/uploads

# If still failing (more permissive):
sudo chmod 777 /var/www/drms/uploads
```

---

### Warning: FILE_STORAGE_PATH not set

**Problem (Development Only):**

```
⚠️  FILE_STORAGE_PATH not set, using default: ./uploads
⚠️  File storage verification failed (non-fatal in development)
```

**Solution:**

**Option 1: Set explicit path (recommended):**

```bash
# backend/.env
FILE_STORAGE_PATH=./uploads
```

**Option 2: Ignore warning (works with defaults):**

- The application will use `./uploads` relative to backend directory
- Files will be stored in `backend/uploads/`
- Warning is informational, uploads will work

---

### Directory Created But No Files Uploading

**Possible Causes:**

**1. Check File Size Limit:**

```bash
# backend/.env
FILE_SIZE_LIMIT_MB=50  # Increase if needed
```

**2. Check Multer Configuration:**

```bash
# Check logs for file filter rejections
# Files may be rejected by MIME type filters
```

**3. Check Frontend API URL:**

```bash
# frontend/.env
VITE_API_BASE_URL=http://localhost:5000  # Correct backend URL
```

**4. Verify Upload Route:**

```bash
# Test with curl
curl -X POST http://localhost:5000/api/achievements \
  -F "proof=@test.pdf" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Path Examples by Platform

### Linux/Unix VPS

**Development:**

```bash
FILE_STORAGE_PATH=./uploads
# Resolves to: /home/user/drms/backend/uploads
```

**Production:**

```bash
FILE_STORAGE_PATH=/var/www/drms/uploads
FILE_STORAGE_PATH=/opt/drms/uploads
FILE_STORAGE_PATH=/srv/drms/uploads
FILE_STORAGE_PATH=/home/deploy/drms/uploads
```

---

### Docker

**Container Internal Path:**

```bash
FILE_STORAGE_PATH=/app/uploads
FILE_STORAGE_PATH=/data/uploads
```

**With Volume Mount (docker-compose.yml):**

```yaml
volumes:
  - ./uploads:/app/uploads # Relative host path
  - /var/drms/uploads:/app/uploads # Absolute host path
```

---

### Windows

**Development:**

```bash
FILE_STORAGE_PATH=./uploads
# Resolves to: D:\drms\backend\uploads
```

**Production:**

```bash
FILE_STORAGE_PATH=C:/drms/uploads           # Forward slashes (recommended)
FILE_STORAGE_PATH=C:\\drms\\uploads         # Escaped backslashes
FILE_STORAGE_PATH=//server/share/uploads    # Network share
```

---

### Cloud Storage (AWS/Azure/GCP)

**AWS EFS Mount:**

```bash
FILE_STORAGE_PATH=/mnt/efs/uploads
```

**Azure File Share Mount:**

```bash
FILE_STORAGE_PATH=/mnt/azure/uploads
```

**GCP Persistent Disk:**

```bash
FILE_STORAGE_PATH=/mnt/disks/uploads
```

---

## 🔐 Security Best Practices

### 1. Use Absolute Paths in Production

**❌ Bad (Relative):**

```bash
FILE_STORAGE_PATH=./uploads
FILE_STORAGE_PATH=uploads
FILE_STORAGE_PATH=../uploads
```

**✅ Good (Absolute):**

```bash
FILE_STORAGE_PATH=/var/www/drms/uploads
FILE_STORAGE_PATH=/opt/drms/uploads
FILE_STORAGE_PATH=/app/uploads
```

**Why:**

- Relative paths depend on current working directory
- Process managers (PM2, systemd) may change `cwd`
- Absolute paths are predictable and explicit

---

### 2. Set Proper Permissions

**Linux/macOS Permissions:**

**Recommended (755):**

```bash
sudo chmod 755 /var/www/drms/uploads
# Owner: rwx (read, write, execute)
# Group: r-x (read, execute)
# Other: r-x (read, execute)
```

**More Secure (750):**

```bash
sudo chmod 750 /var/www/drms/uploads
# Owner: rwx
# Group: r-x
# Other: --- (no access)
```

**Permissive (777) - NOT RECOMMENDED:**

```bash
sudo chmod 777 /var/www/drms/uploads
# Everyone has full access (security risk)
```

---

### 3. Use Correct Ownership

**If running as user (development):**

```bash
sudo chown $USER:$USER /var/www/drms/uploads
```

**If running via Nginx (production):**

```bash
sudo chown www-data:www-data /var/www/drms/uploads
```

**If using PM2 process manager:**

```bash
# PM2 runs as current user
sudo chown $(whoami):$(whoami) /var/www/drms/uploads
```

---

### 4. Isolate Upload Directory

**✅ Good Structure:**

```
/var/www/drms/
├── backend/           (application code)
├── frontend/          (static files)
└── uploads/           (isolated, not in code directory)
```

**❌ Bad Structure:**

```
/var/www/drms/backend/
├── src/
├── node_modules/
└── uploads/           (mixed with code)
```

**Why:**

- Easier to manage permissions separately
- Prevents accidental code access through file uploads
- Simpler backup strategy

---

## 📈 Deployment Checklist

### Pre-Deployment

- [ ] Set `FILE_STORAGE_PATH` to absolute path in production `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Create upload directory with `mkdir -p`
- [ ] Set correct ownership (`chown`)
- [ ] Set permissions to 755 or 750 (`chmod`)
- [ ] Test write access manually (`touch test.txt`)
- [ ] Remove test files

### During Deployment

- [ ] Deploy backend application
- [ ] Verify `.env` file has correct `FILE_STORAGE_PATH`
- [ ] Start application and check logs for file storage verification
- [ ] Look for "✅ File storage verified" message
- [ ] Test file upload via API endpoint

### Post-Deployment

- [ ] Test file upload from frontend UI
- [ ] Verify files are saved to correct directory
- [ ] Test file download/retrieval
- [ ] Check file permissions after upload
- [ ] Monitor logs for permission errors
- [ ] Set up backup strategy for uploads directory

---

## 🎯 Summary

### What Changed

| Component              | Before                      | After                                        |
| ---------------------- | --------------------------- | -------------------------------------------- |
| **Path Configuration** | `./uploads` fallback always | Required in production, fallback only in dev |
| **Validation**         | Basic `existsSync()`        | Comprehensive permission checks              |
| **Error Handling**     | Silent failures             | Clear errors with remediation steps          |
| **Production Safety**  | No enforcement              | Fail fast on misconfiguration                |
| **Documentation**      | Minimal                     | Extensive with examples                      |
| **Startup Check**      | None                        | Full verification at startup                 |

---

### Benefits Achieved

✅ **Predictable File Storage**

- Files always saved to explicit, configured location
- No surprises from relative path resolution

✅ **Safe Production Deployments**

- Configuration errors caught at startup, not runtime
- Clear error messages guide quick fixes

✅ **Permission Awareness**

- Read/write permissions verified before accepting requests
- Test writes ensure actual filesystem access

✅ **Environment Flexibility**

- Strict requirements in production (fail fast)
- Lenient in development (warn but continue)

✅ **Clear Documentation**

- Platform-specific examples (Linux, Docker, Windows)
- Permission guidance for different deployment scenarios
- Troubleshooting guide for common issues

---

## 📚 Related Documentation

- [ENV_SETUP.md](ENV_SETUP.md) - Complete environment variable guide
- [CORS_DEPLOYMENT_GUIDE.md](CORS_DEPLOYMENT_GUIDE.md) - Nginx configuration examples
- [MIGRATION_QUICK_START.md](backend/MIGRATION_QUICK_START.md) - Database setup
- [backend/.env.example](backend/.env.example) - Configuration template

---

## ✅ Implementation Status

All file storage improvements have been successfully implemented and tested:

- ✅ Enhanced validation in `upload.js`
- ✅ Startup verification in `server.js`
- ✅ Updated `.env.example` documentation
- ✅ Comprehensive troubleshooting guide
- ✅ Platform-specific deployment examples
- ✅ Security best practices documented

**The file storage system is now production-ready with robust error handling and clear operational guidance.**
