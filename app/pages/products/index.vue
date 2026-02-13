<script setup lang="ts">
import { formatCurrency } from "~/utils/helpers";

definePageMeta({
  layout: "default",
});

const supabase = useSupabaseClient();

const {
  products,
  loading: productsLoading,
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleFavorite,
  updateStock,
} = useProducts();
const {
  categories,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = useCategories();
const { store } = useStore();

// Show product images setting
const showProductImages = computed(() => {
  if (!store.value) return true;
  const storeData = store.value as any;
  return storeData.show_product_images !== false;
});

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

// Modal & Form States
const deleteModal = reactive({
  open: false,
  id: "",
  name: "",
  loading: false,
});

const stockModal = reactive({
  open: false,
  product: null as any,
  type: "in" as "in" | "out" | "adjustment",
  quantity: 0,
  notes: "",
  loading: false,
});

const openStockModal = (product: any) => {
  stockModal.product = product;
  stockModal.type = "in"; // default
  stockModal.quantity = 0;
  stockModal.notes = "";
  stockModal.open = true;
};

const saveStock = async () => {
  if (!stockModal.product || stockModal.quantity <= 0) {
    showAlert("error", "Jumlah harus lebih dari 0");
    return;
  }

  stockModal.loading = true;
  try {
    await updateStock(
      stockModal.product.id,
      stockModal.type,
      stockModal.quantity,
      stockModal.notes,
    );
    showAlert("success", "Stok berhasil diperbarui");
    stockModal.open = false;
  } catch (e: any) {
    showAlert("error", e.message || "Gagal update stok");
  } finally {
    stockModal.loading = false;
  }
};

const categoryModal = reactive({
  open: false,
  form: {
    id: "",
    name: "",
    color: "#3b82f6",
    isEdit: false,
  },
  loading: false,
});
const searchQuery = ref("");
const selectedCategory = ref("all");
const selectedStockStatus = ref("all");
const sortBy = ref("newest");

const filteredProducts = computed(() => {
  let result = products.value || [];

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter((p) => p.name.toLowerCase().includes(q));
  }

  if (selectedCategory.value !== "all") {
    result = result.filter((p) => p.category_id === selectedCategory.value);
  }

  if (selectedStockStatus.value !== "all") {
    if (selectedStockStatus.value === "available") {
      result = result.filter((p) => p.stock > 0);
    } else if (selectedStockStatus.value === "low") {
      result = result.filter(
        (p) => p.stock > 0 && p.stock <= (p.min_stock || 5),
      );
    } else if (selectedStockStatus.value === "out") {
      result = result.filter((p) => p.stock === 0);
    }
  }

  if (sortBy.value === "name-asc") {
    result.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy.value === "name-desc") {
    result.sort((a, b) => b.name.localeCompare(a.name));
  } else if (sortBy.value === "newest") {
    result.sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime(),
    );
  } else if (sortBy.value === "oldest") {
    result.sort(
      (a, b) =>
        new Date(a.created_at || 0).getTime() -
        new Date(b.created_at || 0).getTime(),
    );
  }

  return result;
});

const totalProducts = computed(() => products.value?.length || 0);
const totalCategories = computed(() => {
  const unique = new Set(
    products.value?.map((p) => p.category_id).filter(Boolean),
  );
  return unique.size;
});

const lowStockCount = computed(() => {
  return (
    products.value?.filter((p) => p.stock <= (p.min_stock || 5) && p.stock > 0)
      .length || 0
  );
});

const outOfStockCount = computed(() => {
  return products.value?.filter((p) => p.stock === 0).length || 0;
});

const modalOpen = ref(false);
const isEdit = ref(false);
const selectedProductFile = ref<File | null>(null);
const productImagePreview = ref<string | null>(null);
const form = reactive({
  id: "",
  name: "",
  category_id: "",
  buy_price: 0,
  sell_price: 0,
  stock: 0,
  unit: "pcs",
  image_url: "",
  is_favorite: false,
});

