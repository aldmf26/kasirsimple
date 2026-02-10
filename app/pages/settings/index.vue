<script setup lang="ts">
import { businessTypes, paymentMethods } from "~/utils/helpers";

definePageMeta({
  layout: "default",
});

const { store, updateStore, fetchStore } = useStore();
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

// Force refresh store data when entering settings page to ensure latest data
onMounted(async () => {
  await fetchStore();
});

// Sync form with store data
watch(
  () => store.value?.id,
  async (storeId) => {
    if (storeId && store.value) {
      const newStore = store.value;
      storeSettings.name = newStore.name;
      storeSettings.business_type = newStore.business_type || "retail";
      storeSettings.address = newStore.address || "";
      storeSettings.phone = newStore.phone || "";
      storeSettings.currency = newStore.currency || "Rp";
      storeSettings.logo_url = newStore.logo_url || "";

      // Load enabled payment methods from store
      const storeData = newStore as any;
      if (storeData.enabled_payment_methods) {
        try {
          const parsed =
            typeof storeData.enabled_payment_methods === "string"
              ? JSON.parse(storeData.enabled_payment_methods)
              : storeData.enabled_payment_methods;
          enabledPaymentMethods.value = Array.isArray(parsed)
            ? parsed
            : ["cash"];
        } catch (e) {
          enabledPaymentMethods.value = ["cash"];
        }
      }

      // Load bank accounts from store
      if (storeData.bank_accounts) {
        try {
          const parsed =
            typeof storeData.bank_accounts === "string"
              ? JSON.parse(storeData.bank_accounts)
              : storeData.bank_accounts;
          bankAccounts.value = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          bankAccounts.value = [];
        }
      }

      // Load product display setting
      showProductImages.value = storeData.show_product_images !== false;

      // Load discount & tax settings
      if (storeData.discount_tax_settings) {
        try {
          const parsed =
            typeof storeData.discount_tax_settings === "string"
              ? JSON.parse(storeData.discount_tax_settings)
              : storeData.discount_tax_settings;
          Object.assign(discountTaxSettings, parsed);
        } catch (e) {
          console.error("Error parsing discount_tax_settings:", e);
        }
      }

      // Reset preview saat load data baru
      if (!selectedLogoFile.value) {
        logoPreview.value = newStore.logo_url || "";
      }
    }
  },
  { immediate: true },
);

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
  document.getElementById("logoInput")?.click();
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
  {
    id: "activity",
    label: "Riwayat Aktivitas",
    icon: "i-heroicons-clock",
    action: () => navigateTo("/activity-history"),
  },
];

// Enabled payment methods
const enabledPaymentMethods = ref(["cash", "transfer", "qris"]);

// Product display settings
const showProductImages = ref(true);

// Discount & Tax settings
const discountTaxSettings = reactive({
  discount_global: {
    enabled: false,
    percent: 0,
  },
  discount_nominal: {
    enabled: false,
    min_amount: 0,
    discount_percent: 0,
  },
  tax: {
    enabled: false,
    percent: 0,
  },
  ppn: {
    enabled: false,
    percent: 0,
  },
});

// Bank accounts for card payment
const bankAccounts = ref<
  Array<{
    id: string;
    accountName: string;
    bank: string;
    accountNumber: string;
  }>
>([]);
const newBankAccount = reactive({
  accountName: "",
  bank: "",
  accountNumber: "",
});

// Edit mode state
const editingAccountId = ref<string | null>(null);
const editingBankAccount = reactive({
  accountName: "",
  bank: "",
  accountNumber: "",
});

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

const addBankAccount = () => {
  if (
    !newBankAccount.accountName ||
    !newBankAccount.bank ||
    !newBankAccount.accountNumber
  ) {
    showAlert("error", "Semua field rekening harus diisi");
    return;
  }

  bankAccounts.value.push({
    id: Math.random().toString(36).substr(2, 9),
    accountName: newBankAccount.accountName,
    bank: newBankAccount.bank,
    accountNumber: newBankAccount.accountNumber,
  });

  newBankAccount.accountName = "";
  newBankAccount.bank = "";
  newBankAccount.accountNumber = "";
  showAlert("success", "Rekening berhasil ditambahkan");
};

