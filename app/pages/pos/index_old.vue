<script setup lang="ts">
import { formatCurrency, paymentMethods } from '~/utils/helpers'

definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Kasir - KasirSimple'
})

const toast = useToast()
const { store } = useStore()
const { products, fetchProducts, searchProducts } = useProducts()
const { 
    cart, 
    cartSubtotal, 
    cartItemsCount, 
    addToCart: addProductToCart, 
    removeFromCart, 
    updateCartItemQuantity, 
    clearCart,
    createTransaction
} = useTransactions()
const { categories, fetchCategories } = useCategories()

// UI state
const selectedCategory = ref('all')
const searchQuery = ref('')
const showPaymentModal = ref(false)
const loading = ref(false)
const showCartMobile = ref(false)

// Payment form
const paymentForm = ref({
  paid: 0,
  paymentMethod: 'cash',
  customerName: '',
  customerPhone: '',
  discount: 0,
  discountType: 'nominal' as 'nominal' | 'percent'
})

// Filtered products
const filteredProducts = computed(() => {
  let result = products.value
  
  if (selectedCategory.value !== 'all') {
    result = result.filter(p => p.category_id === selectedCategory.value)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p => 
      p.name.toLowerCase().includes(query) ||
      (p as any).sku?.toLowerCase().includes(query)
    )
  }
  
  return result
})

const discountAmount = computed(() => {
  if (paymentForm.value.discountType === 'percent') {
    return Math.round(cartSubtotal.value * (paymentForm.value.discount / 100))
  }
  return paymentForm.value.discount
})

const cartTotal = computed(() => {
  return cartSubtotal.value - discountAmount.value
})

const changeAmount = computed(() => {
  return Math.max(0, paymentForm.value.paid - cartTotal.value)
})

// Cart operations wrapper
const handleAddToCart = (product: any) => {
    try {
        addProductToCart(product)
    } catch (e: any) {
        toast.add({
            title: 'Gagal',
            description: e.message,
            color: 'error',
            icon: 'i-heroicons-exclamation-triangle'
        })
    }
}

const handleUpdateQuantity = (productId: string, quantity: number) => {
    try {
        updateCartItemQuantity(productId, quantity)
    } catch (e: any) {
        toast.add({
            title: 'Gagal',
            description: e.message,
            color: 'error',
            icon: 'i-heroicons-exclamation-triangle'
        })
    }
}

// Open payment modal
const openPayment = () => {
  if (cart.value.length === 0) {
    toast.add({
      title: 'Keranjang Kosong',
      description: 'Tambahkan produk terlebih dahulu',
      color: 'warning',
      icon: 'i-heroicons-shopping-cart'
    })
    return
  }
  paymentForm.value.paid = cartTotal.value
  showPaymentModal.value = true
}

// Process payment
const processPayment = async () => {
  if (paymentForm.value.paymentMethod === 'cash' && paymentForm.value.paid < cartTotal.value) {
    toast.add({
      title: 'Pembayaran Kurang',
      description: 'Nominal pembayaran harus lebih dari atau sama dengan total',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle'
    })
    return
  }
  
  loading.value = true
  try {
    const transaction = await createTransaction({
        paid: paymentForm.value.paid,
        payment_method: paymentForm.value.paymentMethod,
        discount: paymentForm.value.discount,
        discount_type: paymentForm.value.discountType,
        customer_name: paymentForm.value.customerName,
        customer_phone: paymentForm.value.customerPhone
    })
    
    // Show success
    toast.add({
        title: 'Transaksi Berhasil! 🎉',
        description: `No: ${transaction.transaction_number} | Total: ${formatCurrency(transaction.total)}`,
        color: 'success',
        icon: 'i-heroicons-check-circle'
    })
    
    showPaymentModal.value = false
    paymentForm.value = {
        paid: 0,
        paymentMethod: 'cash',
        customerName: '',
        customerPhone: '',
        discount: 0,
        discountType: 'nominal'
    }
  } catch (e: any) {
    toast.add({
        title: 'Gagal Memproses Transaksi',
        description: e.message,
        color: 'error',
        icon: 'i-heroicons-exclamation-triangle'
    })
  } finally {
    loading.value = false
  }
}

// Quick cash amounts
const quickCashAmounts = computed(() => {
  const total = cartTotal.value
  return [
    total,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 50000) * 50000,
    Math.ceil(total / 100000) * 100000
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4)
})