const categoryOptions = computed(() => [
  { label: "Semua Kategori", value: "all" },
  ...categories.value.map((c) => ({ label: c.name, value: c.id })),
]);

const modalCategoryOptions = computed(() =>
  categories.value.map((c) => ({
    label: c.name,
    value: c.id,
  })),
);

const stockStatusOptions = [
  { label: "Semua Status Stok", value: "all" },
  { label: "Tersedia", value: "available" },
  { label: "Stok Rendah", value: "low" },
  { label: "Habis", value: "out" },
];

const sortOptions = [
  { label: "Terbaru", value: "newest" },
  { label: "Terlama", value: "oldest" },
  { label: "Nama A-Z", value: "name-asc" },
  { label: "Nama Z-A", value: "name-desc" },
];

const openAdd = () => {
  isEdit.value = false;
  form.id = "";
  form.name = "";
  form.category_id = "";
  form.buy_price = 0;
  form.sell_price = 0;
  form.stock = 0;
  form.unit = "pcs";
  form.image_url = "";
  form.is_favorite = false;
  selectedProductFile.value = null;
  productImagePreview.value = null;
  modalOpen.value = true;
};

const openEdit = (product) => {
  isEdit.value = true;
  form.id = product.id;
  form.name = product.name;
  form.category_id = product.category_id || "";
  form.buy_price = product.buy_price || 0;
  form.sell_price = product.price || 0;
  form.stock = product.stock;
  form.unit = product.unit || "pcs";
  form.image_url = product.image_url || "";
  form.is_favorite = product.is_favorite || false;
  selectedProductFile.value = null;
  productImagePreview.value = product.image_url || null;
  modalOpen.value = true;
};

const handleProductFileSelect = (event: any) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showAlert("error", "Maksimal ukuran file 5MB");
    return;
  }

  selectedProductFile.value = file;
  productImagePreview.value = URL.createObjectURL(file);
};

const triggerProductFileInput = () => {
  document.getElementById("productImageInput")?.click();
};

const save = async () => {
  try {
    let imageUrl = form.image_url;

    // Upload image jika ada file baru
    if (selectedProductFile.value) {
      const file = selectedProductFile.value;
      const fileExt = file.name.split(".").pop();
      const fileName = `product-${Date.now()}.${fileExt}`;

      try {
        // Try upload to "products" bucket
        const { data, error: uploadError } = await supabase.storage
          .from("products")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          showAlert(
            "error",
            `⚠️ Foto tidak dapat diupload (${uploadError.message}). Gunakan link URL langsung.`,
          );
          selectedProductFile.value = null;
        } else {
          const {
            data: { publicUrl },
          } = supabase.storage.from("products").getPublicUrl(fileName);
          imageUrl = publicUrl;
        }
      } catch (storageError: any) {
        console.error("Storage error:", storageError);
        showAlert(
          "error",
          `⚠️ Gagal upload foto: ${storageError.message || "Storage tidak tersedia"}. Gunakan link URL langsung.`,
        );
        selectedProductFile.value = null;
      }
    }

    if (isEdit.value) {
      await updateProduct(form.id, {
        name: form.name,
        category_id: form.category_id,
        buy_price: form.buy_price,
        price: form.sell_price,
        stock: form.stock,
        unit: form.unit,
        image_url: imageUrl,
        is_favorite: form.is_favorite,
      });
      showAlert("success", `✅ ${form.name} berhasil diperbarui`);
    } else {
      await createProduct({
        name: form.name,
        category_id: form.category_id,
        buy_price: form.buy_price,
        price: form.sell_price,
        stock: form.stock,
        unit: form.unit,
        image_url: imageUrl,
        has_stock: true,
        is_favorite: form.is_favorite,
      });
      showAlert("success", `✅ ${form.name} berhasil ditambahkan`);
    }
    selectedProductFile.value = null;
    productImagePreview.value = null;
    modalOpen.value = false;
  } catch (e: any) {
    console.error("Gagal simpan produk:", e);
    showAlert("error", e.message || "Gagal menyimpan produk");
  }
};

