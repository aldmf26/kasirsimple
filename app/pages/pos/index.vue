<script setup lang="ts">
import { formatCurrency } from "~/utils/helpers";

definePageMeta({ layout: "default" });

useHead({ title: "Kasir - POS" });

const { store } = useStore();
const { products, fetchProducts } = useProducts();
const {
  cart,
  cartSubtotal,
  cartItemsCount,
  addToCart,
  updateCartItemQuantity,
  clearCart,
  createTransaction,
} = useTransactions();
const { categories, fetchCategories } = useCategories();

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
const showPaymentModal = ref(false);
const showReceiptModal = ref(false); // Original receipt modal state, will be replaced by showReceipt
const showReceipt = ref(false); // NEW state for the thermal printer style receipt

interface TransactionReceipt {
  id: string;
  receipt_no: string;
  date: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
  subtotal: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  payment_method: string;
  customer_name: string;
}

const lastTransaction = ref<TransactionReceipt | null>(null); // NEW state to store transaction data for the receipt
const loading = ref(false);
const transactionData = ref(null); // untuk simpan data nota (this will be replaced by lastTransaction for the new receipt)

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
});

const filteredProducts = computed(() => {
  let result = products.value || [];
  
  // Filter by favorite first
  if (selectedCategory.value === "favorite") {
    result = result.filter((p) => p.is_favorite === true);
  } else if (selectedCategory.value !== "all") {
    result = result.filter((p) => p.category_id === selectedCategory.value);
  }
  
  // Then filter by search query
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter((p) => p.name.toLowerCase().includes(q));
  }
  return result;
});

const discountAmount = computed(() => {
  if (paymentForm.value.discountType === "percent") {
    return Math.round(cartSubtotal.value * (paymentForm.value.discount / 100));
  }
  return paymentForm.value.discount || 0;
});

const cartTotal = computed(() => cartSubtotal.value - discountAmount.value);

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

const handleAddToCart = (product) => {
  try {
    addToCart(product);
  } catch (e) {
    showAlert("error", "Gagal menambahkan produk");
  }
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
  if (!cart.value.length) return;

  const total = cartTotal.value;
  const paid = paymentForm.value.paid; // Access value from ref

  if (paid < total && paymentForm.value.paymentMethod === "cash") { // Access value from ref
    showAlert("error", "Pembayaran kurang dari total belanja");
    return;
  }

  // Snapshot data sebelum createTransaction (karena cart akan di-clear)
  const currentItems = cart.value.map(item => ({
        name: item.product_name,
        quantity: item.quantity,
        price: item.product_price,
        subtotal: item.subtotal
  }));
  const currentTotal = cartTotal.value;
  const currentPaid = paymentForm.value.paid;
  const currentChange = changeAmount.value;
  const currentPaymentMethod = paymentForm.value.paymentMethod;
  const currentCustomerName = paymentForm.value.customerName;

  loading.value = true;
  try {
    const transactionPayload = {
      paid: currentPaid,
      payment_method: currentPaymentMethod,
      discount: discountAmount.value,
      discount_type: paymentForm.value.discountType,
      customer_name: currentCustomerName,
    };

    const result = await createTransaction(transactionPayload);

    // Simpan data untuk struk baru (gunakan snapshot)
    lastTransaction.value = {
        id: result?.id || `TRX-${Date.now().toString().slice(-8)}`,
        date: new Date().toLocaleString('id-ID', {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }),
        receipt_no: result?.transaction_number || result?.id || `TRX-${Date.now().toString().slice(-8)}`,
        items: currentItems,
        subtotal: currentTotal + (discountAmount.value || 0), // Perkiraan subtotal
        total_amount: currentTotal,
        paid_amount: currentPaid,
        change_amount: currentChange,
        payment_method: currentPaymentMethod,
        customer_name: currentCustomerName,
    };

    // Reset Form
    paymentForm.value = {
      paid: 0,
      paymentMethod: "cash",
      customerName: "",
      discount: 0,
      discountType: "nominal",
    };
    displayPaid.value = "0"; // Reset display paid
    showPaymentModal.value = false;
    
    // Tampilkan Struk baru
    showReceipt.value = true;
    
    // Feedback User
    showAlert("success", "Transaksi Berhasil Disimpan");

  } catch (error: any) {
    showAlert("error", error.message || "Gagal Memproses Transaksi");
  } finally {
    loading.value = false;
  }
};

