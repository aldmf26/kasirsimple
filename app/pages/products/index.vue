<script setup lang="ts">
import { formatCurrency } from "~/utils/helpers";

definePageMeta({
  layout: "default",
});

const {
  products,
  loading: productsLoading,
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = useProducts();
const { categories, fetchCategories } = useCategories();
const { store } = useStore();

const searchQuery = ref("");
const selectedCategory = ref("all");
const selectedStockStatus = ref("all");
const sortBy = ref("name-asc");

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

const categorySummary = computed(() => {
  const map = new Map();
  products.value?.forEach((p) => {
    const cat = p.category_id || "Tanpa Kategori";
    map.set(cat, (map.get(cat) || 0) + 1);
  });
  return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
});

const modalOpen = ref(false);
const isEdit = ref(false);
const form = reactive({
  id: "",
  name: "",
  category_id: "",
  buy_price: 0,
  sell_price: 0,
  stock: 0,
  unit: "pcs",
  image_url: "",
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
  modalOpen.value = true;
};

const save = async () => {
  try {
    if (isEdit.value) {
      await updateProduct(form.id, {
        name: form.name,
        category_id: form.category_id,
        buy_price: form.buy_price,
        price: form.sell_price,
        stock: form.stock,
        unit: form.unit,
        image_url: form.image_url,
      });
    } else {
      await createProduct({
        name: form.name,
        category_id: form.category_id,
        buy_price: form.buy_price,
        price: form.sell_price,
        stock: form.stock,
        unit: form.unit,
        image_url: form.image_url,
        has_stock: true,
      });
    }
    modalOpen.value = false;
  } catch (e) {
    console.error("Gagal simpan produk:", e);
  }
};

const confirmDelete = async (id) => {
  if (confirm("Yakin hapus produk ini?")) {
    await deleteProduct(id);
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

      <!-- Rincian Kategori -->
      <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0"
          >
            <UIcon name="i-heroicons-chart-bar-20-solid" class="w-6 h-6" />
          </div>
          <p class="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Rincian Kategori
          </p>
        </div>
        <div class="space-y-2">
          <div
            v-for="cat in categorySummary"
            :key="cat.name"
            class="flex justify-between items-center text-sm"
          >
            <span
              class="font-medium text-gray-700"
              :class="{
                'text-orange-600': cat.name === 'Tanpa Kategori',
              }"
            >
              {{ cat.name }}
            </span>
            <span class="font-bold text-gray-900">{{ cat.count }}</span>
          </div>
        </div>
      </div>
    </div>

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
          class="px-4 py-2 bg-amber-400 text-gray-900 font-bold rounded-xl border border-amber-500 hover:bg-amber-500 text-sm transition-colors"
        >
          LAINNYA ▼
        </button>
        <button
          @click="openAdd"
          class="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl border border-emerald-700 hover:bg-emerald-700 text-sm transition-colors"
        >
          +TAMBAH
        </button>
      </div>
    </div>

    <!-- Tabel Produk - Desktop -->
    <div class="max-w-5xl mx-auto px-4 sm:px-0">
      <!-- Desktop Table -->
      <div class="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-900 text-white">
            <tr>
              <th class="p-4 font-bold">Nama Produk</th>
              <th class="p-4 font-bold">Kategori</th>
              <th class="p-4 font-bold">Harga Beli</th>
              <th class="p-4 font-bold">Harga Jual</th>
              <th class="p-4 font-bold">Laba</th>
              <th class="p-4 font-bold">Stok</th>
              <th class="p-4 font-bold">Satuan</th>
              <th class="p-4 font-bold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="product in filteredProducts"
              :key="product.id"
              class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td class="p-4 font-semibold text-gray-900">{{ product.name }}</td>
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
                  formatCurrency((product.price || 0) - (product.buy_price || 0))
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
              <td class="p-4 text-right">
                <button
                  @click="openEdit(product)"
                  class="px-3 py-1 bg-blue-600 text-white rounded font-bold mr-2 hover:bg-blue-700 text-xs transition-colors"
                >
                  EDIT
                </button>
                <button
                  @click="confirmDelete(product.id)"
                  class="px-3 py-1 bg-red-600 text-white rounded font-bold hover:bg-red-700 text-xs transition-colors"
                >
                  HAPUS
                </button>
              </td>
            </tr>
            <tr v-if="!filteredProducts.length && !productsLoading">
              <td colspan="8" class="p-8 text-center text-gray-400">
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

        <div v-if="productsLoading" class="bg-white rounded-2xl p-8 text-center text-gray-500 shadow-sm border border-gray-100">
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
                {{ formatCurrency((product.price || 0) - (product.buy_price || 0)) }}
              </p>
            </div>
          </div>

          <!-- Satuan & Stok Info -->
          <div class="flex items-center justify-between text-xs text-gray-500">
            <span>Satuan: <span class="font-bold text-gray-700">{{ product.unit || "pcs" }}</span></span>
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
              @click="confirmDelete(product.id)"
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
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100"
      >
        <div class="p-6 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
          <h2 class="text-xl font-bold text-gray-900">
            {{ isEdit ? "Edit Produk" : "Tambah Produk Baru" }}
          </h2>
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
              >URL Gambar (opsional)</label
            >
            <input
              v-model="form.image_url"
              class="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
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
  </div>
</template>
