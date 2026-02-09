<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <div class="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Riwayat Transaksi</h1>
          <p class="text-gray-500">Kelola data penjualan dan cetak ulang struk</p>
        </div>
        <UButton
          icon="i-heroicons-arrow-path"
          color="primary"
          variant="soft"
          label="Refresh"
          @click="loadTransactions"
          :loading="loading"
        />
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <UTable
          :rows="transactions"
          :columns="columns"
          :loading="loading"
          class="w-full"
        >
          <template #total-data="{ row }">
            <span class="font-semibold text-gray-900">
              {{ formatCurrency(row.total) }}
            </span>
          </template>
          <template #created_at-data="{ row }">
            {{ new Date(row.created_at).toLocaleString('id-ID') }}
          </template>
          <template #payment_method-data="{ row }">
            <UBadge :color="row.payment_method === 'cash' ? 'success' : 'info'" variant="subtle">
              {{ row.payment_method.toUpperCase() }}
            </UBadge>
          </template>
          <template #actions-data="{ row }">
            <div class="flex gap-2">
              <UButton
                icon="i-heroicons-eye"
                size="xs"
                color="info"
                variant="soft"
                @click="openDetail(row)"
              />
              <UButton
                icon="i-heroicons-trash"
                size="xs"
                color="error"
                variant="soft"
                @click="handleDelete(row)"
              />
            </div>
          </template>
        </UTable>
        
        <div v-if="!loading && transactions.length === 0" class="p-8 text-center text-gray-400">
            <UIcon name="i-heroicons-receipt-refund" class="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Belum ada transaksi</p>
        </div>
      </div>
    </div>

    <!-- Modal Detail & Print (Reuse Layout Struk) -->
    <UModal v-model="detailModal.open">
        <div class="p-6 bg-white rounded-lg">
            <!-- Header Struk (untuk Preview) -->
             <div class="text-center mb-6" id="printable-receipt">
                <h3 class="font-bold text-xl uppercase tracking-wider mb-1">{{ store?.name || 'STORE NAME' }}</h3>
                <p class="text-sm text-gray-500 mb-1">{{ store?.address }}</p>
                <p class="text-sm text-gray-500 mb-4">{{ store?.phone }}</p>
                
                <div class="text-xs text-gray-400 border-b border-dashed border-gray-300 pb-3 mb-3">
                    <p>{{ new Date(detailModal.data?.created_at).toLocaleString('id-ID') }}</p>
                    <p class="mt-1">No: {{ detailModal.data?.transaction_number || detailModal.data?.id }}</p>
                </div>

                <!-- Items -->
                <div class="text-left mb-4 min-h-[100px]">
                    <div v-for="item in detailModal.data?.items" :key="item.id" class="flex justify-between text-sm mb-2">
                        <div>
                            <p class="font-medium text-gray-800">{{ item.product_name }}</p>
                            <p class="text-xs text-gray-500">{{ item.quantity }} x {{ formatCurrency(item.product_price) }}</p>
                        </div>
                        <p class="font-medium text-gray-800">{{ formatCurrency(item.subtotal) }}</p>
                    </div>
                </div>

                <!-- Totals -->
                <div class="border-t border-dashed border-gray-300 pt-3 space-y-1 text-sm">
                    <div class="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>{{ formatCurrency(detailModal.data?.subtotal || 0) }}</span>
                    </div>
                    <div v-if="detailModal.data?.discount > 0" class="flex justify-between text-green-600">
                        <span>Diskon</span>
                        <span>-{{ formatCurrency(detailModal.data?.discount) }}</span>
                    </div>
                     <div class="flex justify-between font-bold text-lg text-gray-900 mt-2 border-t border-gray-100 pt-2">
                        <span>TOTAL</span>
                        <span>{{ formatCurrency(detailModal.data?.total || 0) }}</span>
                    </div>
                </div>
                 <div class="border-t border-dashed border-gray-300 my-4"></div>
                 <div class="text-sm space-y-1">
                     <div class="flex justify-between text-gray-600">
                        <span>BAYAR ({{ detailModal.data?.payment_method?.toUpperCase() }})</span>
                        <span>{{ formatCurrency(detailModal.data?.paid || 0) }}</span>
                    </div>
                     <div class="flex justify-between text-gray-600">
                        <span>KEMBALI</span>
                        <span>{{ formatCurrency(detailModal.data?.change || 0) }}</span>
                    </div>
                 </div>
                 
                 <div class="mt-6 pt-4 border-t border-gray-100 text-center">
                    <p class="text-sm text-gray-500 italic font-medium">Terima Kasih</p>
                 </div>
             </div>

             <!-- Actions -->
             <div class="flex gap-3 mt-6">
                <UButton block color="secondary" variant="soft" @click="detailModal.open = false">Tutup</UButton>
                <UButton block color="primary" icon="i-heroicons-printer" @click="printReceipt">Cetak Struk</UButton>
             </div>
        </div>
    </UModal>
    
    <AppAlert 
      :show="alert.show" 
      :type="alert.type" 
      :message="alert.message"
      @close="alert.show = false"
    />
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from "~/utils/helpers";

definePageMeta({
  layout: "default",
});
useHead({ title: "Riwayat Transaksi" });

const { store } = useStore();
const { transactions, fetchTransactions, loading, deleteTransaction } = useTransactions();

// Alert Config
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

// Table Config
const columns = [
  { key: "transaction_number", label: "No Transaksi" },
  { key: "created_at", label: "Tanggal" },
  { key: "payment_method", label: "Pembayaran" },
  { key: "total", label: "Total" },
  { key: "actions", label: "" },
];

// Detail Modal
const detailModal = reactive({
    open: false,
    data: null as any
});

onMounted(() => {
    loadTransactions();
});

const loadTransactions = async () => {
    await fetchTransactions();
};

const openDetail = (transaction: any) => {
    detailModal.data = transaction;
    detailModal.open = true;
};

const handleDelete = async (transaction: any) => {
    try {
        await deleteTransaction(transaction.id);
        showAlert('success', 'Transaksi berhasil dihapus');
        detailModal.open = false;
    } catch (e: any) {
        showAlert('error', e.message || 'Gagal menghapus transaksi');
    }
};

const printReceipt = () => {
  const content = document.getElementById("printable-receipt")?.innerHTML;
  if (!content) return;

  const printWindow = window.open("", "", "width=300,height=600");
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Receipt</title>
          <style>
            body { font-family: monospace; padding: 20px; text-align: center; }
            h3 { font-size: 16px; margin: 0 0 5px 0; }
            p { margin: 2px 0; font-size: 12px; }
            .items { text-align: left; margin: 10px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0; }
            .flex { display: flex; justify-content: space-between; }
            .total { font-weight: bold; font-size: 14px; margin-top: 5px; }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() { window.print(); window.close(); }
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};
</script>
