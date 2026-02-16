<script setup lang="ts">
import { businessTypes, paymentMethods } from "~/utils/helpers";

definePageMeta({
  layout: "default",
});

const { store, printerSettings: globalPrinterSettings, updateStore, fetchStore } = useStore();
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

      // Load printer settings
      fetchPrinterSettings();
    }
  },
  { immediate: true },
);

const fetchPrinterSettings = async () => {
  if (!store.value?.id) return;
  try {
    const { data, error } = await (supabase
      .from("printer_settings") as any)
      .select("*")
      .eq("store_id", store.value.id)
      .maybeSingle();

    if (error) throw error;
    if (data) {
      printerSettings.value = {
        printerType: data.printer_type || "thermal",
        paperWidth: data.paper_width || 58,
        autoPrint: data.auto_print || false,
        includeLogo: data.include_logo !== false,
        includeStoreInfo: data.include_store_info !== false,
        footerText: data.footer_text || "Terima kasih atas kunjungan Anda!",
        bluetoothDeviceName: data.bluetooth_device_name || "",
        bluetoothDeviceAddress: data.bluetooth_device_address || "",
      };
      // Synchronize with global state
      if (globalPrinterSettings) {
        globalPrinterSettings.value = data;
      }
    }
  } catch (e) {
    console.error("Error fetching printer settings:", e);
  }
};

const mockTransaction = computed(() => ({
  id: "TRX-20260216-001",
  transaction_number: "TRX-20260216-001",
  created_at: new Date().toISOString(),
  items: [
    { product_name: "Americano", product_price: 22000, quantity: 1, subtotal: 22000 }
  ],
  subtotal: 22000,
  discount: 0,
  tax: 0,
  ppn: 0,
  total: 22000,
  paid_amount: 22000,
  payment_method: "cash",
  customer_name: "Yadi"
}));

const previewStoreData = computed(() => ({
  name: storeSettings.name,
  address: storeSettings.address,
  phone: storeSettings.phone,
  logo_url: logoPreview.value
}));

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

const removeLogo = async () => {
  if (!confirm("Hapus logo toko?")) return;

  logoPreview.value = null;
  selectedLogoFile.value = null;
  storeSettings.logo_url = "";

  // Trigger auto save immediately for deletion
  await autoSaveStoreSettings();
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
  bluetoothDeviceName: "",
  bluetoothDeviceAddress: "",
});

const { scanningBluetooth, bluetoothDevices, bluetoothError, scanDevices, connectToDevice } = useBluetooth();

const handleScanBluetooth = async () => {
  const device = await scanDevices();
  if (device) {
    printerSettings.value.bluetoothDeviceName = device.name;
    printerSettings.value.bluetoothDeviceAddress = device.id;
    showAlert("success", `Perangkat ${device.name} terpilih`);
  } else if (bluetoothError.value) {
    showAlert("error", bluetoothError.value);
  }
};

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
  {
    id: "printer",
    label: "Pengaturan Struk",
    icon: "i-heroicons-printer",
  },
  {
    id: "help",
    label: "Bantuan & Tutorial",
    icon: "i-heroicons-question-mark-circle",
  },
  {
    id: "activity",
    label: "Riwayat Aktivitas",
    icon: "i-heroicons-clock",
    action: () => navigateTo("/activity-history"),
  },
  { id: "account", label: "Akun", icon: "i-heroicons-user-circle" },
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

// Auto-save printer settings
const autoSavePrinterSettings = async () => {
  if (!store.value?.id) return;

  try {
    const { error } = await (supabase.from("printer_settings") as any).upsert(
      {
        store_id: store.value.id,
        printer_type: printerSettings.value.printerType,
        paper_width: printerSettings.value.paperWidth,
        auto_print: printerSettings.value.autoPrint,
        include_logo: printerSettings.value.includeLogo,
        include_store_info: printerSettings.value.includeStoreInfo,
        footer_text: printerSettings.value.footerText,
        bluetooth_device_name: printerSettings.value.bluetoothDeviceName,
        bluetooth_device_address: printerSettings.value.bluetoothDeviceAddress,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "store_id" },
    );

    if (error) throw error;
    
    // Update global state in useStore immediately
    globalPrinterSettings.value = {
      ...(globalPrinterSettings.value || {}),
      id: globalPrinterSettings.value?.id || '',
      store_id: store.value.id,
      printer_type: printerSettings.value.printerType,
      paper_width: printerSettings.value.paperWidth,
      auto_print: printerSettings.value.autoPrint,
      include_logo: printerSettings.value.includeLogo,
      include_store_info: printerSettings.value.includeStoreInfo,
      footer_text: printerSettings.value.footerText,
      bluetooth_device_name: printerSettings.value.bluetoothDeviceName,
      bluetooth_device_address: printerSettings.value.bluetoothDeviceAddress,
      updated_at: new Date().toISOString(),
      created_at: globalPrinterSettings.value?.created_at || new Date().toISOString()
    } as any;
    
    showAlert("success", "Pengaturan struk disimpan");
  } catch (e: any) {
    console.error(e);
    showAlert("error", "Gagal menyimpan pengaturan struk");
  }
};

