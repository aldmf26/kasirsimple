<script setup lang="ts">
import { formatDateTime } from "~/utils/helpers";

definePageMeta({
  layout: "default",
});

const router = useRouter();
const user = useSupabaseUser();

const { activityLogs, loading, fetchActivityLogs, exportLogs } =
  useActivityLog();
const toast = useToast();

// Check auth on mount only (client-side)
onMounted(() => {
  if (!user.value) {
    router.push("/auth/login");
  }
  loadActivities();
});

// Filter state
const filters = reactive({
  action: "all",
  startDate: "",
  endDate: "",
  search: "",
});

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(20);
const totalItems = ref(0);

// Fetch activity logs
const loadActivities = () => {
  const result = fetchActivityLogs({
    action: filters.action !== "all" ? filters.action : undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    search: filters.search || undefined,
    limit: itemsPerPage.value,
    offset: (currentPage.value - 1) * itemsPerPage.value,
  });

  if (result && Array.isArray(result) === false && "total" in result) {
    totalItems.value = result.total;
  }
};

// Filter watch
watch(
  [() => filters.action, () => filters.startDate, () => filters.endDate],
  () => {
    currentPage.value = 1;
    loadActivities();
  },
);

// Search filter with debounce
const searchInput = ref("");
const debouncedSearch = useDebounceFn(() => {
  filters.search = searchInput.value;
  currentPage.value = 1;
  loadActivities();
}, 500);

watch(
  () => searchInput.value,
  () => {
    debouncedSearch();
  },
);

onMounted(() => {
  loadActivities();
});

// Get icon for action
const getActionIcon = (action: string) => {
  if (action.includes("PRODUCT")) return "i-heroicons-cube";
  if (action.includes("STOCK")) return "i-heroicons-archive-box";
  if (action.includes("TRANSACTION")) return "i-heroicons-receipt-percent";
  if (action.includes("CATEGORY")) return "i-heroicons-list-bullet";
  if (action.includes("CASH")) return "i-heroicons-banknotes";
  if (action.includes("SETTINGS")) return "i-heroicons-cog-6-tooth";
  if (action.includes("LOGIN"))
    return "i-heroicons-arrow-right-start-on-rectangle";
  return "i-heroicons-information-circle";
};

// Get action color
const getActionColor = (action: string) => {
  if (action.includes("DELETED") || action.includes("REFUND")) return "red";
  if (action.includes("CREATED") || action.includes("IN")) return "green";
  if (action.includes("UPDATED")) return "blue";
  if (action.includes("OUT")) return "orange";
  return "gray";
};

// Parse details
const parseDetails = (details: any) => {
  if (typeof details === "string") {
    try {
      return JSON.parse(details);
    } catch {
      return details;
    }
  }
  return details;
};

// Export logs handler
const handleExport = () => {
  exportLogs();
  toast.add({
    title: "Berhasil",
    description: "Activity logs berhasil di-export",
    color: "success",
    icon: "i-heroicons-check-circle",
  });
};
</script>

