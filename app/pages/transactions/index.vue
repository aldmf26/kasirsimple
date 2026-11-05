<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <div class="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Riwayat Transaksi</h1>
          <p class="text-gray-500">Kelola data penjualan, cek kasbon/hutang, dan cetak ulang struk</p>
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

      <!-- Search & Filter Tab Kasbon / Hutang -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <!-- Search Input -->
        <div class="w-full md:w-96">
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Cari nota, pelanggan, atau catatan..."
            size="md"
            class="w-full"
          />
        </div>

        <!-- Filter Tabs -->
        <div class="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            @click="filterStatus = 'all'"
            class="px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
            :class="filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          >
            Semua ({{ transactions.length }})
          </button>
          <button
            type="button"
            @click="filterStatus = 'debt'"
            class="px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5"
            :class="filterStatus === 'debt' ? 'bg-amber-600 text-white shadow-sm' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'"
          >
            <span>⚠️ Belum Lunas</span>
            <span v-if="unpaidCount > 0" class="px-1.5 py-0.5 rounded-full text-[10px] font-black" :class="filterStatus === 'debt' ? 'bg-white text-amber-700' : 'bg-amber-200 text-amber-900'">
              {{ unpaidCount }}
            </span>
          </button>
          <button
            type="button"
            @click="filterStatus = 'paid'"
            class="px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
            :class="filterStatus === 'paid' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          >
            ✓ Lunas
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <UTable
          :rows="filteredTransactions"
          :columns="columns"
          :loading="loading"
          class="w-full"
        >
          <template #transaction_number-data="{ row }">
            <span class="font-bold text-gray-900 font-mono text-xs">
              {{ row.transaction_number || row.id }}
            </span>
          </template>

          <template #customer_name-data="{ row }">
            <div class="font-medium text-gray-800">
              <span>{{ row.customer_name || "-" }}</span>
            </div>
          </template>

          <template #created_at-data="{ row }">
            <span class="text-xs text-gray-600">
              {{ new Date(row.created_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) }}
            </span>
          </template>

          <template #total-data="{ row }">
            <span class="font-bold text-gray-900">
              {{ formatCurrency(row.total) }}
            </span>
          </template>

          <template #status-data="{ row }">
            <UBadge
              v-if="Number(row.paid) < Number(row.total)"
              color="amber"
              variant="subtle"
              class="font-bold text-[11px]"
            >
              Kurang {{ formatCurrency(row.total - row.paid) }}
            </UBadge>
            <UBadge
              v-else
              color="emerald"
              variant="subtle"
              class="font-bold text-[11px]"
            >
              Lunas
            </UBadge>
          </template>

          <template #actions-data="{ row }">
            <div class="flex items-center gap-1.5">
              <UButton
                v-if="Number(row.paid) < Number(row.total)"
                icon="i-heroicons-check-circle"
                size="xs"
                color="amber"
                variant="solid"
                title="Lunasi Hutang"
                :loading="settlingId === row.id"
                @click="handleSettle(row)"
              >
                Lunasi
              </UButton>
              <UButton
                icon="i-heroicons-eye"
                size="xs"
                color="info"
                variant="soft"
                title="Lihat Struk"
                @click="openDetail(row)"
              />
              <UButton
                icon="i-heroicons-trash"
                size="xs"
                color="error"
                variant="soft"
                title="Hapus Transaksi"
                @click="handleDelete(row)"
              />
            </div>
          </template>
        </UTable>
        
        <div v-if="!loading && filteredTransactions.length === 0" class="p-8 text-center text-gray-400">
            <UIcon name="i-heroicons-receipt-refund" class="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{{ searchQuery || filterStatus !== 'all' ? 'Tidak ada transaksi yang cocok' : 'Belum ada transaksi' }}</p>
        </div>
      </div>
    </div>

    <!-- Modal Detail & Print (Reuse Layout Struk) -->
    <UModal v-model="detailModal.open">
        <div class="p-6 bg-white rounded-lg">
             <!-- Banner Jika Belum Lunas (Hutang) -->
             <div
               v-if="detailModal.data && Number(detailModal.data.paid) < Number(detailModal.data.total)"
               class="mb-5 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-sm"
             >
               <div class="flex items-center justify-between gap-3">
                 <div>
                   <p class="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                     ⚠️ STATUS: BELUM LUNAS (KASBON)
                   </p>
                   <p class="text-2xl font-black text-amber-800 mt-0.5">
                     {{ formatCurrency(detailModal.data.total - detailModal.data.paid) }}
                   </p>
                   <p class="text-xs text-amber-700 mt-0.5 font-medium">
                     Pelanggan: <span class="font-bold">{{ detailModal.data.customer_name || 'Umum' }}</span>
                   </p>
                 </div>
                 <UButton
                   color="amber"
                   variant="solid"
                   icon="i-heroicons-check-circle"
                   class="font-bold shrink-0"
                   :loading="settlingId === detailModal.data.id"
                   @click="handleSettle(detailModal.data)"
                 >
                   Lunasi Sekarang
                 </UButton>
               </div>
             </div>

             <!-- Header Struk (untuk Preview) -->
             <div class="text-center mb-6" id="printable-receipt">
                <h3 class="font-bold text-xl uppercase tracking-wider mb-1">{{ store?.name || 'STORE NAME' }}</h3>
                <p class="text-sm text-gray-500 mb-1">{{ store?.address }}</p>
                <p class="text-sm text-gray-500 mb-4">{{ store?.phone }}</p>
                
                <div class="text-xs text-gray-400 border-b border-dashed border-gray-300 pb-3 mb-3">
                    <p>{{ new Date(detailModal.data?.created_at).toLocaleString('id-ID') }}</p>
                    <p class="mt-1">No: {{ detailModal.data?.transaction_number || detailModal.data?.id }}</p>
                    <p v-if="detailModal.data?.customer_name" class="font-bold text-gray-700 mt-1">
                      Cust: {{ detailModal.data.customer_name }}
                    </p>
                </div>

                <!-- Items -->
                <div class="text-left mb-4 min-h-[80px]">
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
                    <!-- Sisa Hutang atau Kembali -->
                    <div
                      v-if="Number(detailModal.data?.paid) < Number(detailModal.data?.total)"
                      class="flex justify-between text-amber-700 font-bold"
                    >
                        <span>SISA HUTANG</span>
                        <span>{{ formatCurrency(detailModal.data.total - detailModal.data.paid) }}</span>
                    </div>
                    <div v-else class="flex justify-between text-gray-600">
                        <span>KEMBALI</span>
                        <span>{{ formatCurrency(detailModal.data?.change || 0) }}</span>
                    </div>
                </div>

                <div
                  v-if="Number(detailModal.data?.paid) < Number(detailModal.data?.total)"
                  class="mt-4 py-1.5 px-3 rounded-lg bg-amber-50 text-amber-700 font-bold text-xs"
                >
                  *** BELUM LUNAS ***
                </div>
                 
                <div class="mt-6 pt-4 border-t border-gray-100 text-center">
                    <p class="text-sm text-gray-500 italic font-medium">Terima Kasih</p>
                </div>
             </div>

             <!-- Status Printer Bluetooth -->
             <div
               class="mt-4 px-3 py-2 rounded-xl text-xs flex items-center justify-between border"
               :class="bt.isConnected.value ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-600'"
             >
               <div class="flex items-center gap-1.5 font-medium truncate">
                 <span class="w-2 h-2 rounded-full shrink-0" :class="bt.isConnected.value ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'"></span>
                 <span class="truncate">
                   {{ bt.isConnected.value ? (bt.deviceName.value || 'Printer Thermal Terhubung') : 'Printer Thermal: Belum tersambung' }}
                 </span>
               </div>
               <button
                 v-if="!bt.isConnected.value"
                 @click="bt.connect()"
                 type="button"
                 class="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 underline ml-2 shrink-0"
               >
                 Sambungkan
               </button>
             </div>

             <!-- Actions -->
             <div class="flex gap-3 mt-4">
                <UButton block color="secondary" variant="soft" class="flex-1" @click="detailModal.open = false">Tutup</UButton>
                <UButton block color="primary" class="flex-1" icon="i-heroicons-printer" :loading="isDirectPrinting" @click="printReceipt">
                  {{ isDirectPrinting ? 'Mencetak...' : 'Cetak Struk' }}
                </UButton>
             </div>
             <div class="text-right mt-2">
                <button
                  @click="printViaBrowser"
                  type="button"
                  class="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Cetak Browser (PDF/Kabel)
                </button>
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
import { ref, reactive, computed, onMounted } from "vue";
import { formatCurrency } from "~/utils/helpers";

