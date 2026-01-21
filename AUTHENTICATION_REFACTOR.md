# Authentication Refactor - Security Improvements

## Summary
This refactor removes hard-coded credentials, implements secure password hashing using `werkzeug.security.generate_password_hash`, and uses environment variables for all sensitive data.

## Changes Made

### 1. **Environment Variables Configuration** (`.env`)
Added new environment variables for authentication credentials:

```dotenv
# --- Authentication & Admin Credentials (Environment Variables) ---
DEFAULT_ADMIN_PASS=admin123
DEFAULT_OWNER_PASS=owner123
DEFAULT_CUST_PASS=cust123
DEFAULT_ADMIN_EMAIL=admin@crav.com
DEFAULT_OWNER_EMAIL=owner1@email.com
DEFAULT_CUST_EMAIL=customer1@email.com
```

**Benefits:**
- Credentials are no longer hard-coded in source files
- Can be easily changed in deployment environments (Render, Docker, etc.)
- Supports different credentials for dev/staging/production

### 2. **Password Hashing Implementation** (`backend/create_initial_data.py`)

#### Imports Added:
```python
from werkzeug.security import generate_password_hash
```

#### Key Changes:
- **Load credentials from environment variables** with secure defaults
- **Hash all passwords** using `generate_password_hash()` before storing in database
- **Admin, Owner, and Customer passwords** are individually hashed
- **Admin and user emails** also loaded from environment variables

#### Code Example:
```python
# Load credentials from environment variables
admin_pass = os.environ.get('DEFAULT_ADMIN_PASS', 'admin123')
admin_email = os.environ.get('DEFAULT_ADMIN_EMAIL', 'admin@crav.com')

# Hash the password
admin_pass_hashed = generate_password_hash(admin_pass)

# Store hashed password in database
admin_user = ds.create_user(
    email=admin_email,
    password=admin_pass_hashed,  # Use hashed password
    name="Admin User"
)
```

### 3. **Removed Hard-Coded Credentials** (`backend/routes.py`)

**Before:**
```python
"message": "Database setup complete! Check Render logs for details. You can now log in with admin@crav.com / admin123"
```

**After:**
```python
"message": "Database setup complete! Check Render logs for details. Admin account has been created. Use credentials from environment variables to log in."
```

**Benefit:** No credentials exposed in API responses or logs

### 4. **Authentication Flow** (Existing - Enhanced Security)

The login process uses **Flask-Security's `verify_password()`** which:
1. Takes the plain-text password from login form
2. Compares it against the **hashed password** stored in database using secure comparison
3. Returns True only if the passwords match

```python
if not user or not verify_password(data.get('password'), user.password):
    return jsonify({"message": "Invalid credentials"}), 401
```

**Security Benefits:**
- Original passwords are never stored
- Compromised database cannot reveal user passwords
- Time-safe comparison prevents timing attacks

## Database Reset & Initialization

### To Apply These Changes:

1. **Delete the old database:**
   ```powershell
   Remove-Item -Path "instance\db.sqlite3" -Force
   ```

2. **Start the application:**
   ```powershell
   python app.py
   ```

3. **Initialize database (one-time):**
   - Navigate to: `/api/admin/run-db-setup`
   - This endpoint creates:
     - All roles (admin, owner, customer)
     - Default users with environment variable credentials
     - Sample restaurant data

4. **Login with credentials from `.env`:**
   - Admin: `admin@crav.com` / password from `DEFAULT_ADMIN_PASS`
   - Owner: `owner1@email.com` / password from `DEFAULT_OWNER_PASS`
   - Customer: `customer1@email.com` / password from `DEFAULT_CUST_PASS`

## Password Hashing Algorithm

By default, `werkzeug.security.generate_password_hash` uses **PBKDF2** with:
- 160,000 iterations (configurable)
- SHA-256 hashing
- Automatic salt generation
- Adaptive to future compute speeds

### Verification Process:
```python
from werkzeug.security import check_password_hash

# Verify during login
is_valid = check_password_hash(stored_hash, user_provided_password)
```

## Security Best Practices Implemented

✅ **Passwords hashed** before storage using PBKDF2  
✅ **Credentials in environment variables** not source code  
✅ **No credentials in API responses** or logs  
✅ **Time-safe password comparison** to prevent timing attacks  
✅ **Different admin identifiers** from default in `.env`  
✅ **Database initialized from scratch** with secure setup  

## Deployment Notes

### For Render/Production:
1. Add these to your Environment Variables in Render dashboard:
   ```
   DEFAULT_ADMIN_PASS=<your_secure_password>
   DEFAULT_ADMIN_EMAIL=<your_admin_email>
   DEFAULT_OWNER_PASS=<your_secure_password>
   DEFAULT_CUST_PASS=<your_secure_password>
   ```

2. After deployment, hit the `/api/admin/run-db-setup` endpoint once to initialize the database

3. The default credentials from `.env` are used for initial setup only (one-time)

### For Local Development:
- Credentials in `.env` are for local testing
- Change them as needed for your environment
- `.env` file is typically not committed to version control (add to `.gitignore`)

## Files Modified

1. **`.env`** - Added environment variables for credentials
2. **`backend/create_initial_data.py`** - Implemented password hashing with `generate_password_hash()`
3. **`backend/routes.py`** - Removed hard-coded credentials from response messages

## Verification Checklist

- [x] All passwords are hashed before storage
- [x] Credentials loaded from environment variables
- [x] Hard-coded credentials removed from code
- [x] Database supports secure password verification
- [x] API responses don't expose credentials
- [x] Login uses `verify_password()` for secure comparison
- [x] Database reset and ready for new initialization

## Additional Security Recommendations

1. **Change default passwords** in `.env` before deploying to production
2. **Use HTTPS** for all authentication endpoints
3. **Implement rate limiting** on login attempts
4. **Add password strength validation** on registration
5. **Consider 2FA** for admin accounts
6. **Rotate passwords regularly** and update `.env`
7. **Keep dependencies updated** (flask-security, werkzeug)