const openDeleteConfirm = (product: any) => {
  deleteModal.id = product.id;
  deleteModal.name = product.name;
  deleteModal.open = true;
};

const handleDeleteProduct = async () => {
  deleteModal.loading = true;
  try {
    await deleteProduct(deleteModal.id);
    showAlert("success", "🗑️ Produk berhasil dihapus");
    deleteModal.open = false;
  } catch (e: any) {
    showAlert("error", e.message || "Gagal menghapus produk");
  } finally {
    deleteModal.loading = false;
  }
};

// Category Logic
const manageCategories = () => {
  categoryModal.form = { id: "", name: "", color: "#3b82f6", isEdit: false };
  categoryModal.open = true;
};

const editCategory = (cat: any) => {
  categoryModal.form = {
    id: cat.id,
    name: cat.name,
    color: cat.color || "#3b82f6",
    isEdit: true,
  };
};

const cancelEditCategory = () => {
  categoryModal.form = { id: "", name: "", color: "#3b82f6", isEdit: false };
};

const saveCategoryHandler = async () => {
  if (!categoryModal.form.name) return;
  categoryModal.loading = true;
  try {
    if (categoryModal.form.isEdit) {
      await updateCategory(categoryModal.form.id, {
        name: categoryModal.form.name,
        color: categoryModal.form.color,
      });
      showAlert("success", "Kategori diperbarui");
    } else {
      await createCategory({
        name: categoryModal.form.name,
        color: categoryModal.form.color,
        is_active: true,
        sort_order: 0,
      });
      showAlert("success", "Kategori ditambahkan");
    }
    cancelEditCategory();
    await fetchCategories();
  } catch (e: any) {
    showAlert("error", e.message);
  } finally {
    categoryModal.loading = false;
  }
};

const deleteCategoryHandler = async (id: string) => {
  if (
    !confirm(
      "Hapus kategori ini? Produk dalam kategori ini akan menjadi 'Tanpa Kategori'",
    )
  )
    return;
  try {
    await deleteCategory(id);
    showAlert("success", "Kategori dihapus");
    await fetchCategories();
  } catch (e: any) {
    showAlert("error", e.message);
  }
};

const handleToggleFavorite = async (id: string, event: Event) => {
  event.stopPropagation();
  try {
    const newStatus = await toggleFavorite(id);
    showAlert(
      "success",
      newStatus ? "⭐ Ditambahkan ke Favorit" : "☆ Dihapus dari Favorit",
    );
  } catch (e: any) {
    console.error("Gagal toggle favorite:", e);
    showAlert("error", "Gagal mengubah status favorit");
  }
};

onMounted(async () => {
  if (!store.value) await useStore().fetchStore();
  if (store.value) {
    await Promise.all([fetchCategories(), fetchProducts()]);
  }
});

watch(
  () => store.value,
  async (val) => {
    if (val?.id) await Promise.all([fetchCategories(), fetchProducts()]);
  },
  { immediate: true },
);
</script>