<template>
  <ClientOnly>
    <div class="h-full flex flex-col bg-gray-50 overflow-auto">
      <!-- Header -->
      <div
        class="px-8 py-6 border-b border-gray-200 bg-white shadow-sm shrink-0"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <UButton
              icon="i-heroicons-arrow-left"
              color="neutral"
              variant="soft"
              size="lg"
              @click="router.back()"
            >
              Kembali
            </UButton>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">
                Riwayat Aktivitas
              </h1>
              <p class="text-sm text-gray-500">
                Catat semua aktivitas pengguna dan perubahan data
              </p>
            </div>
          </div>
          <UButton
            icon="i-heroicons-arrow-down-tray"
            size="lg"
            color="primary"
            @click="handleExport"
          >
            Export
          </UButton>
        </div>
      </div>

      <!-- Filters -->
      <div class="px-8 py-4 bg-white border-b border-gray-200 space-y-4">
        <div class="flex flex-col md:flex-row gap-4 items-end">
          <!-- Search -->
          <div class="flex-1">
            <label class="text-xs font-semibold text-gray-500 ml-1 block mb-1"
              >Cari Aktivitas</label
            >
            <input
              v-model="searchInput"
              type="text"
              placeholder="Cari berdasarkan action atau detail..."
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-700 shadow-sm"
            />
          </div>

          <!-- Action Filter -->
          <div>
            <label class="text-xs font-semibold text-gray-500 ml-1 block mb-1"
              >Jenis Aktivitas</label
            >
            <select
              v-model="filters.action"
              class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-700 shadow-sm min-w-[150px]"
            >
              <option value="all">Semua</option>
              <option value="PRODUCT_CREATED">Tambah Produk</option>
              <option value="PRODUCT_UPDATED">Update Produk</option>
              <option value="PRODUCT_DELETED">Hapus Produk</option>
              <option value="STOCK_ADJUSTMENT">Sesuaikan Stok</option>
              <option value="STOCK_IN">Stok Masuk</option>
              <option value="STOCK_OUT">Stok Keluar</option>
              <option value="TRANSACTION_CREATED">Buat Transaksi</option>
              <option value="TRANSACTION_DELETED">Hapus Transaksi</option>
              <option value="TRANSACTION_REFUNDED">Refund Transaksi</option>
            </select>
          </div>

          <!-- Start Date -->
          <div>
            <label class="text-xs font-semibold text-gray-500 ml-1 block mb-1"
              >Dari Tanggal</label
            >
            <input
              v-model="filters.startDate"
              type="date"
              class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-700 shadow-sm min-w-[130px]"
            />
          </div>

          <!-- End Date -->
          <div>
            <label class="text-xs font-semibold text-gray-500 ml-1 block mb-1"
              >Sampai Tanggal</label
            >
            <input
              v-model="filters.endDate"
              type="date"
              class="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-700 shadow-sm min-w-[130px]"
            />
          </div>
        </div>
      </div>

      <!-- Activity List -->
      <div class="p-8 flex-1 space-y-3 overflow-y-auto">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="text-center">
            <UIcon
              name="i-heroicons-arrow-path"
              class="w-8 h-8 mx-auto mb-2 text-primary-600 animate-spin"
            />
            <p class="text-gray-500">Memuat riwayat aktivitas...</p>
          </div>
        </div>

        <div
          v-else-if="activityLogs.length === 0"
          class="flex items-center justify-center py-12"
        >
          <div class="text-center">
            <UIcon
              name="i-heroicons-inbox"
              class="w-12 h-12 mx-auto mb-2 text-gray-400"
            />
            <p class="text-gray-500 font-medium">Tidak ada aktivitas</p>
            <p class="text-xs text-gray-400">
              Coba ubah filter untuk melihat lebih banyak
            </p>
          </div>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="log in activityLogs"
            :key="log.id"
            class="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-start gap-4">
              <!-- Icon -->
              <div
                :class="`w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-${getActionColor(log.action)}-100 text-${getActionColor(log.action)}-600`"
              >
                <UIcon :name="getActionIcon(log.action)" class="w-5 h-5" />
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="font-semibold text-gray-900">{{ log.action }}</h3>
                  <span
                    class="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600"
                  >
                    {{ formatDateTime(log.timestamp) }}
                  </span>
                </div>

                <!-- Details -->
                <div v-if="log.details" class="mt-2 text-sm text-gray-600">
                  <div
                    v-if="typeof parseDetails(log.details) === 'object'"
                    class="space-y-1"
                  >
                    <div
                      v-for="(value, key) in parseDetails(log.details)"
                      :key="key"
                      class="flex gap-2"
                    >
                      <span class="font-medium">{{ key }}:</span>
                      <span class="truncate">{{ value }}</span>
                    </div>
                  </div>
                  <div v-else class="italic">{{ log.details }}</div>
                </div>

                <!-- User Info -->
                <div v-if="log.user_id" class="mt-2 text-xs text-gray-400">
                  User ID: {{ log.user_id.substring(0, 8) }}...
                </div>
              </div>

              <!-- Related ID -->
              <div v-if="log.related_id" class="shrink-0 text-right">
                <p class="text-xs text-gray-500">
                  ID: {{ log.related_id.substring(0, 8) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="totalItems > itemsPerPage"
        class="px-8 py-4 bg-white border-t border-gray-200 flex items-center justify-between"
      >
        <p class="text-sm text-gray-500">
          Menampilkan {{ (currentPage - 1) * itemsPerPage + 1 }} -
          {{ Math.min(currentPage * itemsPerPage, totalItems) }} dari
          {{ totalItems }} aktivitas
        </p>
        <div class="flex gap-2">
          <UButton
            size="sm"
            variant="soft"
            @click="
              currentPage--;
              loadActivities();
            "
            :disabled="currentPage === 1"
          >
            Sebelumnya
          </UButton>
          <UButton
            size="sm"
            variant="soft"
            @click="
              currentPage++;
              loadActivities();
            "
            :disabled="currentPage * itemsPerPage >= totalItems"
          >
            Selanjutnya
          </UButton>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<style scoped>
/* Color utilities untuk dynamic classes */
:deep(.bg-red-100) {
  background-color: rgb(254, 226, 226);
}
:deep(.text-red-600) {
  color: rgb(220, 38, 38);
}
:deep(.bg-green-100) {
  background-color: rgb(220, 252, 231);
}
:deep(.text-green-600) {
  color: rgb(22, 163, 74);
}
:deep(.bg-blue-100) {
  background-color: rgb(219, 234, 254);
}
:deep(.text-blue-600) {
  color: rgb(37, 99, 235);
}
:deep(.bg-orange-100) {
  background-color: rgb(254, 237, 220);
}
:deep(.text-orange-600) {
  color: rgb(234, 88, 12);
}
:deep(.bg-gray-100) {
  background-color: rgb(243, 244, 246);
}
:deep(.text-gray-600) {
  color: rgb(75, 85, 99);
}
</style>