// Options for the category buttons
const categoryOptions = computed(() => {
    const opts = categories.value.map(c => ({
        label: c.name,
        value: c.id
    }))
    return [{ label: 'Semua', value: 'all' }, ...opts]
})

onMounted(async () => {
    if (store.value) {
        await Promise.all([
            fetchCategories(),
            fetchProducts()
        ])
    }
})

watch(() => store.value, async (newStore) => {
    if (newStore) {
        await Promise.all([
            fetchCategories(),
            fetchProducts()
        ])
    }
})
</script>

<template>
  <div class="h-full flex flex-col lg:flex-row bg-gray-50 overflow-hidden relative">
    <!-- Products Section -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-xl lg:text-2xl font-bold text-gray-900">Kasir</h1>
            <p class="text-xs lg:text-sm text-gray-500">Pilih produk untuk transaksi</p>
          </div>
          
          <!-- Search -->
          <div class="flex-1 max-w-md w-full">
            <UInput
              v-model="searchQuery"
              placeholder="Cari produk..."
              icon="i-heroicons-magnifying-glass"
              size="md"
              class="w-full"
            />
          </div>
        </div>
        
        <!-- Category Filter -->
        <div class="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          <UButton
            v-for="cat in categoryOptions"
            :key="cat.value"
            :variant="selectedCategory === cat.value ? 'solid' : 'soft'"
            :color="selectedCategory === cat.value ? 'primary' : 'neutral'"
            size="sm"
            class="whitespace-nowrap"
            @click="selectedCategory = cat.value"
          >
            {{ cat.label }}
          </UButton>
        </div>
      </div>
      
      <!-- Products Grid -->
      <div class="flex-1 overflow-y-auto p-4 lg:p-6">
        <div v-if="filteredProducts.length === 0" class="flex flex-col items-center justify-center h-full text-gray-400 py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <UIcon name="i-heroicons-shopping-bag" class="w-10 h-10 text-gray-300" />
          </div>
          <p class="text-xl font-bold text-gray-900">Produk Tidak Ditemukan</p>
          <p class="text-sm text-gray-500 max-w-xs text-center mt-1">Coba cari dengan kata kunci lain atau pilih kategori yang berbeda.</p>
          <UButton color="primary" variant="soft" class="mt-6" @click="searchQuery = ''; selectedCategory = 'all'">Reset Pencarian</UButton>
        </div>
        
        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            class="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
            :class="{ 'opacity-50 pointer-events-none': product.stock <= 0 }"
            @click="handleAddToCart(product)"
          >
            <!-- Product Image -->
            <div class="aspect-square bg-gray-100 relative overflow-hidden">
              <img
                v-if="product.image_url"
                :src="product.image_url"
                :alt="product.name"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
                <UIcon name="i-heroicons-photo" class="w-12 h-12" />
              </div>
              
              <!-- Stock Badge -->
              <div 
                class="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold"
                :class="product.stock <= (product.min_stock || 5) ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'"
              >
                {{ product.stock }}
              </div>
              
              <!-- Add indicator -->
              <div class="absolute inset-0 bg-primary-600/0 group-hover:bg-primary-600/10 flex items-center justify-center transition-colors">
                <div class="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all">
                  <UIcon name="i-heroicons-plus" class="w-6 h-6" />
                </div>
              </div>
            </div>
            
            <!-- Product Info -->
            <div class="p-3">
              <h3 class="font-bold text-gray-900 text-sm truncate group-hover:text-primary-600 transition-colors">{{ product.name }}</h3>
              <div class="flex items-center justify-between mt-1">
                <p class="text-primary-600 font-extrabold text-sm">{{ formatCurrency(product.price) }}</p>
                <UIcon name="i-heroicons-plus-circle" class="w-5 h-5 text-gray-300 group-hover:text-primary-600 transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Cart Sidebar -->
    <div 
      class="fixed inset-0 z-40 lg:relative lg:inset-auto lg:flex w-full lg:w-96 bg-white border-l border-gray-200 flex flex-col shrink-0 transition-transform duration-300 lg:translate-x-0"
      :class="showCartMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'"
    >
      <!-- Cart Header Mobile -->
      <div class="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h2 class="font-bold text-gray-900">Keranjang Belanja</h2>
          <UButton 
            variant="ghost" 
            color="neutral" 
            icon="i-heroicons-x-mark" 
            @click="showCartMobile = false" 
          />
      </div>

      <!-- Cart Header -->
      <div class="px-6 py-5 border-b border-gray-200 hidden lg:block bg-gradient-to-r from-white to-gray-50">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 shadow-inner">
              <UIcon name="i-heroicons-shopping-cart" class="w-6 h-6" />
            </div>
            <div>
              <h2 class="font-extrabold text-gray-900">Pesanan</h2>
              <p class="text-xs text-gray-500 font-medium uppercase tracking-wider">{{ cartItemsCount }} item terpilih</p>
            </div>
          </div>
          <UButton
            v-if="cart.length > 0"
            variant="ghost"
            color="error"
            size="sm"
            icon="i-heroicons-trash"
            @click="clearCart"
          />
        </div>
      </div>
      
      <!-- Cart Items -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        <div v-if="cart.length === 0" class="flex flex-col items-center justify-center h-full text-gray-400">
          <UIcon name="i-heroicons-shopping-cart" class="w-16 h-16 mb-4" />
          <p>Keranjang kosong</p>
          <p class="text-sm">Klik produk untuk menambahkan</p>
        </div>
        
        <div
          v-for="item in cart"
          :key="item.product_id"
          class="bg-gray-50 rounded-xl p-3"
        >
          <div class="flex gap-3">
            <!-- Item Image -->
            <div class="w-14 h-14 bg-gray-200 rounded-lg overflow-hidden shrink-0">
              <img
                v-if="item.product_image"
                :src="item.product_image"
                :alt="item.product_name"
                class="w-full h-full object-cover"
              />
            </div>
            
            <!-- Item Info -->
            <div class="flex-1 min-w-0">
              <h4 class="font-medium text-gray-900 text-sm truncate">{{ item.product_name }}</h4>
              <p class="text-primary-600 font-semibold text-sm">{{ formatCurrency(item.product_price) }}</p>
              
              <!-- Quantity Controls -->
              <div class="flex items-center gap-2 mt-2">
                <UButton
                  variant="soft"
                  color="neutral"
                  size="xs"
                  icon="i-heroicons-minus"
                  @click="handleUpdateQuantity(item.product_id, item.quantity - 1)"
                />
                <span class="w-8 text-center font-semibold text-gray-900">{{ item.quantity }}</span>
                <UButton
                  variant="soft"
                  color="primary"
                  size="xs"
                  icon="i-heroicons-plus"
                  @click="handleUpdateQuantity(item.product_id, item.quantity + 1)"
                />
                <button
                  class="ml-auto text-error-500 hover:text-error-600 p-1"
                  @click="removeFromCart(item.product_id)"
                >
                  <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <!-- Item Subtotal -->
          <div class="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
            <span class="text-sm text-gray-500">Subtotal</span>
            <span class="font-bold text-gray-900">{{ formatCurrency(item.product_price * item.quantity) }}</span>
          </div>
        </div>
      </div>
      
      <!-- Cart Summary & Checkout -->
      <div class="border-t border-gray-200 p-4 space-y-4 bg-gray-50">
        <!-- Summary -->
        <div class="space-y-2">
          <div class="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{{ formatCurrency(cartSubtotal) }}</span>
          </div>
          <div v-if="discountAmount > 0" class="flex justify-between text-sm text-green-600">
            <span>Diskon</span>
            <span>-{{ formatCurrency(discountAmount) }}</span>
          </div>
          <div class="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span class="text-primary-600">{{ formatCurrency(cartTotal) }}</span>
          </div>
        </div>
        
        <!-- Checkout Button -->
        <UButton
          block
          size="xl"
          color="primary"
          :disabled="cart.length === 0"
          :loading="loading"
          class="font-bold"
          @click="openPayment"
        >
          <UIcon name="i-heroicons-banknotes" class="w-5 h-5 mr-2" />
          Bayar Sekarang
        </UButton>
      </div>
    </div>

    <!-- Mobile Cart FAB -->
    <div class="lg:hidden fixed bottom-6 right-6 z-30">
        <UButton
            size="xl"
            color="primary"
            class="rounded-full shadow-2xl h-16 w-16 flex items-center justify-center p-0"
            @click="showCartMobile = true"
        >
            <div class="relative">
                <UIcon name="i-heroicons-shopping-cart" class="w-8 h-8" />
                <div v-if="cartItemsCount > 0" class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                    {{ cartItemsCount }}
                </div>
            </div>
        </UButton>
    </div>

    <UModal v-model="showPaymentModal">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-bold text-gray-900">💳 Pembayaran</h3>
            <UButton
              variant="ghost"
              color="neutral"
              icon="i-heroicons-x-mark"
              @click="showPaymentModal = false"
            />
          </div>
        </template>
        
        <div class="space-y-6">
          <!-- Total -->
          <div class="text-center bg-primary-50 rounded-2xl p-6">
            <p class="text-sm text-gray-500 mb-1">Total Pembayaran</p>
            <p class="text-4xl font-black text-primary-600">{{ formatCurrency(cartTotal) }}</p>
          </div>
          
          <!-- Payment Method -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Metode Pembayaran</label>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <UButton
                v-for="method in paymentMethods.slice(0, 3)"
                :key="method.value"
                :variant="paymentForm.paymentMethod === method.value ? 'solid' : 'soft'"
                :color="paymentForm.paymentMethod === method.value ? 'primary' : 'neutral'"
                class="flex-col py-3 px-2 h-auto"
                @click="paymentForm.paymentMethod = method.value"
              >
                <UIcon :name="method.icon" class="w-5 h-5 mb-1" />
                <span class="text-[10px] sm:text-xs font-bold leading-tight uppercase">{{ method.label }}</span>
              </UButton>
            </div>
          </div>
          
          <!-- Quick Cash (for cash payment) -->
          <div v-if="paymentForm.paymentMethod === 'cash'">
            <label class="block text-sm font-medium text-gray-700 mb-2 font-bold text-gray-900">Uang Diterima</label>
            <div class="grid grid-cols-2 gap-2 mb-3">
              <UButton
                v-for="amount in quickCashAmounts"
                :key="amount"
                variant="soft"
                color="primary"
                size="md"
                class="font-extrabold justify-center"
                @click="paymentForm.paid = amount"
              >
                {{ formatCurrency(amount).replace('Rp ', '') }}
              </UButton>
            </div>
            <UInput
              v-model.number="paymentForm.paid"
              type="number"
              placeholder="0"
              size="lg"
              class="text-right font-bold"
            />
          </div>
          
          <!-- Change -->
          <div v-if="changeAmount > 0 && paymentForm.paymentMethod === 'cash'" class="text-center bg-success-50 rounded-xl p-4">
            <p class="text-sm text-gray-500 mb-1">Kembalian</p>
            <p class="text-2xl font-bold text-success-600">{{ formatCurrency(changeAmount) }}</p>
          </div>
          
          <!-- Discount -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Diskon (opsional)</label>
            <div class="flex gap-2">
              <UInput
                v-model.number="paymentForm.discount"
                type="number"
                placeholder="0"
                class="flex-1"
              />
              <UButtonGroup>
                <UButton
                  :variant="paymentForm.discountType === 'nominal' ? 'solid' : 'soft'"
                  :color="paymentForm.discountType === 'nominal' ? 'primary' : 'neutral'"
                  @click="paymentForm.discountType = 'nominal'"
                >
                  Rp
                </UButton>
                <UButton
                  :variant="paymentForm.discountType === 'percent' ? 'solid' : 'soft'"
                  :color="paymentForm.discountType === 'percent' ? 'primary' : 'neutral'"
                  @click="paymentForm.discountType = 'percent'"
                >
                  %
                </UButton>
              </UButtonGroup>
            </div>
          </div>
          
          <!-- Customer Info -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nama Customer</label>
              <UInput
                v-model="paymentForm.customerName"
                placeholder="Opsional"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
              <UInput
                v-model="paymentForm.customerPhone"
                placeholder="Opsional"
              />
            </div>
          </div>
        </div>
        
        <template #footer>
          <div class="flex gap-3">
            <UButton
              variant="soft"
              color="neutral"
              class="flex-1"
              @click="showPaymentModal = false"
            >
              Batal
            </UButton>
            <UButton
              color="primary"
              class="flex-1 font-bold"
              :disabled="paymentForm.paymentMethod === 'cash' && paymentForm.paid < cartTotal"
              :loading="loading"
              @click="processPayment"
            >
              <UIcon name="i-heroicons-check" class="w-5 h-5 mr-2" />
              Proses Pembayaran
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
