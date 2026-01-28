<script setup lang="ts">
import { formatCurrency } from "~/utils/helpers";

definePageMeta({ layout: "default" });

useHead({ title: "Kasir - POS" });

const toast = useToast();
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

const selectedCategory = ref("all");
const searchQuery = ref("");
const showPaymentModal = ref(false);
const loading = ref(false);

const paymentForm = ref({
  paid: 0,
  paymentMethod: "cash",
  customerName: "",
  discount: 0,
  discountType: "nominal" as "nominal" | "percent",
});

const filteredProducts = computed(() => {
  let result = products.value || [];
  if (selectedCategory.value !== "all") {
    result = result.filter((p) => p.category_id === selectedCategory.value);
  }
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

const handleAddToCart = (product) => {
  try {
    addToCart(product);
    toast.add({
      title: "Ditambah!",
      color: "green",
      icon: "i-heroicons-check",
    });
  } catch (e) {
    toast.add({ title: "Stok habis!", color: "red" });
  }
};

const openPayment = () => {
  if (!cart.value.length) return;
  paymentForm.value.paid = cartTotal.value;
  showPaymentModal.value = true;
};

const processPayment = async () => {
  if (
    paymentForm.value.paid < cartTotal.value &&
    paymentForm.value.paymentMethod === "cash"
  ) {
    toast.add({ title: "Uang kurang!", color: "yellow" });
    return;
  }
  loading.value = true;
  try {
    await createTransaction({
      paid: paymentForm.value.paid,
      payment_method: paymentForm.value.paymentMethod,
      discount: paymentForm.value.discount,
      discount_type: paymentForm.value.discountType,
      customer_name: paymentForm.value.customerName,
    });
    toast.add({ title: "Transaksi berhasil!", color: "green" });
    showPaymentModal.value = false;
    clearCart();
    paymentForm.value = {
      paid: 0,
      paymentMethod: "cash",
      customerName: "",
      discount: 0,
      discountType: "nominal",
    };
  } catch (err) {
    toast.add({ title: "Gagal proses", color: "red" });
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (!store.value) await useStore().fetchStore();
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
  <!-- Mobile: Stacked layout, Desktop: Flex layout -->
  <div
    class="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] bg-gray-50 gap-0 lg:gap-0"
  >
    <!-- LEFT: Produk -->
    <div class="flex-1 flex flex-col p-2 sm:p-3 lg:p-4 overflow-hidden">
      <!-- Search & Kategori -->
      <div
        class="rounded-lg shadow-sm p-2 sm:p-3 mb-3 sm:mb-4 sticky top-0 z-10"
      >
        <!-- Search Bar -->
        <div class="flex items-center gap-2 mb-3">
          <UInput
            v-model="searchQuery"
            placeholder="Cari produk..."
            class="flex-1"
            icon="i-heroicons-magnifying-glass"
          />
        </div>

        <!-- Kategori Button -->
        <div class="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
          <UButton
            label="Semua"
            size="xs"
            :color="selectedCategory === 'all' ? 'blue' : 'gray'"
            variant="solid"
            @click="selectedCategory = 'all'"
            class="flex-shrink-0"
          />
          <UButton
            v-for="cat in categories"
            :key="cat.id"
            :label="cat.name"
            size="xs"
            :color="selectedCategory === cat.id ? 'blue' : 'gray'"
            variant="solid"
            @click="selectedCategory = cat.id"
            class="flex-shrink-0"
          />
        </div>
      </div>

      <!-- Grid Produk - Responsive -->
      <div class="flex-1 overflow-y-auto">
        <div
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3"
        >
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            @click="handleAddToCart(product)"
            class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer active:scale-95 transition-transform hover:shadow-md"
            :class="{
              'opacity-60 pointer-events-none': product.stock === 0,
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
                class="w-8 sm:w-10 h-8 sm:h-10 text-gray-300"
              />

              <!-- Stock Badge -->
              <div
                class="absolute bottom-0 left-0 right-0 text-center text-xs font-bold py-1 px-1"
                :class="{
                  'bg-green-500 text-white': product.stock > 10,
                  'bg-yellow-500 text-white':
                    product.stock > 0 && product.stock <= 10,
                  'bg-red-600 text-white': product.stock === 0,
                }"
              >
                {{ product.stock === 0 ? "HABIS" : `Stok: ${product.stock}` }}
              </div>
            </div>

            <!-- Info Produk -->
            <div class="p-2 sm:p-2.5 text-center">
              <p class="text-xs sm:text-sm font-medium line-clamp-2 h-8 sm:h-9">
                {{ product.name }}
              </p>
              <p class="text-sm sm:text-base font-bold text-blue-600 mt-1">
                {{ formatCurrency(product.price) }}
              </p>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-if="!filteredProducts.length"
            class="col-span-full py-8 sm:py-12 text-center text-gray-500"
          >
            <UIcon
              name="i-heroicons-cube"
              class="w-12 h-12 mx-auto opacity-50 mb-2"
            />
            <p class="font-semibold">Tidak ada produk</p>
            <p class="text-sm mt-1">Coba cari dengan kata lain</p>
          </div>
        </div>
      </div>
    </div>

    <!-- RIGHT: Keranjang - Mobile: Bottom sheet, Desktop: Sidebar -->
    <div class="lg:w-96 lg:border-l border-gray-200 bg-white flex flex-col">
      <!-- Header -->
      <div class="bg-indigo-600 text-white p-3 sm:p-4 flex-shrink-0">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 sm:gap-3">
            <UIcon
              name="i-heroicons-shopping-cart"
              class="w-5 sm:w-6 h-5 sm:h-6"
            />
            <div>
              <p class="font-bold text-sm sm:text-base">Keranjang</p>
              <p class="text-xs opacity-90">{{ cartItemsCount }} item</p>
            </div>
          </div>
          <UButton
            color="error"
            variant="ghost"
            icon="i-heroicons-trash"
            size="xs"
            @click="clearCart"
          />
        </div>
      </div>

      <!-- Cart Items -->
      <div
        class="overflow-y-auto p-2 sm:p-3 space-y-2 sm:space-y-3"
        style="max-height: 300px"
      >
        <div v-if="!cart.length" class="text-center py-8 text-gray-500">
          <UIcon
            name="i-heroicons-shopping-bag"
            class="w-10 h-10 mx-auto opacity-50 mb-2"
          />
          <p class="text-sm font-medium">Keranjang kosong</p>
          <p class="text-xs mt-1">Pilih produk di sebelah kiri</p>
        </div>

        <div
          v-for="item in cart"
          :key="item.product_id"
          class="flex items-center gap-2 sm:gap-3 bg-gray-50 p-2 sm:p-3 rounded-lg"
        >
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm truncate">{{ item.product_name }}</p>
            <p class="text-xs sm:text-sm text-gray-600">
              {{ formatCurrency(item.product_price) }}
            </p>
          </div>
          <div
            class="flex items-center bg-white rounded-lg border flex-shrink-0"
          >
            <button
              @click="
                updateCartItemQuantity(item.product_id, item.quantity - 1)
              "
              class="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-red-600 hover:bg-red-50 text-lg"
            >
              −
            </button>
            <span
              class="w-8 sm:w-10 text-center font-bold text-xs sm:text-sm"
              >{{ item.quantity }}</span
            >
            <button
              @click="
                updateCartItemQuantity(item.product_id, item.quantity + 1)
              "
              class="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 text-lg"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <!-- Footer: Total & Buttons -->
      <div
        class="p-3 sm:p-4 border-t bg-gray-50 flex-shrink-0 space-y-2 sm:space-y-3"
      >
        <!-- Total -->
        <div
          class="flex justify-between text-base sm:text-lg font-bold bg-white p-2 sm:p-3 rounded-lg"
        >
          <span>Total</span>
          <span class="text-indigo-600">{{ formatCurrency(cartTotal) }}</span>
        </div>

        <!-- Button Row 1 -->
        <div class="grid grid-cols-2 gap-2">
          <UButton
            label="INPUT"
            color="error"
            variant="outline"
            block
            size="sm"
          />
          <UButton
            label="KOSONG"
            color="error"
            variant="solid"
            block
            size="sm"
            @click="clearCart"
          />
        </div>

        <!-- Button Row 2 -->
        <div class="grid grid-cols-2 gap-2">
          <UButton
            label="QRIS LAYAR"
            color="primary"
            variant="solid"
            block
            size="md"
            @click="openPayment"
          />
          <UButton
            label="CETAK QRIS"
            color="primary"
            variant="outline"
            block
            size="md"
          />
        </div>

        <!-- Button Row 3 -->
        <div class="grid grid-cols-2 gap-2">
          <UButton
            label="TUNAI PAS"
            color="success"
            variant="solid"
            block
            size="md"
            @click="openPayment"
          />
          <UButton
            label="LAINNYA"
            color="primary"
            variant="solid"
            block
            size="md"
            @click="openPayment"
          />
        </div>
      </div>
    </div>
    <!-- Modal Pembayaran -->
    <UModal v-model:open="showPaymentModal" title="Modal with title">
      <template #body>
        <div class="space-y-3 sm:space-y-4">
          <!-- Ringkasan Transaksi -->
          <div class="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Subtotal:</span>
                <span class="font-semibold">{{
                  formatCurrency(cartSubtotal)
                }}</span>
              </div>
              <div class="flex justify-between" v-if="discountAmount > 0">
                <span class="text-gray-600">Diskon:</span>
                <span class="font-semibold text-red-600"
                  >-{{ formatCurrency(discountAmount) }}</span
                >
              </div>
              <div
                class="border-t border-blue-300 pt-2 flex justify-between font-bold"
              >
                <span>Total:</span>
                <span class="text-blue-600">{{
                  formatCurrency(cartTotal)
                }}</span>
              </div>
            </div>
          </div>

          <!-- Form Pembayaran -->
          <div class="space-y-2 sm:space-y-3">
            <!-- Nama Customer -->
            <div>
              <label class="text-xs font-semibold text-gray-700 uppercase"
                >Nama Pelanggan</label
              >
              <UInput
                v-model="paymentForm.customerName"
                placeholder="Opsional"
                size="sm"
              />
            </div>

            <!-- Metode Pembayaran -->
            <div>
              <label class="text-xs font-semibold text-gray-700 uppercase"
                >Metode Pembayaran</label
              >
              <USelect
                v-model="paymentForm.paymentMethod"
                :options="[
                  { label: 'Tunai', value: 'cash' },
                  { label: 'Transfer', value: 'transfer' },
                  { label: 'QRIS', value: 'qris' },
                  { label: 'Debit', value: 'debit' },
                  { label: 'Kartu Kredit', value: 'credit' },
                ]"
                size="sm"
              />
            </div>

            <!-- Diskon -->
            <div class="grid grid-cols-3 gap-2">
              <div class="col-span-2">
                <label class="text-xs font-semibold text-gray-700 uppercase"
                  >Diskon</label
                >
                <UInput
                  v-model.number="paymentForm.discount"
                  type="number"
                  placeholder="0"
                  size="sm"
                />
              </div>
              <div>
                <label class="text-xs font-semibold text-gray-700 uppercase"
                  >Tipe</label
                >
                <USelect
                  v-model="paymentForm.discountType"
                  :options="[
                    { label: 'Rp', value: 'nominal' },
                    { label: '%', value: 'percent' },
                  ]"
                  size="sm"
                />
              </div>
            </div>

            <!-- Uang Dibayar -->
            <div>
              <label class="text-xs font-semibold text-gray-700 uppercase"
                >Uang Dibayar</label
              >
              <UInput
                v-model.number="paymentForm.paid"
                type="number"
                placeholder="0"
                size="sm"
              />
            </div>

            <!-- Kembalian -->
            <div class="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <p class="text-xs text-emerald-600 font-semibold uppercase">
                Kembalian
              </p>
              <p class="text-2xl font-bold text-emerald-700">
                {{ formatCurrency(changeAmount) }}
              </p>
            </div>
          </div>
        </div>
      </template>
    </UModal>
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
</style>

<style scoped>
/* Tambahan style jika perlu */
</style>
