<script setup lang="ts">
import { formatCurrency, formatDateTime } from "~/utils/helpers";

definePageMeta({
  layout: "default",
});

useHead({
  title: "Beranda Toko - KasirSimple",
});

const { store } = useStore();
const { products, fetchProducts, getLowStockProducts } = useProducts();
const { transactions, fetchTransactions, getTodaySummary } = useTransactions();

const dashboardStats = ref({
  totalSales: 0,
  totalTransactions: 0,
  totalProducts: 0,
});

const recentTransactions = ref<any[]>([]);
const lowStockItems = ref<any[]>([]);
const loading = ref(true);

const refreshDashboard = async () => {
  if (!store.value) return;

  loading.value = true;
  try {
    const [summary, recent, lowStock, prods] = await Promise.all([
      getTodaySummary(),
      fetchTransactions(),
      getLowStockProducts(),
      fetchProducts(),
    ]);

    if (summary) {
      dashboardStats.value = {
        totalSales: summary.totalSales || 0,
        totalTransactions: summary.totalTransactions || 0,
        totalProducts: prods?.length || 0,
      };
    }
    recentTransactions.value = (recent || []).slice(0, 5);
    lowStockItems.value = lowStock || [];
  } catch (e) {
    console.error("Error refreshing dashboard:", e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  refreshDashboard();
});

// Aksi Cepat - Diurutkan berdasarkan prioritas ibu-ibu
const quickActions = [
  {
    label: "MULAI JUALAN (KASIR)",
    description: "Klik di sini untuk melayani pembeli",
    icon: "i-heroicons-shopping-cart-solid",
    to: "/pos",
    color: "emerald",
    featured: true,
  },
  {
    label: "Tambah Barang",
    description: "Masukan barang dagangan baru",
    icon: "i-heroicons-plus-circle",
    to: "/products",
    color: "blue",
    featured: false,
  },
  {
    label: "Catatan Keuntungan",
    description: "Lihat hasil jualan",
    icon: "i-heroicons-document-text",
    to: "/reports",
    color: "violet",
    featured: false,
  },
];

const getColorClasses = (color: string) => {
  const colors: Record<
    string,
    { bg: string; text: string; iconBg: string; border: string }
  > = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      iconBg: "bg-blue-100",
      border: "border-blue-200",
    },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      iconBg: "bg-emerald-100",
      border: "border-emerald-200",
    },
    violet: {
      bg: "bg-purple-50",
      text: "text-purple-600",
      iconBg: "bg-purple-100",
      border: "border-purple-200",
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      iconBg: "bg-amber-100",
      border: "border-amber-200",
    },
  };
  return colors[color] || colors.blue;
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 pb-20">
    <div class="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div
        class="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100"
      >
        <div>
          <h1 class="text-2xl font-bold text-gray-800">
            Selamat {{ new Date().getHours() < 12 ? "Pagi" : "Siang" }}, Bu!
          </h1>
          <p class="text-gray-500 text-sm italic">
            Semoga dagangan hari ini laris manis ya.
          </p>
        </div>
        <div class="text-right hidden sm:block">
          <p class="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Tanggal Hari Ini
          </p>
          <p class="text-sm font-medium text-gray-700">
            {{
              new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })
            }}
          </p>
        </div>
      </div>

      <div
        class="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl"
      >
        <div class="flex justify-between items-start">
          <div>
            <p class="text-blue-100 font-medium">Uang Masuk Hari Ini:</p>
            <h2 class="text-4xl font-black mt-1">
              {{ formatCurrency(dashboardStats.totalSales) }}
            </h2>
            <p class="text-blue-100 text-sm mt-2 flex items-center gap-1">
              <UIcon name="i-heroicons-check-badge" />
              Dari {{ dashboardStats.totalTransactions }} kali jualan
            </p>
          </div>
          <div class="bg-white/20 p-3 rounded-2xl">
            <UIcon name="i-heroicons-banknotes" class="w-10 h-10" />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4">
        <NuxtLink
          v-for="action in quickActions"
          :key="action.label"
          :to="action.to"
          class="flex items-center p-5 rounded-2xl border-2 transition-all active:scale-95 bg-white"
          :class="[
            action.featured
              ? 'border-emerald-500 ring-4 ring-emerald-50'
              : 'border-gray-100 shadow-sm',
          ]"
        >
          <div
            class="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
            :class="getColorClasses(action.color).iconBg"
          >
            <UIcon
              :name="action.icon"
              class="w-8 h-8"
              :class="getColorClasses(action.color).text"
            />
          </div>
          <div class="ml-4 flex-1">
            <h3
              class="font-bold text-gray-900"
              :class="action.featured ? 'text-lg' : 'text-base'"
            >
              {{ action.label }}
            </h3>
            <p class="text-sm text-gray-500">{{ action.description }}</p>
          </div>
          <UIcon
            name="i-heroicons-chevron-right"
            class="w-6 h-6 text-gray-300"
          />
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          class="bg-white rounded-2xl border border-orange-200 overflow-hidden shadow-sm"
        >
          <div
            class="p-4 bg-orange-50 border-b border-orange-100 flex items-center gap-2"
          >
            <UIcon
              name="i-heroicons-exclamation-triangle-solid"
              class="text-orange-500 w-5 h-5"
            />
            <h2 class="font-bold text-orange-800 text-sm uppercase">
              Barang Mau Habis
            </h2>
          </div>
          <div class="p-2">
            <div
              v-if="lowStockItems.length === 0"
              class="p-6 text-center text-gray-400"
            >
              <UIcon
                name="i-heroicons-check-circle"
                class="w-10 h-10 mx-auto mb-2 text-emerald-400"
              />
              <p class="text-sm italic">Semua stok barang masih aman, Bu.</p>
            </div>
            <div v-else class="divide-y divide-gray-50">
              <div
                v-for="item in lowStockItems.slice(0, 3)"
                :key="item.id"
                class="p-3 flex justify-between items-center"
              >
                <span class="font-medium text-gray-700">{{ item.name }}</span>
                <span
                  class="bg-red-100 text-red-600 px-3 py-1 rounded-full font-bold text-xs"
                >
                  Sisa: {{ item.stock }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          class="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
        >
          <div
            class="p-4 border-b border-gray-100 flex justify-between items-center"
          >
            <h2 class="font-bold text-gray-800 text-sm uppercase">
              Jualan Terakhir
            </h2>
            <NuxtLink to="/reports" class="text-xs text-blue-600 font-bold"
              >Lihat Semua</NuxtLink
            >
          </div>
          <div class="p-2">
            <div
              v-if="recentTransactions.length === 0"
              class="p-6 text-center text-gray-400 text-sm italic"
            >
              Belum ada penjualan hari ini.
            </div>
            <div v-else class="divide-y divide-gray-50">
              <div
                v-for="trx in recentTransactions"
                :key="trx.id"
                class="p-3 flex justify-between items-center"
              >
                <div>
                  <p class="text-sm font-bold text-gray-800">
                    {{ formatCurrency(trx.total) }}
                  </p>
                  <p class="text-[10px] text-gray-400 uppercase">
                    {{ trx.payment_method }} •
                    {{ formatDateTime(trx.created_at) }}
                  </p>
                </div>
                <UIcon
                  name="i-heroicons-check-circle"
                  class="text-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Menghilangkan scrollbar agar tampilan lebih bersih */
.overflow-y-auto::-webkit-scrollbar {
  display: none;
}
</style>
