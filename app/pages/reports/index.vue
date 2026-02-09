<script setup lang="ts">
import { formatCurrency, formatDateTime } from '~/utils/helpers'

definePageMeta({
  layout: 'default'
})

const { store } = useStore()
const { transactions, loading, fetchTransactions, deleteTransaction } = useTransactions()
const { products, fetchProducts } = useProducts()
const toast = useToast()

// Modal states
const selectedTransaction = ref(null)
const showReceiptModal = ref(false)
const showDeleteModal = ref(false)

// Stats Calculation
const totalSales = computed(() => {
    return transactions.value.reduce((sum, t) => sum + (t.total || 0), 0)
})

const totalTransactions = computed(() => transactions.value.length)
const averageTransaction = computed(() => {
    if (totalTransactions.value === 0) return 0
    return totalSales.value / totalTransactions.value
})

// View Receipt
const viewReceipt = (transaction: any) => {
    selectedTransaction.value = transaction
    showReceiptModal.value = true
}

// Delete Transaction
const confirmDelete = (transaction: any) => {
    selectedTransaction.value = transaction
    showDeleteModal.value = true
}

const handleDelete = async () => {
    if (!selectedTransaction.value) return
    
    try {
        await deleteTransaction(selectedTransaction.value.id)
        toast.add({
            title: 'Berhasil',
            description: 'Transaksi berhasil dihapus',
            color: 'success',
            icon: 'i-heroicons-check-circle'
        })
        showDeleteModal.value = false
        selectedTransaction.value = null
        await fetchTransactions()
    } catch (error) {
        toast.add({
            title: 'Gagal',
            description: 'Gagal menghapus transaksi',
            color: 'error',
            icon: 'i-heroicons-x-circle'
        })
    }
}

// Print Receipt
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
                <div v-for="t in transactions" :key="t.id" class="py-3 flex justify-between items-center group hover:bg-gray-50 px-3 -mx-3 rounded-lg transition-colors">
                    <div class="flex items-center gap-3">
                         <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                             <UIcon name="i-heroicons-receipt-percent" />
                         </div>
                         <div>
                             <p class="font-medium text-gray-900">{{ t.payment_method === 'cash' ? 'Pembayaran Tunai' : 'Transfer' }}</p>
                             <p class="text-xs text-gray-500">{{ formatDateTime(t.created_at) }}</p>
                         </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="font-bold text-gray-900">{{ formatCurrency(t.total) }}</span>
                        <div class="flex items-center gap-2">
                            <UButton
                                icon="i-heroicons-eye"
                                size="sm"
                                color="primary"
                                variant="soft"
                                @click="viewReceipt(t)"
                                title="Lihat Struk"
                            />
                            <UButton
                                icon="i-heroicons-trash"
                                size="sm"
                                color="error"
                                variant="soft"
                                @click="confirmDelete(t)"
                                title="Hapus"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="text-center py-10 text-gray-400">
                <UIcon name="i-heroicons-document" class="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Belum ada transaksi</p>
            </div>
        </div>
    </div>

    <!-- Modal Struk (Thermal Printer Style) -->
    <Teleport to="body">
      <div
        v-if="showReceiptModal && selectedTransaction"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="showReceiptModal = false"
      >
        <div class="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto flex flex-col">
           <!-- Preview Area -->
           <div id="receipt-content" class="bg-white p-4 font-mono text-xs text-gray-800 border border-gray-100 shadow-sm mb-4">
              <div class="text-center mb-4">
                  <img v-if="store?.logo_url" :src="store.logo_url" class="w-16 h-16 object-contain mx-auto mb-2 grayscale" />
                  <h2 class="font-bold text-base uppercase">{{ store?.name || 'Kasir Simple' }}</h2>
                  <p v-if="store?.address">{{ store.address }}</p>
                  <p v-if="store?.phone">{{ store.phone }}</p>
                  <p class="mt-2">{{ formatDateTime(selectedTransaction.created_at) }}</p>
                  <p>No: {{ selectedTransaction.transaction_number || selectedTransaction.id }}</p>
              </div>

              <hr class="border-t border-dashed border-gray-400 my-2" />

              <div class="space-y-1">
                  <div v-for="(item, idx) in selectedTransaction.items" :key="idx" class="flex justify-between">
                      <span class="truncate pr-2">{{ item.quantity }}x {{ item.product_name }}</span>
                      <span class="whitespace-nowrap">{{ formatCurrency(item.product_price * item.quantity) }}</span>
                  </div>
              </div>

              <hr class="border-t border-dashed border-gray-400 my-2" />

               <div class="space-y-1 font-bold">
                  <div class="flex justify-between">
                      <span>TOTAL</span>
                      <span>{{ formatCurrency(selectedTransaction.total) }}</span>
                  </div>
                  <div class="flex justify-between">
                      <span>BAYAR ({{ selectedTransaction.payment_method === 'cash' ? 'Tunai' : 'Transfer' }})</span>
                      <span>{{ formatCurrency(selectedTransaction.paid_amount || selectedTransaction.total) }}</span>
                  </div>
                  <div class="flex justify-between">
                      <span>KEMBALI</span>
                      <span>{{ formatCurrency((selectedTransaction.paid_amount || selectedTransaction.total) - selectedTransaction.total) }}</span>
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
                  @click="showReceiptModal = false"
                  class="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
                >
                  TUTUP
               </button>
               <button 
                  @click="printReceipt"
                  class="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <UIcon name="i-heroicons-printer" class="w-5 h-5" />
                  PRINT
               </button>
           </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="showDeleteModal = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" @click.stop>
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-7 h-7 text-red-600" />
            </div>
            <h3 class="text-xl font-bold text-gray-900">Hapus Transaksi?</h3>
          </div>

          <p class="text-base text-gray-600 mb-6">
            Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.
          </p>

          <div class="flex gap-3">
            <button
              @click="showDeleteModal = false"
              class="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
            >
              BATAL
            </button>
            <button
              @click="handleDelete"
              class="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 active:scale-95 transition-all"
            >
              HAPUS
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* Print style untuk cetak struk */
@media print {
  body * {
    visibility: hidden;
  }
  #receipt-content,
  #receipt-content * {
    visibility: visible;
  }
  #receipt-content {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    background: white !important;
  }
}
</style>