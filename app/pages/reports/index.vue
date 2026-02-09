<script setup lang="ts">
import { formatCurrency, formatDateTime } from "~/utils/helpers";
import { Line, Bar, Pie, Doughnut } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

definePageMeta({
  layout: "default",
});

const { store } = useStore();
const { transactions, loading, fetchTransactions, deleteTransaction } =
  useTransactions();
const { products, fetchProducts } = useProducts();
const {
  getSalesByDate,
  getSalesByPaymentMethod,
  getTopSellingProducts,
  getTransactionCountByMethod,
  getAllItemsSold,
} = useCharts();
const toast = useToast();

// Modal states
const selectedTransaction = ref(null);
const showReceiptModal = ref(false);
const showDeleteModal = ref(false);

// Stats Calculation
const totalSales = computed(() => {
  return transactions.value.reduce((sum, t) => sum + (t.total || 0), 0);
});

const totalTransactions = computed(() => transactions.value.length);
const averageTransaction = computed(() => {
  if (totalTransactions.value === 0) return 0;
  return totalSales.value / totalTransactions.value;
});

// Chart Data
const salesByDateData = computed(() => {
  const { dates, sales } = getSalesByDate(transactions.value);
  return {
    labels: dates,
    datasets: [
      {
        label: "Penjualan Harian",
        data: sales,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#3b82f6",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };
});

const paymentMethodData = computed(() => {
  const { methods, amounts } = getSalesByPaymentMethod(transactions.value);
  return {
    labels: methods,
    datasets: [
      {
        data: amounts,
        backgroundColor: ["#10b981", "#f59e0b"],
        borderColor: ["#059669", "#d97706"],
        borderWidth: 2,
      },
    ],
  };
});

const topProductsData = computed(() => {
  const { products: names, quantities } = getTopSellingProducts(
    transactions.value,
    5,
  );
  return {
    labels: names,
    datasets: [
      {
        label: "Jumlah Terjual",
        data: quantities,
        backgroundColor: [
          "#3b82f6",
          "#8b5cf6",
          "#ec4899",
          "#f59e0b",
          "#10b981",
        ],
        borderColor: ["#1e40af", "#6d28d9", "#be185d", "#b45309", "#047857"],
        borderWidth: 2,
      },
    ],
  };
});

const paymentMethodCountData = computed(() => {
  const { methods, counts } = getTransactionCountByMethod(transactions.value);
  return {
    labels: methods,
    datasets: [
      {
        data: counts,
        backgroundColor: ["#06b6d4", "#f43f5e"],
        borderColor: ["#0891b2", "#be185d"],
        borderWidth: 2,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: true,
      position: "bottom" as const,
    },
  },
};

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: true,
      position: "bottom" as const,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function (value: any) {
          return "Rp " + value.toLocaleString("id-ID");
        },
      },
    },
  },
};

// Top Selling Items Computed
const allItemsSold = computed(() => getAllItemsSold(transactions.value));

// View Receipt
const viewReceipt = (transaction: any) => {
  selectedTransaction.value = transaction;
  showReceiptModal.value = true;
};

// Delete Transaction
const confirmDelete = (transaction: any) => {
  selectedTransaction.value = transaction;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!selectedTransaction.value) return;

  try {
    await deleteTransaction(selectedTransaction.value.id);
    toast.add({
      title: "Berhasil",
      description: "Transaksi berhasil dihapus",
      color: "success",
      icon: "i-heroicons-check-circle",
    });
    showDeleteModal.value = false;
    selectedTransaction.value = null;
    await fetchTransactions();
  } catch (error) {
    toast.add({
      title: "Gagal",
      description: "Gagal menghapus transaksi",
      color: "error",
      icon: "i-heroicons-x-circle",
    });
  }
};

