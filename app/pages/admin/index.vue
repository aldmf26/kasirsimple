<script setup lang="ts">
import { formatCurrency } from "~/utils/helpers";

definePageMeta({
  layout: "default",
});

const { isAdmin, allStores, loading, fetchAllStores, updateStoreSubscription, getStoreReport } = useAdmin();
const router = useRouter();

// Store for reports data
const storeReports = reactive<Record<string, any>>({});
const editModal = reactive({
  open: false,
  store: null as any,
  form: {
    subscription_until: "",
    subscription_status: "active",
    subscription_plan: "monthly"
  },
  loading: false
});

onMounted(async () => {
  if (!isAdmin.value) {
    // Wait a bit for store to load
    setTimeout(async () => {
      if (!isAdmin.value) {
        router.push("/dashboard");
      } else {
        await loadData();
      }
    }, 1000);
  } else {
    await loadData();
  }
});

const loadData = async () => {
  await fetchAllStores();
  // Fetch reports for each store
  for (const s of allStores.value) {
    const report = await getStoreReport(s.id);
    if (report) storeReports[s.id] = report;
  }
};

const openEdit = (s: any) => {
  editModal.store = s;
  // Parse date to YYYY-MM-DD for input
  const date = s.subscription_until ? new Date(s.subscription_until) : new Date();
  editModal.form.subscription_until = date.toISOString().split('T')[0];
  editModal.form.subscription_status = s.subscription_status || 'active';
  editModal.form.subscription_plan = s.subscription_plan || 'monthly';
  editModal.open = true;
};

const handleUpdate = async () => {
  if (!editModal.store) return;
  editModal.loading = true;
  try {
    await updateStoreSubscription(editModal.store.id, {
      subscription_until: new Date(editModal.form.subscription_until).toISOString(),
      subscription_status: editModal.form.subscription_status,
      subscription_plan: editModal.form.subscription_plan
    });
    editModal.open = false;
  } catch (e: any) {
    alert("Gagal update: " + e.message);
  } finally {
    editModal.loading = false;
  }
};

const getStatusColor = (s: any) => {
  const now = new Date();
  const until = new Date(s.subscription_until);
  if (until < now) return "bg-red-100 text-red-700 border-red-200";
  
  const diffDays = Math.ceil((until.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) return "bg-orange-100 text-orange-700 border-orange-200";
  
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
};

const getDaysLeft = (s: any) => {
  if (!s.subscription_until) return 0;
  const now = new Date();
  const until = new Date(s.subscription_until);
  const diffTime = until.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-24">
    <div class="bg-gray-900 text-white p-6 rounded-b-[2rem] shadow-lg mb-6">
      <h1 class="text-2xl font-black mb-1">Admin Dashboard</h1>
      <p class="text-gray-400 text-sm font-medium uppercase tracking-wider">Manajemen Toko & Langganan</p>
    </div>

    <div v-if="!isAdmin" class="p-12 text-center">
      <UIcon name="i-heroicons-lock-closed" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <p class="text-gray-500 font-bold">Maaf, halaman ini hanya untuk Admin.</p>
    </div>

    <div v-else class="container mx-auto px-4 space-y-4">
      <!-- Loading State -->
      <div v-if="loading && allStores.length === 0" class="flex flex-col items-center justify-center p-20">
        <div class="animate-spin text-blue-600 mb-4 text-4xl">⏳</div>
        <p class="text-gray-500 font-medium">Memuat data seluruh toko...</p>
      </div>

      <!-- Store List -->
      <div v-if="allStores.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="s in allStores" :key="s.id" 
             class="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="font-black text-gray-900 text-lg leading-tight">{{ s.name }}</h3>
              <p class="text-xs text-gray-500 font-bold uppercase tracking-wide">{{ s.business_type || 'Retail' }}</p>
            </div>
            <span :class="getStatusColor(s)" class="px-3 py-1 rounded-full text-[10px] font-black uppercase border">
              {{ !s.subscription_until ? 'Trial (Default)' : (getDaysLeft(s) <= 0 ? 'Expired' : getDaysLeft(s) + ' Hari') }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-3 mb-5">
            <div class="bg-gray-50 p-3 rounded-2xl border border-gray-100">
               <p class="text-[10px] text-gray-400 font-bold uppercase mb-1">Omzet (30hr)</p>
               <p class="text-sm font-black text-blue-600">{{ formatCurrency(storeReports[s.id]?.totalRevenue || 0) }}</p>
            </div>
            <div class="bg-gray-50 p-3 rounded-2xl border border-gray-100">
               <p class="text-[10px] text-gray-400 font-bold uppercase mb-1">Transaksi</p>
               <p class="text-sm font-black text-gray-900">{{ storeReports[s.id]?.transactionCount || 0 }} Kali</p>
            </div>
          </div>

          <div class="flex gap-2">
            <button @click="openEdit(s)" class="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 shadow-lg shadow-blue-100 active:scale-95 transition-all">
              EDIT LANGGANAN
            </button>
            <a :href="'https://wa.me/' + s.phone" target="_blank" class="w-12 h-12 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 border border-emerald-100">
               <UIcon name="i-heroicons-chat-bubble-left-right" class="w-6 h-6" />
            </a>
          </div>
        </div>
      </div>

      <div v-else-if="!loading" class="bg-white p-10 rounded-3xl text-center border-2 border-dashed border-gray-200">
         <p class="text-gray-400 font-medium">Belum ada toko yang mendaftar.</p>
      </div>
    </div>

    <!-- Edit Subscription Modal -->
    <div v-if="editModal.open" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="editModal.open = false">
      <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-[scale-in_0.2s_ease-out]">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-black text-gray-900">Edit Akses</h3>
            <button @click="editModal.open = false" class="text-gray-400 hover:text-gray-600">
              <UIcon name="i-heroicons-x-mark" class="w-6 h-6" />
            </button>
          </div>

          <p class="text-sm text-gray-500 font-medium mb-4">Toko: <span class="text-gray-900 font-black">{{ editModal.store?.name }}</span></p>

          <div class="space-y-4">
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Aktif Sampai</label>
              <input type="date" v-model="editModal.form.subscription_until" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</label>
              <select v-model="editModal.form.subscription_status" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Paket</label>
              <select v-model="editModal.form.subscription_plan" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="monthly">Bulanan</option>
                <option value="yearly">Tahunan</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <button @click="handleUpdate" :disabled="editModal.loading" class="w-full py-4 bg-gray-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all disabled:opacity-50 mt-4">
              {{ editModal.loading ? 'Menyimpan...' : 'SIMPAN PERUBAHAN' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes scale-in {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
