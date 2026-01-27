<script setup lang="ts">
import { formatCurrency, paymentMethods } from '~/utils/helpers'

definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Halaman Kasir - KasirSimple'
})

const toast = useToast()
const { store } = useStore()
const { products, fetchProducts } = useProducts()
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

// State UI
const selectedCategory = ref('all')
const searchQuery = ref('')
const showPaymentModal = ref(false)
const loading = ref(false)

// Form Pembayaran
const paymentForm = ref({
  paid: 0,
  paymentMethod: 'cash',
  customerName: '',
  discount: 0,
  discountType: 'nominal' as 'nominal' | 'percent'
})

// Filter Produk
const filteredProducts = computed(() => {
  let result = products.value
  if (selectedCategory.value !== 'all') {
    result = result.filter(p => p.category_id === selectedCategory.value)
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p => p.name.toLowerCase().includes(query))
  }
  return result
})

const discountAmount = computed(() => {
  if (paymentForm.value.discountType === 'percent') {
    return Math.round(cartSubtotal.value * (paymentForm.value.discount / 100))
  }
  return paymentForm.value.discount
})

const cartTotal = computed(() => cartSubtotal.value - discountAmount.value)

const changeAmount = computed(() => Math.max(0, paymentForm.value.paid - cartTotal.value))

// Logika Tambah ke Keranjang
const handleAddToCart = (product: any) => {
    try {
        addProductToCart(product)
        toast.add({ title: 'Berhasil ditambah!', color: 'emerald', icon: 'i-heroicons-check-circle', timeout: 1000 })
    } catch (e: any) {
        toast.add({ title: 'Stok Habis!', color: 'red', icon: 'i-heroicons-exclamation-circle' })
    }
}

// Buka Modal Bayar
const openPayment = () => {
  if (cart.value.length === 0) return
  paymentForm.value.paid = cartTotal.value
  showPaymentModal.value = true
}

// Proses Transaksi
const processPayment = async () => {
  if (paymentForm.value.paid < cartTotal.value && paymentForm.value.paymentMethod === 'cash') {
    toast.add({ title: 'Uang Kurang!', color: 'orange' })
    return
  }
  
  loading.value = true
  try {
    await createTransaction({
        paid: paymentForm.value.paid,
        payment_method: paymentForm.value.paymentMethod,
        discount: paymentForm.value.discount,
        discount_type: paymentForm.value.discountType,
        customer_name: paymentForm.value.customerName
    })
    
    toast.add({ title: 'Jualan Berhasil!', color: 'emerald' })
    showPaymentModal.value = false
    clearCart()
  } catch (e: any) {
    toast.add({ title: 'Gagal Simpan', color: 'red' })
  } finally {
    loading.value = false
  }
}

const quickCashAmounts = computed(() => {
  const total = cartTotal.value
  return [total, Math.ceil(total / 10000) * 10000, 50000, 100000].filter(v => v >= total).slice(0, 4)
})

onMounted(async () => {
  if (store.value) {
    await Promise.all([fetchCategories(), fetchProducts()])
  }
})
</script>