// Print Receipt
const printReceipt = () => {
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

// Filters
const filters = reactive({
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date().toISOString().split("T")[0],
  paymentMethod: "all",
});
const activeFilter = ref("today");

const setFilter = (type: string) => {
  activeFilter.value = type;
  const end = new Date();
  const start = new Date();

  if (type === "today") {
    // start stays today
  } else if (type === "week") {
    start.setDate(end.getDate() - 7);
  } else if (type === "month") {
    start.setDate(end.getDate() - 30);
  } else if (type === "year") {
    start.setMonth(0, 1); // Jan 1st
  }

  filters.startDate = start.toISOString().split("T")[0];
  filters.endDate = end.toISOString().split("T")[0];
  loadData();
};

const loadData = async () => {
  if (store.value) {
    await Promise.all([
      fetchTransactions({
        startDate: filters.startDate,
        endDate: filters.endDate,
        paymentMethod: filters.paymentMethod,
      }),
      fetchProducts(),
    ]);
  }
};

onMounted(() => {
  loadData();
});

watch(
  () => store.value,
  async (newStore) => {
    if (newStore) {
      loadData();
    }
  },
);
</script>

<template>
  <div class="h-full flex flex-col bg-gray-50 overflow-auto">
    <!-- Header -->
    <div class="px-8 py-6 border-b border-gray-200 bg-white shadow-sm shrink-0">
      <h1 class="text-2xl font-bold text-gray-900">Laporan Penjualan</h1>
      <p class="text-sm text-gray-500">Ringkasan performa toko anda</p>
    </div>

    <!-- Filter Bar -->
    <div class="px-8 py-4 bg-white border-b border-gray-200">
      <div
        class="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between"
      >
        <!-- Shortcuts -->
        <div class="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <UButton
            size="xs"
            :color="activeFilter === 'today' ? 'primary' : 'neutral'"
            variant="soft"
            @click="setFilter('today')"
            >Hari Ini</UButton
          >
          <UButton
            size="xs"
            :color="activeFilter === 'week' ? 'primary' : 'neutral'"
            variant="soft"
            @click="setFilter('week')"
            >7 Hari</UButton
          >
          <UButton
            size="xs"
            :color="activeFilter === 'month' ? 'primary' : 'neutral'"
            variant="soft"
            @click="setFilter('month')"
            >30 Hari</UButton
          >
          <UButton
            size="xs"
            :color="activeFilter === 'year' ? 'primary' : 'neutral'"
            variant="soft"
            @click="setFilter('year')"
            >Tahun Ini</UButton
          >
        </div>

        <!-- Manual Filter -->
        <div
          class="flex flex-wrap items-end gap-3 w-full md:w-auto p-2 bg-gray-50 rounded-xl border border-gray-200"
        >
          <div class="flex flex-col gap-1">
            <span class="text-xs font-semibold text-gray-500 ml-1"
              >Dari Tanggal</span
            >
            <input
              type="date"
              v-model="filters.startDate"
              class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-700 shadow-sm"
            />
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-xs font-semibold text-gray-500 ml-1"
              >Sampai Tanggal</span
            >
            <input
              type="date"
              v-model="filters.endDate"
              class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-700 shadow-sm"
            />
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-xs font-semibold text-gray-500 ml-1"
              >Metode Bayar</span
            >
            <select
              v-model="filters.paymentMethod"
              class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-700 shadow-sm min-w-[120px]"
            >
              <option value="all">Semua</option>
              <option value="cash">Tunai</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          <UButton
            icon="i-heroicons-funnel"
            size="sm"
            color="primary"
            @click="loadData"
            :loading="loading"
            class="mb-0.5 shadow-sm"
          >
            Terapkan
          </UButton>
        </div>
      </div>
    </div>

    <div class="p-8 space-y-8">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
        >
          <div
            class="w-14 h-14 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center"
          >
            <UIcon name="i-heroicons-banknotes-20-solid" class="w-8 h-8" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Total Penjualan</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ formatCurrency(totalSales) }}
            </p>
          </div>
        </div>

        <div
          class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
        >
          <div
            class="w-14 h-14 rounded-full bg-success-100 text-success-600 flex items-center justify-center"
          >
            <UIcon name="i-heroicons-shopping-bag-20-solid" class="w-8 h-8" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Total Transaksi</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ totalTransactions }}
            </p>
          </div>
        </div>

        <div
          class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
        >
          <div
            class="w-14 h-14 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center"
          >
            <UIcon name="i-heroicons-chart-pie-20-solid" class="w-8 h-8" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Rata-rata Keranjang</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ formatCurrency(averageTransaction) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Sales Trend Chart -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Tren Penjualan</h3>
          <div class="h-80">
            <Line
              :data="salesByDateData"
              :options="lineChartOptions"
              v-if="salesByDateData.labels.length > 0"
            />
            <div
              v-else
              class="flex items-center justify-center h-full text-gray-400"
            >
              <p>Tidak ada data penjualan</p>
            </div>
          </div>
        </div>

        <!-- Top Products Chart -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">
            Produk Terlaris (Top 5)
          </h3>
          <div class="h-80">
            <Bar
              :data="topProductsData"
              :options="chartOptions"
              v-if="topProductsData.labels.length > 0"
            />
            <div
              v-else
              class="flex items-center justify-center h-full text-gray-400"
            >
              <p>Tidak ada data produk</p>
            </div>
          </div>
        </div>

        <!-- Payment Method Pie Chart -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">
            Penjualan Berdasarkan Metode Pembayaran
          </h3>
          <div class="h-80 flex items-center justify-center">
            <div class="w-full h-full">
              <Pie
                :data="paymentMethodData"
                :options="chartOptions"
                v-if="paymentMethodData.labels.length > 0"
              />
              <div
                v-else
                class="flex items-center justify-center h-full text-gray-400"
              >
                <p>Tidak ada data pembayaran</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Selling Items Table -->
        <div
          class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col"
        >
          <h3 class="text-lg font-bold text-gray-900 mb-4">Item Terjual</h3>
          <div
            v-if="allItemsSold.products && allItemsSold.products.length > 0"
            class="overflow-y-auto flex-1"
          >
            <table class="w-full">
              <thead class="sticky top-0 bg-white">
                <tr class="border-b border-gray-200">
                  <th class="text-left py-3 px-4 font-semibold text-gray-700">
                    No
                  </th>
                  <th class="text-left py-3 px-4 font-semibold text-gray-700">
                    Nama Produk
                  </th>
                  <th class="text-right py-3 px-4 font-semibold text-gray-700">
                    Jumlah Terjual
                  </th>
                  <th class="text-right py-3 px-4 font-semibold text-gray-700">
                    Total Penjualan
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(product, idx) in allItemsSold.products"
                  :key="idx"
                  class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td class="py-3 px-4 text-gray-900 font-medium">
                    {{ idx + 1 }}
                  </td>
                  <td class="py-3 px-4 text-gray-900">{{ product }}</td>
                  <td class="py-3 px-4 text-right text-gray-900 font-semibold">
                    {{ allItemsSold.quantities[idx] }} unit
                  </td>
                  <td class="py-3 px-4 text-right text-gray-900 font-semibold">
                    {{
                      formatCurrency((allItemsSold.sales?.[idx] || 0) as number)
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div
            v-else
            class="flex items-center justify-center flex-1 text-gray-400"
          >
            <div class="text-center">
              <UIcon
                name="i-heroicons-chart-bar"
                class="w-12 h-12 mx-auto mb-2 opacity-20"
              />
              <p class="font-medium">Belum ada item terjual</p>
            </div>
          </div>
        </div>
      </div>

      <div
        class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6"
      >
        <h3 class="text-lg font-bold text-gray-900 mb-4">Transaksi Terakhir</h3>
        <div v-if="transactions.length > 0" class="divide-y divide-gray-100">
          <div
            v-for="t in transactions"
            :key="t.id"
            class="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-gray-50 px-3 -mx-3 rounded-xl transition-colors"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0"
              >
                <UIcon name="i-heroicons-receipt-percent" class="w-6 h-6" />
              </div>
              <div class="min-w-0">
                <p class="font-semibold text-gray-900 truncate">
                  {{
                    t.payment_method === "cash"
                      ? "Pembayaran Tunai"
                      : "Transfer"
                  }}
                </p>
                <p class="text-xs text-gray-500">
                  {{ formatDateTime(t.created_at) }}
                </p>
              </div>
            </div>
            <div class="flex items-center justify-between sm:justify-end gap-4">
              <span class="text-lg font-bold text-gray-900">{{
                formatCurrency(t.total)
              }}</span>
              <div class="flex items-center gap-2">
                <UButton
                  icon="i-heroicons-eye"
                  size="md"
                  color="primary"
                  variant="soft"
                  @click="viewReceipt(t)"
                  class="rounded-xl"
                  title="Lihat Struk"
                />
                <UButton
                  icon="i-heroicons-trash"
                  size="md"
                  color="error"
                  variant="soft"
                  @click="confirmDelete(t)"
                  class="rounded-xl"
                  title="Hapus"
                />
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-12 text-gray-400">
          <UIcon
            name="i-heroicons-document-text"
            class="w-12 h-12 mx-auto mb-2 opacity-20"
          />
          <p class="font-medium">Belum ada transaksi</p>
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
        <div
          class="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto flex flex-col"
        >
          <!-- Thermal Printer Receipt Component -->
          <div class="mb-4">
            <ThermalPrinterReceipt
              :transaction="selectedTransaction"
              :store="store"
            />
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
        <div
          class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
          @click.stop
        >
          <div class="flex items-center gap-3 mb-4">
            <div
              class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"
            >
              <UIcon
                name="i-heroicons-exclamation-triangle"
                class="w-7 h-7 text-red-600"
              />
            </div>
            <h3 class="text-xl font-bold text-gray-900">Hapus Transaksi?</h3>
          </div>

          <p class="text-base text-gray-600 mb-6">
            Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak
            dapat dibatalkan.
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