<template>
  <div class="min-h-screen bg-slate-50 pb-20">
    <!-- Statistik Header -->
    <div
      class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 md:p-6 max-w-5xl mx-auto"
    >
      <!-- Total Produk -->
      <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p
              class="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider"
            >
              Total Produk
            </p>
            <p class="text-4xl font-black text-gray-900">{{ totalProducts }}</p>
          </div>
          <div
            class="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"
          >
            <UIcon name="i-heroicons-cube-20-solid" class="w-6 h-6" />
          </div>
        </div>
      </div>

      <!-- Total Kategori -->
      <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p
              class="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider"
            >
              Total Kategori
            </p>
            <p class="text-4xl font-black text-gray-900">
              {{ totalCategories }}
            </p>
          </div>
          <div
            class="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center"
          >
            <UIcon name="i-heroicons-tag-20-solid" class="w-6 h-6" />
          </div>
        </div>
      </div>

      <!-- Stok Menipis (Pengganti Rincian Kategori) -->
      <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p
              class="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider"
            >
              Perlu Restock
            </p>
            <div class="flex items-baseline gap-2">
              <p class="text-4xl font-black text-orange-600">
                {{ lowStockCount }}
              </p>
              <span class="text-sm text-gray-400 font-medium">Item</span>
            </div>
            <p
              v-if="outOfStockCount > 0"
              class="text-xs font-bold text-red-500 mt-1"
            >
              {{ outOfStockCount }} Produk Habis!
            </p>
          </div>
          <div
            class="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center"
          >
            <UIcon
              name="i-heroicons-exclamation-triangle-20-solid"
              class="w-6 h-6"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Alert Box (Replaced with AppAlert) -->
    <AppAlert
      :show="alert.show"
      :type="alert.type"
      :message="alert.message"
      @close="alert.show = false"
    />

    <!-- Toolbar -->
    <div
      class="bg-white rounded-2xl shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-3 items-center justify-between border border-gray-100 max-w-5xl mx-auto"
    >
      <div class="flex gap-2 w-full md:w-auto flex-wrap">
        <input
          v-model="searchQuery"
          placeholder="Cari produk..."
          class="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          v-model="selectedCategory"
          class="px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option
            v-for="opt in categoryOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
        <select
          v-model="selectedStockStatus"
          class="px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option
            v-for="opt in stockStatusOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
        <select
          v-model="sortBy"
          class="px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option
            v-for="opt in sortOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </select>
      </div>

      <div class="flex gap-2 w-full md:w-auto">
        <button
          @click="manageCategories"
          class="px-4 py-2 bg-white text-gray-700 font-bold rounded-xl border border-gray-300 hover:bg-gray-50 text-sm transition-colors flex items-center gap-2"
        >
          <UIcon name="i-heroicons-tag" class="w-4 h-4" />
          KATEGORI
        </button>
        <button
          @click="openAdd"
          class="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl border border-emerald-700 hover:bg-emerald-700 text-sm transition-colors flex items-center gap-2"
        >
          <UIcon name="i-heroicons-plus" class="w-4 h-4" />
          TAMBAH PRODUK
        </button>
      </div>
    </div>

    <!-- Tabel Produk - Desktop -->
    <div class="max-w-5xl mx-auto px-4 sm:px-0">
      <!-- Desktop Table -->
      <div
        class="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-900 text-white">
            <tr>
              <th class="p-4 font-bold text-center">No</th>
              <th class="p-4 font-bold">Nama Produk</th>
              <th class="p-4 font-bold">Kategori</th>
              <th class="p-4 font-bold">Harga Beli</th>
              <th class="p-4 font-bold">Harga Jual</th>
              <th class="p-4 font-bold">Laba</th>
              <th class="p-4 font-bold">Stok</th>
              <th class="p-4 font-bold">Satuan</th>
              <th class="p-4 font-bold text-center">Favorit</th>
              <th class="p-4 font-bold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(product, index) in filteredProducts"
              :key="product.id"
              class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td class="p-4 font-bold text-center text-gray-500">
                {{ index + 1 }}
              </td>
              <td class="p-4 font-semibold text-gray-900">
                {{ product.name }}
              </td>
              <td class="p-4">
                <span
                  class="px-3 py-1 rounded-lg text-xs font-bold border"
                  :style="{
                    backgroundColor: product.category?.color + '20',
                    color: product.category?.color,
                    borderColor: product.category?.color,
                  }"
                >
                  {{ product.category?.name || "Tanpa Kategori" }}
                </span>
              </td>
              <td class="p-4 text-gray-700">
                {{ formatCurrency(product.buy_price || 0) }}
              </td>
              <td class="p-4 font-bold text-gray-900">
                {{ formatCurrency(product.price) }}
              </td>
              <td class="p-4 text-emerald-600 font-bold">
                {{
                  formatCurrency(
                    (product.price || 0) - (product.buy_price || 0),
                  )
                }}
              </td>
              <td class="p-4">
                <span
                  class="font-bold"
                  :class="{
                    'text-red-600': product.stock === 0,
                    'text-orange-600':
                      product.stock > 0 &&
                      product.stock <= (product.min_stock || 5),
                    'text-emerald-600': product.stock > 10,
                  }"
                >
                  {{ product.stock }}
                </span>
              </td>
              <td class="p-4 text-gray-700">{{ product.unit || "pcs" }}</td>
              <td class="p-4 text-center">
                <button
                  @click="handleToggleFavorite(product.id, $event)"
                  class="text-2xl transition-all hover:scale-125 active:scale-95"
                  :class="
                    product.is_favorite ? 'text-yellow-500' : 'text-gray-300'
                  "
                  :title="
                    product.is_favorite
                      ? 'Hapus dari favorit'
                      : 'Tambah ke favorit'
                  "
                >
                  {{ product.is_favorite ? "★" : "☆" }}
                </button>
              </td>
              <td class="p-4 text-center flex justify-center gap-2">
                <button
                  @click="openStockModal(product)"
                  class="px-3 py-1 bg-purple-600 text-white rounded font-bold mr-2 hover:bg-purple-700 text-xs transition-colors"
                  title="Kelola Stok"
                >
                  STOK
                </button>
                <button
                  @click="openEdit(product)"
                  class="px-3 py-1 bg-blue-600 text-white rounded font-bold mr-2 hover:bg-blue-700 text-xs transition-colors"
                >
                  EDIT
                </button>
                <button
                  @click="openDeleteConfirm(product)"
                  class="px-3 py-1 bg-red-600 text-white rounded font-bold hover:bg-red-700 text-xs transition-colors"
                >
                  HAPUS
                </button>
              </td>
            </tr>
            <tr v-if="!filteredProducts.length && !productsLoading">
              <td colspan="9" class="p-8 text-center text-gray-400">
                Tidak ada produk ditemukan
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="productsLoading" class="p-8 text-center text-gray-500">
          Memuat produk...
        </div>
      </div>

      <!-- Mobile Cards -->
      <div class="md:hidden space-y-3">
        <div
          v-if="!filteredProducts.length && !productsLoading"
          class="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm border border-gray-100"
        >
          Tidak ada produk ditemukan
        </div>

        <div
          v-if="productsLoading"
          class="bg-white rounded-2xl p-8 text-center text-gray-500 shadow-sm border border-gray-100"
        >
          Memuat produk...
        </div>

        <div
          v-for="product in filteredProducts"
          :key="product.id"
          class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3"
        >
          <!-- Nama & Kategori -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <p class="font-bold text-gray-900 truncate">{{ product.name }}</p>
              <span
                class="inline-block px-2 py-1 rounded-lg text-xs font-bold border mt-1"
                :style="{
                  backgroundColor: product.category?.color + '20',
                  color: product.category?.color,
                  borderColor: product.category?.color,
                }"
              >
                {{ product.category?.name || "Tanpa Kategori" }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="handleToggleFavorite(product.id, $event)"
                class="text-3xl transition-all hover:scale-125 active:scale-95"
                :class="
                  product.is_favorite ? 'text-yellow-500' : 'text-gray-300'
                "
                :title="
                  product.is_favorite
                    ? 'Hapus dari favorit'
                    : 'Tambah ke favorit'
                "
              >
                {{ product.is_favorite ? "★" : "☆" }}
              </button>
              <span
                class="font-bold flex-shrink-0"
                :class="{
                  'text-red-600 text-lg': product.stock === 0,
                  'text-orange-600 text-lg':
                    product.stock > 0 &&
                    product.stock <= (product.min_stock || 5),
                  'text-emerald-600 text-lg': product.stock > 10,
                }"
              >
                {{ product.stock }}
              </span>
            </div>
          </div>

          <!-- Harga Grid -->
          <div class="grid grid-cols-3 gap-2 text-sm">
            <div class="bg-gray-50 p-2 rounded-lg">
              <p class="text-xs text-gray-500 font-medium">Beli</p>
              <p class="font-bold text-gray-900">
                {{ formatCurrency(product.buy_price || 0) }}
              </p>
            </div>
            <div class="bg-gray-50 p-2 rounded-lg">
              <p class="text-xs text-gray-500 font-medium">Jual</p>
              <p class="font-bold text-gray-900">
                {{ formatCurrency(product.price) }}
              </p>
            </div>
            <div class="bg-emerald-50 p-2 rounded-lg">
              <p class="text-xs text-emerald-600 font-medium">Laba</p>
              <p class="font-bold text-emerald-600">
                {{
                  formatCurrency(
                    (product.price || 0) - (product.buy_price || 0),
                  )
                }}
              </p>
            </div>
          </div>

          <!-- Satuan & Stok Info -->
          <div class="flex items-center justify-between text-xs text-gray-500">
            <span
              >Satuan:
              <span class="font-bold text-gray-700">{{
                product.unit || "pcs"
              }}</span></span
            >
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2">
            <button
              @click="openEdit(product)"
              class="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 text-xs transition-colors"
            >
              EDIT
            </button>
            <button
              @click="openStockModal(product)"
              class="flex-1 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 text-xs transition-colors"
            >
              STOK
            </button>
            <button
              @click="openDeleteConfirm(product)"
              class="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 text-xs transition-colors"
            >
              HAPUS
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Tambah/Edit -->
    <div
      v-if="modalOpen"
      @click.self="modalOpen = false"
      class="fixed inset-0 z-50 mb-20 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100 transform transition-all scale-100"
      >
        <div
          class="p-6 border-b border-gray-100 bg-gray-50 sticky top-0 z-10 flex justify-between items-center"
        >
          <h2 class="text-xl font-bold text-gray-900">
            {{ isEdit ? "Edit Produk" : "Tambah Produk Baru" }}
          </h2>
          <button
            @click="modalOpen = false"
            class="text-gray-400 hover:text-gray-600"
          >
            <UIcon name="i-heroicons-x-mark" class="w-6 h-6" />
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2"
              >Nama Produk</label
            >
            <input
              v-model="form.name"
              class="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Contoh: Nasi Goreng"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2"
                >Harga Beli</label
              >
              <input
                v-model.number="form.buy_price"
                type="number"
                class="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2"
                >Harga Jual</label
              >
              <input
                v-model.number="form.sell_price"
                type="number"
                class="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2"
              >Kategori</label
            >
            <div class="flex gap-2">
              <select
                v-model="form.category_id"
                class="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Kategori</option>
                <option
                  v-for="cat in modalCategoryOptions"
                  :key="cat.value"
                  :value="cat.value"
                >
                  {{ cat.label }}
                </option>
              </select>
              <button
                @click="manageCategories"
                class="px-3 py-2 bg-gray-100 rounded-xl border border-gray-300 hover:bg-gray-200"
                title="Kelola Kategori"
              >
                <UIcon
                  name="i-heroicons-cog-6-tooth"
                  class="w-5 h-5 text-gray-600"
                />
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2"
                >Stok</label
              >
              <input
                v-model.number="form.stock"
                type="number"
                class="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2"
                >Satuan</label
              >
              <input
                v-model="form.unit"
                class="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="pcs / kg / dll"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2"
              >🖼️ Gambar Produk (opsional)</label
            >

            <!-- Warning if photos disabled -->
            <div
              v-if="!showProductImages"
              class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 mb-3"
            >
              ⚠️ Fitur foto dimatikan. Konfigurasi di
              <strong>Settings → Pembayaran</strong> untuk mengaktifkannya.
            </div>

            <!-- Upload/Link Options - Only show if enabled -->
            <div v-if="showProductImages" class="space-y-3">
              <!-- Image Preview -->
              <div
                v-if="productImagePreview"
                class="relative mb-3 rounded-xl overflow-hidden bg-gray-100"
              >
                <img
                  :src="productImagePreview"
                  class="w-full h-48 object-cover"
                  alt="Product Preview"
                />
                <button
                  @click="
                    productImagePreview = null;
                    form.image_url = '';
                    selectedProductFile = null;
                  "
                  class="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700"
                >
                  ✕
                </button>
              </div>

              

              <div class="relative">
                <input
                  v-model="form.image_url"
                  placeholder="Atau paste link gambar (https://...)"
                  class="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @input="
                    selectedProductFile = null;
                    if (form.image_url) productImagePreview = form.image_url;
                  "
                />
              </div>
            </div>
          </div>
        </div>

        <div
          class="p-6 border-t border-gray-100 flex gap-3 bg-gray-50 sticky bottom-0 z-10"
        >
          <button
            @click="modalOpen = false"
            class="flex-1 py-3 bg-gray-200 border border-gray-300 rounded-xl font-bold hover:bg-gray-300 transition-colors"
          >
            BATAL
          </button>
          <button
            @click="save"
            class="flex-1 py-3 bg-emerald-600 text-white border border-emerald-700 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
          >
            {{ isEdit ? "UPDATE" : "SIMPAN" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Konfirmasi Hapus Produk -->
    <div
      v-if="deleteModal.open"
      class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="deleteModal.open = false"
    >
      <div
        class="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-[scale-in_0.2s_ease-out]"
      >
        <div class="p-6 text-center">
          <div
            class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <UIcon name="i-heroicons-trash" class="w-8 h-8" />
          </div>
          <h3 class="text-lg font-bold text-gray-900 mb-2">Hapus Produk?</h3>
          <p class="text-sm text-gray-500 mb-6">
            Apakah Anda yakin ingin menghapus produk
            <span class="font-bold text-gray-800">"{{ deleteModal.name }}"</span
            >? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div class="flex gap-3">
            <button
              @click="deleteModal.open = false"
              class="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
              BATAL
            </button>
            <button
              @click="handleDeleteProduct"
              :disabled="deleteModal.loading"
              class="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center"
            >
              <span v-if="deleteModal.loading" class="animate-spin mr-2"
                >⏳</span
              >
              {{ deleteModal.loading ? "MENGHAPUS..." : "YA, HAPUS" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Manajemen Kategori -->
    <div
      v-if="categoryModal.open"
      class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="categoryModal.open = false"
    >
      <div
        class="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col"
      >
        <div
          class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl"
        >
          <h3 class="font-bold text-lg text-gray-800">Manajemen Kategori</h3>
          <button
            @click="categoryModal.open = false"
            class="text-gray-400 hover:text-gray-600"
          >
            <UIcon name="i-heroicons-x-mark" class="w-6 h-6" />
          </button>
        </div>

        <div class="p-4 border-b border-gray-100 bg-white">
          <p class="text-xs font-bold text-gray-500 uppercase mb-2">
            {{
              categoryModal.form.isEdit
                ? "Edit Kategori"
                : "Tambah Kategori Baru"
            }}
          </p>
          <div class="flex gap-2">
            <input
              v-model="categoryModal.form.name"
              placeholder="Nama Kategori..."
              class="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              @keyup.enter="saveCategoryHandler"
            />
            <input
              type="color"
              v-model="categoryModal.form.color"
              class="h-10 w-10 p-1 border border-gray-300 rounded-lg cursor-pointer"
              title="Warna Label"
            />
            <button
              @click="saveCategoryHandler"
              :disabled="!categoryModal.form.name || categoryModal.loading"
              class="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UIcon
                v-if="categoryModal.form.isEdit"
                name="i-heroicons-check"
                class="w-5 h-5"
              />
              <UIcon v-else name="i-heroicons-plus" class="w-5 h-5" />
            </button>
            <button
              v-if="categoryModal.form.isEdit"
              @click="cancelEditCategory"
              class="px-4 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200"
              title="Batal Edit"
            >
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
          <p
            v-if="!categories.length"
            class="text-center text-gray-400 py-4 text-sm"
          >
            Belum ada kategori
          </p>
          <div
            v-for="cat in categories"
            :key="cat.id"
            class="bg-white p-3 rounded-xl border border-gray-200 flex justify-between items-center group hover:shadow-sm"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-4 h-4 rounded-full"
                :style="{ backgroundColor: cat.color }"
              ></div>
              <span class="font-medium text-gray-800 text-sm">{{
                cat.name
              }}</span>
            </div>
            <div
              class="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <button
                @click="editCategory(cat)"
                class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                title="Edit"
              >
                <UIcon name="i-heroicons-pencil-square" class="w-4 h-4" />
              </button>
              <button
                @click="deleteCategoryHandler(cat.id)"
                class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                title="Hapus"
              >
                <UIcon name="i-heroicons-trash" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Stok -->
    <div
      v-if="stockModal.open"
      class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="stockModal.open = false"
    >
      <div
        class="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-[scale-in_0.2s_ease-out]"
      >
        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-lg font-bold text-gray-900">Kelola Stok</h3>
            <button
              @click="stockModal.open = false"
              class="text-gray-400 hover:text-gray-600"
            >
              <UIcon name="i-heroicons-x-mark" class="w-6 h-6" />
            </button>
          </div>

          <div class="mb-4">
            <p class="text-sm text-gray-500">
              Produk:<span class="font-bold text-gray-900 ml-1">{{
                stockModal.product?.name
              }}</span>
            </p>
            <p class="text-sm text-gray-500">
              Stok Saat Ini:<span class="font-bold text-gray-900 ml-1">{{
                stockModal.product?.stock || 0
              }}</span>
            </p>
          </div>

          <div class="space-y-4">
            <!-- Tipe Aksi -->
            <div class="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-xl">
              <button
                @click="stockModal.type = 'in'"
                class="py-2 text-sm font-bold rounded-lg transition-all"
                :class="
                  stockModal.type === 'in'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                "
              >
                TAMBAH
              </button>
              <button
                @click="stockModal.type = 'out'"
                class="py-2 text-sm font-bold rounded-lg transition-all"
                :class="
                  stockModal.type === 'out'
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                "
              >
                KURANG
              </button>
              <button
                @click="stockModal.type = 'adjustment'"
                class="py-2 text-sm font-bold rounded-lg transition-all"
                :class="
                  stockModal.type === 'adjustment'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                "
              >
                SETEL
              </button>
            </div>

            <!-- Input Jumlah -->
            <div>
              <label
                class="block text-xs font-bold text-gray-500 uppercase mb-1"
                >Jumlah</label
              >
              <input
                type="number"
                v-model.number="stockModal.quantity"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg font-bold focus:outline-none focus:border-purple-500 focus:ring-0"
                min="1"
                placeholder="0"
                @keyup.enter="saveStock"
              />
            </div>

            <!-- Input Catatan -->
            <div>
              <label
                class="block text-xs font-bold text-gray-500 uppercase mb-1"
                >Catatan (Opsional)</label
              >
              <input
                v-model="stockModal.notes"
                class="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-purple-500 focus:ring-0 placeholder-gray-400"
                placeholder="Alasan (opsional, misal: Stok opname)"
                @keyup.enter="saveStock"
              />
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3 mt-6">
              <button
                @click="stockModal.open = false"
                class="flex-1 py-3 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
              >
                BATAL
              </button>
              <button
                @click="saveStock"
                :disabled="stockModal.loading"
                class="flex-1 py-3 text-white font-bold rounded-xl transition-colors shadow-lg shadow-purple-200 flex items-center justify-center border-2 border-transparent"
                :class="
                  stockModal.type === 'in'
                    ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600'
                    : stockModal.type === 'out'
                      ? 'bg-red-600 hover:bg-red-700 border-red-600'
                      : 'bg-blue-600 hover:bg-blue-700 border-blue-600'
                "
              >
                <span v-if="stockModal.loading" class="animate-spin mr-2"
                  >⏳</span
                >
                {{
                  stockModal.type === "in"
                    ? "TAMBAH"
                    : stockModal.type === "out"
                      ? "KURANGI"
                      : "SETEL"
                }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
