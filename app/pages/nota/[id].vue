<script setup lang="ts">
import { formatCurrency, formatDateTime } from "~/utils/helpers";

definePageMeta({
  layout: false,
});

const route = useRoute();
const { getTransactionByNumber } = useTransactions();
const transaction = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  const transactionNumber = route.params.id as string;
  try {
    const data = await getTransactionByNumber(transactionNumber);
    if (data) {
      transaction.value = data;
    } else {
      error.value = "Nota tidak ditemukan";
    }
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-100 py-8 px-4 flex flex-col items-center">
    <div v-if="loading" class="flex flex-col items-center py-20">
      <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500 mb-4" />
      <p class="text-gray-500 font-medium">Memuat nota...</p>
    </div>

    <div v-else-if="error" class="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center">
      <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
        <UIcon name="i-heroicons-x-circle" class="w-12 h-12" />
      </div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
      <p class="text-gray-500 mb-8">{{ error }}</p>
      <NuxtLink 
        to="/" 
        class="block w-full py-3 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-colors"
      >
        KEMBALI KE BERANDA
      </NuxtLink>
    </div>

    <div v-else-if="transaction" class="max-w-md w-full">
      <!-- Receipt Card -->
      <div class="bg-white rounded-3xl shadow-2xl overflow-hidden mb-6 relative">
        <!-- Decorator circles for receipt style -->
        <div class="absolute left-0 bottom-1/4 -translate-x-1/2 w-4 h-8 bg-gray-100 rounded-r-full"></div>
        <div class="absolute right-0 bottom-1/4 translate-x-1/2 w-4 h-8 bg-gray-100 rounded-l-full"></div>
        
        <div class="p-8">
          <!-- Header -->
          <div class="text-center mb-8 border-b-2 border-dashed border-gray-100 pb-8">
            <h1 class="text-2xl font-black text-gray-900 uppercase tracking-tight mb-1">
              {{ transaction.store?.name || 'KASIR SIMPLE' }}
            </h1>
            <p v-if="transaction.store?.address" class="text-gray-500 text-sm leading-relaxed mb-1">
              {{ transaction.store.address }}
            </p>
            <p v-if="transaction.store?.phone" class="text-gray-500 text-sm mb-4">
              {{ transaction.store.phone }}
            </p>
            
            <div class="inline-flex items-center px-4 py-1.5 bg-gray-50 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest">
              NOTA DIGITAL
            </div>
          </div>

          <!-- Transaction Meta -->
          <div class="grid grid-cols-2 gap-y-4 mb-8 text-sm">
            <div>
              <p class="text-gray-400 font-bold uppercase text-[10px] tracking-wider mb-1">Nomor Transaksi</p>
              <p class="text-gray-900 font-mono font-bold">{{ transaction.transaction_number }}</p>
            </div>
            <div class="text-right">
              <p class="text-gray-400 font-bold uppercase text-[10px] tracking-wider mb-1">Tanggal</p>
              <p class="text-gray-900 font-bold">{{ formatDateTime(transaction.created_at) }}</p>
            </div>
            <div v-if="transaction.customer_name">
              <p class="text-gray-400 font-bold uppercase text-[10px] tracking-wider mb-1">Pelanggan</p>
              <p class="text-gray-900 font-bold">{{ transaction.customer_name }}</p>
            </div>
            <div :class="transaction.customer_name ? 'text-right' : ''">
              <p class="text-gray-400 font-bold uppercase text-[10px] tracking-wider mb-1">Metode Bayar</p>
              <p class="text-gray-900 font-bold uppercase">{{ transaction.payment_method }}</p>
            </div>
          </div>

          <!-- Items Table -->
          <div class="space-y-4 mb-8">
            <div class="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">
              <span>Produk</span>
              <span>Subtotal</span>
            </div>
            <div v-for="item in transaction.items" :key="item.id" class="space-y-1">
              <div class="flex justify-between items-start">
                <span class="text-gray-900 font-bold leading-tight flex-1 pr-4">{{ item.product_name }}</span>
                <span class="text-gray-900 font-bold whitespace-nowrap">{{ formatCurrency(item.subtotal) }}</span>
              </div>
              <p class="text-gray-500 text-xs">{{ item.quantity }} x {{ formatCurrency(item.product_price) }}</p>
            </div>
          </div>

          <!-- Summary -->
          <div class="bg-gray-50 rounded-2xl p-6 space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 font-medium">Subtotal</span>
              <span class="text-gray-900 font-bold">{{ formatCurrency(transaction.subtotal) }}</span>
            </div>
            <div v-if="transaction.discount > 0" class="flex justify-between text-sm text-rose-600 font-bold">
              <span>Diskon</span>
              <span>-{{ formatCurrency(transaction.discount) }}</span>
            </div>
            <div v-if="transaction.tax > 0" class="flex justify-between text-sm text-gray-500">
              <span>Pajak</span>
              <span class="text-gray-900 font-bold">+{{ formatCurrency(transaction.tax) }}</span>
            </div>
            <div v-if="transaction.ppn > 0" class="flex justify-between text-sm text-gray-500">
              <span>PPN</span>
              <span class="text-gray-900 font-bold">+{{ formatCurrency(transaction.ppn) }}</span>
            </div>
            <div class="flex justify-between items-center pt-3 border-t border-gray-200">
              <span class="text-gray-900 font-black uppercase text-base tracking-tighter">Total</span>
              <span class="text-2xl font-black text-primary-600 tracking-tight">{{ formatCurrency(transaction.total) }}</span>
            </div>
            <div class="flex justify-between text-sm pt-2 border-t border-gray-100 italic">
              <span class="text-gray-500">Dibayar</span>
              <span class="text-gray-900 font-bold">{{ formatCurrency(transaction.paid || transaction.total) }}</span>
            </div>
            <div v-if="(transaction.paid || transaction.total) - transaction.total > 0" class="flex justify-between text-sm italic">
              <span class="text-gray-500">Kembali</span>
              <span class="text-gray-900 font-bold">{{ formatCurrency((transaction.paid || transaction.total) - transaction.total) }}</span>
            </div>
          </div>

          <!-- Footer Message -->
          <div class="mt-10 text-center">
            <div class="w-12 h-1 bg-gray-100 mx-auto rounded-full mb-6"></div>
            <p class="text-gray-900 font-bold uppercase tracking-widest text-xs mb-1">Terima Kasih</p>
            <p class="text-gray-400 text-sm">Silahkan datang kembali!</p>
          </div>
        </div>

        <!-- Receipt bottom zig-zag decorator -->
        <div class="flex">
          <div v-for="i in 20" :key="i" class="w-full h-2 bg-gray-100" style="clip-path: polygon(0 100%, 50% 0, 100% 100%);"></div>
        </div>
      </div>

      <!-- Footer Branding -->
      <div class="text-center opacity-40 hover:opacity-100 transition-opacity">
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
          Powered by <span class="text-primary-600">KasirOK.com</span>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

body {
  font-family: 'Inter', sans-serif;
}
</style>
