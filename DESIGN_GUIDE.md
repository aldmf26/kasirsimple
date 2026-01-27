# 🎨 KasirSimple - Design & Feature Guide

## Dashboard Page (`/`)

### Layout Structure:

```
┌─────────────────────────────────────────────┐
│  HEADER                                     │
│  Dashboard | Welcome Message | Date         │
├─────────────────────────────────────────────┤
│  QUICK ACTIONS (4 Columns)                  │
│  ┌─────────┬─────────┬──────────┬────────┐ │
│  │ Kasir   │ Produk  │ Laporan  │ Setting│ │
│  └─────────┴─────────┴──────────┴────────┘ │
├─────────────────────────────────────────────┤
│  STATS CARDS (4 Columns)                    │
│  ┌─────────┬─────────┬──────────┬────────┐ │
│  │ Penjual │ Transaksi│Rata-rata│ Produk │ │
│  │  Hari   │  Hari   │ Transaksi│       │ │
│  └─────────┴─────────┴──────────┴────────┘ │
├─────────────────────────────────────────────┤
│  CONTENT AREA (2:1 Ratio)                   │
│  ┌──────────────────────┬──────────────┐   │
│  │  Transaksi Terbaru   │  Stok Rendah │   │
│  │  ┌────────────────┐  │  ┌────────┐  │   │
│  │  │  Transaction 1 │  │  │Product1│  │   │
│  │  │  Transaction 2 │  │  │Product2│  │   │
│  │  │  Transaction 3 │  │  │Product3│  │   │
│  │  │  Transaction 4 │  │  │Product4│  │   │
│  │  │  Transaction 5 │  │  │Product5│  │   │
│  │  └────────────────┘  │  └────────┘  │   │
│  └──────────────────────┴──────────────┘   │
└─────────────────────────────────────────────┘
```

### Color Scheme:

- **Stats Cards**: Blue, Emerald, Violet, Orange
- **Icons**: Matching color with card
- **Hover Effects**: Elevated shadow + slight translate-up
- **Dark Mode**: Full support dengan slate/gray variants

---

## POS Page (`/pos`)

### Layout Structure (Desktop):

```
┌──────────────────────────────────────────────────────────┐
│  HEADER: Kasir | Store Name | Back Home                  │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  PRODUCTS SECTION              │  CART SECTION            │
│  ┌──────────────────────┐     │  ┌──────────────────┐   │
│  │ Search Products      │     │  │ KERANJANG        │   │
│  │ [Input Field]        │     │  ├──────────────────┤   │
│  ├──────────────────────┤     │  │ Item 1           │   │
│  │ Category Filter      │     │  │ - Qty controls   │   │
│  │ ○ All  ○ Food ○ Drink      │  │                  │   │
│  ├──────────────────────┤     │  │ Item 2           │   │
│  │ PRODUCT GRID (4 cols)│     │  │ - Qty controls   │   │
│  │ ┌──┬──┬──┬──┐       │     │  │                  │   │
│  │ │P1│P2│P3│P4│       │     │  │ Item 3           │   │
│  │ │  │  │  │  │       │     │  │ - Qty controls   │   │
│  │ └──┴──┴──┴──┘       │     │  ├──────────────────┤   │
│  │ ┌──┬──┬──┬──┐       │     │  │ Subtotal: Rp 123 │   │
│  │ │P5│P6│P7│P8│       │     │  │ Diskon: -Rp 12   │   │
│  │ │  │  │  │  │       │     │  │ Total: Rp 111    │   │
│  │ └──┴──┴──┴──┘       │     │  ├──────────────────┤   │
│  │                      │     │  │ [Bayar Sekarang] │   │
│  │ (scrollable)         │     │  │ [Kosongkan Cart] │   │
│  └──────────────────────┘     │  └──────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### Mobile Layout:

```
┌─────────────────────────────┐
│ HEADER + CART BUTTON        │
├─────────────────────────────┤
│ SEARCH                      │
├─────────────────────────────┤
│ CATEGORY FILTER             │
├─────────────────────────────┤
│ PRODUCT GRID (2-3 cols)     │
│ ┌──────────┬──────────┐     │
│ │Product 1 │Product 2 │     │
│ │          │          │     │
│ └──────────┴──────────┘     │
│ ┌──────────┬──────────┐     │
│ │Product 3 │Product 4 │     │
│ │          │          │     │
│ └──────────┴──────────┘     │
│ (scrollable)                │
└─────────────────────────────┘

