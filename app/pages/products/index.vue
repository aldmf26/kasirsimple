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
const selectedStockStatus = ref("all"); // all, available, low, out
const sortBy = ref("name-asc"); // name-asc, name-desc, price-asc, etc

const filteredProducts = computed(() => {
  let result = products.value || [];

  // Search
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter((p) => p.name.toLowerCase().includes(q));
  }

  // Kategori
  if (selectedCategory.value !== "all") {
    result = result.filter((p) => p.category_id === selectedCategory.value);
  }

  // Status Stok
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

  // Sorting
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
  <div class="min-h-screen bg-gray-100 p-6">
    <!-- Statistik Header -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div
        class="bg-cyan-500 text-white rounded-xl p-6 shadow-lg relative overflow-hidden"
      >
        <div class="absolute top-4 right-4 text-5xl opacity-20">📦</div>
        <p class="text-lg font-medium">TOTAL PRODUK</p>
        <p class="text-5xl font-black mt-2">{{ totalProducts }}</p>
      </div>

      <div
        class="bg-purple-500 text-white rounded-xl p-6 shadow-lg relative overflow-hidden"
      >
        <div class="absolute top-4 right-4 text-5xl opacity-20">🗂️</div>
        <p class="text-lg font-medium">TOTAL KATEGORI</p>
        <p class="text-5xl font-black mt-2">{{ totalCategories }}</p>
      </div>

      <div class="bg-gray-900 text-white rounded-xl p-6 shadow-lg">
        <p class="text-lg font-bold mb-4">RINCIAN KATEGORI</p>
        <div class="space-y-3">
          <div
            v-for="cat in categorySummary"
            :key="cat.name"
            class="flex justify-between items-center"
          >
            <span :class="{ 'text-red-400': cat.name === 'Tanpa Kategori' }">
              {{ cat.name }}
            </span>
            <span class="font-bold text-lg">{{ cat.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div
      class="bg-white rounded-xl shadow p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between"
    >
      <div class="flex gap-4 w-full md:w-auto">
        <input
          v-model="searchQuery"
          placeholder="Cari produk..."
          class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <select
          v-model="selectedCategory"
          class="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
          class="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
          class="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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

      <div class="flex gap-3 w-full md:w-auto">
        <UButton color="gray" variant="solid" size="lg">LAINNYA ▼</UButton>
        <UButton color="primary" size="lg" @click="openAdd">+ TAMBAH</UButton>
      </div>
    </div>

    <!-- Tabel Produk -->
    <div class="bg-white rounded-xl shadow overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-black text-white">
          <tr>
            <th class="p-4 font-medium">Nama Produk</th>
            <th class="p-4 font-medium">Kategori</th>
            <th class="p-4 font-medium">Harga Beli</th>
            <th class="p-4 font-medium">Harga Jual</th>
            <th class="p-4 font-medium">Laba</th>
            <th class="p-4 font-medium">Stok</th>
            <th class="p-4 font-medium">Satuan</th>
            <th class="p-4 font-medium text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="product in filteredProducts"
            :key="product.id"
            class="border-b hover:bg-gray-50"
          >
            <td class="p-4 font-medium">{{ product.name }}</td>
            <td class="p-4">
              <span
                class="px-3 py-1 rounded-full text-xs"
                :style="{
                  backgroundColor: product.category?.color + '30',
                  color: product.category?.color,
                }"
              >
                {{ product.category?.name || "Tanpa Kategori" }}
              </span>
            </td>
            <td class="p-4">{{ formatCurrency(product.buy_price || 0) }}</td>
            <td class="p-4 font-bold text-primary">
              {{ formatCurrency(product.price) }}
            </td>
            <td class="p-4 text-green-600 font-medium">
              {{
                formatCurrency((product.price || 0) - (product.buy_price || 0))
              }}
            </td>
            <td class="p-4">
              <span
                :class="{
                  'text-red-600 font-bold': product.stock === 0,
                  'text-orange-600':
                    product.stock > 0 &&
                    product.stock <= (product.min_stock || 5),
                  'text-green-600': product.stock > 10,
                }"
              >
                {{ product.stock }}
              </span>
            </td>
            <td class="p-4">{{ product.unit || "pcs" }}</td>
            <td class="p-4 text-right">
              <button
                @click="openEdit(product)"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg mr-2 hover:bg-blue-700"
              >
                EDIT
              </button>
              <button
                @click="confirmDelete(product.id)"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                HAPUS
              </button>
            </td>
          </tr>
          <tr v-if="!filteredProducts.length && !productsLoading">
            <td colspan="8" class="p-12 text-center text-gray-500">
              Tidak ada produk ditemukan
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="productsLoading" class="p-12 text-center">
        Memuat produk...
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
        class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div class="p-6 border-b">
          <h2 class="text-2xl font-bold">
            {{ isEdit ? "Edit Produk" : "Tambah Produk Baru" }}
          </h2>
        </div>

        <div class="p-6 space-y-5">
          <div>
            <label class="block text-sm font-bold mb-2">Nama Produk</label>
            <input
              v-model="form.name"
              class="w-full p-3 border rounded-lg"
              placeholder="Contoh: Nasi Goreng"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-bold mb-2">Harga Beli</label>
              <input
                v-model.number="form.buy_price"
                type="number"
                class="w-full p-3 border rounded-lg"
              />
            </div>
            <div>
              <label class="block text-sm font-bold mb-2">Harga Jual</label>
              <input
                v-model.number="form.sell_price"
                type="number"
                class="w-full p-3 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold mb-2">Kategori</label>
            <select
              v-model="form.category_id"
              class="w-full p-3 border rounded-lg"
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

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-bold mb-2">Stok</label>
              <input
                v-model.number="form.stock"
                type="number"
                class="w-full p-3 border rounded-lg"
              />
            </div>
            <div>
              <label class="block text-sm font-bold mb-2">Satuan</label>
              <input
                v-model="form.unit"
                class="w-full p-3 border rounded-lg"
                placeholder="pcs / kg / dll"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold mb-2"
              >URL Gambar (opsional)</label
            >
            <input
              v-model="form.image_url"
              class="w-full p-3 border rounded-lg"
              placeholder="https://..."
            />
          </div>
        </div>

        <div class="p-6 border-t flex gap-3">
          <button
            @click="modalOpen = false"
            class="flex-1 py-4 bg-gray-200 rounded-xl font-bold"
          >
            BATAL
          </button>
          <button
            @click="save"
            class="flex-1 py-4 bg-primary-600 text-white rounded-xl font-bold"
          >
            {{ isEdit ? "UPDATE" : "SIMPAN" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
