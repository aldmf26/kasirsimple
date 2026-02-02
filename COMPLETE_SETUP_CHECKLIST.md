# ✅ Complete Setup Checklist - Kasir Simple + Supabase

## 📋 Pre-Setup (Before You Start)

- [ ] Have Supabase account (signup at https://supabase.com)
- [ ] Have Node.js 18+ installed (`node --version`)
- [ ] Have npm or pnpm installed (`npm --version`)
- [ ] Have git installed (`git --version`)
- [ ] Have text editor (VS Code recommended)

## 🔧 Step 1: Supabase Project Setup (15 minutes)

### Create Supabase Project

- [ ] Login to https://supabase.com/dashboard
- [ ] Click "New project"
- [ ] Fill project details:
  - [ ] Name: `kasir-simple` (or preferred name)
  - [ ] Database password: Set strong password
  - [ ] Region: Singapore (or closest region)
  - [ ] Pricing plan: Free tier OK for development
- [ ] Wait for project to be created (5-10 minutes)
- [ ] Project ready when you see "Connected" status

### Get API Keys

- [ ] Go to Settings → API
- [ ] Copy `Project URL` → Save somewhere safe
- [ ] Copy `anon public key` → Save somewhere safe
- [ ] Copy `service_role secret key` → Save somewhere safe (backend only)

## 📝 Step 2: Environment Setup (5 minutes)

### Create .env.local

- [ ] In project root, create file `.env.local`
- [ ] Add:
  ```env
  NUXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
  NUXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
  ```
- [ ] Replace xxx with your actual keys
- [ ] Save file

### Verify .env.local

- [ ] Check file exists in root directory
- [ ] Check it's NOT in git (check .gitignore has `.env.local`)
- [ ] Verify you can read the keys

## 🗄️ Step 3: Database Schema Setup (10 minutes)

### Run Schema in Supabase

1. [ ] Open `supabase/schema.sql` in project
2. [ ] Copy ALL content (Ctrl+A, Ctrl+C)
3. [ ] Go to Supabase Dashboard
4. [ ] Go to SQL Editor → New query
5. [ ] Paste schema content
6. [ ] Click "Run"
7. [ ] Wait for completion (should be instant or few seconds)
8. [ ] Verify no errors shown

### Verify Tables Created

1. [ ] Go to Supabase Dashboard
2. [ ] Go to Table Editor
3. [ ] Verify these tables exist:
   - [ ] stores
   - [ ] categories
   - [ ] products
   - [ ] transactions
   - [ ] transaction_items
   - [ ] stock_movements
   - [ ] printer_settings

4. [ ] Click each table and verify columns:
   - [ ] stores: id, user_id, name, address, phone, currency, etc.
   - [ ] products: id, store_id, category_id, name, price, buy_price, stock, unit, etc.
   - [ ] transactions: id, store_id, transaction_number, total, paid, change, etc.

## 🔐 Step 4: Enable RLS (Row Level Security) (5 minutes)

### Enable RLS on All Tables

For each table (stores, categories, products, transactions, transaction_items, stock_movements, printer_settings):

1. [ ] Click table name in Table Editor
2. [ ] Go to "Policies" tab
3. [ ] Look for "RLS" toggle/switch
4. [ ] Toggle ON if OFF
5. [ ] Verify it says "RLS Enabled"

### Verify Policies Exist

1. [ ] Go to Authentication → Policies
2. [ ] For each table, check these policies exist:
   - [ ] SELECT policy
   - [ ] INSERT policy
   - [ ] UPDATE policy
   - [ ] DELETE policy

3. [ ] If any missing, copy from `supabase/RLS_FIX.sql` and run

### Test RLS Works

1. [ ] In SQL Editor, run test query:

   ```sql
   SELECT set_config('request.jwt.claims',
     json_build_object('sub', 'test-user-123')::text, true);

   SELECT * FROM stores;
   ```

2. [ ] Should return empty result (test user has no stores) ✅

## 🚀 Step 5: Project Setup (5 minutes)

### Install Dependencies

```bash
cd [project-directory]
npm install
# or
pnpm install
```

- [ ] Wait for all packages installed
- [ ] Check no errors in output

### Verify Installation

```bash
npm run build
```

- [ ] Should complete without errors
- [ ] Check for TypeScript errors (if any, note them)

## ✅ Step 6: Test Application (15 minutes)

### Start Development Server

```bash
npm run dev
```

- [ ] Server should start
- [ ] Should see "Local: http://localhost:3000"
- [ ] Open http://localhost:3000 in browser

### Test Authentication

1. [ ] Click "Register" or "Sign Up"
2. [ ] Fill form:
   - [ ] Email: Use new test email (e.g., test1@example.com)
   - [ ] Password: Any password (min 6 chars)
   - [ ] Confirm password
3. [ ] Click Register
4. [ ] Should see success or redirect to login
5. [ ] Login with same email/password
6. [ ] Should redirect to dashboard ✅

### Test Store Creation

1. [ ] After login, go to Settings (click user icon)
2. [ ] Click "Profil Toko" or "Store Profile"
3. [ ] Fill store details:
   - [ ] Name: "Toko Test"
   - [ ] Address: "Test Address"
   - [ ] Phone: "08123456789"
4. [ ] Click Save
5. [ ] Should see success message ✅
6. [ ] Go back to Dashboard
7. [ ] Should see store name displayed ✅

### Test Products

1. [ ] Go to /products page
2. [ ] Click "+ TAMBAH" (Add)
3. [ ] Fill product form:
   - [ ] Name: "Nasi Goreng"
   - [ ] Price: 15000
   - [ ] Stock: 10
   - [ ] Unit: pcs
4. [ ] Click SIMPAN (Save)
5. [ ] Should see product in list ✅
6. [ ] Add 2-3 more test products

### Test POS (Point of Sale)

1. [ ] Go to /pos page
2. [ ] Should see products grid
3. [ ] Click a product to add to cart
4. [ ] Cart should update:
   - [ ] Item count increases
   - [ ] Total price updates
5. [ ] Click "+ " to increase quantity
6. [ ] Click "BAYAR" (Pay)
7. [ ] Payment modal should open
8. [ ] Enter amount ≥ total
9. [ ] Click "SELESAI" (Complete)
10. [ ] Should see receipt modal ✅
11. [ ] Close modal
12. [ ] Go to /products
13. [ ] Verify stock decreased ✅

### Test Multi-Tenant (Data Isolation)

1. [ ] Logout (click Settings → Logout)
2. [ ] Register new user (different email)
3. [ ] Create different store (different name)
4. [ ] Add products for this store
5. [ ] Go to /products
6. [ ] Should only see products from current store ✅
7. [ ] Should NOT see first user's products ✅

## 🔍 Step 7: Verify Database (5 minutes)

### Check Data in Supabase

1. [ ] Go to Supabase Dashboard → Table Editor
2. [ ] Click "stores" table
3. [ ] Should see your test stores with different user_ids ✅
4. [ ] Click "products" table
5. [ ] Should see products with correct store_ids ✅
6. [ ] Click "transactions" table
7. [ ] Should see your test transaction ✅

### Check RLS Working

1. [ ] In Supabase SQL Editor:

   ```sql
   -- Test that user can only see own data
   SELECT set_config('request.jwt.claims',
     json_build_object('sub', 'USER_ID_1')::text, true);

   SELECT COUNT(*) FROM stores;
   -- Should return 1 (only user 1's store)
   ```

2. [ ] Switch to different user:

   ```sql
   SELECT set_config('request.jwt.claims',
     json_build_object('sub', 'USER_ID_2')::text, true);

   SELECT COUNT(*) FROM stores;
   -- Should return 1 (only user 2's store)
   ```

✅ RLS working correctly!

## 🛠️ Step 8: Troubleshooting (If Issues)

### Issue: "Can login but can't see dashboard"

- [ ] Check browser console for errors (F12)
- [ ] Check Supabase logs:
  - [ ] Dashboard → Logs → Recent Logs
  - [ ] Look for 403/permission errors
- [ ] Run RLS_FIX.sql from `supabase/` directory
- [ ] Refresh page

### Issue: "Can't create store"

- [ ] Check INSERT policy for stores table
- [ ] Verify RLS enabled with toggle ON
- [ ] Check .env.local variables correct
- [ ] Try SQL test:
  ```sql
  INSERT INTO stores (user_id, name, address, phone)
  VALUES (auth.uid(), 'Test', 'Test', '08123');
  ```

### Issue: "Products not saving"

- [ ] Check RLS enabled for products table
- [ ] Check product INSERT policy
- [ ] Check store_id is being passed
- [ ] Try manual insert in SQL editor

### Issue: "Transactions not working"

- [ ] Check transactions table RLS policy
- [ ] Check transaction_items policy
- [ ] Check stock_movements table
- [ ] Run query:
  ```sql
  SELECT * FROM transactions WHERE store_id = 'your-store-id';
  ```

### Issue: "User can see other user's data"

- [ ] URGENT: RLS not working
- [ ] Run `supabase/RLS_FIX.sql` immediately
- [ ] Verify all policies created
- [ ] Check `auth.uid()` in policies

## 📚 Next Steps

After all checkboxes done:

- [ ] Read `DATABASE_SETUP.md` for full documentation
- [ ] Read `QUICK_START.md` for quick reference
- [ ] Customize store branding
- [ ] Add more test data
- [ ] Test on different browsers
- [ ] Plan deployment

## 🚀 Ready to Deploy?

- [ ] All tests passing
- [ ] RLS working correctly
- [ ] Data isolation verified
- [ ] No console errors
- [ ] Performance acceptable

Then:

- [ ] Choose hosting (Netlify/Vercel/custom)
- [ ] Setup production variables
- [ ] Deploy!

## 📊 Final Checklist

### Technical

- [ ] Schema created ✅
- [ ] RLS enabled ✅
- [ ] Environment variables set ✅
- [ ] App running locally ✅
- [ ] Authentication working ✅
- [ ] Database CRUD operations working ✅
- [ ] Multi-tenant isolation verified ✅

### Functional

- [ ] Can signup ✅
- [ ] Can create store ✅
- [ ] Can add products ✅
- [ ] Can create transactions ✅
- [ ] Can view reports ✅
- [ ] Can change settings ✅

### Security

- [ ] RLS enforced ✅
- [ ] User can't see other user's data ✅
- [ ] Authentication required ✅
- [ ] HTTPS ready ✅
- [ ] No secrets in git ✅

## 🎉 SUCCESS!

If all checkboxes are checked, your Kasir Simple + Supabase setup is complete!

---

**Still having issues?**

1. Check `RLS_TROUBLESHOOTING.md` for detailed solutions
2. Check Supabase logs for error messages
3. Ask in Supabase Discord: https://discord.supabase.com

**Estimated Time: 1-2 hours for complete setup**

Good luck! 🚀