[SLIDING DRAWER - Cart]
┌─────────────────────────────┐
│ KERANJANG              [X]   │
├─────────────────────────────┤
│ Item 1 + Qty controls       │
│ Item 2 + Qty controls       │
│ Item 3 + Qty controls       │
├─────────────────────────────┤
│ Summary                     │
│ [Bayar] [Kosongkan]        │
└─────────────────────────────┘
```

### Payment Modal:

```
┌──────────────────────────────────┐
│ KONFIRMASI PEMBAYARAN       │ ▢ │
├──────────────────────────────────┤
│ ┌────────────────────────────┐   │
│ │ PAYMENT SUMMARY (Blue BG)  │   │
│ │ Subtotal: Rp 1,000,000     │   │
│ │ Diskon:  -Rp 100,000       │   │
│ │ Total:    Rp 900,000       │   │
│ └────────────────────────────┘   │
│                                  │
│ Metode Pembayaran:               │
│ ○ Cash  ○ Debit  ○ Credit  ○ Transfer│
│                                  │
│ Diskon (Optional):               │
│ [Input] [Nominal/Persen]        │
│                                  │
│ Pelanggan (Optional):            │
│ [Nama] [HP]                      │
│                                  │
│ Nominal Pembayaran:              │
│ [Input Besar]                    │
│ [Quick: 900K] [950K] [1M]       │
│                                  │
│ ┌────────────────────────────┐   │
│ │ KEMBALIAN: Rp 100,000      │   │
│ └────────────────────────────┘   │
│                                  │
│ [Batal] [Proses Pembayaran]     │
└──────────────────────────────────┘
```

---

## Component Features

### Stats Cards

- **Icon**: Rounded square dengan warna sesuai
- **Title**: Small gray text
- **Value**: Large bold number
- **Change**: Optional trending indicator
- **Hover**: Elevated shadow + scale icon

### Product Cards

- **Image**: Aspect ratio square dengan hover zoom
- **Name**: 2-line clamp
- **SKU**: Gray text
- **Price**: Large bold
- **Stock**: Color badge (Green/Red/Amber)
- **CTA Button**: Full width dengan icon

### Cart Items

- **Product Image**: Thumbnail
- **Name & Price**: With quantity
- **Qty Controls**: -/+/Manual input buttons
- **Subtotal**: Bold blue text
- **Delete**: Trash icon button
- **Hover**: Subtle background change

### Payment Methods

- **Cards**: Equal width buttons
- **Icons**: Optional payment method icons
- **Selected State**: Blue color + soft background
- **Smooth Transition**: Color fade

---

## Animations & Interactions

### Hover Effects:

```
Cards:        ↑ slight translate + shadow increase
Buttons:      ↑ bg-color darken + scale 0.98
Links:        → underline fade-in
Icons:        ↑ scale 1.1 + slight rotate
```

### Transitions:

```
Default:      duration-200 (quick responsiveness)
Modals:       fade-in + scale from center
Drawers:      slide-in from right (mobile)
Loading:      spin animation (infinit)
```

### Loading States:

```
Spinner:      Animated rotating icon
Text:         "Memuat..." or placeholder
Disabled:     Opacity 50% + cursor-not-allowed
```

---

## Responsive Breakpoints

```
Mobile (< 768px):   1 column grid, drawer cart
Tablet (768-1024px): 2-3 column grid
Desktop (> 1024px):  4 column grid + side cart
```

---

## Dark Mode Colors

```
Background:  dark:bg-slate-900, dark:bg-slate-800
Cards:       dark:bg-slate-800, dark:border-slate-700
Text:        dark:text-white, dark:text-gray-400
Accent:      dark:text-blue-400 (slightly lighter)
```

---

## Nuxt UI Integration

Using Nuxt UI components:

- `<UButton>` - All buttons
- `<UInput>` - Form inputs
- `<USelect>` - Dropdown selects
- `<UIcon>` - Heroicons integration
- `<UModal>` - Payment modal
- `<USlideover>` - Mobile cart drawer
- `<UButtonGroup>` - Payment method selector

---

## Performance Tips

1. **Lazy Loading**: Product images use lazy loading
2. **Computed**: Filtered products computed reactively
3. **Watchers**: Auto-refresh on store change
4. **Debouncing**: Search input dapat di-debounce jika diperlukan
5. **v-if vs v-show**: Empty states use v-if, modal use v-model

---

## Next Enhancements

1. 🖨️ Print receipt modal
2. 📊 Dashboard charts & graphs
3. 🔍 Advanced product filtering
4. 💾 Transaction history export
5. 👥 Customer profile & history
6. 📦 Inventory management
7. 💳 Multiple payment gateway integration
8. 📱 Progressive Web App features

---

**Version**: 1.0
**Last Updated**: January 2026
**Status**: Production Ready ✅
