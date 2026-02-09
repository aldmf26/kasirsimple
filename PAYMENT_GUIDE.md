# 🎯 Payment Methods - Step-by-Step Guide

## Quick Overview

The payment methods feature allows you to:

1. ✅ Choose which payment methods your store accepts
2. ✅ Configure bank account details for card payments
3. ✅ Display only enabled methods in POS checkout
4. ✅ Select appropriate payment method for each transaction

---

## Complete Workflow

### Step 1: Access Settings

1. Click **Settings** in the left sidebar
2. Click on **Metode Pembayaran** tab
3. You'll see 3 payment method buttons

![Payment Methods]

---

### Step 2: Choose Your Payment Methods

The 3 available methods are:

| Method                | Icon | Description                         |
| --------------------- | ---- | ----------------------------------- |
| **Tunai (Cash)**      | 💵   | Physical money payment              |
| **QRIS**              | 📲   | Digital QR code payment (Indonesia) |
| **Kartu Bank (Card)** | 🏦   | Bank card payment                   |

#### Enable/Disable a Method

1. Click the button for the method you want
2. Green button = Enabled ✅
3. Gray button = Disabled ❌

**Rules:**

- At least 1 method must always be enabled
- Can't disable all methods (you'll see an error)

#### Example Setup

For a typical toko kelontong, good options are:

- ✅ **Tunai** (always enabled - most customers pay cash)
- ✅ **QRIS** (growing in popularity)
- ⚪ **Kartu** (optional, if you have bank account)

---

### Step 3: Configure Bank Accounts (for Card Payment)

If you enabled **Kartu Bank**:

1. **Scroll down** to see **Rekening Bank Kartu** section
2. Fill the form with your bank details:

#### Field 1: Nama Rekening (Account Name)

- **What**: The account holder's name or account nickname
- **Example**: "Rekening Pribadi" or "Rini Mulyo"
- **Note**: For your reference - not used in transaction

#### Field 2: Nama Bank (Bank Name)

- **What**: The name of the bank
- **Example**: "BCA", "BNI", "Mandiri", "Permata"
- **Note**: Customers will see this when choosing payment

#### Field 3: Nomor Rekening (Account Number)

- **What**: Your bank account number
- **Example**: "1234567890"
- **Note**: Customers will see this to transfer money

### Step 4: Add Bank Account

1. Fill all 3 fields above
2. Click blue **Tambah Rekening** button
3. Account appears in the list below
4. Repeat for multiple accounts if needed

**Example:**

```
Nama Rekening: Rekening Pribadi
Nama Bank: BCA
Nomor Rekening: 1234567890

👇 Click Tambah Rekening

✅ Rekening added to list:
[Account Name: Rekening Pribadi]
[BCA - 1234567890] [Delete button]
```

### Step 5: Manage Bank Accounts

**To Remove an Account:**

1. Click the **trash icon** 🗑️ on the right of the account
2. Account immediately removed
3. List updates

**To Add More Accounts:**

1. Repeat Step 3 & 4 with different details
2. Useful if you have multiple accounts

---

### Step 6: Save Your Settings

1. After toggling methods or managing accounts
2. Click blue **Simpan** button at the bottom
3. Wait for green success message ✅
4. Settings saved to your store profile

---

## Using Payment Methods in POS

### When Checkout

1. Click **BAYAR** button in POS
2. Payment modal opens
3. See payment method buttons showing **only your enabled methods**

**Example 1: You enabled Tunai + QRIS**

```
💳 Metode Pembayaran
[💵 Tunai] [📲 QRIS]
```

**Example 2: You enabled all 3 methods**

```
💳 Metode Pembayaran
[💵 Tunai] [📲 QRIS] [🏦 Kartu]
```

### Selecting Card Payment

If **Kartu Bank** is enabled:

1. Click the **[🏦 Kartu]** button
2. A dropdown appears below: "Pilih Rekening" (Select Account)
3. Dropdown shows all your configured bank accounts
4. Example:
   ```
   🏦 Pilih Rekening
   [Dropdown ▼]
   - BCA - Rekening Pribadi (1234567890)
   - BNI - Rekening Bisnis (9876543210)
   ```
5. Select the account customer will transfer to
6. Continue with payment process

---

## Real-World Examples

### Example 1: Toko Kelontong (Traditional)

**Situation**: You mainly accept cash, but want to add digital payment option

**Configuration:**

- ✅ **Tunai** (Always on - most customers)
- ✅ **QRIS** (Enable - younger customers)
- ⚪ **Kartu** (Leave off - bank account not needed)

**In POS**: Customers see Tunai and QRIS options

---

### Example 2: Toko Kelontong (Modern)

**Situation**: You want multiple payment options

**Configuration:**

- ✅ **Tunai** (Always on)
- ✅ **QRIS** (Dynamic QR code payments)
- ✅ **Kartu** (Enable)
  - Add Account 1:
    - Name: "Rekening Pribadi"
    - Bank: "BCA"
    - Number: "1234567890"

**In POS**: Customers see all 3 options. If they choose card, they see BCA account number to transfer to.

---

### Example 3: Online Store (Future)

**Situation**: You want to integrate payment gateway

**Configuration:**

- ⚪ **Tunai** (Off - not needed for online)
- ✅ **QRIS** (Enable - for dynamic payments)
- ✅ **Kartu** (Enable)
  - Add multiple accounts for different banks