let printerSettingsDebounce: ReturnType<typeof setTimeout> | null = null;
watch(
  printerSettings,
  () => {
    if (printerSettingsDebounce) clearTimeout(printerSettingsDebounce);
    printerSettingsDebounce = setTimeout(autoSavePrinterSettings, 500);
  },
  { deep: true },
);

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

// Watch selected logo file to trigger upload
watch(selectedLogoFile, (newFile) => {
  if (newFile) {
    if (storeSettingsDebounce) clearTimeout(storeSettingsDebounce);
    storeSettingsDebounce = setTimeout(autoSaveStoreSettings, 1000);
  }
});


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

// Help section state
const activeHelpTab = ref<string | null>("konsep");
const helpTabs = [
  {
    id: "konsep",
    title: "1. CARA MEMULAI & KEAMANAN",
    content: [
      {
        type: "list",
        title: "Persiapan Toko:",
        items: [
          "<b>Pengaturan Profil</b>: Lengkapi nama, jenis usaha, alamat, no telepon, tampilan produk.",
          "<b>Keamanan Data</b>: Data Anda tersimpan secara otomatis dan rapi. Setiap pemilik toko hanya bisa melihat data miliknya sendiri.",
          "<b>Multi-Perangkat</b>: Anda bisa membuka akun kasir ini dari beberapa HP atau laptop sekaligus secara bersamaan.",
        ],
      },
    ],
  },
  {
    id: "transaksi",
    title: "2. CARA JUALAN (KASIR)",
    content: [
      {
        type: "list",
        title: "Panduan Transaksi:",
        items: [
          "<b>Pilih Produk</b>: Klik pada gambar atau nama produk untuk memasukkannya ke keranjang belanja.",
          "<b>Proses Bayar</b>: Klik tombol TUNAI PAS untuk langsung membayar, pilih BAYAR untuk membayar dengan metode pembayaran.",
          "<b>Hitung Kembalian</b>: Sistem akan otomatis menghitung uang kembalian dan memperbarui stok barang Anda.",
        ],
      },
    ],
  },
  {
    id: "stok",
    title: "3. ATUR BARANG & STOK",
    content: [
      {
        type: "list",
        title: "Kelola Barang Dagangan:",
        items: [
          "<b>Tambah Produk</b>: Masukkan harga beli, harga jual, dan jumlah stok awal saat menambah barang baru.",
          "<b>Update Stok</b>: Klik ikon kotak/stok pada daftar produk jika ingin menambah stok baru tanpa harus edit data produk.",
          "<b>Pantau Laba</b>: Dengan mengisi harga beli, Anda bisa melihat estimasi keuntungan bersih toko secara otomatis di laporan.",
          "<b>Pilah Kategori</b>: Kelompokkan barang (misal: Makanan, Minuman) agar lebih mudah ditemukan saat jualan.",
        ],
      },
    ],
  },
  {
    id: "laporan",
    title: "4. MELIHAT LAPORAN",
    content: [
      {
        type: "list",
        title: "Pantau Hasil Penjualan:",
        items: [
          "<b>Ringkasan Harian</b>: Cek omzet hari ini dan total keuntungan langsung dari halaman utama (Dashboard).",
          "<b>Cetak Laporan</b>: Anda bisa mendownload laporan penjualan ke dalam format <b>Excel</b> atau <b>PDF</b> untuk pembukuan.",
          "<b>Audit Aktivitas</b>: Lihat semua riwayat perubahan (seperti hapus transaksi atau edit produk) di menu Riwayat Aktivitas.",
        ],
      },
    ],
  },
  {
    id: "struk",
    title: "5. STRUK & PRINTER",
    content: [
      {
        type: "list",
        title: "Informasi Nota Belanja:",
        items: [
          "<b>Cetak Struk</b>: Sambungkan printer thermal (Bluetooth/USB) untuk mencetak nota belanja pelanggan.",
          "<b>Nota Digital</b>: Jika tidak punya printer, Anda bisa bagikan <b>Link Struk</b> ke WhatsApp pelanggan agar mereka bisa lihat nota di HP sendiri.",
        ],
      },
    ],
  },
];

