<script setup lang="ts">
import { businessTypes, paymentMethods } from "~/utils/helpers";

definePageMeta({
  layout: "default",
});

const { store, updateStore } = useStore();
const supabase = useSupabaseClient();

// Store settings form
const storeSettings = reactive({
  name: "",
  business_type: "retail",
  address: "",
  phone: "",
  currency: "Rp",
  logo_url: "",
});

const selectedLogoFile = ref<File | null>(null);
const logoPreview = ref<string | null>(null);

// Sync form with store data
watch(store, (newStore) => {
  if (newStore) {
    storeSettings.name = newStore.name;
    storeSettings.business_type = newStore.business_type || "retail";
    storeSettings.address = newStore.address || "";
    storeSettings.phone = newStore.phone || "";
    storeSettings.currency = newStore.currency || "Rp";
    storeSettings.logo_url = newStore.logo_url || "";
    
    // Reset preview saat load data baru
    if(!selectedLogoFile.value) {
        logoPreview.value = newStore.logo_url || "";
    }
  }
}, { immediate: true });

const handleFileSelect = (event: any) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    showAlert("error", "Maksimal ukuran file 2MB");
    return;
  }

  selectedLogoFile.value = file;
  logoPreview.value = URL.createObjectURL(file);
};

const triggerFileInput = () => {
    document.getElementById('logoInput')?.click();
};

// Alert State
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
const printerSettings = ref({
  printerType: "thermal",
  paperWidth: 58,
  autoPrint: false,
  includeLogo: true,
  includeStoreInfo: true,
  footerText: "Terima kasih atas kunjungan Anda!",
});

// Active section
const activeSection = ref("store");

const sections = [
  {
    id: "store",
    label: "Profil Toko",
    icon: "i-heroicons-building-storefront",
  },
  {
    id: "payment",
    label: "Metode Pembayaran",
    icon: "i-heroicons-credit-card",
  },
  { id: "account", label: "Akun", icon: "i-heroicons-user-circle" },
];

// Enabled payment methods
const enabledPaymentMethods = ref(["cash", "transfer", "qris"]);

const togglePaymentMethod = (method: string) => {
  const index = enabledPaymentMethods.value.indexOf(method);
  if (index > -1) {
    if (enabledPaymentMethods.value.length > 1) {
      enabledPaymentMethods.value.splice(index, 1);
    } else {
      showAlert("error", "Minimal satu metode pembayaran harus aktif");
    }
  } else {
    enabledPaymentMethods.value.push(method);
  }
};

const saveSettings = async () => {
  if (activeSection.value === 'store') {
    try {
      if (store.value?.id) {
        let logoUrl = storeSettings.logo_url;

        // Upload logo jika ada file baru di client
        if (selectedLogoFile.value) {
           const file = selectedLogoFile.value;
           const fileExt = file.name.split(".").pop();
           const fileName = `${store.value.id}-${Date.now()}.${fileExt}`;
           
           const { error: uploadError } = await supabase.storage
              .from("logos")
              .upload(fileName, file, {
                 cacheControl: "3600",
                 upsert: false
              });
            
           if (uploadError) throw uploadError;

           const { data: { publicUrl } } = supabase.storage
              .from("logos")
              .getPublicUrl(fileName);
           
           logoUrl = publicUrl;
        }

        await updateStore(store.value.id, {
          name: storeSettings.name,
          business_type: storeSettings.business_type,
          address: storeSettings.address,
          phone: storeSettings.phone,
          currency: storeSettings.currency,
          logo_url: logoUrl
        });
        
        // Reset local state
        selectedLogoFile.value = null;
        storeSettings.logo_url = logoUrl;
        
        showAlert("success", "Profil toko berhasil diperbarui");
      }
    } catch (e: any) {
      console.error(e);
      showAlert("error", e.message || "Gagal menyimpan perubahan");
    }
  } else {
    // Mock save for other sections
    showAlert("success", "Perubahan berhasil disimpan");
  }
};

