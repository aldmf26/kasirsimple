<script setup lang="ts">
import { formatCurrency, formatDateTime } from "~/utils/helpers";

definePageMeta({
  layout: "default",
});

useHead({
  title: "Beranda Toko - KasirOK",
});

const { store, fetchStore, createStore } = useStore();
const { products, fetchProducts, getLowStockProducts } = useProducts();
const { transactions, fetchTransactions, getTodaySummary } = useTransactions();
const user = useSupabaseUser();
const toast = useToast();

const dashboardStats = ref({
  totalSales: 0,
  totalTransactions: 0,
  totalProducts: 0,
});

const recentTransactions = ref<any[]>([]);
const lowStockItems = ref<any[]>([]);
const loading = ref(true);

// Setup Store Modal State
const setupModal = reactive({
  open: false,
  loading: false,
  error: null as string | null,
  form: {
    name: "",
    business_type: "retail",
    address: "",
    phone: "",
  }
});

const businessTypes = [
  { value: "retail", label: "Toko Eceran (Retail)", icon: "🏪" },
  { value: "fnb", label: "Makanan & Minuman", icon: "🍽️" },
  { value: "service", label: "Jasa / Service", icon: "🛠️" },
];

const handleSetupStore = async () => {
    if (!setupModal.form.name) {
        setupModal.error = "Nama toko wajib diisi";
        return;
    }
    
    setupModal.loading = true;
    setupModal.error = null;
    
    try {
         // Create store
         await createStore({
            name: setupModal.form.name,
            business_type: setupModal.form.business_type,
            address: setupModal.form.address,
            phone: setupModal.form.phone,
            is_active: true
        });
        
        setupModal.open = false;
        toast.add({ title: 'Toko Berhasil Dibuat!', description: 'Selamat datang di dashboard Anda.', color: 'success' });
        
        // Refresh data
        refreshDashboard();
    } catch (e: any) {
        console.error(e);
        setupModal.error = e.message || "Gagal membuat toko";
    } finally {
        setupModal.loading = false;
    }
}

const refreshDashboard = async () => {
  if (!store.value) {
    loading.value = false;
    return;
  }

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
  } catch (e: any) {
    console.error("Error refreshing dashboard:", e);
  } finally {
    loading.value = false;
  }
};

// Watch store changes
watch(
  () => store.value,
  (newStore) => {
    if (newStore) {
      // If store is loaded (even late), close the modal and refresh
      setupModal.open = false; 
      refreshDashboard();
    }
  },
  { deep: true },
);

onMounted(async () => {
  loading.value = true;
  
  try {
    // Wait for user to be ready if needed
    if (!user.value) {
       // Short delay or check
    }

    // Check store
    if (!store.value && user.value) {
        // Explicitly pass user ID to ensure we fetch for the correct user
        await fetchStore(user.value.id);
    }
    
    if (store.value) {
      refreshDashboard();
    } else {
      // If user is logged in but no store -> Show Setup Modal
      // Double check user exists before showing
      if (user.value) {
          // Pre-fill name
          if (user.value.user_metadata?.full_name) {
              setupModal.form.name = `Toko ${user.value.user_metadata.full_name}`;
          }
          setupModal.open = true;
      }
    }
  } catch (e) {
    console.error("Error initializing dashboard:", e);
  } finally {
    loading.value = false;
  }
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
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return "Pagi";
  if (hour < 15) return "Siang";
  if (hour < 18) return "Sore";
  return "Malam";
});

</script>

<template>
  <div class="min-h-screen bg-slate-50 pb-20">
    <div class="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div
        class="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100"
      >
        <div>
          <h1 class="text-2xl font-bold text-gray-800">
           Selamat {{ greeting }}, {{ store?.name || "Toko Anda" }}!
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
              <p class="text-sm italic">Semua stok barang masih aman.</p>
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

    <!-- Setup Store Modal -->
    <div v-if="setupModal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div class="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
        <div class="p-6 border-b border-gray-100 bg-gray-50/50">
          <div class="flex items-center gap-3">
             <div class="w-12 h-12 bg-gradient-to-tr from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-200">
                <UIcon name="i-heroicons-building-storefront" class="w-7 h-7" />
             </div>
             <div>
                <h3 class="text-lg font-bold text-gray-900">Halo, Selamat Datang! 👋</h3>
                <p class="text-sm text-gray-500">Yuk isi data tokomu dulu biar bisa jualan.</p>
             </div>
          </div>
        </div>
        
        <div class="p-6 space-y-5">
           <!-- Error Alert -->
          <div v-if="setupModal.error" class="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold flex gap-2 items-center">
            <UIcon name="i-heroicons-exclamation-circle" class="w-4 h-4 shrink-0" />
            {{ setupModal.error }}
          </div>

           <div class="space-y-1.5">
             <label class="text-sm font-bold text-gray-700 ml-1">Nama Toko <span class="text-red-500">*</span></label>
             <input v-model="setupModal.form.name" type="text" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all outline-none text-sm font-medium placeholder-gray-400" placeholder="Contoh: Toko Berkah" />
           </div>

           <div class="space-y-1.5">
             <label class="text-sm font-bold text-gray-700 ml-1">Jenis Usaha</label>
             <div class="grid grid-cols-1 gap-2">
                <button v-for="type in businessTypes" :key="type.value" 
                  @click="setupModal.form.business_type = type.value"
                  class="flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all text-left"
                  :class="setupModal.form.business_type === type.value ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'"
                >
                  <span class="text-xl">{{ type.icon }}</span>
                  <span class="text-sm font-medium">{{ type.label }}</span>
                  <UIcon v-if="setupModal.form.business_type === type.value" name="i-heroicons-check-circle-solid" class="ml-auto w-5 h-5 text-violet-600" />
                </button>
             </div>
           </div>
           
           <div class="space-y-1.5">
             <label class="text-sm font-bold text-gray-700 ml-1">Alamat (Opsional)</label>
             <textarea v-model="setupModal.form.address" rows="2" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all outline-none text-sm font-medium placeholder-gray-400" placeholder="Dimana lokasi tokomu?"></textarea>
           </div>
        </div>

        <div class="p-6 border-t border-gray-100 bg-gray-50/50 flex flex-col gap-3">
           <button 
             @click="handleSetupStore" 
             :disabled="setupModal.loading"
             class="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-violet-200 transform transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
           >
             <svg v-if="setupModal.loading" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
               <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
             {{ setupModal.loading ? 'Menyiapkan Toko...' : 'Simpan & Mulai Jualan 🚀' }}
           </button>
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