// Account & Password Actions
const user = useSupabaseUser();
const newPassword = ref("");
const confirmingPassword = ref("");
const changingPassword = ref(false);

const handleUpdatePassword = async () => {
  if (!newPassword.value) {
    showAlert("error", "Password baru tidak boleh kosong");
    return;
  }
  if (newPassword.value !== confirmingPassword.value) {
    showAlert("error", "Konfirmasi password tidak cocok");
    return;
  }
  if (newPassword.value.length < 6) {
    showAlert("error", "Password minimal 6 karakter");
    return;
  }

  changingPassword.value = true;
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword.value,
    });
    if (error) throw error;
    showAlert("success", "Password berhasil diperbarui");
    newPassword.value = "";
    confirmingPassword.value = "";
  } catch (e: any) {
    showAlert("error", e.message || "Gagal memperbarui password");
  } finally {
    changingPassword.value = false;
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
              <!-- Logo Toko -->
              <div class="flex flex-col items-center sm:flex-row gap-6 pb-8 border-b border-gray-100">
                <div class="relative group cursor-pointer" @click="triggerFileInput">
                  <div
                    class="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 group-hover:border-emerald-500 transition-colors"
                    :class="{ 'border-none': logoPreview }"
                  >
                    <img
                      v-if="logoPreview"
                      :src="logoPreview"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="text-center">
                      <UIcon
                        name="i-heroicons-photo"
                        class="w-8 h-8 text-gray-400 group-hover:text-emerald-500"
                      />
                      <p class="text-[10px] text-gray-400 font-medium">
                        Tambah Logo
                      </p>
                    </div>
                  </div>
                  <div
                    class="absolute -bottom-2 -right-2 bg-white shadow-md rounded-full p-1.5 border border-gray-100 text-emerald-600"
                  >
                    <UIcon name="i-heroicons-pencil-square" class="w-4 h-4" />
                  </div>
                  <input
                    id="logoInput"
                    type="file"
                    class="hidden"
                    accept="image/*"
                    @change="handleFileSelect"
                  />
                </div>
                <div class="text-center sm:text-left">
                  <h3 class="font-bold text-gray-900">Logo Toko</h3>
                  <p class="text-xs text-gray-500 mt-1 max-w-[200px]">
                    Format: JPG, PNG, atau WEBP. Maksimal 2MB.
                  </p>
                  <button
                    v-if="logoPreview"
                    @click.stop="removeLogo"
                    class="mt-2 text-xs text-red-500 font-medium hover:text-red-700 transition-colors"
                  >
                    Hapus Logo
                  </button>
                </div>
              </div>

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

        <!-- Printer & Receipt Settings -->
        <div v-if="activeSection === 'printer'" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Settings Column -->
          <div class="space-y-6">
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-6">⚙️ Pengaturan Printer</h2>
              
              <div class="space-y-6">
                <!-- Printer Type -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">Jenis Koneksi Printer</label>
                  <div class="grid grid-cols-2 gap-3">
                    <button 
                      v-for="type in [{id: 'thermal', label: 'Web / Browser'}, {id: 'bluetooth', label: 'Bluetooth'}]" 
                      :key="type.id"
                      @click="printerSettings.printerType = type.id"
                      class="py-3 rounded-xl border-2 font-bold transition-all text-sm"
                      :class="printerSettings.printerType === type.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 text-gray-500'"
                    >
                      {{ type.label }}
                    </button>
                  </div>
                </div>

                <!-- Bluetooth Selection -->
                <div v-if="printerSettings.printerType === 'bluetooth'" class="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-bold text-emerald-800">Perangkat Bluetooth</span>
                    <button 
                      @click="handleScanBluetooth"
                      :disabled="scanningBluetooth"
                      class="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:bg-gray-400 flex items-center gap-1"
                    >
                      <UIcon :name="scanningBluetooth ? 'i-heroicons-arrow-path' : 'i-heroicons-magnifying-glass'" class="w-4 h-4" :class="{'animate-spin': scanningBluetooth}" />
                      {{ scanningBluetooth ? 'Mencari...' : 'Scan Printer' }}
                    </button>
                  </div>
                  
                  <div v-if="printerSettings.bluetoothDeviceName" class="flex items-center gap-2 p-3 bg-white rounded-lg border border-emerald-200">
                    <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <UIcon name="i-heroicons-printer" class="w-4 h-4" />
                    </div>
                    <div>
                      <p class="text-sm font-bold text-gray-900">{{ printerSettings.bluetoothDeviceName }}</p>
                      <p class="text-[10px] text-gray-500 uppercase tracking-widest">Tersambung</p>
                    </div>
                    <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-emerald-500 ml-auto" />
                  </div>
                  
                  <div v-else class="text-center py-4 bg-white/50 rounded-lg border border-dashed border-emerald-200">
                    <p class="text-xs text-emerald-600 font-medium">Klik Scan untuk mencari printer Anda</p>
                  </div>
                </div>

                <!-- Paper Width -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">Lebar Kertas</label>
                  <div class="grid grid-cols-2 gap-3">
                    <button 
                      v-for="width in [58, 80]" 
                      :key="width"
                      @click="printerSettings.paperWidth = width"
                      class="py-3 rounded-xl border-2 font-bold transition-all"
                      :class="printerSettings.paperWidth === width ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 text-gray-500'"
                    >
                      {{ width }}mm
                    </button>
                  </div>
                </div>

                <!-- Footer Text -->
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">Pesan Kaki (Footer)</label>
                  <textarea
                    v-model="printerSettings.footerText"
                    rows="2"
                    class="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Pesan di bagian bawah struk"
                  ></textarea>
                </div>

                <!-- Toggles -->
                <div class="space-y-4 pt-4 border-t border-gray-100">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-bold text-gray-900 text-sm">Tampilkan Logo</p>
                      <p class="text-xs text-gray-500">Munculkan logo toko di struk</p>
                    </div>
                    <button
                      @click="printerSettings.includeLogo = !printerSettings.includeLogo"
                      class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                      :class="printerSettings.includeLogo ? 'bg-emerald-600' : 'bg-gray-300'"
                    >
                      <span class="inline-block h-4 w-4 transform rounded-full bg-white transition" :class="printerSettings.includeLogo ? 'translate-x-6' : 'translate-x-1'" />
                    </button>
                  </div>

                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-bold text-gray-900 text-sm">Info Toko</p>
                      <p class="text-xs text-gray-500">Alamat & No. Telepon</p>
                    </div>
                    <button
                      @click="printerSettings.includeStoreInfo = !printerSettings.includeStoreInfo"
                      class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                      :class="printerSettings.includeStoreInfo ? 'bg-emerald-600' : 'bg-gray-300'"
                    >
                      <span class="inline-block h-4 w-4 transform rounded-full bg-white transition" :class="printerSettings.includeStoreInfo ? 'translate-x-6' : 'translate-x-1'" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Preview Column -->
          <div class="lg:sticky lg:top-8 self-start">
            <h3 class="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider text-center">Pratinjau Struk</h3>
            <div class="flex justify-center">
              <ThermalPrinterReceipt
                :transaction="mockTransaction"
                :store="previewStoreData"
                :settings="printerSettings"
                :style="{ width: printerSettings.paperWidth === 80 ? '300px' : '230px' }"
                class="shadow-xl"
              />
            </div>
            <p class="text-center text-xs text-gray-400 mt-4 italic">Ini adalah simulasi tampilan struk Anda</p>
          </div>
        </div>
        <div v-if="activeSection === 'help'" class="max-w-2xl space-y-6">
          <div
            class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <h2 class="text-xl font-bold text-gray-900 mb-2">
              Bantuan & Tutorial
            </h2>
            <p class="text-sm text-gray-500 mb-8">
              Panduan lengkap penggunaan aplikasi KasirSimple
            </p>

            <!-- Accordion Content -->
            <div class="space-y-3">
              <div
                v-for="tab in helpTabs"
                :key="tab.id"
                class="rounded-xl border border-gray-200 overflow-hidden transition-all"
              >
                <!-- Accordion Header -->
                <button
                  @click="
                    activeHelpTab = activeHelpTab === tab.id ? null : tab.id
                  "
                  class="w-full flex items-center justify-between p-4 text-left transition-colors"
                  :class="activeHelpTab === tab.id ? 'bg-emerald-50' : 'hover:bg-gray-50'"
                >
                  <span class="font-bold text-gray-900 text-sm">{{
                    tab.title
                  }}</span>
                  <UIcon
                    :name="
                      activeHelpTab === tab.id
                        ? 'i-heroicons-chevron-up'
                        : 'i-heroicons-chevron-down'
                    "
                    class="w-5 h-5"
                    :class="activeHelpTab === tab.id ? 'text-emerald-600' : 'text-gray-400'"
                  />
                </button>

                <!-- Accordion Body -->
                <div
                  v-if="activeHelpTab === tab.id"
                  class="p-5 border-t border-gray-100 bg-white"
                >
                  <div v-for="(block, bIdx) in tab.content" :key="bIdx">
                    <p v-if="block.title" class="font-bold text-gray-800 mb-3 text-sm">
                      {{ block.title }}
                    </p>
                    <ul v-if="block.type === 'list'" class="space-y-4">
                      <li
                        v-for="(item, iIdx) in block.items"
                        :key="iIdx"
                        class="flex items-start gap-3 text-sm text-gray-600 leading-relaxed"
                      >
                        <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
                        <span v-html="item"></span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <!-- Contact Support -->
            <div class="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-4">
              <div class="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                <UIcon name="i-heroicons-chat-bubble-left-right" class="w-5 h-5" />
              </div>
              <div>
                <p class="text-xs text-gray-500">Punya kendala lain?</p>
                <p class="text-sm font-bold text-gray-900 cursor-pointer hover:text-emerald-600 transition-colors">
                  WhatsApp CS: 0895413111035
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Account Settings -->
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
                <span class="text-2xl font-black">{{ user?.email?.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="text-center sm:text-left">
                <p class="font-bold text-lg text-gray-900">{{ user?.user_metadata?.full_name || 'Pengguna Kasir' }}</p>
                <p class="text-gray-500 text-sm">{{ user?.email }}</p>
                <div class="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  Aktif
                </div>
              </div>
            </div>

            <!-- Change Password Form -->
            <div class="space-y-4">
              <h3 class="font-bold text-gray-900">Keamanan & Password</h3>
              <div class="grid gap-4">
                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1">Password Baru</label>
                  <input
                    v-model="newPassword"
                    type="password"
                    class="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1">Konfirmasi Password</label>
                  <input
                    v-model="confirmingPassword"
                    type="password"
                    class="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ulangi password baru"
                  />
                </div>
              </div>
              
              <button
                @click="handleUpdatePassword"
                :disabled="changingPassword"
                class="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <UIcon :name="changingPassword ? 'i-heroicons-arrow-path' : 'i-heroicons-shield-check'" class="w-5 h-5" :class="{'animate-spin': changingPassword}" />
                {{ changingPassword ? 'Memproses...' : 'Perbarui Password' }}
              </button>

              <div class="pt-6 border-t border-gray-100">
                <button
                  @click="handleLogout"
                  class="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <UIcon
                    name="i-heroicons-arrow-left-on-rectangle"
                    class="w-5 h-5"
                  />
                  Keluar dari Aplikasi
                </button>
              </div>
            </div>
          </div>

          <!-- Danger Zone -->
          <div class="bg-red-50 rounded-2xl border border-red-100 p-6">
            <h3 class="text-lg font-bold text-red-600 mb-1">Zona Bahaya</h3>
            <p class="text-xs text-red-500 mb-4 leading-relaxed">
              Menghapus akun akan menghilangkan seluruh data toko, produk, dan transaksi Anda secara permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
            <button
              class="w-full sm:w-auto py-2.5 px-6 border-2 border-red-200 text-red-600 hover:bg-red-600 hover:text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2"
            >
              <UIcon name="i-heroicons-trash" class="w-4 h-4" />
              Hapus Seluruh Data Akun
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
