# 🔐 Security Guidelines - DRMS Application

## ⚠️ CRITICAL: Environment Variable Management

### Security Principles

**NEVER** commit the following to version control:

- `.env` files with real credentials
- Database passwords
- JWT secrets
- Email passwords
- API keys

**ALWAYS** use `.env.example` templates for documentation.

---

## 📋 Environment Variable Setup

### Backend Configuration

#### 1. Database Security

```bash
# ❌ WEAK - Never use easily guessable passwords
DB_PASS=password123
DB_PASS=admin

# ✅ STRONG - Use complex passwords
DB_PASS=X9$mK2#pL8@vN4qR7&wE5!tY
```

**Best Practices:**

- Minimum 16 characters
- Mix uppercase, lowercase, numbers, symbols
- No dictionary words
- Use a password manager to generate

#### 2. JWT Secret Generation

```bash
# Generate a strong JWT secret (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use OpenSSL
openssl rand -hex 32
```

**Example Output:**

```
a7f8e6d9c4b3a2e1f0d9c8b7a6e5f4d3c2b1a0e9d8c7b6a5f4e3d2c1b0a9e8d7
```

**Add to .env:**

```bash
JWT_SECRET=a7f8e6d9c4b3a2e1f0d9c8b7a6e5f4d3c2b1a0e9d8c7b6a5f4e3d2c1b0a9e8d7
```

#### 3. Email Security (Gmail Example)

**For Gmail:**

1. Enable 2-Factor Authentication
2. Generate App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password

```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop  # Gmail App Password
EMAIL_SERVICE=gmail
```

**For Outlook/Office365:**

```bash
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your_outlook_password
```

#### 4. CORS Configuration

**Development:**

```bash
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Production:**

```bash
CORS_ORIGINS=https://your-production-domain.com
```

**Never use `*` in production:**

```bash
# ❌ INSECURE - Allows any origin
CORS_ORIGINS=*

# ✅ SECURE - Specific domains only
CORS_ORIGINS=https://app.example.com,https://www.example.com
```

---

### Frontend Configuration

#### Environment Variables

Create `.env` file in `frontend/`:

```bash
# Development
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_ENV=development
VITE_DEBUG=false
```

Create `.env.production` for production builds:

```bash
# Production
VITE_API_BASE_URL=https://api.your-domain.com/api
VITE_APP_ENV=production
VITE_DEBUG=false
```

**Build Commands:**

```bash
# Development build
npm run build

# Production build (uses .env.production)
npm run build -- --mode production
```

---

## 🔒 Deployment Security Checklist

### Pre-Deployment

- [ ] All `.env` files excluded from git (check `.gitignore`)
- [ ] Strong JWT_SECRET generated (minimum 32 characters)
- [ ] Database password is strong and unique
- [ ] Email credentials use App Passwords (not regular passwords)
- [ ] CORS_ORIGINS limited to production domains only
- [ ] NODE_ENV set to `production`
- [ ] Debug mode disabled in production

### Backend Deployment

```bash
# Set environment variables on your hosting platform
# Examples for different platforms:

# Heroku
heroku config:set JWT_SECRET=your_secret_here
heroku config:set DB_PASS=your_db_password

# Railway / Render / Vercel
# Use their dashboard to set environment variables

# Docker
# Use docker-compose.yml with env_file or docker secrets

# VPS (Linux)
# Use systemd environment files or .env with proper permissions
chmod 600 .env  # Read/write for owner only
```

### Database Security

**Production Database Checklist:**

- [ ] Enable SSL/TLS connections
- [ ] Use firewall to restrict database access
- [ ] Regular backups configured
- [ ] Strong authentication enabled
- [ ] Disable public access
- [ ] Use connection pooling
- [ ] Monitor for suspicious queries

**PostgreSQL SSL Configuration:**

```javascript
// config/db.js for production
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: Number(process.env.DB_PORT || 5432),
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: false,
        }
      : false,
});
```

---

## 🚨 Leaked Credentials - Immediate Actions

### If Credentials Are Committed to Git:

1. **Immediate Actions:**

   ```bash
   # Change ALL compromised credentials immediately
   # Database password
   # Email password
   # JWT secret
   # Any API keys
   ```

2. **Remove from Git History:**

   ```bash
   # ⚠️ WARNING: This rewrites history
   # Coordinate with team before running

   # Remove file from all commits
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch backend/.env" \
     --prune-empty --tag-name-filter cat -- --all

   # Force push (dangerous - inform team)
   git push origin --force --all

   # Alternative: Use BFG Repo-Cleaner
   # https://rtyley.github.io/bfg-repo-cleaner/
   ```

3. **Revoke and Regenerate:**
   - Revoke compromised database credentials
   - Regenerate JWT secret
   - Revoke email app passwords
   - Update all deployment environments

4. **Audit:**
   - Check access logs for suspicious activity
   - Invalidate all existing user sessions
   - Monitor for unauthorized access

---

## 🛡️ Additional Security Measures

### 1. Rate Limiting

Add rate limiting to prevent brute force attacks:

```javascript
// Install: npm install express-rate-limit
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
});

