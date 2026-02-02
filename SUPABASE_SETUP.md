# Panduan Setup Supabase untuk Kasir Simple

## 1️⃣ Create Supabase Project

1. Buka https://supabase.com
2. Sign up atau login
3. Create new project
   - Pilih region terdekat (contoh: Singapore)
   - Set password yang kuat
4. Tunggu project selesai di-provision (5-10 menit)

## 2️⃣ Setup Authentication

### Enable Email/Password Auth

1. Dashboard → Authentication → Providers
2. Pastikan "Email" sudah enabled
3. Customize email templates jika perlu

### Setup Custom Redirect URLs

1. Authentication → URL Configuration
2. Add redirect URLs:

   ```
   Development:
   - http://localhost:3000/**

   Production:
   - https://your-domain.com/**
   ```

## 3️⃣ Run Database Schema

1. Dashboard → SQL Editor
2. Create new query
3. Copy semua isi dari `supabase/schema.sql`
4. Paste ke SQL Editor
5. Click "Run"
6. Tunggu hingga complete ✅

## 4️⃣ Verify Tables & RLS

### Check Tables

1. Dashboard → Table Editor
2. Verify muncul tables berikut:
   - stores
   - categories
   - products
   - transactions
   - transaction_items
   - stock_movements
   - printer_settings

### Check RLS Policies

1. Dashboard → Authentication → Policies
2. For each table, verify policies exist:
   - SELECT policy
   - INSERT policy
   - UPDATE policy
   - DELETE policy

### Enable RLS on Each Table

Untuk setiap table:

1. Click table name
2. Policies tab
3. Toggle "Enable RLS" ON
4. Verify semua policies ada ✅

## 5️⃣ Get API Keys

1. Dashboard → Project Settings → API
2. Copy untuk `.env.local`:
   ```
   NUXT_PUBLIC_SUPABASE_URL=... (Project URL)
   NUXT_PUBLIC_SUPABASE_ANON_KEY=... (anon/public key)
   ```

## 6️⃣ Setup Environment Variables

Create/update `.env.local`:

```env
# Supabase
NUXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Optional: Service Role (backend only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

## 7️⃣ Test Connection

### Manual Test di Supabase Console

1. Dashboard → SQL Editor
2. Run query untuk test RLS:

```sql
-- Set auth.uid() untuk testing
SELECT set_config('request.jwt.claims', '{"sub":"YOUR_USER_ID"}', true);

-- Test query
SELECT * FROM stores;
```

### App Test

1. Run development server:
   ```bash
   npm run dev
   ```
2. Go to http://localhost:3000
3. Signup dengan email baru
4. Verify dapat login dan akses dashboard

## 8️⃣ Initial Data Setup (Optional)

### Create Test Store

```sql
-- Ganti USER_ID dengan user yang baru di-signup
INSERT INTO stores (user_id, name, address, phone)
VALUES (
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  'Toko Demo',
  'Jl. Demo No. 123',
  '08123456789'
);
```

### Create Test Categories

```sql
INSERT INTO categories (store_id, name, color)
VALUES
  ('YOUR_STORE_ID', 'Makanan', '#EF4444'),
  ('YOUR_STORE_ID', 'Minuman', '#3B82F6'),
  ('YOUR_STORE_ID', 'Snack', '#F59E0B');
```

## 9️⃣ Backup & Monitoring

### Enable Point-in-Time Recovery

1. Dashboard → Database → Backups
2. Enable automatic backups

### Monitor Usage

1. Dashboard → Project Settings → Usage
2. Check storage, bandwidth, function calls

### Set Up Alerts

1. Dashboard → Project Settings → Alerts
2. Enable email alerts untuk high usage

## 🔟 Production Checklist

- [ ] RLS enabled untuk semua tables
- [ ] HTTPS/SSL enabled
- [ ] Backup strategy set up
- [ ] API rate limits configured
- [ ] Email templates customized
- [ ] Error logging enabled
- [ ] Monitoring set up
- [ ] Database backups scheduled
- [ ] API keys stored securely
- [ ] Test user account verified

## 🆘 Troubleshooting

### "Connection Refused"

- Check NUXT_PUBLIC_SUPABASE_URL is correct
- Verify internet connection
- Check Supabase project status

### "Policy violation"

- Verify RLS policies are created
- Check auth.uid() matches user_id
- Test with SQL console first

### "Table doesn't exist"

- Re-run schema.sql
- Check SQL execution completed
- Refresh dashboard

### Slow Queries

- Add indexes (already in schema.sql)
- Check query complexity
- Use LIMIT for large datasets

### Can't Sign Up

- Check email provider settings
- Verify redirect URLs
- Check SMTP configuration

## 📱 Useful Supabase Features

### Realtime Subscriptions

```typescript
supabase
  .from("transactions")
  .on("*", (payload) => {
    console.log("New transaction:", payload.new);
  })
  .subscribe();
```

### Storage (untuk upload gambar)

```
Akan ditambahkan di fase selanjutnya
```

### Edge Functions (untuk custom logic)

```
Akan ditambahkan untuk automation
```

## 🔗 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

**Setup Complete! 🎉**

Aplikasi Kasir Simple siap digunakan dengan Supabase backend.