const printReceipt = () => {
    const content = document.getElementById('receipt-content')?.innerHTML;
    const printWindow = window.open('', '', 'height=600,width=400');
    if(printWindow && content) {
        printWindow.document.write('<html><head><title>Struk Belanja</title>');
        printWindow.document.write('<style>body{font-family:monospace; font-size: 12px; text-align: center;} .flex{display:flex; justify-content:space-between;} .bold{font-weight:bold;} hr{border-top: 1px dashed #000; border-bottom: none;} img{max-width: 80px; margin: 0 auto; display: block;}</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(content);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    }
}

onMounted(async () => {
  // Ensure store is loaded before fetching products/categories
  if (!store.value) {
    await useStore().fetchStore();
  }

  if (store.value) {
    await Promise.all([fetchCategories(), fetchProducts()]);
  }
});

watch(
  () => store.value,
  async (val) => {
    if (val?.id) await Promise.all([fetchCategories(), fetchProducts()]);
  },
  { immediate: true },
);
</script>

<template>
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
      <!-- Search & Kategori -->
      <div class="bg-white rounded-xl shadow-sm p-3 sm:p-4 mb-3 sm:mb-4">
        <!-- Search Bar -->
        <div class="mb-3">
          <input
            v-model="searchQuery"
            placeholder="Cari produk..."
            class="w-full flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-indigo-500"
            type="search"
          />
        </div>

        <!-- Kategori Button -->
        <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
            :color="selectedCategory === 'favorite' ? 'amber' : 'info'"
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
      <div class="flex-1 overflow-y-auto">
        <div
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3"
        >
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            @click="handleAddToCart(product)"
            class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer active:scale-95 transition-transform hover:shadow-md hover:border-primary-200"
            :class="{
              'opacity-50 pointer-events-none': product.stock === 0,
            }"
          >
            <!-- Gambar Produk -->
            <div
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
            <div class="p-3 text-center">
              <p
                class="text-xs sm:text-sm font-bold text-gray-800 line-clamp-2 h-8 sm:h-10 mb-2"
              >
                {{ product.name }}
              </p>
              <p class="text-sm sm:text-base font-black text-primary-600">
                {{ formatCurrency(product.price) }}
              </p>
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
            :key="item.product_id"
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
                  updateCartItemQuantity(item.product_id, item.quantity - 1)
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
                  updateCartItemQuantity(item.product_id, item.quantity + 1)
                "
                class="w-8 h-8 flex items-center justify-center text-primary-600 hover:bg-primary-50 font-bold text-lg active:scale-90 transition-all"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-gray-200 bg-gray-50 space-y-3">
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

    <!-- Modal Pembayaran (kode kamu tetap utuh) -->
    <Teleport to="body">
      <div
        v-if="showPaymentModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background-color: rgba(0, 0, 0, 0.5)"
      >
        <div
          class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          @click.stop
        >
          <!-- Header -->
          <div
            class="p-6 border-b border-gray-200 text-center sticky top-0 bg-white z-10 rounded-t-2xl"
          >
            <h3 class="text-2xl font-black text-gray-800">PEMBAYARAN</h3>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-4">
            <!-- Total Tagihan -->
            <div
              class="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200"
            >
              <p class="text-xs font-bold text-blue-600 uppercase mb-2">
                Total Tagihan
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
                  v-for="method in [
                    { label: 'Tunai', value: 'cash', icon: '💵' },
                    { label: 'Transfer', value: 'transfer', icon: '🏦' },
                  ]"
                  :key="method.value"
                  @click="paymentForm.paymentMethod = method.value"
                  class="px-4 py-3 rounded-xl border-2 font-bold text-base transition-all active:scale-95"
                  :class="
                    paymentForm.paymentMethod === method.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                  "
                >
                  <span class="mr-2">{{ method.icon }}</span>
                  {{ method.label }}
                </button>
              </div>
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

    <!-- Modal Nota / Struk (Original, will be replaced by the new one) -->
    <Teleport to="body">
      <div
        v-if="showReceiptModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background-color: rgba(0, 0, 0, 0.6)"
      >
        <div
          class="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto"
          @click.stop
        >
          <!-- Struk Content -->
          <div class="p-6 text-center space-y-4">
            <!-- Logo & Toko -->
            <div>
              <div
                class="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-2"
              >
                <span class="text-4xl font-bold">T</span>
              </div>
              <h2 class="text-2xl font-bold text-primary">
                {{ store?.name || "TOKO BARAT" }}
              </h2>
              <p class="text-sm text-gray-600">
                {{ store?.address || "JL Alalak" }}
              </p>
              <p class="text-sm text-gray-600">
                {{ store?.phone || "08123456789" }}
              </p>
            </div>

            <!-- Tanggal & ID -->
            <div class="text-sm text-gray-500 border-b pb-3">
              {{ transactionData?.date }}
              <br />
              ID: {{ transactionData?.id }}
            </div>

            <!-- Daftar Item -->
            <div class="text-left space-y-2 text-sm">
              <div
                v-for="item in transactionData?.items"
                :key="item.name"
                class="flex justify-between border-b pb-1"
              >
                <div>
                  <p class="font-medium">{{ item.name }}</p>
                  <p class="text-gray-500">
                    {{ item.qty }} pcs x {{ formatCurrency(item.price) }}
                  </p>
                </div>
                <p class="font-medium">{{ formatCurrency(item.subtotal) }}</p>
              </div>
            </div>

            <!-- Ringkasan -->
            <div class="space-y-2 text-sm text-black">
              <div class="flex justify-between font-medium">
                <span>Subtotal</span>
                <span>{{ formatCurrency(transactionData?.subtotal) }}</span>
              </div>
              <div class="flex justify-between text-lg font-black border-t pt-2">
                <span>TOTAL</span>
                <span>{{ formatCurrency(transactionData?.total) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Metode Bayar</span>
                <span>{{ transactionData?.method }}</span>
              </div>
              <div class="flex justify-between">
                <span>Dibayar</span>
                <span>{{ formatCurrency(transactionData?.paid) }}</span>
              </div>
              <div class="flex justify-between font-bold text-success text-lg">
                <span>Kembalian</span>
                <span>{{ formatCurrency(transactionData?.change) }}</span>
              </div>
            </div>

            <div class="pt-4 text-gray-500 text-xs italic">
              --- Terima Kasih Telah Berbelanja ---
            </div>

            <!-- Tombol Action -->
            <div class="grid grid-cols-2 gap-3 pt-4">
              <button
                class="justify-center px-4 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 active:scale-95 transition-all flex items-center gap-2"
              >
                <UIcon name="i-heroicons-printer" class="w-6 h-6" />
                CETAK
              </button>

              <button
                @click="showReceiptModal = false"
                class="justify-center px-4 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 active:scale-95 transition-all flex items-center gap-2"
              >
                <UIcon name="i-heroicons-x-mark" class="w-6 h-6" />
                TUTUP
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Struk (NEW thermal printer style) -->
     <Teleport to="body">
      <div
        v-if="showReceipt && lastTransaction"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="showReceipt = false"
      >
        <div class="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto flex flex-col">
           <!-- Preview Area -->
           <div id="receipt-content" class="bg-white p-4 font-mono text-xs text-gray-800 border border-gray-100 shadow-sm mb-4">
              <div class="text-center mb-4">
                  <img v-if="store?.logo_url" :src="store.logo_url" class="w-16 h-16 object-contain mx-auto mb-2 grayscale" />
                  <h2 class="font-bold text-base uppercase">{{ store?.name || 'Kasir Simple' }}</h2>
                  <p v-if="store?.address">{{ store.address }}</p>
                  <p v-if="store?.phone">{{ store.phone }}</p>
                  <p class="mt-2">{{ lastTransaction.date }}</p>
                  <p>No: {{ lastTransaction.receipt_no }}</p>
              </div>

              <hr class="border-t border-dashed border-gray-400 my-2" />

              <div class="space-y-1">
                  <div v-for="(item, idx) in lastTransaction.items" :key="idx" class="flex justify-between">
                      <span class="truncate pr-2">{{ item.quantity }}x {{ item.name }}</span>
                      <span class="whitespace-nowrap">{{ formatCurrency(item.price * item.quantity) }}</span>
                  </div>
              </div>

              <hr class="border-t border-dashed border-gray-400 my-2" />

               <div class="space-y-1 font-bold">
                  <div class="flex justify-between">
                      <span>TOTAL</span>
                      <span>{{ formatCurrency(lastTransaction.total_amount) }}</span>
                  </div>
                  <div class="flex justify-between">
                      <span>BAYAR ({{ lastTransaction.payment_method === 'cash' ? 'Tunai' : 'Transfer' }})</span>
                      <span>{{ formatCurrency(lastTransaction.paid_amount) }}</span>
                  </div>
                  <div class="flex justify-between">
                      <span>KEMBALI</span>
                      <span>{{ formatCurrency(lastTransaction.change_amount) }}</span>
                  </div>
              </div>

               <div class="mt-6 text-center">
                  <p>Terima Kasih</p>
                  <p>Silahkan Datang Kembali</p>
              </div>
           </div>

           <!-- Actions -->
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