**Future**: Can integrate Stripe, Midtrans, etc.

---

## Common Tasks

### Task 1: "I want to accept only cash"

1. Go to **Metode Pembayaran**
2. Make sure only **Tunai** is enabled
3. Disable QRIS and Kartu
4. Click **Simpan**
5. Done! ✅

### Task 2: "Add QRIS to my existing store"

1. Go to **Metode Pembayaran**
2. Click the **QRIS** button (turns green)
3. Click **Simpan**
4. Done! No configuration needed ✅

### Task 3: "I have 2 bank accounts"

1. Go to **Metode Pembayaran**
2. Enable **Kartu**
3. Add first account:
   - Name: "Account 1"
   - Bank: "BCA"
   - Number: "111222333"
4. Click **Tambah Rekening**
5. Add second account:
   - Name: "Account 2"
   - Bank: "BNI"
   - Number: "444555666"
6. Click **Tambah Rekening**
7. Click **Simpan**
8. Done! Both show in POS ✅

### Task 4: "Remove a bank account"

1. Go to **Metode Pembayaran**
2. Find the account in the list
3. Click the trash icon 🗑️
4. Account removed from list
5. Click **Simpan**
6. Done! ✅

### Task 5: "I don't want card payment anymore"

1. Go to **Metode Pembayaran**
2. Click **Kartu** button (turns gray)
3. Bank accounts section disappears
4. Click **Simpan**
5. Done! ✅

---

## Tips & Tricks

### 💡 Tip 1: Update Account Number

- Can't edit account after adding?
- Delete it and add again with correct number

### 💡 Tip 2: Default Method

- First enabled method is default in POS
- Order: Tunai → QRIS → Kartu

### 💡 Tip 3: Bank Account Format

- Account names can be anything (for your reference)
- Bank names should match actual bank
- Account numbers should be exact

### 💡 Tip 4: Multiple Users

- Each store has its own payment configuration
- Different users don't see each other's setup
- Perfect for franchise/multi-store setup

### 💡 Tip 5: Testing

- Make settings changes
- Go to POS to verify they appear
- Complete test transaction
- Check if settings persist after refresh

---

## Troubleshooting

### ❌ Problem: "Minimal satu metode pembayaran harus aktif"

**What it means**: You tried to disable the last enabled payment method

**Solution**:

1. Enable another method first
2. Then disable the one you want

**Example**:

```
❌ Wrong: Disable Tunai when only Tunai is enabled
✅ Right: Enable QRIS first, then disable Tunai
```

---

### ❌ Problem: Bank accounts section doesn't show

**Possible causes**:

1. Kartu method is not enabled
2. Page not refreshed after enabling
3. Browser cache issue

**Solutions**:

1. Go to Settings → Metode Pembayaran
2. Make sure Kartu button is **GREEN**
3. Scroll down to see bank section
4. If still not visible: Refresh page (F5)

---

### ❌ Problem: Added bank account but disappeared

**Possible causes**:

1. Didn't click **Simpan** button
2. Got error message (check if field was incomplete)
3. Page refreshed before saving

**Solutions**:

1. Check all 3 fields are filled
2. Check for error messages in red
3. Click **Simpan** button
4. Wait for green success message
5. Then refresh

---

### ❌ Problem: Changes don't appear in POS

**Possible causes**:

1. Didn't save settings (need to click Simpan)
2. POS page cached old data
3. Store not loaded yet

**Solutions**:

1. Go back to Settings
2. Click **Simpan** again
3. See success message
4. Go to POS page
5. Refresh POS page (F5)
6. Changes should appear

---

### ❌ Problem: Can't delete bank account

**Solution**:

- Click the trash icon 🗑️ on the right side of the account
- If icon not visible, scroll right (mobile view)
- Click **Simpan** to confirm deletion

---

## FAQ

**Q: Is cash payment always required?**
A: Yes, you must have at least 1 payment method enabled. We recommend keeping Tunai (cash) enabled for most stores.

**Q: Can I disable QRIS or Kartu?**
A: Yes, anytime. Just unselect it and click Simpan.

**Q: Do I need bank account for QRIS?**
A: No, QRIS doesn't require bank account setup. Just enable it.

**Q: How many bank accounts can I add?**
A: As many as you want! Each appears as an option in POS.

**Q: Can customers see my full account number?**
A: Yes, they'll need it to transfer money. Only share with trusted customers.

**Q: What if I make a mistake in account number?**
A: Delete it and add the correct one.

**Q: Will old transactions be affected?**
A: No, old transactions keep their original payment method. New settings only apply to future transactions.

**Q: Can I hide payment methods from certain customers?**
A: Not yet, but you can disable a method temporarily in Settings.

---

## Next Steps

After configuring payment methods:

1. ✅ Test in POS with each method
2. ✅ Verify bank account shows for card payment
3. ✅ Complete sample transactions
4. ✅ Check activity history to verify setup worked
5. ✅ Train any staff on new payment methods

---

## Need Help?

See these documents:

- **Technical Details**: [PAYMENT_METHODS.md](PAYMENT_METHODS.md)
- **Implementation Details**: [PAYMENT_IMPLEMENTATION.md](PAYMENT_IMPLEMENTATION.md)
- **Testing Checklist**: [COMPLETE_SETUP_CHECKLIST.md](COMPLETE_SETUP_CHECKLIST.md)

---

**Happy selling!** 🛍️💰
