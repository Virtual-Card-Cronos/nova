# How Services Work with Vercel Deployment

## Current Architecture

The project uses a **monorepo structure** where:
- **Entry Point**: `apps/web` (Next.js app)
- **Services**: `services/agent` (AI agent logic)
- **Path Alias**: `@novaagent/agent` → `../../services/agent/src`

## How It Works

### 1. **Path Resolution**

The web app imports from the services folder using a path alias:

```typescript
// In apps/web/src/app/api/agent/process/route.ts
import { processAgentRequest } from '@novaagent/agent'
```

This alias is configured in two places:

**TypeScript** (`apps/web/tsconfig.json`):
```json
{
  "paths": {
    "@novaagent/agent": ["../../services/agent/src"]
  }
}
```

**Webpack** (`apps/web/next.config.js`):
```javascript
webpack: (config) => {
  config.resolve.alias = {
    '@novaagent/agent': path.resolve(__dirname, '../../services/agent/src'),
  }
  return config
}
```

### 2. **Build Process**

When Next.js builds:
1. TypeScript resolves `@novaagent/agent` to `../../services/agent/src`
2. Webpack bundles the code from that path
3. The service code is **inlined into the Next.js bundle**

**Important**: The service code is **compiled into the Next.js build**, not imported at runtime. This means:
- ✅ No runtime dependency on the `services/` folder
- ✅ Everything is bundled into `.next/` output
- ✅ Works on Vercel even though root directory is `apps/web`

### 3. **Vercel Deployment**

**How Vercel Handles This:**

1. **Install Phase**:
   ```bash
   npm install  # From root (installs all workspace dependencies)
   ```

2. **Build Phase**:
   ```bash
   npm run build --workspace=apps/web
   # Or: cd apps/web && npm run build
   ```

3. **Path Resolution**:
   - Vercel clones the **entire repository** (not just `apps/web`)
   - Sets root directory to `apps/web` for **deployment**
   - But during **build**, webpack can access `../../services/agent/src`
   - The service code gets **bundled into** `.next/` output

4. **Runtime**:
   - Only the `.next/` folder is deployed
   - Service code is already compiled into the bundle
   - No need to access `services/` folder at runtime

## Configuration Files

### `vercel.json` (Root)
```json
{
  "rootDirectory": "apps/web",
  "buildCommand": "npm install && npm run build --workspace=apps/web",
  "installCommand": "npm install"
}
```

This tells Vercel:
- Install from root (to get workspace dependencies)
- Build from `apps/web`
- But the entire repo is available during build

### `apps/web/next.config.js`
```javascript
webpack: (config) => {
  config.resolve.alias = {
    '@novaagent/agent': path.resolve(__dirname, '../../services/agent/src'),
  }
  return config
}
```

This tells webpack:
- When you see `@novaagent/agent`, resolve to `../../services/agent/src`
- Bundle that code into the Next.js output

## Why This Works

1. **Build Time**: Vercel has access to the entire repository during build
2. **Bundling**: Webpack bundles the service code into `.next/`
3. **Deployment**: Only `.next/` is deployed (service code is already inside)
4. **Runtime**: No external dependencies needed

## Alternative Approaches

If you encounter issues, here are alternatives:

### Option 1: Copy Service to Web App (Simpler)
Move `services/agent/src` to `apps/web/src/lib/agent`:
- ✅ No path aliases needed
- ✅ Everything in one folder
- ❌ Loses monorepo structure

### Option 2: Use Workspace Package (More Complex)
Publish `services/agent` as a proper npm package:
- ✅ True monorepo structure
- ✅ Can be versioned independently
- ❌ More setup complexity

### Option 3: Build Script (Current - Recommended)
Keep current structure, ensure build works:
- ✅ Maintains monorepo structure
- ✅ Service code bundled at build time
- ✅ Works with Vercel

## Troubleshooting

### Error: "Cannot find module '@novaagent/agent'"

**Solution**: Ensure:
1. `vercel.json` installs from root: `"installCommand": "npm install"`
2. Build command has access to parent directories
3. Webpack alias path is correct in `next.config.js`

### Error: "Module not found" during build

**Solution**: Check that:
1. `services/agent/src/index.ts` exists and exports correctly
2. Path in `next.config.js` uses `path.resolve(__dirname, ...)`
3. Vercel has access to the entire repo (not just `apps/web`)

### Build succeeds but runtime fails

**Solution**: This shouldn't happen because code is bundled. If it does:
1. Check that service code doesn't use Node.js-only APIs in client components
2. Ensure all imports are properly resolved at build time

## Summary

**The service code is NOT deployed separately** - it's bundled into the Next.js build during the build process. Vercel:
1. Clones the entire repo
2. Installs dependencies from root
3. Builds from `apps/web` (which bundles `services/agent` code)
4. Deploys only the `.next/` output

The `services/` folder is only needed **during build**, not at runtime! 🎯