app.use("/api/", limiter);
```

### 2. Helmet.js for HTTP Headers

```javascript
// Install: npm install helmet
import helmet from "helmet";

app.use(helmet());
```

### 3. Input Validation

Always validate and sanitize user input:

```javascript
// Use parameterized queries (already implemented)
pool.query("SELECT * FROM users WHERE email = $1", [email]);

// Never use template literals with user input
// ❌ DANGEROUS
pool.query(`SELECT * FROM users WHERE email = '${email}'`);
```

### 4. File Upload Security

Already implemented in `config/upload.js`:

- File size limits
- MIME type validation
- Random filenames (prevents overwriting)
- Isolated upload directory

### 5. Session Security

```javascript
// Session configuration (if using express-session)
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only
      httpOnly: true, // Prevent XSS
      maxAge: 1000 * 60 * 60 * 24 * 90, // 90 days
      sameSite: "strict", // CSRF protection
    },
  }),
);
```

---

## 📝 Environment Variable Reference

### Backend (.env)

| Variable             | Required | Description                  | Example                         |
| -------------------- | -------- | ---------------------------- | ------------------------------- |
| `DB_USER`            | ✅ Yes   | PostgreSQL username          | `postgres`                      |
| `DB_PASS`            | ✅ Yes   | PostgreSQL password          | `SecurePass123!`                |
| `DB_HOST`            | ✅ Yes   | Database host                | `localhost` or `db.example.com` |
| `DB_PORT`            | ✅ Yes   | Database port                | `5432`                          |
| `DB_NAME`            | ✅ Yes   | Database name                | `drms_db`                       |
| `JWT_SECRET`         | ✅ Yes   | JWT signing secret           | 64-char hex string              |
| `EMAIL_HOST`         | ✅ Yes   | SMTP host                    | `smtp-mail.outlook.com`         |
| `EMAIL_PORT`         | ✅ Yes   | SMTP port                    | `587` or `465`                  |
| `EMAIL_USER`         | ✅ Yes   | Email address                | `admin@example.com`             |
| `EMAIL_PASS`         | ✅ Yes   | Email password/app password  | `app_password_here`             |
| `ADMIN_EMAILS`       | ❌ No    | Comma-separated admin emails | `admin1@ex.com,admin2@ex.com`   |
| `CORS_ORIGINS`       | ❌ No    | Allowed origins              | `http://localhost:3000`         |
| `PORT`               | ❌ No    | Server port                  | `5000`                          |
| `NODE_ENV`           | ❌ No    | Environment                  | `development` or `production`   |
| `FILE_STORAGE_PATH`  | ❌ No    | Upload directory             | `./uploads`                     |
| `FILE_SIZE_LIMIT_MB` | ❌ No    | Max file size                | `50`                            |

### Frontend (.env)

| Variable            | Required | Description             | Example                       |
| ------------------- | -------- | ----------------------- | ----------------------------- |
| `VITE_API_BASE_URL` | ✅ Yes   | Backend API URL         | `http://localhost:5000/api`   |
| `VITE_APP_ENV`      | ❌ No    | Application environment | `development` or `production` |
| `VITE_DEBUG`        | ❌ No    | Enable debug logging    | `false`                       |

---

## 🎯 Quick Setup Guide

### First Time Setup

1. **Backend:**

   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your actual credentials
   npm install
   npm start
   ```

2. **Frontend:**
   ```bash
   cd frontend
   cp .env.example .env
   # Edit VITE_API_BASE_URL if backend is not on localhost:5000
   npm install
   npm run dev
   ```

### Production Deployment

1. **Set environment variables on hosting platform**
2. **Never store credentials in code**
3. **Use platform-specific secrets management**
4. **Enable SSL/TLS for all connections**
5. **Regularly rotate secrets**

---

## 📞 Security Incident Response

If you discover a security vulnerability:

1. **Do NOT** create a public GitHub issue
2. **Do NOT** commit fixes that expose the vulnerability
3. **DO** contact the security team immediately
4. **DO** follow responsible disclosure practices

---

## 🔍 Regular Security Audits

### Monthly Checklist

- [ ] Review access logs for suspicious activity
- [ ] Update dependencies (`npm audit`)
- [ ] Rotate JWT secrets
- [ ] Review user roles and permissions
- [ ] Check for exposed credentials in git history
- [ ] Test backup and recovery procedures
- [ ] Review CORS settings
- [ ] Audit file uploads directory

### Dependency Security

```bash
# Check for vulnerabilities
npm audit

# Fix automatically if possible
npm audit fix

# Check for outdated packages
npm outdated
```

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Last Updated:** February 24, 2026  
**Version:** 1.0.0  
**Maintainers:** DRMS Development Team