const removeBankAccount = (id: string) => {
  bankAccounts.value = bankAccounts.value.filter((acc) => acc.id !== id);
  showAlert("success", "Rekening berhasil dihapus");
};

const startEditBankAccount = (account: any) => {
  editingAccountId.value = account.id;
  editingBankAccount.accountName = account.accountName;
  editingBankAccount.bank = account.bank;
  editingBankAccount.accountNumber = account.accountNumber;
};

const cancelEditBankAccount = () => {
  editingAccountId.value = null;
  editingBankAccount.accountName = "";
  editingBankAccount.bank = "";
  editingBankAccount.accountNumber = "";
};

const saveEditBankAccount = () => {
  if (
    !editingBankAccount.accountName ||
    !editingBankAccount.bank ||
    !editingBankAccount.accountNumber
  ) {
    showAlert("error", "Semua field rekening harus diisi");
    return;
  }

  const accountIndex = bankAccounts.value.findIndex(
    (acc) => acc.id === editingAccountId.value,
  );
  if (accountIndex > -1) {
    bankAccounts.value[accountIndex] = {
      id: editingAccountId.value!,
      accountName: editingBankAccount.accountName,
      bank: editingBankAccount.bank,
      accountNumber: editingBankAccount.accountNumber,
    };
    showAlert("success", "Rekening berhasil diubah");
    cancelEditBankAccount();
  }
};

// Debounce timers
let storeSettingsDebounce: ReturnType<typeof setTimeout> | null = null;
let paymentSettingsDebounce: ReturnType<typeof setTimeout> | null = null;

// Auto-save store settings with debounce
const autoSaveStoreSettings = async () => {
  if (!store.value?.id) return;

  try {
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
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("logos").getPublicUrl(fileName);

      logoUrl = publicUrl;
    }

    await updateStore(store.value.id, {
      name: storeSettings.name,
      business_type: storeSettings.business_type,
      address: storeSettings.address,
      phone: storeSettings.phone,
      currency: storeSettings.currency,
      logo_url: logoUrl,
    });

    // Reset local state
    selectedLogoFile.value = null;
    storeSettings.logo_url = logoUrl;

    showAlert("success", "Profil toko berhasil disimpan");
  } catch (e: any) {
    console.error(e);
    showAlert("error", e.message || "Gagal menyimpan perubahan");
  }
};

// Auto-save payment settings with debounce
const autoSavePaymentSettings = async () => {
  if (!store.value?.id) return;

  try {
    const updateData: any = {
      enabled_payment_methods: JSON.stringify(enabledPaymentMethods.value),
      bank_accounts: JSON.stringify(bankAccounts.value),
      show_product_images: showProductImages.value,
      discount_tax_settings: JSON.stringify(discountTaxSettings),
    };
    await updateStore(store.value.id, updateData);
    showAlert("success", "Pengaturan berhasil disimpan");
  } catch (e: any) {
    console.error(e);
    showAlert("error", e.message || "Gagal menyimpan perubahan");
  }
};

// Watch store settings with debounce
watch(
  storeSettings,
  () => {
    if (storeSettingsDebounce) clearTimeout(storeSettingsDebounce);
    storeSettingsDebounce = setTimeout(autoSaveStoreSettings, 1000);
  },
  { deep: true },
);

// Watch payment methods with debounce
watch(
  enabledPaymentMethods,
  () => {
    if (paymentSettingsDebounce) clearTimeout(paymentSettingsDebounce);
    paymentSettingsDebounce = setTimeout(autoSavePaymentSettings, 1000);
  },
  { deep: true },
);

