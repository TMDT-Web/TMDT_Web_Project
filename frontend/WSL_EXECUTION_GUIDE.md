# 🚀 Quick Start: Execute This in WSL

**Environment:** Windows Subsystem for Linux (Bash)  
**Time Required:** ~5 minutes

---

## Step 1: Open WSL Terminal

Open Windows Terminal and start a WSL (Bash) session:

```bash
# Verify you're in WSL
uname -a
# Expected output: Linux...
```

---

## Step 2: Navigate to Frontend Directory

```bash
cd /mnt/c/Users/Hoangson\ Le/Workspace/PycharmProjects/Luxe_Furniture/frontend
pwd
# Expected: /mnt/c/Users/Hoangson Le/Workspace/PycharmProjects/Luxe_Furniture/frontend
```

---

## Step 3: Install openapi-typescript-codegen

```bash
npm install --save-dev openapi-typescript-codegen
```

**Expected Output:**
```
added 1 package, and audited 500 packages in 5s
```

**Verify Installation:**
```bash
npm list openapi-typescript-codegen
```

Should show:
```
luxefurniture-frontend@1.0.0
└── openapi-typescript-codegen@0.27.0
```

---

## Step 4: Verify Backend is Running

**Open a NEW WSL terminal** (don't close the first one) and check if backend is running:

```bash
# Test if backend is accessible
curl -I http://localhost:8000/docs

# Expected: HTTP/1.1 200 OK

# Check OpenAPI spec is available
curl http://localhost:8000/openapi.json | head -20
```

**If backend is NOT running:**

```bash
# Navigate to project root
cd /mnt/c/Users/Hoangson\ Le/Workspace/PycharmProjects/Luxe_Furniture

# Start backend
docker-compose up -d backend

# Wait 10 seconds for startup
sleep 10

# Verify it's running
docker logs luxefurniture_backend --tail 20
```

---

## Step 5: Generate the API Client

**Back in the frontend terminal:**

```bash
npm run generate-client
```

**Expected Output:**
```
✔ Generating...
✔ Writing to disk...
✔ Done!
```

**Verify Generated Files:**
```bash
ls -la src/client/
```

Should show:
```
drwxr-xr-x  - user  index.ts
drwxr-xr-x  - user  core/
drwxr-xr-x  - user  models/
drwxr-xr-x  - user  services/
```

**Check specific files:**
```bash
# Should have 11+ service files
ls src/client/services/
# AuthenticationService.ts
# ProductsService.ts
# CartService.ts
# CollectionsService.ts
# OrdersService.ts
# ... etc

# Should have 50+ model files
ls src/client/models/ | wc -l
# Expected: 50+
```

---

## Step 6: Verify TypeScript Compilation

```bash
# Run TypeScript compiler check
npx tsc --noEmit

# If successful, no output (silence = success)
# If errors, they will be listed
```

---

## Step 7: Start Development Server

```bash
npm run dev
```

**Expected Output:**
```
  VITE v5.0.11  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

**Keep this terminal running.**

---

## Step 8: Test in Browser Console

1. Open browser: `http://localhost:5173`
2. Open Developer Console (F12)
3. Test API calls:

```javascript
// Import service (in a React component)
import { ProductsService } from '@/client';

// Test call
const products = await ProductsService.getProducts(0, 10);
console.log(products);
```

---

## 🎯 Quick Verification Commands

Run these in WSL to verify everything works:

```bash
# 1. Check generated client exists
ls frontend/src/client/index.ts && echo "✓ Client generated"

# 2. Check services exist
ls frontend/src/client/services/ProductsService.ts && echo "✓ Services OK"

# 3. Check models exist
ls frontend/src/client/models/ProductResponse.ts && echo "✓ Models OK"

# 4. Check package.json has script
grep "generate-client" frontend/package.json && echo "✓ Script added"

# 5. Verify backend is accessible
curl -s http://localhost:8000/openapi.json > /dev/null && echo "✓ Backend accessible"
```

**All checks should show ✓**

---

## 🔄 Regenerate After Backend Changes

Whenever you update FastAPI backend:

```bash
cd /mnt/c/Users/Hoangson\ Le/Workspace/PycharmProjects/Luxe_Furniture/frontend
npm run generate-client
```

---

## 🐛 Troubleshooting

### Error: "Cannot connect to localhost:8000"

**Solution 1 - Check Backend:**
```bash
docker ps | grep backend
# If not running:
docker-compose up -d backend
```

**Solution 2 - Check Port:**
```bash
netstat -tulpn | grep 8000
```

**Solution 3 - Use Windows IP (WSL1 only):**
```bash
# Get Windows host IP
cat /etc/resolv.conf | grep nameserver | awk '{print $2}'

# Use that IP in generation
npm run generate-client -- --input http://172.x.x.x:8000/openapi.json
```

### Error: "Module '@/client' not found"

This is normal BEFORE generation. Run:
```bash
npm run generate-client
```

### Error: "openapi: command not found"

```bash
# Reinstall
npm install --save-dev openapi-typescript-codegen

# Or install globally
npm install -g openapi-typescript-codegen
```

---

## ✅ Success Checklist

- [ ] WSL terminal opened
- [ ] Navigated to `frontend/` directory
- [ ] `openapi-typescript-codegen` installed
- [ ] Backend running on `localhost:8000`
- [ ] `npm run generate-client` executed successfully
- [ ] `src/client/` directory created with files
- [ ] TypeScript compilation passes
- [ ] Dev server starts without errors

---

## 📁 What Gets Generated

After running `npm run generate-client`:

```
frontend/src/client/
├── index.ts                    # Main export file
├── core/
│   ├── OpenAPI.ts              # Configuration (BASE, TOKEN, etc.)
│   ├── ApiError.ts             # Error handling
│   ├── ApiRequestOptions.ts    # Request config types
│   ├── ApiResult.ts            # Result types
│   ├── CancelablePromise.ts    # Promise wrapper
│   └── request.ts              # HTTP request logic
├── models/                     # All Pydantic models as TypeScript
│   ├── ProductResponse.ts
│   ├── CartResponse.ts
│   ├── OrderResponse.ts
│   ├── UserResponse.ts
│   └── ... (50+ model files)
└── services/                   # All API endpoints as methods
    ├── AuthenticationService.ts
    ├── ProductsService.ts
    ├── CartService.ts
    ├── CollectionsService.ts
    ├── OrdersService.ts
    ├── DashboardService.ts
    └── ... (11+ service files)
```

**Total Generated Files:** ~70 files  
**Lines of Code:** ~5000+ lines  
**All Type-Safe:** ✅

---

## 🎓 Next Steps

1. **Read the full guide:** `OPENAPI_CLIENT_SETUP.md`
2. **Review example service:** `src/services/product.service.generated.ts`
3. **Check example components:** `src/examples/ProductComponents.generated.tsx`
4. **Configure auth:** Review `src/services/apiClient.ts`
5. **Start refactoring:** Replace manual axios calls with generated client

---

**Ready to modernize your frontend! 🚀**