<template>
  <div class="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-gray-100">
    
    <div class="flex-1 flex flex-col p-4 overflow-hidden border-r border-gray-200">
      <div class="space-y-4 mb-4 shrink-0">
        <UInput
          v-model="searchQuery"
          icon="i-heroicons-magnifying-glass"
          placeholder="Cari nama barang..."
          size="xl"
          class="shadow-sm"
        />
        
        <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <UButton
            label="Semua"
            :variant="selectedCategory === 'all' ? 'solid' : 'soft'"
            color="info"
            @click="selectedCategory = 'all'"
          />
          <UButton
            v-for="cat in categories"
            :key="cat.id"
            :label="cat.name"
            :variant="selectedCategory === cat.id ? 'solid' : 'soft'"
            color="info"
            @click="selectedCategory = cat.id"
          />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto pr-2 pb-20 lg:pb-0">
        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            @click="handleAddToCart(product)"
            class="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 active:scale-95 transition-all cursor-pointer flex flex-col items-center text-center"
          >
            <div class="w-full aspect-square bg-gray-50 rounded-xl mb-2 flex items-center justify-center overflow-hidden">
              <img v-if="product.image_url" :src="product.image_url" class="w-full h-full object-cover" />
              <UIcon v-else name="i-heroicons-squares-2x2" class="w-12 h-12 text-gray-200" />
            </div>
            <p class="text-xs font-bold text-gray-800 line-clamp-2 h-8 mb-1 leading-tight">{{ product.name }}</p>
            <p class="text-blue-600 font-black text-sm">{{ formatCurrency(product.price) }}</p>
            <div class="mt-2 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
              Stok: {{ product.stock }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full lg:w-96 bg-white shadow-2xl flex flex-col">
      <div class="p-4 bg-blue-600 text-white flex justify-between items-center">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-shopping-cart-20-solid" class="w-6 h-6" />
          <span class="font-bold">Keranjang Belanja</span>
        </div>
        <UButton color="white" variant="ghost" icon="i-heroicons-trash" @click="clearCart" />
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        <div v-if="cart.length === 0" class="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
          <UIcon name="i-heroicons-shopping-bag" class="w-16 h-16 mb-2" />
          <p class="text-sm italic">Belum ada barang dipilih</p>
        </div>

        <div v-for="item in cart" :key="item.product_id" class="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-gray-800 truncate">{{ item.product_name }}</p>
            <p class="text-xs text-blue-600 font-medium">{{ formatCurrency(item.product_price) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <UButton size="xs" color="warning" variant="soft" icon="i-heroicons-minus" @click="updateCartItemQuantity(item.product_id, item.quantity - 1)" />
            <span class="text-sm font-bold w-4 text-center">{{ item.quantity }}</span>
            <UButton size="xs" color="warning" variant="soft" icon="i-heroicons-plus" @click="updateCartItemQuantity(item.product_id, item.quantity + 1)" />
          </div>
        </div>
      </div>

      <div class="p-4 border-t bg-gray-50 space-y-3">
        <div class="flex justify-between items-center">
          <span class="text-gray-500 font-medium">Total:</span>
          <span class="text-2xl font-black text-blue-700">{{ formatCurrency(cartSubtotal) }}</span>
        </div>
        <UButton
          block
          size="xl"
          color="emerald"
          label="BAYAR SEKARANG"
          class="font-black tracking-widest py-4 rounded-2xl"
          :disabled="cart.length === 0"
          @click="openPayment"
        />
      </div>
    </div>

    <UModal v-model="showPaymentModal" prevent-close>
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold">Terima Uang Pembeli</h3>
          <UButton color="warning" variant="ghost" icon="i-heroicons-x-mark" @click="showPaymentModal = false" />
        </div>

        <div class="space-y-6">
          <div class="text-center bg-blue-50 py-4 rounded-2xl">
            <p class="text-sm text-blue-600 font-bold uppercase tracking-widest">Total Harus Dibayar</p>
            <h2 class="text-4xl font-black text-blue-700">{{ formatCurrency(cartTotal) }}</h2>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-bold text-gray-700">Uang yang Diterima:</label>
            <UInput
              v-model.number="paymentForm.paid"
              type="number"
              size="xl"
              input-class="text-3xl font-bold text-center h-20"
              color="info"
            />
            <div class="grid grid-cols-2 gap-2 mt-2">
              <UButton
                v-for="amt in quickCashAmounts"
                :key="amt"
                :label="formatCurrency(amt)"
                variant="outline"
                color="warning"
                @click="paymentForm.paid = amt"
              />
            </div>
          </div>

          <div class="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl">
            <span class="font-bold text-emerald-700">Kembalian:</span>
            <span class="text-2xl font-black text-emerald-700">{{ formatCurrency(changeAmount) }}</span>
          </div>

          <UButton
            block
            size="xl"
            color="primary"
            label="PROSES & SELESAI"
            class="py-4 font-bold"
            :loading="loading"
            @click="processPayment"
          />
        </div>
      </div>
    </UModal>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>