# Work Log

## Etsy Integration Fix
**Issue:**
- User reported an error when connecting to Etsy: `{"success":false,"error":"Failed to get user info: Failed to get user info: Shared secret is required in x-api-key header.","sessionId":"..."}`.
- This error occurs because Etsy API v3 requires the `x-api-key` header to strictly follow the format `API_KEY:SHARED_SECRET`.
- The previous implementation was only sending the `API_KEY`.

**Fix:**
- Modified `api/services/etsyAuthService.js`:
  - Updated the constructor to create a combined `apiKey` string: `this.apiKey = \`${this.clientId}:${this.clientSecret}\``.
  - Updated `getUserInfo` to use this new combined key in the `x-api-key` header.
- Modified `api/services/etsyService.js`:
  - Updated the constructor to also use the combined `API_KEY:SHARED_SECRET` format for all standard API requests.

## Build System Repair
**Issue:**
- After the code fix, `npm run build` failed with: `Error: Cannot find module @rollup/rollup-darwin-arm64`.
- This is a known npm/Rollup optional dependency issue on macOS.
- Consequently, the `ampt` dev server crashed because it couldn't find `static/index.html`.

**Actions Taken:**
- Initiated a clean reinstall of dependencies to resolve the Rollup binary issue:
  ```bash
  rm -rf node_modules package-lock.json && npm install
  ```
- Removed the problematic `postinstall` script from `package.json` (`npm install --os=linux --cpu=x64 sharp`) which was forcing incompatible Linux binaries on macOS and causing the build process to fail.
- Successfully rebuilt the project with `npm run build`.
- The application is now ready for testing.
