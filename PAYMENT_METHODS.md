# 💳 Payment Methods Configuration Guide

## Overview

Payment methods are now fully configurable in the Settings page. You can enable/disable different payment methods and manage bank account details for card payments.

## Supported Payment Methods

### 1. **Tunai (Cash)** 💵

- No additional configuration needed
- Default payment method
- Can't be disabled if it's the last enabled method

### 2. **QRIS**

- Modern digital payment system
- Popular in Indonesia
- No additional details needed

### 3. **Kartu Bank (Card)** 🏦

- Requires bank account information
- Toggleable - can be enabled/disabled
- When enabled, allows adding multiple bank accounts

## Configuration Steps

### Enable/Disable Payment Methods

1. Go to **Settings** → **Metode Pembayaran**
2. Click on the payment method button to toggle it
3. Selected methods show green checkmark
4. Minimum 1 method must always be enabled

### Add Bank Accounts (for Card Payment)

1. Make sure **Kartu Bank** toggle is **enabled**
2. Scroll down to **Rekening Bank Kartu** section
3. Fill in:
   - **Nama Rekening**: Account holder name (e.g., "Rekening Pribadi")
   - **Nama Bank**: Bank name (e.g., "BCA", "BNI", "Mandiri")
   - **Nomor Rekening**: Account number (e.g., "1234567890")
4. Click **Tambah Rekening** button
5. Click **Simpan** to persist changes to database

### Remove Bank Accounts

1. In the **Rekening Bank Kartu** section
2. Click the trash icon on the right of the account you want to remove
3. Click **Simpan** to persist changes

## How It Works in POS

### Payment Method Selection

1. When you go to checkout in POS, only **enabled payment methods** will show
2. Click on the method you want to use
3. Amount to be paid will be displayed in the large input field

### Bank Account Selection (for Card Payment)

1. If you select **Kartu Bank**, a dropdown will appear showing all configured bank accounts
2. Format: `[Bank Name] - [Account Name] ([Account Number])`
3. Select the account you want to use for this transaction
4. The selection is saved with the transaction record

## Database Schema

### Stores Table Fields

```sql
-- JSON array of enabled payment methods
enabled_payment_methods TEXT DEFAULT '["cash"]'

-- JSON array of bank accounts
bank_accounts TEXT DEFAULT '[]'
```

### Example Data

**enabled_payment_methods:**

```json
["cash", "qris", "card"]
```

**bank_accounts:**

```json
[
  {
    "id": "abc123",
    "accountName": "Rekening Pribadi",
    "bank": "BCA",
    "accountNumber": "1234567890"
  },
  {
    "id": "def456",
    "accountName": "Rekening Bisnis",
    "bank": "BNI",
    "accountNumber": "9876543210"
  }
]
```

## TypeScript Types

### Store Type

```typescript
interface Store {
  id: string;
  user_id: string;
  name: string;
  // ... other fields
  enabled_payment_methods: string; // JSON stringified array
  bank_accounts: string; // JSON stringified array
}
```

### Bank Account Structure

```typescript
interface BankAccount {
  id: string; // Random unique ID
  accountName: string;
  bank: string;
  accountNumber: string;
}
```

## Activity Logging

When you update payment methods or bank accounts in Settings:

- An activity log entry is created (if implemented)
- Tracked in Activity History page
- Shows what was changed and when

## Common Issues

### "Minimal satu metode pembayaran harus aktif"

- This message appears when you try to disable the last enabled payment method
- You must enable at least one method before disabling another

### Bank accounts dropdown not showing

- Make sure **Kartu Bank** toggle is enabled
- Make sure at least one bank account has been added
- Refresh the page if needed

### Changes not persisting

- Click **Simpan** button in the Payment Methods section
- Wait for the success message
- Refresh to verify changes

## Migration Notes

If you're upgrading from an older version:

1. Run the migration: `supabase/migrations/003_add_payment_config.sql`

   ```sql
   ALTER TABLE stores
   ADD COLUMN IF NOT EXISTS enabled_payment_methods TEXT DEFAULT '["cash"]',
   ADD COLUMN IF NOT EXISTS bank_accounts TEXT DEFAULT '[]';
   ```

2. The defaults ensure backward compatibility:
   - `enabled_payment_methods` defaults to `["cash"]`
   - `bank_accounts` defaults to `[]`

3. Existing stores will automatically use these defaults

## Future Enhancements

Potential improvements for payment methods:

1. **Payment Method Icons** - Add custom icons for each method
2. **Activation Codes** - For QRIS/Card validation
3. **Transaction History by Method** - Filter reports by payment method
4. **Payment Method Analytics** - See which methods are most used
5. **Bank Account Images** - Add QR codes for QRIS
6. **Test Transactions** - Before enabling live payments
7. **Payment Gateway Integration** - Stripe, Midtrans, etc.

## Testing Checklist

- [ ] Create new store
- [ ] Navigate to Settings → Metode Pembayaran
- [ ] Toggle payment methods on/off
- [ ] Add bank account for card payment
- [ ] Verify changes save to database
- [ ] Remove bank account
- [ ] Go to POS checkout
- [ ] Verify only enabled methods show
- [ ] Verify bank accounts show when card is selected
- [ ] Complete a transaction with card payment
- [ ] Verify transaction saved with correct payment method
