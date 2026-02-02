# 📊 Flow Diagram - Sebelum & Sesudah Perbaikan

## ❌ SEBELUM (Infinite Redirect Loop)

```
User Login
    ↓
Auth Middleware
    ↓
✅ User authenticated?
    ↓
Check: store.value ada?
    ↓
❌ TIDAK ADA
    ↓
fetchStore() async
    ↓
❌ Tidak ditemukan
    ↓
navigateTo('/dashboard')  ← REDIRECT KE PROTECTED ROUTE!
    ↓
Auth Middleware LAGI (untuk /dashboard)
    ↓
✅ User authenticated?
    ↓
Check: store.value ada?
    ↓
❌ TIDAK ADA (sama seperti sebelum!)
    ↓
fetchStore() async
    ↓
❌ Tidak ditemukan
    ↓
navigateTo('/dashboard')  ← REDIRECT LAGI!
    ↓
🔄 LOOP INFINIT (30+ kali) → ERROR!
```

## ✅ SESUDAH (Perbaikan)

```
User Login
    ↓
Auth Middleware
    ↓
✅ User authenticated?
    ↓
✅ Cek auth only, TIDAK cek store
    ↓
navigateTo('/dashboard')  ← REDIRECT SEKALI SAJA
    ↓
Auth Middleware (untuk /dashboard)
    ↓
✅ User authenticated?
    ↓
✅ Tidak ada nested logic
    ↓
Render default.vue (Layout)
    ↓
onMounted() di Layout
    ↓
✅ user.value ada?  ✅ store.value kosong?
    ↓
fetchStore() async
    ↓
⏳ Tunggu hasil (tidak redirect!)
    ↓
Jika ✅ store ada → Render page + produk
Jika ❌ store kosong → Load halaman kosong (bukan redirect)
```

## 🔑 Key Differences

| Aspek              | Sebelum ❌             | Sesudah ✅                |
| ------------------ | ---------------------- | ------------------------- |
| **Store Loading**  | Di Middleware          | Di Layout onMounted       |
| **Redirect Logic** | Ada (menyebabkan loop) | Tidak ada (hanya auth)    |
| **Error Handling** | Redirect → loop        | Load data → OK            |
| **Performance**    | Banyak checks berulang | Satu kali check per route |
| **UX**             | Freeze/crash           | Smooth loading            |

## 🎯 Navigation Flow Examples

### Example 1: User Login

```
GET /auth/login (public)
    ↓
Auth Middleware
    ↓
✅ User NOT authenticated (atau authenticate then redirect)
    ↓
POST /auth/login (sign in)
    ↓
GET /dashboard (after login)
    ↓
Auth Middleware checks:
    - ✅ User authenticated? YES
    - ✅ Not a login/register page? YES
    → PASS (no redirect)
    ↓
Layout default.vue renders
    ↓
onMounted():
    - ✅ User ada? YES
    - ✅ Store belum load? YES
    → fetchStore() (TIDAK redirect, tunggu async)
    ↓
✅ Store loaded
    ↓
Render dashboard with data
```

### Example 2: Access /pos (Protected)

```
GET /pos
    ↓
Auth Middleware
    ↓
✅ User authenticated? YES
    → PASS (no redirect)
    ↓
Layout renders
    ↓
onMounted():
    → fetchStore() (if needed)
    ↓
✅ Store loaded
    ↓
fetchCategories(), fetchProducts() di page
    ↓
✅ POS page renders with all data
```

### Example 3: Not Authenticated Access /pos

```
GET /pos
    ↓
Auth Middleware
    ↓
❌ User NOT authenticated?
    ↓
navigateTo('/auth/login')  ← SINGLE REDIRECT
    ↓
GET /auth/login
    ↓
Auth Middleware
    ↓
✅ Public route? YES
    → PASS (no redirect)
    ↓
Auth layout renders
    ↓
✅ Login form shows
```

## 💡 Why This Works Better

1. **Clear Separation of Concerns**
   - Middleware: Only handle authentication
   - Layout: Only handle data loading
   - Pages: Only handle UI rendering

2. **No Circular Redirects**
   - Middleware tidak redirect ke protected routes
   - Data loading adalah async, bukan navigation

3. **Better Error Handling**
   - Jika store kosong → halaman blank (but no error)
   - Jika auth fail → redirect ke login (one-time)
   - Jika fetch error → error state di component

4. **Performance**
   - Fewer middleware checks
   - Single navigation per route
   - Async data loading doesn't block navigation

## 🧪 Testing Scenarios

| Skenario                | Hasil Diharapkan                              |
| ----------------------- | --------------------------------------------- |
| Login tanpa store       | ✅ Redirect /dashboard, load store via layout |
| Login dengan store      | ✅ Redirect /dashboard, sudah ada store       |
| Access /pos tanpa auth  | ✅ Redirect /auth/login                       |
| Access /pos dengan auth | ✅ Load store & data, render POS              |
| Logout                  | ✅ Redirect /auth/login, clear state          |