const handleLogout = () => {
  const dummyAuth = useCookie("dummy_auth");
  dummyAuth.value = null;
  navigateTo("/auth/login");
};
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Mobile Tabs (Hidden on Desktop) -->
    <div class="md:hidden sticky top-0 z-10 bg-white border-b border-gray-100">
      <div class="flex overflow-x-auto">
        <button
          v-for="section in sections"
          :key="section.id"
          class="flex-1 px-4 py-3 text-xs font-bold uppercase transition-colors border-b-2 whitespace-nowrap"
          :class="
            activeSection === section.id
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          "
          @click="activeSection = section.id"
        >
          <UIcon :name="section.icon" class="w-4 h-4 mr-1 inline" />
          {{ section.label }}
        </button>
      </div>
    </div>
    
    <AppAlert 
      :show="alert.show" 
      :type="alert.type" 
      :message="alert.message"
      @close="alert.show = false"
    />

    <div class="flex min-h-screen md:min-h-auto">
      <!-- Sidebar (Hidden on Mobile) -->
      <div
        class="hidden md:block w-72 bg-white border-r border-gray-100 shrink-0 sticky top-0 h-screen overflow-y-auto"
      >
        <div class="p-6 border-b border-gray-100">
          <h1 class="text-xl font-bold text-gray-900">⚙️ Pengaturan</h1>
          <p class="text-sm text-gray-500 mt-1">Kelola toko Anda</p>
        </div>

        <nav class="p-4 space-y-1">
          <button
            v-for="section in sections"
            :key="section.id"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left font-medium"
            :class="
              activeSection === section.id
                ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-600'
                : 'text-gray-600 hover:bg-gray-50'
            "
            @click="activeSection = section.id"
          >
            <UIcon :name="section.icon" class="w-5 h-5 flex-shrink-0" />
            {{ section.label }}
          </button>
        </nav>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 md:p-8">
        <!-- Store Profile -->
        <div v-if="activeSection === 'store'" class="max-w-2xl space-y-6">
          <div
            class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <h2 class="text-xl font-bold text-gray-900 mb-8">Profil Toko</h2>

            <div class="space-y-6">
              <!-- Store Name -->
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2"
                  >Nama Toko</label
                >
                <input
                  v-model="storeSettings.name"
                  class="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Nama toko Anda"
                />
              </div>

              <!-- Business Type -->
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-3"
                  >Jenis Usaha</label
                >
                <div class="grid grid-cols-3 gap-2 sm:gap-3">
                  <button
                    v-for="type in businessTypes"
                    :key="type.value"
                    class="p-3 sm:p-4 rounded-xl border-2 transition-all text-center"
                    :class="
                      storeSettings.business_type === type.value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    "
                    @click="storeSettings.business_type = type.value"
                  >
                    <span class="text-2xl block mb-2">{{ type.icon }}</span>
                    <span
                      class="font-medium text-xs sm:text-sm text-gray-900"
                      >{{ type.label }}</span
                    >
                  </button>
                </div>
              </div>

              <!-- Address -->
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2"
                  >Alamat</label
                >
                <textarea
                  v-model="storeSettings.address"
                  :rows="2"
                  class="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Alamat lengkap toko"
                ></textarea>
              </div>

              <!-- Phone -->
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-2"
                  >No. Telepon</label
                >
                <input
                  v-model="storeSettings.phone"
                  class="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </div>
          </div>

          <button
            @click="saveSettings"
            class="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
          >
            <UIcon name="i-heroicons-check" class="w-5 h-5" />
            Simpan Perubahan
          </button>
        </div>

        <!-- Payment Methods -->
        <div v-if="activeSection === 'payment'" class="max-w-2xl space-y-6">
          <div
            class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <h2 class="text-xl font-bold text-gray-900 mb-2">
              Metode Pembayaran
            </h2>
            <p class="text-sm text-gray-500 mb-6">
              Aktifkan metode pembayaran yang diterima di toko Anda
            </p>

            <div class="space-y-3">
              <div
                v-for="method in paymentMethods"
                :key="method.value"
                class="flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer"
                :class="
                  enabledPaymentMethods.includes(method.value)
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                "
                @click="togglePaymentMethod(method.value)"
              >
                <div class="flex items-center gap-4">
                  <div
                    class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    :class="
                      enabledPaymentMethods.includes(method.value)
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-gray-200 text-gray-400'
                    "
                  >
                    <UIcon :name="method.icon" class="w-6 h-6" />
                  </div>
                  <span
                    class="font-medium text-gray-900 text-sm sm:text-base"
                    >{{ method.label }}</span
                  >
                </div>
                <UIcon
                  :name="
                    enabledPaymentMethods.includes(method.value)
                      ? 'i-heroicons-check-circle-solid'
                      : 'i-heroicons-x-circle'
                  "
                  class="w-6 h-6 flex-shrink-0"
                  :class="
                    enabledPaymentMethods.includes(method.value)
                      ? 'text-emerald-600'
                      : 'text-gray-300'
                  "
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Account -->
        <div v-if="activeSection === 'account'" class="max-w-2xl space-y-6">
          <div
            class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <h2 class="text-xl font-bold text-gray-900 mb-6">Akun Anda</h2>

            <div
              class="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-8 border-b border-gray-100"
            >
              <div
                class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0"
              >
                <UIcon name="i-heroicons-user" class="w-10 h-10" />
              </div>
              <div class="text-center sm:text-left">
                <p class="font-bold text-lg text-gray-900">User Demo</p>
                <p class="text-gray-500 text-sm">demo@example.com</p>
              </div>
            </div>

            <div class="space-y-3">
              <button
                class="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <UIcon name="i-heroicons-key" class="w-5 h-5" />
                Ubah Password
              </button>

              <button
                @click="handleLogout"
                class="w-full py-3 px-4 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <UIcon
                  name="i-heroicons-arrow-left-on-rectangle"
                  class="w-5 h-5"
                />
                Logout
              </button>
            </div>
          </div>

          <!-- Danger Zone -->
          <div class="bg-red-50 rounded-2xl border border-red-200 p-6">
            <h3 class="text-lg font-bold text-red-600 mb-2">Zona Berbahaya</h3>
            <p class="text-sm text-red-500 mb-4">
              Tindakan ini tidak dapat dikembalikan
            </p>
            <button
              class="py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors text-sm flex items-center gap-2"
            >
              <UIcon name="i-heroicons-trash" class="w-4 h-4" />
              Hapus Akun
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