definePageMeta({
  layout: "default",
});
useHead({ title: "Riwayat Transaksi" });

const { store, printerSettings } = useStore();
const { transactions, fetchTransactions, loading, deleteTransaction, settleDebtTransaction } = useTransactions();
const bt = useBluetoothPrinter();
const isDirectPrinting = ref(false);
const settlingId = ref<string | null>(null);

// Search & Filter
const searchQuery = ref("");
const filterStatus = ref<"all" | "debt" | "paid">("all");

const unpaidCount = computed(() => {
  return (transactions.value || []).filter(
    (t: any) => Number(t.paid) < Number(t.total)
  ).length;
});

const filteredTransactions = computed(() => {
  let list = transactions.value || [];

  // Filter status
  if (filterStatus.value === "debt") {
    list = list.filter((t: any) => Number(t.paid) < Number(t.total));
  } else if (filterStatus.value === "paid") {
    list = list.filter((t: any) => Number(t.paid) >= Number(t.total));
  }

  // Filter query
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    list = list.filter((t: any) => {
      const num = (t.transaction_number || t.id || "").toLowerCase();
      const cust = (t.customer_name || "").toLowerCase();
      const notes = (t.notes || "").toLowerCase();
      return num.includes(q) || cust.includes(q) || notes.includes(q);
    });
  }

  return list;
});

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
  { key: "customer_name", label: "Pelanggan" },
  { key: "total", label: "Total" },
  { key: "status", label: "Status" },
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

