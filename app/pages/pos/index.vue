<script setup lang="ts">
import { formatCurrency } from "~/utils/helpers";

definePageMeta({ layout: "default" });

useHead({ title: "Kasir - POS" });

const { store, printerSettings } = useStore();
const { products, fetchProducts } = useProducts();
const {
  cart,
  cartSubtotal,
  cartItemsCount,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  createTransaction,
} = useTransactions();
const { categories, fetchCategories } = useCategories();
const toast = useToast();
const { activeShift, fetchActiveShift, openShift, updateShift, closeShift, calculateExpectedBalance, error: shiftError } = useShifts();
const isEditingShift = ref(false);
const hasPromptedShift = ref(false);

// Shift State
const showOpenShiftModal = ref(false);
const showCloseShiftModal = ref(false);
const openingBalance = ref("0");
const actualBalance = ref("0");
const shiftNotes = ref("");
const expectedBalance = ref(0);
const shiftLoading = ref(false);
const isMounted = ref(false);

// Get enabled payment methods and bank accounts from store
const enabledPaymentMethods = computed(() => {
  if (!store.value) return [];
  const storeData = store.value as any;
  if (storeData.enabled_payment_methods) {
    try {
      const parsed =
        typeof storeData.enabled_payment_methods === "string"
          ? JSON.parse(storeData.enabled_payment_methods)
          : storeData.enabled_payment_methods;
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
});

const bankAccounts = computed(() => {
  if (!store.value) return [];
  const storeData = store.value as any;
  if (storeData.bank_accounts) {
    try {
      const parsed =
        typeof storeData.bank_accounts === "string"
          ? JSON.parse(storeData.bank_accounts)
          : storeData.bank_accounts;
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
});

const showProductImages = computed(() => {
  if (!store.value) return true;
  const storeData = store.value as any;
  return storeData.show_product_images !== false;
});

// Get discount & tax settings from store
const discountTaxSettings = computed(() => {
  const defaults = {
    discount_global: { enabled: false, type: "percent", percent: 0, nominal: 0 },
    discount_nominal: {
      enabled: false,
      min_amount: 0,
      type: "percent",
      discount_percent: 0,
      discount_nominal: 0,
    },
    tax: { enabled: false, percent: 0 },
    ppn: { enabled: false, percent: 0 },
  };

  if (!store.value) {
    return defaults;
  }
  const storeData = store.value as any;
  if (storeData.discount_tax_settings) {
    try {
      const parsed =
        typeof storeData.discount_tax_settings === "string"
          ? JSON.parse(storeData.discount_tax_settings)
          : storeData.discount_tax_settings;
      return {
        ...defaults,
        ...parsed,
        discount_global: {
          ...defaults.discount_global,
          ...(parsed.discount_global || {}),
        },
        discount_nominal: {
          ...defaults.discount_nominal,
          ...(parsed.discount_nominal || {}),
        },
      };
    } catch (e) {
      return defaults;
    }
  }
  return defaults;
});

const filteredPaymentMethods = computed(() => {
  return paymentMethods.filter((method) =>
    enabledPaymentMethods.value.includes(method.value),
  );
});

// Alert State
const alert = reactive({
  show: false,
  type: "success" as "success" | "error",
  message: "",
});

const showAlert = (type: "success" | "error", message: string) => {
  alert.show = true;
  alert.type = type;
  alert.message = message;
  setTimeout(() => (alert.show = false), 3000);
};

const displayPaid = ref("0");
const selectedCategory = ref("all");
const searchQuery = ref("");
const barcodeQuery = ref("");
const quickSaleName = ref("");
const quickSalePrice = ref("");
const displayedProductsCount = ref(8);
const showPaymentModal = ref(false);
const showReceipt = ref(false);
const barcodeInputRef = ref<HTMLInputElement | null>(null);
const barcodeVideoRef = ref<HTMLVideoElement | null>(null);
const showBarcodeScanner = ref(false);
let barcodeControls: { stop: () => void } | null = null;

interface TransactionReceipt {
  id: string;
  created_at: string;
  transaction_number: string;
  items: {
    product_name: string;
    product_price: number;
    quantity: number;
    subtotal: number;
  }[];
  subtotal: number;
  discount: number;
  discount_from_settings: number;
  tax: number;
  tax_percentage: number;
  ppn: number;
  ppn_percentage: number;
  total: number;
  paid_amount: number;
  change_amount: number;
  payment_method: string;
  customer_name: string;
}

const lastTransaction = ref<TransactionReceipt | null>(null);
const loading = ref(false);

const formattedPaid = computed({
  get: () => displayPaid.value,
  set: (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    paymentForm.value.paid = parseInt(numericValue) || 0;
    displayPaid.value = numericValue
      ? parseInt(numericValue).toLocaleString("id-ID")
      : "0";
  },
});

const paymentForm = ref({
  paid: 0,
  paymentMethod: "cash",
  customerName: "",
  discount: 0,
  discountType: "nominal" as "nominal" | "percent",
  selectedBankAccount: "",
});

const filteredProducts = computed(() => {
  let result = products.value || [];

  if (selectedCategory.value === "favorite") {
    result = result.filter((p) => p.is_favorite === true);
  } else if (selectedCategory.value !== "all") {
    result = result.filter((p) => p.category_id === selectedCategory.value);
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q),
    );
  }
  return result;
});

const displayedProducts = computed(() => {
  return filteredProducts.value.slice(0, displayedProductsCount.value);
});

const hasMoreProducts = computed(() => {
  return displayedProductsCount.value < filteredProducts.value.length;
});

const discountAmount = computed(() => {
  if (paymentForm.value.discountType === "percent") {
    return Math.round(cartSubtotal.value * (paymentForm.value.discount / 100));
  }
  return paymentForm.value.discount || 0;
});

const settingsDiscount = computed(() => {
  let discount = 0;
  const subtotal = cartSubtotal.value;
  const globalDiscount = discountTaxSettings.value.discount_global;
  const minimumDiscount = discountTaxSettings.value.discount_nominal;

  if (globalDiscount.enabled) {
    if (globalDiscount.type === "nominal") {
      discount += Number(globalDiscount.nominal || 0);
    } else {
      discount += Math.round(subtotal * (Number(globalDiscount.percent || 0) / 100));
    }
  }

  if (
    minimumDiscount.enabled &&
    subtotal >= Number(minimumDiscount.min_amount || 0)
  ) {
    if (minimumDiscount.type === "nominal") {
      discount += Number(minimumDiscount.discount_nominal || 0);
    } else {
      discount += Math.round(
        subtotal * (Number(minimumDiscount.discount_percent || 0) / 100),
      );
    }
  }

  return Math.min(discount, subtotal);
});

const settingsDiscountLabel = computed(() => {
  const parts: string[] = [];
  const globalDiscount = discountTaxSettings.value.discount_global;
  const minimumDiscount = discountTaxSettings.value.discount_nominal;

  if (globalDiscount.enabled) {
    parts.push(
      globalDiscount.type === "nominal"
        ? formatCurrency(Number(globalDiscount.nominal || 0))
        : `${globalDiscount.percent || 0}%`,
    );
  }

  if (minimumDiscount.enabled) {
    parts.push(
      minimumDiscount.type === "nominal"
        ? formatCurrency(Number(minimumDiscount.discount_nominal || 0))
        : `${minimumDiscount.discount_percent || 0}%`,
    );
  }

  return parts.length ? `Diskon Sistem (${parts.join(" + ")})` : "Diskon Sistem";
});

const subtotalAfterDiscount = computed(() => {
  return Math.max(
    0,
    cartSubtotal.value - discountAmount.value - settingsDiscount.value,
  );
});

const taxAmount = computed(() => {
  if (discountTaxSettings.value.tax.enabled) {
    return Math.round(
      subtotalAfterDiscount.value *
        (discountTaxSettings.value.tax.percent / 100),
    );
  }
  return 0;
});

const ppnAmount = computed(() => {
  if (discountTaxSettings.value.ppn.enabled) {
    return Math.round(
      subtotalAfterDiscount.value *
        (discountTaxSettings.value.ppn.percent / 100),
    );
  }
  return 0;
});

const cartTotal = computed(
  () => subtotalAfterDiscount.value + taxAmount.value + ppnAmount.value,
);

const changeAmount = computed(() =>
  Math.max(0, paymentForm.value.paid - cartTotal.value),
);

const quickCashAmounts = computed(() => {
  const total = cartTotal.value;
  const amounts = [
    Math.ceil(total / 1000) * 1000,
    Math.ceil(total / 5000) * 5000,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 50000) * 50000,
  ];
  return [...new Set(amounts)].sort((a, b) => a - b).slice(0, 6);
});

const handleAddToCart = (product: any) => {
  try {
    addToCart(product);
  } catch (e) {
    showAlert("error", "Gagal menambahkan produk");
  }
};

const findProductByBarcode = (code: string) => {
  const normalizedCode = code.trim().toLowerCase();
  return (products.value || []).find(
    (product: any) => (product.sku || "").trim().toLowerCase() === normalizedCode,
  );
};

const handleBarcodeSubmit = () => {
  const code = barcodeQuery.value.trim();
  if (!code) return;

  const product = findProductByBarcode(code);
  if (!product) {
    showAlert("error", "Barcode belum ada di data barang");
    barcodeQuery.value = "";
    barcodeInputRef.value?.focus();
    return;
  }

  handleAddToCart(product);
  barcodeQuery.value = "";
  barcodeInputRef.value?.focus();
};

const stopBarcodeCamera = () => {
  barcodeControls?.stop();
  barcodeControls = null;
  showBarcodeScanner.value = false;
};

const startBarcodeCamera = async () => {
  if (!process.client) return;

  try {
    showBarcodeScanner.value = true;
    await nextTick();
    if (!barcodeVideoRef.value) return;

    const { BrowserMultiFormatReader } = await import("@zxing/browser");
    const reader = new BrowserMultiFormatReader();
    barcodeControls = await reader.decodeFromConstraints(
      {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      },
      barcodeVideoRef.value,
      (result: any) => {
        const rawValue = result?.getText?.();
        if (rawValue) {
          barcodeQuery.value = rawValue;
          stopBarcodeCamera();
          handleBarcodeSubmit();
        }
      },
    );
  } catch (e) {
    stopBarcodeCamera();
    showAlert("error", "Kamera tidak bisa dibuka");
  }
};

const addQuickSale = () => {
  const price = parseInt(quickSalePrice.value.replace(/\D/g, "")) || 0;
  if (price <= 0) {
    showAlert("error", "Isi nominal jual cepat dulu");
    return;
  }

  addToCart({
    id: null,
    is_quick_sale: true,
    name: quickSaleName.value.trim() || "Jual Cepat",
    sku: null,
    price,
    image_url: null,
    has_stock: false,
    stock: 0,
  });

  quickSaleName.value = "";
  quickSalePrice.value = "";
};

const openPayment = () => {
  if (!cart.value.length) return;
  paymentForm.value.paid = cartTotal.value;
  displayPaid.value = cartTotal.value.toLocaleString("id-ID");
  showPaymentModal.value = true;
};

const setExactAmount = () => {
  paymentForm.value.paid = cartTotal.value;
  displayPaid.value = cartTotal.value.toLocaleString("id-ID");
};

const processPayment = async () => {
  if (!activeShift.value) {
    showAlert("error", "Shift kasir harus dibuka terlebih dahulu!");
    showOpenShiftModal.value = true;
    return;
  }
  if (!cart.value.length) return;

  const total = cartTotal.value;
  const paid = paymentForm.value.paid;

  if (paid < total && paymentForm.value.paymentMethod === "cash") {
    showAlert("error", "Pembayaran kurang dari total belanja");
    return;
  }

  // ✅ EDIT: Snapshot cart items SEBELUM createTransaction
  // Deep copy cart untuk menghindari referensi yang berubah
  const snapshotItems = JSON.parse(JSON.stringify(cart.value.map((item) => ({
    product_name: item.product_name,
    product_price: item.product_price,
    quantity: item.quantity,
    subtotal: item.subtotal,
  }))));

  // Snapshot data lainnya
  const currentSubtotal = cartSubtotal.value;
  const currentTotal = cartTotal.value;
  const currentPaid = paymentForm.value.paid;
  const currentChange = changeAmount.value;
  const currentPaymentMethod = paymentForm.value.paymentMethod;
  const currentCustomerName = paymentForm.value.customerName;
  const currentDiscount = discountAmount.value;
  const currentSettingsDiscount = settingsDiscount.value;
  const currentTax = taxAmount.value;
  const currentPpn = ppnAmount.value;

  loading.value = true;
  try {
    const transactionPayload = {
      paid: currentPaid,
      payment_method: currentPaymentMethod,
      discount: currentDiscount,
      discount_type: paymentForm.value.discountType,
      discount_from_settings: currentSettingsDiscount,
      tax: currentTax,
      tax_percentage: discountTaxSettings.value.tax.percent,
      ppn: currentPpn,
      ppn_percentage: discountTaxSettings.value.ppn.percent,
      customer_name: currentCustomerName,
    };

    const result = await createTransaction(transactionPayload);

    // ✅ EDIT: Gunakan snapshot items yang sudah disimpan sebelumnya
    lastTransaction.value = {
      id: result?.id || `TRX-${Date.now().toString().slice(-8)}`,
      created_at: new Date().toISOString(),
      transaction_number:
        result?.transaction_number ||
        result?.id ||
        `TRX-${Date.now().toString().slice(-8)}`,
      items: snapshotItems, // ← Gunakan snapshot yang sudah dibuat sebelum cart di-clear
      subtotal: currentSubtotal,
      discount: currentDiscount,
      discount_from_settings: currentSettingsDiscount,
      tax: currentTax,
      tax_percentage: discountTaxSettings.value.tax.percent,
      ppn: currentPpn,
      ppn_percentage: discountTaxSettings.value.ppn.percent,
      total: currentTotal,
      paid_amount: currentPaid,
      change_amount: currentChange,
      payment_method: currentPaymentMethod,
      customer_name: currentCustomerName,
    } as any;

    // Reset Form
    paymentForm.value = {
      paid: 0,
      paymentMethod: "cash",
      customerName: "",
      discount: 0,
      discountType: "nominal",
      selectedBankAccount: "",
    };
    displayPaid.value = "0";
    showPaymentModal.value = false;

    // Refresh products
    await fetchProducts();

    // Tampilkan Struk
    showReceipt.value = true;

    showAlert("success", "Transaksi Berhasil Disimpan");
  } catch (error: any) {
    showAlert("error", error.message || "Gagal Memproses Transaksi");
  } finally {
    loading.value = false;
  }
};

const printReceipt = async () => {
  const content = document.getElementById("receipt-content")?.innerHTML;
  const printWindow = window.open("", "", "height=600,width=400");
  if (printWindow && content) {
    printWindow.document.write("<html><head><title>Struk Belanja</title>");
    printWindow.document.write(
      "<style>body{font-family:monospace; font-size: 12px; text-align: center;} .flex{display:flex; justify-content:space-between;} .bold{font-weight:bold;} hr{border-top: 1px dashed #000; border-bottom: none;} img{max-width: 80px; margin: 0 auto; display: block;}</style>",
    );
    printWindow.document.write("</head><body>");
    printWindow.document.write(content);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.print();
  }
};

// Copy Receipt Link
const copyReceiptLink = () => {
  if (!lastTransaction.value) return;
  
  const protocol = window.location.protocol;
  const host = window.location.host;
  const url = `${protocol}//${host}/nota/${lastTransaction.value.transaction_number}`;
  
  navigator.clipboard.writeText(url).then(() => {
    toast.add({
      title: "Berhasil",
      description: "Link nota online telah disalin",
      color: "success",
      icon: "i-heroicons-check-circle",
    });
  }).catch(() => {
    toast.add({
      title: "Gagal",
      description: "Gagal menyalin link",
      color: "error",
      icon: "i-heroicons-x-circle",
    });
  });
};

// --- Shift Logic ---
const handleOpenShift = async () => {
  const balance = parseInt(openingBalance.value.replace(/\D/g, "")) || 0;
  const name = shiftNotes.value.trim();
  
  if (!name) {
    showAlert("error", "Harap masukkan Nama Operator/Kasir.");
    return;
  }

  shiftLoading.value = true;
  try {
    if (isEditingShift.value && activeShift.value) {
      await updateShift(activeShift.value.id, {
        opening_balance: balance,
        notes: `Kasir: ${name}`
      });
      toast.add({
        title: "Perubahan Disimpan",
        description: `Operator: ${name} | Modal: ${formatCurrency(balance)}`,
        icon: "i-heroicons-check-circle",
        color: "success"
      });
    } else {
      await openShift(balance, `Kasir: ${name}`);
      toast.add({
        title: "Kasir Berhasil Dibuka",
        description: `Operator: ${name} | Modal: ${formatCurrency(balance)}`,
        icon: "i-heroicons-check-circle",
        color: "success"
      });
    }
    showOpenShiftModal.value = false;
    openingBalance.value = "0";
    isEditingShift.value = false;
  } catch (e: any) {
    toast.add({
      title: isEditingShift.value ? "Gagal Update Shift" : "Gagal Membuka Kasir",
      description: e.message || "Terjadi kesalahan pada server.",
      color: "error"
    });
  } finally {
    shiftLoading.value = false;
  }
};

const handleEditShift = () => {
  if (!activeShift.value) return;
  
  isEditingShift.value = true;
  openingBalance.value = activeShift.value.opening_balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  
  // Extract name from "Kasir: Name - Description" or "Kasir: Name"
  const rawNotes = activeShift.value.notes || "";
  const nameMatch = rawNotes.match(/^Kasir:\s*(.*?)(?:\s*-\s*.*|$)/);
  shiftNotes.value = nameMatch ? nameMatch[1].trim() : "";
  
  showOpenShiftModal.value = true;
};

const handlePrepareCloseShift = async () => {
  shiftLoading.value = true;
  try {
    expectedBalance.value = await calculateExpectedBalance(activeShift.value);
    actualBalance.value = expectedBalance.value.toString();
    // Pre-fill notes with the cashier name if it exists
    if (activeShift.value?.notes) {
      shiftNotes.value = activeShift.value.notes + " - ";
    }
    showCloseShiftModal.value = true;
  } catch (e: any) {
    toast.add({
      title: "Gagal",
      description: "Gagal menghitung saldo: " + e.message,
      color: "error"
    });
  } finally {
    shiftLoading.value = false;
  }
};

const handleCloseShift = async () => {
  const actual = parseInt(actualBalance.value.replace(/\D/g, "")) || 0;
  shiftLoading.value = true;
  try {
    await closeShift(actual, shiftNotes.value);
    showCloseShiftModal.value = false;
    actualBalance.value = "0";
    shiftNotes.value = "";
    toast.add({
      title: "Kasir Berhasil Ditutup",
      description: "Shift hari ini telah berakhir.",
      icon: "i-heroicons-check-circle",
      color: "success"
    });
    // Auto-prompt to open new shift if they want
    hasPromptedShift.value = false; // Reset prompt so it can show once more if needed
    setTimeout(() => {
      showOpenShiftModal.value = true;
    }, 500);
  } catch (e: any) {
    toast.add({
      title: "Gagal",
      description: e.message || "Gagal menutup kasir",
      color: "error"
    });
  } finally {
    shiftLoading.value = false;
  }
};

const checkAndPromptShift = async (retryCount = 0) => {
  // If we already have a session in memory, don't follow the heavy check
  if (activeShift.value || hasPromptedShift.value) {
    if (activeShift.value) hasPromptedShift.value = true;
    return;
  }
  
  // Wait for user session to be available
  const user = useSupabaseUser();
  if (!user.value && retryCount < 5) {
    setTimeout(() => checkAndPromptShift(retryCount + 1), 500);
    return;
  }

  // Force a fresh check from DB only if memory is empty
  loading.value = true;
  try {
    const shift = await fetchActiveShift();
    
    if (!activeShift.value && !showOpenShiftModal.value) {
      showOpenShiftModal.value = true;
    }
    hasPromptedShift.value = true;
  } catch (e) {
    console.warn("Silent shift check failed", e);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  isMounted.value = true;
  if (!store.value) {
    await useStore().fetchStore();
  }

  if (store.value) {
    await Promise.all([fetchCategories(), fetchProducts()]);
    await checkAndPromptShift();
  }
});

watch(
  () => store.value,
  async (val) => {
    if (val?.id && process.client) {
       await Promise.all([fetchCategories(), fetchProducts()]);
       await checkAndPromptShift();
    }
  },
  { immediate: false },
);

onUnmounted(() => {
  stopBarcodeCamera();
});
</script>

<template>
  <!-- TEMPLATE TETAP SAMA SEPERTI SEBELUMNYA - TIDAK ADA PERUBAHAN -->
  <div
    class="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] bg-gray-50 gap-0 lg:gap-0"
  >
    <AppAlert
      :show="alert.show"
      :type="alert.type"
      :message="alert.message"
      @close="alert.show = false"
    />
    <!-- LEFT: Produk -->
    <div class="flex-1 flex flex-col p-2 sm:p-3 lg:p-4 overflow-hidden">
      <!-- HEADER: Status & Shift -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 px-1">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-200 shrink-0">
            <UIcon name="i-heroicons-shopping-bag" class="w-6 h-6" />
          </div>
          <div>
            <h2 class="text-sm font-black text-gray-800 uppercase tracking-tight">Katalog Produk</h2>
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{{ store?.name || 'Kasir Simple' }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <!-- Shift Info Pill -->
          <div v-if="activeShift" class="flex-1 sm:flex-none flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm shrink-0">
             <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <div class="flex flex-col">
               <div class="flex items-center gap-1">
                 <span class="text-[10px] font-black text-gray-800 uppercase leading-none">
                    {{ activeShift.notes?.split(' - ')[0].replace('Kasir: ', '') || 'Operator' }}
                 </span>
                 <button @click="handleEditShift" class="hover:text-primary-600 text-gray-400 transition-colors">
                    <UIcon name="i-heroicons-pencil-square" class="w-3 h-3" />
                 </button>
               </div>
               <span class="text-[9px] font-bold text-gray-800 uppercase tracking-wider">Modal: {{ formatCurrency(activeShift.opening_balance) }}</span>
             </div>
          </div>

          <!-- Shift Action Button -->
          <UButton
            v-if="activeShift"
            label="TUTUP"
            color="error"
            variant="soft"
            icon="i-heroicons-lock-closed"
            class="font-black text-[10px]"
            size="md"
            :loading="shiftLoading"
            @click="handlePrepareCloseShift"
          />
          <UButton
            v-else
            label="BUKA KASIR"
            color="primary"
            variant="solid"
            icon="i-heroicons-key"
            class="font-black text-[10px] shadow-lg shadow-primary-200"
            size="sm"
            @click="showOpenShiftModal = true"
          />
        </div>
      </div>

      <!-- Aksi Cepat Kasir -->
      <div class="bg-white rounded-2xl shadow-sm p-3 sm:p-4 mb-4 border border-gray-100">
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-3">
          <form class="flex gap-2" @submit.prevent="handleBarcodeSubmit">
            <div class="relative flex-1">
              <UIcon
                name="i-heroicons-qr-code"
                class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-500"
              />
              <input
                ref="barcodeInputRef"
                v-model="barcodeQuery"
                inputmode="numeric"
                autocomplete="off"
                placeholder="Scan barcode..."
                class="w-full h-12 pl-10 pr-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-primary-500 focus:bg-white transition-all outline-none text-base font-black"
              />
            </div>
            <UButton
              type="button"
              icon="i-heroicons-camera"
              color="neutral"
              variant="soft"
              size="xl"
              class="font-black px-4"
              @click="startBarcodeCamera"
            />
            <UButton
              type="submit"
              icon="i-heroicons-plus"
              color="primary"
              size="xl"
              class="font-black px-4"
            />
          </form>

          <form class="grid grid-cols-[1fr_1fr_auto] gap-2" @submit.prevent="addQuickSale">
            <input
              v-model="quickSaleName"
              placeholder="Nama bebas"
              class="h-12 min-w-0 px-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-emerald-500 focus:bg-white transition-all outline-none text-sm font-bold"
            />
            <input
              v-model="quickSalePrice"
              inputmode="numeric"
              placeholder="Nominal"
              class="h-12 min-w-0 px-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-emerald-500 focus:bg-white transition-all outline-none text-sm font-black"
            />
            <UButton
              type="submit"
              icon="i-heroicons-bolt"
              color="success"
              size="xl"
              class="font-black px-4"
            />
          </form>
        </div>
      </div>

      <!-- Search & Kategori -->
      <div class="bg-white rounded-2xl shadow-sm p-3 sm:p-5 mb-4 border border-gray-100">
        <!-- Search Bar -->
        <div class="relative mb-5 group">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
            <UIcon name="i-heroicons-magnifying-glass" class="w-5 h-5" />
          </div>
          <input
            v-model="searchQuery"
            placeholder="Cari menu atau barang..."
            class="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-50 rounded-xl focus:border-primary-500 focus:bg-white transition-all outline-none text-sm font-medium"
            type="search"
          />
        </div>

        <!-- Kategori Button -->
        <div class="flex gap-2 items-center overflow-x-auto pb-1 scrollbar-hide">
          

          <UButton
            label="Semua"
            size="lg"
            :color="selectedCategory === 'all' ? 'primary' : 'info'"
            :variant="selectedCategory === 'all' ? 'solid' : 'soft'"
            @click="selectedCategory = 'all'"
            class="flex-shrink-0"
          />
          <UButton
            label="⭐ Favorit"
            size="lg"
            :color="selectedCategory === 'favorite' ? 'warning' : 'info'"
            :variant="selectedCategory === 'favorite' ? 'solid' : 'soft'"
            @click="selectedCategory = 'favorite'"
            class="flex-shrink-0"
          />
          <UButton
            v-for="cat in categories"
            :key="cat.id"
            :label="cat.name"
            size="lg"
            :color="selectedCategory === cat.id ? 'primary' : 'info'"
            :variant="selectedCategory === cat.id ? 'solid' : 'soft'"
            @click="selectedCategory = cat.id"
            class="flex-shrink-0"
          />
        </div>
      </div>

      <!-- Grid Produk -->
      <div class="flex-1 overflow-y-auto flex flex-col">
        <div
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 p-2 sm:p-3"
        >
          <div
            v-for="product in displayedProducts"
            :key="product.id"
            @click="handleAddToCart(product)"
            class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer active:scale-95 transition-transform hover:shadow-md hover:border-primary-200"
            :class="{
              'opacity-50 pointer-events-none': product.stock === 0,
            }"
          >
            <!-- Gambar Produk -->
            <div
              v-if="showProductImages"
              class="relative bg-gray-100 aspect-square flex items-center justify-center overflow-hidden"
            >
              <img
                v-if="product.image_url"
                :src="product.image_url"
                class="w-full h-full object-cover hover:scale-105 transition-transform"
                :alt="product.name"
              />
              <UIcon
                v-else
                name="i-heroicons-photo"
                class="w-10 sm:w-12 h-10 sm:h-12 text-gray-300"
              />

              <!-- Stock Badge -->
              <div
                v-if="product.has_stock"
                class="absolute bottom-0 left-0 right-0 text-center text-xs font-bold py-1"
                :class="{
                  'bg-green-500 text-white': product.stock > 10,
                  'bg-orange-500 text-white':
                    product.stock > 0 && product.stock <= 10,
                  'bg-red-600 text-white': product.stock === 0,
                }"
              >
                {{ product.stock === 0 ? "HABIS" : `Stok: ${product.stock}` }}
              </div>
            </div>

            <!-- Info Produk -->
            <div
              :class="
                showProductImages
                  ? 'p-3 text-center'
                  : 'p-4 text-center flex flex-col justify-between h-full'
              "
            >
              <p
                class="text-xs sm:text-sm font-bold text-gray-800 line-clamp-2 mb-2"
              >
                {{ product.name }}
              </p>
              <div class="space-y-2">
                <p class="text-sm sm:text-base font-black text-primary-600">
                  {{ formatCurrency(product.price) }}
                </p>
                <!-- Stock Info when no image -->
                <div
                  v-if="!showProductImages && product.has_stock"
                  class="text-xs font-bold py-1 rounded"
                  :class="{
                    'text-green-600': product.stock > 10,
                    'text-orange-600': product.stock > 0 && product.stock <= 10,
                    'text-red-600': product.stock === 0,
                  }"
                >
                  {{ product.stock === 0 ? "HABIS" : `Stok: ${product.stock}` }}
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-if="!filteredProducts.length"
            class="col-span-full py-12 sm:py-16 text-center text-gray-400"
          >
            <UIcon
              name="i-heroicons-cube"
              class="w-16 h-16 mx-auto mb-3 opacity-50"
            />
            <p class="font-bold text-lg">Tidak ada produk</p>
            <p class="text-sm mt-1">Coba kata kunci lain</p>
          </div>
        </div>

        <!-- Load More Button -->
        <div v-if="hasMoreProducts" class="p-3 text-center">
          <button
            @click="displayedProductsCount += 8"
            class="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
          >
            📦 Tampilkan Lebih Banyak ({{
              filteredProducts.length - displayedProductsCount
            }})
          </button>
        </div>
      </div>
    </div>

    <!-- RIGHT: Keranjang -->
    <div class="lg:w-96 lg:border-l border-gray-200 bg-white flex flex-col">
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 flex-shrink-0">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <UIcon
              name="i-heroicons-shopping-cart"
              class="w-6 h-6 text-primary-600"
            />
            <div>
              <p class="font-black text-base">KERANJANG</p>
              <p class="text-xs text-gray-500">{{ cartItemsCount }} item</p>
            </div>
          </div>
          <UButton
            color="error"
            variant="soft"
            icon="i-heroicons-trash"
            size="lg"
            @click="clearCart"
          />
        </div>
      </div>

      <!-- Cart Items -->
      <div class="flex-1 overflow-y-auto p-3 space-y-3">
        <div
          v-if="!cart.length"
          class="text-center py-12 text-gray-400 h-full flex flex-col items-center justify-center"
        >
          <UIcon
            name="i-heroicons-shopping-bag"
            class="w-16 h-16 mx-auto mb-3 opacity-50"
          />
          <p class="text-sm font-bold">Keranjang Kosong</p>
          <p class="text-xs mt-1">Pilih produk untuk mulai transaksi</p>
        </div>

        <div
          class="overflow-y-auto p-2 sm:p-3 space-y-2 sm:space-y-3"
          style="max-height: 300px"
        >
          <div
            v-for="item in cart"
            :key="item.cart_line_id"
            class="flex items-center gap-3 bg-gray-50 p-3 rounded-xl"
          >
            <div class="flex-1 min-w-0">
              <p class="font-bold text-sm text-gray-800 truncate">
                {{ item.product_name }}
              </p>
              <p class="text-xs text-gray-500">
                {{ formatCurrency(item.product_price) }}
              </p>
            </div>
            <div
              class="flex items-center bg-white rounded-lg border-2 border-gray-200"
            >
              <button
                @click="
                  updateCartItemQuantity(item.cart_line_id, item.quantity - 1)
                "
                class="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 font-bold text-lg active:scale-90 transition-all"
              >
                −
              </button>
              <span class="w-10 text-center font-black text-sm">{{
                item.quantity
              }}</span>
              <button
                @click="
                  updateCartItemQuantity(item.cart_line_id, item.quantity + 1)
                "
                class="w-8 h-8 flex items-center justify-center text-primary-600 hover:bg-primary-50 font-bold text-lg active:scale-90 transition-all"
              >
                +
              </button>
            </div>
            <button
              @click="removeFromCart(item.cart_line_id)"
              class="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-100 rounded-lg font-bold text-lg transition-all"
              title="Hapus dari keranjang"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-gray-200 bg-gray-50 space-y-3">
          <!-- Discount Info -->
          <div
            v-if="settingsDiscount > 0 || discountAmount > 0"
            class="bg-orange-50 p-3 rounded-lg border border-orange-200"
          >
            <p class="text-xs font-semibold text-orange-700 mb-1">
              ✨ Diskon Diterapkan:
            </p>
            <div class="space-y-1 text-sm">
              <div
                v-if="discountAmount > 0"
                class="flex justify-between text-orange-600"
              >
                <span>Diskon Manual</span>
                <span class="font-bold"
                  >-{{ formatCurrency(discountAmount) }}</span
                >
              </div>
              <div
                v-if="settingsDiscount > 0"
                class="flex justify-between text-orange-600"
              >
                <span>Diskon Sistem</span>
                <span class="font-bold"
                  >-{{ formatCurrency(settingsDiscount) }}</span
                >
              </div>
            </div>
          </div>

          <!-- Total -->
          <div
            class="flex justify-between items-center text-xl font-black bg-gradient-to-br from-primary-50 to-primary-100 p-5 rounded-2xl border-2 border-primary-200"
          >
            <span class="text-gray-700">TOTAL</span>
            <span class="text-primary-700 text-2xl">{{
              formatCurrency(cartTotal)
            }}</span>
          </div>

          <!-- Payment Buttons -->
          <div class="grid grid-cols-2 gap-2">
            <UButton
              label="TUNAI PAS"
              color="success"
              size="xl"
              block
              :disabled="!cart.length"
              @click="
                setExactAmount();
                processPayment();
              "
              class="font-black"
            />
            <UButton
              label="BAYAR"
              color="primary"
              size="xl"
              block
              :disabled="!cart.length"
              @click="openPayment"
              class="font-black"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Scan Barcode -->
    <Teleport to="body">
      <div
        v-if="showBarcodeScanner"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
        @click.self="stopBarcodeCamera"
      >
        <div class="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div class="flex items-center justify-between border-b border-gray-200 p-4">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-qr-code" class="h-5 w-5 text-primary-600" />
              <p class="text-sm font-black text-gray-900">SCAN BARCODE</p>
            </div>
            <UButton
              icon="i-heroicons-x-mark"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="stopBarcodeCamera"
            />
          </div>
          <div class="relative aspect-[3/4] bg-black">
            <video
              ref="barcodeVideoRef"
              class="h-full w-full object-cover"
              autoplay
              muted
              playsinline
            />
            <div class="absolute inset-x-8 top-1/2 h-28 -translate-y-1/2 rounded-xl border-2 border-white shadow-[0_0_0_999px_rgba(0,0,0,0.35)]"></div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Pembayaran - SAMA, TIDAK ADA PERUBAHAN -->
    <Teleport to="body">
      <div
        v-if="showPaymentModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="showPaymentModal = false"
      >
        <div
          class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-[scale-in_0.2s_ease-out]"
        >
          <!-- Header -->
          <div
            class="p-6 border-b border-gray-200 text-center sticky top-0 bg-white z-10 rounded-t-2xl"
          >
            <h3 class="text-2xl font-black text-gray-800">PEMBAYARAN</h3>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-4">
            <!-- Breakdown Detail -->
            <div
              class="bg-gray-50 rounded-2xl border border-gray-200 p-4 space-y-2 text-sm"
            >
              <div class="flex justify-between">
                <span class="text-gray-600">Subtotal</span>
                <span class="font-bold text-gray-900">{{
                  formatCurrency(cartSubtotal)
                }}</span>
              </div>

              <div
                v-if="discountAmount > 0"
                class="flex justify-between text-orange-600"
              >
                <span>Diskon Manual</span>
                <span class="font-bold"
                  >-{{ formatCurrency(discountAmount) }}</span
                >
              </div>

              <div
                v-if="settingsDiscount > 0"
                class="flex justify-between text-orange-600"
              >
                <span>{{ settingsDiscountLabel }}</span>
                <span class="font-bold"
                  >-{{ formatCurrency(settingsDiscount) }}</span
                >
              </div>

              <div
                v-if="taxAmount > 0"
                class="flex justify-between text-blue-600"
              >
                <span>Pajak ({{ discountTaxSettings.tax.percent }}%)</span>
                <span class="font-bold">+{{ formatCurrency(taxAmount) }}</span>
              </div>

              <div
                v-if="ppnAmount > 0"
                class="flex justify-between text-blue-600"
              >
                <span>PPN ({{ discountTaxSettings.ppn.percent }}%)</span>
                <span class="font-bold">+{{ formatCurrency(ppnAmount) }}</span>
              </div>

              <div
                class="border-t border-gray-300 pt-2 mt-2 flex justify-between"
              >
                <span class="font-bold text-gray-900">Total</span>
                <span class="font-black text-lg text-gray-900">{{
                  formatCurrency(cartTotal)
                }}</span>
              </div>
            </div>

            <!-- Total Tagihan -->
            <div
              class="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200"
            >
              <p class="text-xs font-bold text-blue-600 uppercase mb-2">
                Total Bayar
              </p>
              <h2 class="text-5xl font-black text-blue-700">
                {{ formatCurrency(cartTotal) }}
              </h2>
              <p class="text-sm text-blue-600 mt-2 font-medium">
                {{ cartItemsCount }} item
              </p>
            </div>

            <!-- Nama Pelanggan -->
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">
                👤 Nama Pelanggan (Opsional)
              </label>
              <input
                v-model="paymentForm.customerName"
                placeholder="Masukkan nama pelanggan..."
                class="w-full px-4 py-3 text-blue-700 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <!-- Metode Pembayaran -->
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">
                💳 Metode Pembayaran
              </label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="method in filteredPaymentMethods"
                  :key="method.value"
                  @click="paymentForm.paymentMethod = method.value"
                  class="px-4 py-3 rounded-xl border-2 font-bold text-base transition-all active:scale-95"
                  :class="
                    paymentForm.paymentMethod === method.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                  "
                >
                  {{ method.label }}
                </button>
              </div>
            </div>

            <!-- Bank Account Selection -->
            <div
              v-if="
                paymentForm.paymentMethod === 'card' && bankAccounts.length > 0
              "
            >
              <label class="block text-sm font-bold text-gray-700 mb-2">
                🏦 Pilih Rekening
              </label>
              <select
                v-model="paymentForm.selectedBankAccount"
                class="w-full text-black px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Pilih Rekening --</option>
                <option
                  v-for="account in bankAccounts"
                  :key="account.id"
                  :value="account.id"
                >
                  {{ account.bank }} - {{ account.accountName }} ({{
                    account.accountNumber
                  }})
                </option>
              </select>
            </div>

            <!-- Uang Diterima -->
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">
                💵 Uang Diterima
              </label>
              <input
                v-model="formattedPaid"
                type="text"
                placeholder="0"
                class="w-full px-4 text-blue-700 py-4 text-3xl font-black text-center rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none"
              />

              <!-- Quick Cash -->
              <div class="grid grid-cols-3 gap-2 mt-3">
                <button
                  v-for="amt in quickCashAmounts"
                  :key="amt"
                  @click="
                    paymentForm.paid = amt;
                    displayPaid = amt.toLocaleString('id-ID');
                  "
                  class="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs active:scale-95 transition-all"
                >
                  {{ formatCurrency(amt) }}
                </button>
              </div>
            </div>

            <!-- Kembalian -->
            <div class="bg-green-50 p-5 rounded-2xl border-2 border-green-200">
              <div class="flex justify-between items-center">
                <span class="font-black text-green-700 text-lg"
                  >💰 Kembalian</span
                >
                <span class="text-4xl font-black text-green-700">
                  {{ formatCurrency(changeAmount) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="p-6 border-t border-gray-200 sticky bottom-0 bg-white rounded-b-2xl"
          >
            <div class="flex gap-2">
              <button
                @click="showPaymentModal = false"
                class="flex-1 px-6 py-4 border-2 border-red-400 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg active:scale-95 transition-all"
              >
                BATAL
              </button>
              <button
                @click="processPayment"
                :disabled="
                  (paymentForm.paid < cartTotal &&
                    paymentForm.paymentMethod === 'cash') ||
                  loading
                "
                class="flex-1 px-6 py-4 rounded-xl font-black text-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                :class="
                  (paymentForm.paid < cartTotal &&
                    paymentForm.paymentMethod === 'cash') ||
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                "
              >
                <span v-if="loading">⏳</span>
                <span v-else>✓</span>
                SELESAI
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body" v-if="isMounted">
      <!-- Modal Buka Kasir -->
      <div v-if="showOpenShiftModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-[scale-in_0.2s_ease-out]">
            <div class="flex items-center justify-between mb-6">
              <div class="flex-1"></div>
              <div class="text-center w-full">
                <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UIcon :name="isEditingShift ? 'i-heroicons-pencil-square' : 'i-heroicons-key'" class="w-8 h-8" />
                </div>
                <h3 class="text-2xl font-black text-gray-800">{{ isEditingShift ? 'Edit Kasir' : 'Buka Kasir' }}</h3>
                <p class="text-gray-500 text-sm font-medium">{{ isEditingShift ? 'Perbarui modal atau nama operator' : 'Masukkan modal awal uang tunai' }}</p>
              </div>
              <div class="flex-1 flex justify-end">
                <button @click="showOpenShiftModal = false; isEditingShift = false" class="text-gray-400 hover:text-gray-600 p-2">
                  <UIcon name="i-heroicons-x-mark" class="w-6 h-6" />
                </button>
              </div>
            </div>
          
          <div class="space-y-6">
            <div v-if="shiftError" class="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-bold">
              ⚠️ {{ shiftError }}
            </div>

            <div>
              <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">NAMA OPERATOR / KASIR</label>
              <input
                v-model="shiftNotes"
                type="text"
                class="text-black w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none text-lg font-bold text-center"
                placeholder="Contoh: Budi Gunawan"
                autofocus
              />
            </div>

            <div>
              <label class="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">MODAL AWAL (Rp)</label>
              <input
                v-model="openingBalance"
                type="text"
                @input="(e) => openingBalance = (e.target as HTMLInputElement).value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                class="text-black w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none text-2xl font-black text-center"
                placeholder="0"
              />
            </div>
            
            <UButton
              :label="isEditingShift ? 'SIMPAN PERUBAHAN' : 'MULAI SHIFT'"
              color="primary"
              size="xl"
              block
              class="font-black rounded-2xl py-4 shadow-lg shadow-blue-200"
              :loading="shiftLoading"
              @click="handleOpenShift"
            />
          </div>
        </div>
      </div>

      <!-- Modal Tutup Kasir -->
      <div v-if="showCloseShiftModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-[scale-in_0.2s_ease-out]">
          <div class="flex items-center justify-between mb-8">
            <h3 class="text-2xl font-black text-gray-800">Tutup Kasir</h3>
            <button @click="showCloseShiftModal = false" class="text-gray-400 hover:text-gray-600">
              <UIcon name="i-heroicons-x-mark" class="w-6 h-6" />
            </button>
          </div>
          
          <div class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p class="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1">Modal Awal</p>
                <p class="text-lg font-bold text-gray-800">{{ formatCurrency(activeShift?.opening_balance || 0) }}</p>
              </div>
              <div class="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <p class="text-[10px] font-black text-blue-400 tracking-widest uppercase mb-1">Ekspektasi Kas</p>
                <p class="text-lg font-bold text-blue-700">{{ formatCurrency(expectedBalance) }}</p>
              </div>
            </div>

            <div>
              <label class="block text-[10px] font-black text-gray-400 tracking-widest uppercase mb-2">SALDO AKTUAL DI LACI</label>
              <input
                v-model="actualBalance"
                type="text"
                @input="(e) => actualBalance = (e.target as HTMLInputElement).value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')"
                class="text-black w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none text-2xl font-black text-center"
              />
            </div>

            <div>
              <label class="block text-[10px] font-black text-gray-400 tracking-widest uppercase mb-2">CATATAN SHIFT</label>
              <textarea
                v-model="shiftNotes"
                rows="2"
                class="text-black w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none resize-none font-medium text-sm"
                placeholder="Tambahkan info jika ada selisih..."
              ></textarea>
            </div>
            
            <UButton
              label="AKHIRI SHIFT"
              color="error"
              size="xl"
              block
              class="py-4 rounded-2xl font-black text-lg"
              :loading="shiftLoading"
              @click="handleCloseShift"
            />
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Struk - SAMA, TIDAK ADA PERUBAHAN -->
    <Teleport to="body">
      <div
        v-if="showReceipt && lastTransaction"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="showReceipt = false"
      >
        <div
          class="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto flex flex-col"
        >
          <!-- Thermal Printer Receipt Component -->
          <ThermalPrinterReceipt
            :transaction="lastTransaction"
            :store="store"
            :settings="printerSettings || undefined"
            :style="{ width: printerSettings?.paper_width === 80 ? '380px' : '300px' }"
            class="mb-4 mx-auto"
          />

          <!-- Actions -->
          <div class="flex flex-col gap-2">
            <button
              @click="copyReceiptLink"
              class="w-full py-3 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 flex items-center justify-center gap-2 active:scale-95 transition-all border border-blue-200"
            >
              <UIcon name="i-heroicons-share" class="w-5 h-5" />
              SALIN LINK NOTA ONLINE
            </button>
            <div class="flex gap-2">
              <button
                @click="showReceipt = false"
                class="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
              >
                TUTUP
              </button>
              <button
                @click="printReceipt"
                class="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 flex items-center justify-center gap-2"
              >
                <UIcon name="i-heroicons-printer" class="w-5 h-5" />
                PRINT
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Print style untuk cetak struk */
@media print {
  body * {
    visibility: hidden;
  }
  .fixed.inset-0:last-child,
  .fixed.inset-0:last-child * {
    visibility: visible;
  }
  .fixed.inset-0:last-child {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    background: white !important;
  }
}
</style>
