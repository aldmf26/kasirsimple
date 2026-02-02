# 🚀 Quick Start Guide - Supabase Setup

## Langkah-langkah Setup (5 menit)

### 1. Copy Schema SQL

- Buka `supabase/schema.sql` di project
- Copy semua isi file

### 2. Run di Supabase

1. Dashboard Supabase → SQL Editor
2. Paste schema.sql
3. Click "Run"
4. Tunggu selesai ✅

### 3. Setup Environment

```env
# .env.local
NUXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

Copy dari Supabase Project Settings → API

### 4. Test Login

```bash
npm run dev
# Go to http://localhost:3000
# Click "Sign Up" / "Register"
# Signup dengan email baru
# Verify bisa login ✅
```

### 5. Create Store

- Setelah login, akan redirect ke dashboard
- Klik "Create Store" atau buka `/settings`
- Isi nama toko, alamat, dll
- Simpan ✅

### 6. Test POS

- Buka `/products`
- Click "Tambah Produk" untuk create sample
- Buka `/pos`
- Click produk untuk add to cart
- Test checkout ✅

## ✅ Success Indicators

- [ ] Bisa signup/login
- [ ] Store tersimpan di database
- [ ] Bisa lihat store di dashboard
- [ ] Bisa create products
- [ ] Bisa add to cart dan checkout
- [ ] Transactions tercatat di database

## 🆘 Common Issues & Fixes

### Issue 1: "Supabase Error: connect ECONNREFUSED"

**Fix**: Check NUXT_PUBLIC_SUPABASE_URL di .env.local

### Issue 2: "Can login but no data"

**Fix**: Run `DATABASE_SETUP.md` → RLS Troubleshooting section

- Check RLS is enabled
- Check policies exist
- Re-run schema.sql if needed

### Issue 3: "Can't create store"

**Fix**:

```sql
-- Check INSERT policy exists
SELECT * FROM pg_policies WHERE tablename = 'stores';

-- If not, re-run schema.sql
```

### Issue 4: "Tables not appearing"

**Fix**:

- Refresh dashboard
- Check SQL execution completed without errors
- Check table editor

## 📁 File Structure

```
supabase/
  ├── schema.sql          ← Main database schema + RLS
  └── migrations/
      └── 002_add_buy_price_unit.sql

app/composables/
  ├── useStore.ts        ← Store management (Supabase)
  ├── useProducts.ts     ← Products (Supabase, no dummy)
  ├── useCategories.ts   ← Categories (Supabase, no dummy)
  └── useTransactions.ts ← Transactions (Supabase, no dummy)

docs/
  ├── DATABASE_SETUP.md         ← Full database guide
  ├── SUPABASE_SETUP.md         ← Supabase setup steps
  ├── RLS_TROUBLESHOOTING.md    ← Fix RLS issues
  └── QUICK_START.md            ← This file
```

## 🔍 Verify Everything Works

### Test 1: Check Database Connection

```typescript
// In browser console
const { data, error } = await supabase.from("stores").select("*");
console.log("Stores:", data);
console.log("Error:", error);
```

### Test 2: Check RLS Working

- Login dengan user A, create store A
- Logout, login dengan user B
- User B tidak bisa lihat store A ✅

### Test 3: Check Transactions

- Add products, create transaction
- Check database untuk transaction entries ✅

### Test 4: Check Stock Updates

- Create product dengan stock 10
- Create transaction dengan qty 2
- Verify stock jadi 8 ✅

## 🎯 Next Steps

1. ✅ Setup Supabase & Tables (selesai)
2. ✅ Setup RLS (selesai)
3. ✅ Connect app ke Supabase (selesai)
4. 🔄 Test semua features
5. 📊 Add reports page
6. 💾 Setup backups
7. 🚀 Deploy ke production

## 💡 Tips

- Use `console.log()` untuk debug
- Check Supabase logs untuk errors
- Test queries di SQL Editor dulu
- Use RLS_TROUBLESHOOTING.md jika ada masalah

## 🔐 Security Notes

- RLS automatically filters data per user
- User hanya bisa akses data dari store mereka
- Stock movements logged untuk audit trail
- Soft deletes untuk data integrity

## 📞 Support

- 📖 Read `DATABASE_SETUP.md` untuk full guide
- 🛠️ Use `RLS_TROUBLESHOOTING.md` untuk fix issues
- 💬 Ask in Supabase Discord

---

**Selamat! Setup Supabase complete 🎉**

Aplikasi siap digunakan dengan multi-tenant architecture yang aman.