const handleSettle = async (transaction: any) => {
  const sisa = (Number(transaction.total) || 0) - (Number(transaction.paid) || 0);
  const name = transaction.customer_name || "pelanggan ini";
  if (!confirm(`Lunasi sisa hutang ${formatCurrency(sisa)} untuk ${name}?`)) {
    return;
  }

  settlingId.value = transaction.id;
  try {
    const updated = await settleDebtTransaction(transaction.id);
    if (detailModal.data && detailModal.data.id === transaction.id) {
      detailModal.data = { ...detailModal.data, ...updated };
    }
    showAlert("success", `Hutang ${name} sebesar ${formatCurrency(sisa)} berhasil dilunasi!`);
  } catch (e: any) {
    showAlert("error", e.message || "Gagal melunasi transaksi");
  } finally {
    settlingId.value = null;
  }
};

const handleDelete = async (transaction: any) => {
    try {
        const warnings = await deleteTransaction(transaction.id);
        showAlert(
            warnings?.length ? 'error' : 'success',
            warnings?.length
                ? `Transaksi dihapus, tapi stok belum kembali: ${warnings.join(', ')}`
                : 'Transaksi berhasil dihapus'
        );
        detailModal.open = false;
    } catch (e: any) {
        showAlert('error', e.message || 'Gagal menghapus transaksi');
    }
};

const printReceipt = async () => {
  if (!detailModal.data) return;

  isDirectPrinting.value = true;
  try {
    const r = await bt.smartPrint(
      detailModal.data,
      store.value,
      printerSettings.value
    );
    if (r.sent) {
      showAlert('success', 'Struk langsung keluar dari printer thermal');
      return;
    }
    if (r.error) {
      showAlert('error', r.error);
    }
  } catch (e: any) {
    console.error('Bluetooth print gagal:', e);
    showAlert('error', e?.message || 'Gagal mencetak ke printer');
  } finally {
    isDirectPrinting.value = false;
  }
};

const printViaBrowser = () => {
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
