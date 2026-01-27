<script setup lang="ts">
import { formatCurrency, formatDateTime } from '~/utils/helpers'

definePageMeta({
  layout: 'default'
})

const { store } = useStore()
const { transactions, loading, fetchTransactions } = useTransactions()
const { products, fetchProducts } = useProducts()

// Stats Calculation
const totalSales = computed(() => {
    return transactions.value.reduce((sum, t) => sum + (t.total || 0), 0)
})

const totalTransactions = computed(() => transactions.value.length)
const averageTransaction = computed(() => {
    if (totalTransactions.value === 0) return 0
    return totalSales.value / totalTransactions.value
})

onMounted(async () => {
    if (store.value) {
        await Promise.all([
            fetchTransactions(),
            fetchProducts()
        ])
    }
})

watch(() => store.value, async (newStore) => {
    if (newStore) {
        await Promise.all([
            fetchTransactions(),
            fetchProducts()
        ])
    }
})
</script>

<template>
  <div class="h-full flex flex-col bg-gray-50 overflow-auto">
     <!-- Header -->
    <div class="px-8 py-6 border-b border-gray-200 bg-white shadow-sm shrink-0">
        <h1 class="text-2xl font-bold text-gray-900">Laporan Penjualan</h1>
        <p class="text-sm text-gray-500">Ringkasan performa toko anda</p>
    </div>

    <div class="p-8 space-y-8">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div class="w-14 h-14 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                    <UIcon name="i-heroicons-banknotes-20-solid" class="w-8 h-8" />
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-500">Total Penjualan</p>
                    <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(totalSales) }}</p>
                </div>
            </div>

            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div class="w-14 h-14 rounded-full bg-success-100 text-success-600 flex items-center justify-center">
                    <UIcon name="i-heroicons-shopping-bag-20-solid" class="w-8 h-8" />
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-500">Total Transaksi</p>
                    <p class="text-2xl font-bold text-gray-900">{{ totalTransactions }}</p>
                </div>
            </div>

            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div class="w-14 h-14 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center">
                    <UIcon name="i-heroicons-chart-pie-20-solid" class="w-8 h-8" />
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-500">Rata-rata Keranjang</p>
                    <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(averageTransaction) }}</p>
                </div>
            </div>
        </div>

        <!-- Recent Transactions -->
         <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Transaksi Terakhir</h3>
            <div v-if="transactions.length > 0" class="divide-y divide-gray-100">
                <div v-for="t in transactions" :key="t.id" class="py-3 flex justify-between items-center">
                    <div class="flex items-center gap-3">
                         <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                             <UIcon name="i-heroicons-receipt-percent" />
                         </div>
                         <div>
                             <p class="font-medium text-gray-900">Pembayaran Tunai</p>
                             <p class="text-xs text-gray-500">{{ new Date(t.created_at).toLocaleTimeString() }}</p>
                         </div>
                    </div>
                    <span class="font-bold text-gray-900">{{ formatCurrency(t.total) }}</span>
                </div>
            </div>
            <div v-else class="text-center py-10 text-gray-400">
                <UIcon name="i-heroicons-document" class="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Belum ada transaksi</p>
            </div>
        </div>
    </div>
  </div>
</template>