// Watch bank accounts with debounce
watch(
  bankAccounts,
  () => {
    if (paymentSettingsDebounce) clearTimeout(paymentSettingsDebounce);
    paymentSettingsDebounce = setTimeout(autoSavePaymentSettings, 1000);
  },
  { deep: true },
);

// Watch product images setting with debounce
watch(showProductImages, () => {
  if (paymentSettingsDebounce) clearTimeout(paymentSettingsDebounce);
  paymentSettingsDebounce = setTimeout(autoSavePaymentSettings, 1000);
});

// Watch discount & tax settings with debounce
watch(
  discountTaxSettings,
  () => {
    if (paymentSettingsDebounce) clearTimeout(paymentSettingsDebounce);
    paymentSettingsDebounce = setTimeout(autoSavePaymentSettings, 1000);
  },
  { deep: true },
);

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
            @click="
              section.action ? section.action() : (activeSection = section.id)
            "
          >
            <UIcon :name="section.icon" class="w-5 h-5 shrink-0" />
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

              <!-- Product Display Settings -->
              <div
                class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
              >
                <h2 class="text-xl font-bold text-gray-900 mb-2">
                  📸 Tampilan Produk
                </h2>
                <p class="text-sm text-gray-500 mb-6">
                  Pilih apakah foto produk ditampilkan di POS atau tidak
                </p>

                <div class="space-y-4">
                  <!-- Show Product Images Toggle -->
                  <div
                    class="flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer"
                    :class="
                      showProductImages
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    "
                    @click="showProductImages = !showProductImages"
                  >
                    <div class="flex items-center gap-4">
                      <div
                        class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        :class="
                          showProductImages
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-200 text-gray-400'
                        "
                      >
                        <UIcon
                          :name="
                            showProductImages
                              ? 'i-heroicons-photo'
                              : 'i-heroicons-photo-slash'
                          "
                          class="w-6 h-6"
                        />
                      </div>
                      <div>
                        <p
                          class="font-medium text-gray-900 text-sm sm:text-base"
                        >
                          {{
                            showProductImages
                              ? "Tampilkan Foto"
                              : "Sembunyikan Foto"
                          }}
                        </p>
                        <p class="text-xs text-gray-500 mt-1">
                          {{
                            showProductImages
                              ? "Foto produk akan ditampilkan di POS"
                              : "Menghemat ruang, foto tidak ditampilkan"
                          }}
                        </p>
                      </div>
                    </div>
                    <UIcon
                      :name="
                        showProductImages
                          ? 'i-heroicons-check-circle-solid'
                          : 'i-heroicons-x-circle'
                      "
                      class="w-6 h-6 shrink-0"
                      :class="
                        showProductImages ? 'text-blue-600' : 'text-gray-300'
                      "
                    />
                  </div>

                  <div
                    v-if="showProductImages"
                    class="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800"
                  >
                    ✅ Anda dapat paste link foto untuk setiap produk
                  </div>
                  <div
                    v-else
                    class="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600"
                  >
                    💾 Mode hemat: Foto tidak ditampilkan di POS untuk menghemat
                    ruang
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                    class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
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
                  class="w-6 h-6 shrink-0"
                  :class="
                    enabledPaymentMethods.includes(method.value)
                      ? 'text-emerald-600'
                      : 'text-gray-300'
                  "
                />
              </div>
            </div>

            <!-- Bank Accounts Section (Show when card is enabled) -->
            <div
              v-if="enabledPaymentMethods.includes('card')"
              class="mt-8 pt-8 border-t border-gray-200"
            >
              <h3 class="text-lg font-bold text-gray-900 mb-4">
                Rekening Bank Kartu
              </h3>

              <!-- Existing Bank Accounts -->
              <div v-if="bankAccounts.length > 0" class="mb-6 space-y-2">
                <div
                  v-for="account in bankAccounts"
                  :key="account.id"
                  class="p-4 bg-gray-50 rounded-xl"
                >
                  <!-- Display mode -->
                  <div
                    v-if="editingAccountId !== account.id"
                    class="flex items-center justify-between"
                  >
                    <div>
                      <p class="font-semibold text-gray-900">
                        {{ account.accountName }}
                      </p>
                      <p class="text-sm text-gray-500">
                        {{ account.bank }} - {{ account.accountNumber }}
                      </p>
                    </div>
                    <div class="flex gap-2">
                      <button
                        @click="startEditBankAccount(account)"
                        class="text-blue-600 hover:text-blue-700"
                        title="Edit"
                      >
                        <UIcon name="i-heroicons-pencil" class="w-5 h-5" />
                      </button>
                      <button
                        @click="removeBankAccount(account.id)"
                        class="text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <UIcon name="i-heroicons-trash" class="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <!-- Edit mode -->
                  <div v-else class="space-y-3">
                    <div>
                      <label class="block text-xs font-bold text-gray-600 mb-1"
                        >Nama Rekening</label
                      >
                      <input
                        v-model="editingBankAccount.accountName"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-gray-600 mb-1"
                        >Nama Bank</label
                      >
                      <input
                        v-model="editingBankAccount.bank"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-gray-600 mb-1"
                        >Nomor Rekening</label
                      >
                      <input
                        v-model="editingBankAccount.accountNumber"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div class="flex gap-2">
                      <button
                        @click="saveEditBankAccount"
                        class="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm"
                      >
                        Simpan Perubahan
                      </button>
                      <button
                        @click="cancelEditBankAccount"
                        class="flex-1 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded-lg text-sm"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Add New Bank Account Form -->
              <div class="bg-gray-50 p-4 rounded-xl space-y-3">
                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1"
                    >Nama Rekening</label
                  >
                  <input
                    v-model="newBankAccount.accountName"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Misal: Rekening Pribadi"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1"
                    >Nama Bank</label
                  >
                  <input
                    v-model="newBankAccount.bank"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Misal: BCA, BNI, Mandiri"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1"
                    >Nomor Rekening</label
                  >
                  <input
                    v-model="newBankAccount.accountNumber"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Misal: 1234567890"
                  />
                </div>
                <button
                  @click="addBankAccount"
                  class="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                  Tambah Rekening
                </button>
              </div>
            </div>
          </div>

          <!-- Diskon & Pajak Settings -->
          <div
            class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <h2 class="text-xl font-bold text-gray-900 mb-2">
              💰 Diskon & Pajak
            </h2>
            <p class="text-sm text-gray-500 mb-6">
              Atur diskon dan pajak yang berlaku untuk semua transaksi
            </p>

            <div class="space-y-6">
              <!-- Diskon Global -->
              <div class="border-b border-gray-200 pb-6">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <p class="font-bold text-gray-900">Diskon Global</p>
                    <p class="text-xs text-gray-500 mt-1">
                      Berikan diskon untuk semua transaksi.
                    </p>
                  </div>
                  <button
                    @click="
                      discountTaxSettings.discount_global.enabled =
                        !discountTaxSettings.discount_global.enabled
                    "
                    class="relative inline-flex h-6 w-11 items-center rounded-full"
                    :class="
                      discountTaxSettings.discount_global.enabled
                        ? 'bg-emerald-600'
                        : 'bg-gray-300'
                    "
                  >
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white transition"
                      :class="
                        discountTaxSettings.discount_global.enabled
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      "
                    />
                  </button>
                </div>
                <div
                  v-if="discountTaxSettings.discount_global.enabled"
                  class="flex items-center gap-3"
                >
                  <input
                    v-model.number="discountTaxSettings.discount_global.percent"
                    type="number"
                    min="0"
                    max="100"
                    class="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                  />
                  <span class="text-sm font-bold text-gray-600">%</span>
                </div>
              </div>

              <!-- Diskon Minimum Belanja -->
              <div class="border-b border-gray-200 pb-6">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <p class="font-bold text-gray-900">
                      Diskon Minimum Belanja
                    </p>
                    <p class="text-xs text-gray-500 mt-1">
                      Diskon jika total belanja mencapai nominal tertentu.
                    </p>
                  </div>
                  <button
                    @click="
                      discountTaxSettings.discount_nominal.enabled =
                        !discountTaxSettings.discount_nominal.enabled
                    "
                    class="relative inline-flex h-6 w-11 items-center rounded-full"
                    :class="
                      discountTaxSettings.discount_nominal.enabled
                        ? 'bg-emerald-600'
                        : 'bg-gray-300'
                    "
                  >
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white transition"
                      :class="
                        discountTaxSettings.discount_nominal.enabled
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      "
                    />
                  </button>
                </div>
                <div
                  v-if="discountTaxSettings.discount_nominal.enabled"
                  class="space-y-3"
                >
                  <div>
                    <label class="block text-xs font-bold text-gray-600 mb-2"
                      >Jika belanja di atas(Rp)</label
                    >
                    <input
                      v-model.number="
                        discountTaxSettings.discount_nominal.min_amount
                      "
                      type="number"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-600 mb-2"
                      >Maka diskon sebesar</label
                    >
                    <div class="flex items-center gap-3">
                      <input
                        v-model.number="
                          discountTaxSettings.discount_nominal.discount_percent
                        "
                        type="number"
                        min="0"
                        max="100"
                        class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="0"
                      />
                      <span class="text-sm font-bold text-gray-600">%</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Pajak/Tax -->
              <div class="border-b border-gray-200 pb-6">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <p class="font-bold text-gray-900">Pajak(Tax)</p>
                    <p class="text-xs text-gray-500 mt-1">
                      Tambahkan pajak(selain PPN)ke transaksi.
                    </p>
                  </div>
                  <button
                    @click="
                      discountTaxSettings.tax.enabled =
                        !discountTaxSettings.tax.enabled
                    "
                    class="relative inline-flex h-6 w-11 items-center rounded-full"
                    :class="
                      discountTaxSettings.tax.enabled
                        ? 'bg-emerald-600'
                        : 'bg-gray-300'
                    "
                  >
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white transition"
                      :class="
                        discountTaxSettings.tax.enabled
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      "
                    />
                  </button>
                </div>
                <div
                  v-if="discountTaxSettings.tax.enabled"
                  class="flex items-center gap-3"
                >
                  <input
                    v-model.number="discountTaxSettings.tax.percent"
                    type="number"
                    min="0"
                    max="100"
                    class="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                  />
                  <span class="text-sm font-bold text-gray-600">%</span>
                </div>
              </div>

              <!-- PPN -->
              <div>
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <p class="font-bold text-gray-900">PPN</p>
                    <p class="text-xs text-gray-500 mt-1">
                      Tambahkan PPN ke transaksi.
                    </p>
                  </div>
                  <button
                    @click="
                      discountTaxSettings.ppn.enabled =
                        !discountTaxSettings.ppn.enabled
                    "
                    class="relative inline-flex h-6 w-11 items-center rounded-full"
                    :class="
                      discountTaxSettings.ppn.enabled
                        ? 'bg-emerald-600'
                        : 'bg-gray-300'
                    "
                  >
                    <span
                      class="inline-block h-4 w-4 transform rounded-full bg-white transition"
                      :class="
                        discountTaxSettings.ppn.enabled
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      "
                    />
                  </button>
                </div>
                <div
                  v-if="discountTaxSettings.ppn.enabled"
                  class="flex items-center gap-3"
                >
                  <input
                    v-model.number="discountTaxSettings.ppn.percent"
                    type="number"
                    min="0"
                    max="100"
                    class="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                  />
                  <span class="text-sm font-bold text-gray-600">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="activeSection === 'account'" class="max-w-2xl space-y-6">
          <div
            class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <h2 class="text-xl font-bold text-gray-900 mb-6">Akun Anda</h2>

            <div
              class="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-8 border-b border-gray-100"
            >
              <div
                class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shrink-0"
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
