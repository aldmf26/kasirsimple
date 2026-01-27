<script setup lang="ts">
import { formatCurrency } from '~/utils/helpers'

definePageMeta({
  layout: 'default'
})

const { products, loading: productsLoading, fetchProducts, createProduct, updateProduct, deleteProduct } = useProducts()
const { categories, fetchCategories } = useCategories()
const { store } = useStore()

const columns = [
  { id: 'image_url', key: 'image_url', label: 'Foto' },
  { id: 'name', key: 'name', label: 'Nama Produk', sortable: true },
  { id: 'category', key: 'category', label: 'Kategori', sortable: true },
  { id: 'price', key: 'price', label: 'Harga', sortable: true },
  { id: 'stock', key: 'stock', label: 'Stok', sortable: true },
  { id: 'actions', key: 'actions', label: 'Aksi' }
]

const q = ref('')
const selectedCategory = ref('all')

const filteredRows = computed(() => {
  let result = products.value

  if (q.value) {
    result = result.filter(person => {
      return Object.values(person).some(value => {
        return String(value).toLowerCase().includes(q.value.toLowerCase())
      })
    })
  }

  if (selectedCategory.value !== 'all') {
    result = result.filter(p => p.category_id === selectedCategory.value)
  }

  return result
})

const isOpen = ref(false)
const isEdit = ref(false)
const state = reactive({
  id: '',
  name: '',
  price: 0,
  category_id: '',
  stock: 0,
  min_stock: 5,
  image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200&auto=format&fit=crop'
})

// Options for the category select
const categoryOptions = computed(() => {
    const opts = categories.value.map(c => ({
        label: c.name,
        value: c.id
    }))
    return [{ label: 'Semua Kategori', value: 'all' }, ...opts]
})

const modalCategoryOptions = computed(() => {
    return categories.value.map(c => ({
        label: c.name,
        value: c.id
    }))
})

const openAddModal = () => {
    isEdit.value = false
    state.id = ''
    state.name = ''
    state.price = 0
    state.category_id = categories.value[0]?.id || ''
    state.stock = 0
    state.min_stock = 5
    isOpen.value = true
}

const openEditModal = (row: any) => {
    isEdit.value = true
    state.id = row.id
    state.name = row.name
    state.price = row.price
    state.category_id = row.category_id || ''
    state.stock = row.stock
    state.min_stock = row.min_stock || 0
    state.image_url = row.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200&auto=format&fit=crop'
    isOpen.value = true
}

const saveProduct = async () => {
    try {
        if (isEdit.value) {
            await updateProduct(state.id, {
                name: state.name,
                price: state.price,
                category_id: state.category_id,
                stock: state.stock,
                min_stock: state.min_stock,
                image_url: state.image_url
            })
        } else {
            await createProduct({
                name: state.name,
                price: state.price,
                category_id: state.category_id,
                stock: state.stock,
                min_stock: state.min_stock,
                image_url: state.image_url,
                has_stock: true
            })
        }
        isOpen.value = false
    } catch (e) {
        console.error('Error saving product:', e)
    }
}

const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus produk ini?')) {
        await deleteProduct(id)
    }
}

// Initial fetch
onMounted(async () => {
    if (store.value) {
        await Promise.all([
            fetchCategories(),
            fetchProducts()
        ])
    }
})

// Re-fetch if store changes
watch(() => store.value, async (newStore) => {
    if (newStore) {
        await Promise.all([
            fetchCategories(),
            fetchProducts()
        ])
    }
})
</script>

<template>
  <div class="h-full flex flex-col bg-gray-50">
    <!-- Header -->
    <div class="px-8 py-6 border-b border-gray-200 bg-white flex justify-between items-center shrink-0 shadow-sm">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">Manajemen Produk</h1>
            <p class="text-sm text-gray-500">Kelola daftar menu dan stok</p>
        </div>
        <UButton icon="i-heroicons-plus" color="primary" size="lg" @click="openAddModal">Tambah Produk</UButton>
    </div>

    <!-- Toolbar -->
    <div class="px-8 py-4 flex gap-4 items-center">
        <UInput v-model="q" icon="i-heroicons-magnifying-glass-20-solid" placeholder="Cari nama produk..." class="w-64" />
        <USelect v-model="selectedCategory" :options="categoryOptions" class="w-48" />
    </div>

    <!-- Table -->
    <div class="flex-1 overflow-auto px-8 pb-8">
        <div class="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
             <UTable :columns="columns" :rows="filteredRows" :loading="productsLoading">
                <template #image_url-data="{ row }">
                    <img :src="row.image_url" class="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                </template>

                <template #category-data="{ row }">
                    <span v-if="row.category" class="px-2 py-1 rounded-md text-xs font-medium" :style="{ backgroundColor: row.category.color + '20', color: row.category.color }">
                        {{ row.category.name }}
                    </span>
                    <span v-else class="text-gray-400 text-xs">-</span>
                </template>
                
                <template #price-data="{ row }">
                    <span class="font-medium text-gray-900">{{ formatCurrency(row.price) }}</span>
                </template>

                <template #stock-data="{ row }">
                    <UBadge :color="row.stock <= (row.min_stock || 5) ? 'error' : 'success'" variant="subtle">{{ row.stock }}</UBadge>
                </template>

                <template #actions-data="{ row }">
                    <div class="flex gap-2 justify-end">
                        <UButton icon="i-heroicons-pencil-square" color="neutral" variant="ghost" size="xs" @click="openEditModal(row)" />
                        <UButton icon="i-heroicons-trash" color="error" variant="ghost" size="xs" @click="handleDelete(row.id)" />
                    </div>
                </template>
            </UTable>
        </div>
    </div>

    <!-- Modal -->
    <UModal v-model="isOpen">
        <UCard>
            <template #header>
                <div class="flex items-center justify-between">
                    <h3 class="font-bold text-lg text-gray-900">{{ isEdit ? 'Edit Produk' : 'Tambah Produk' }}</h3>
                    <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" @click="isOpen = false" />
                </div>
            </template>

            <form @submit.prevent="saveProduct" class="space-y-4">
                <UFormGroup label="Nama Produk" required>
                    <UInput v-model="state.name" placeholder="Contoh: Nasi Goreng" />
                </UFormGroup>
                
                <div class="grid grid-cols-2 gap-4">
                    <UFormGroup label="Harga" required>
                        <UInput v-model="state.price" type="number" icon="i-heroicons-currency-dollar" />
                    </UFormGroup>
                    <UFormGroup label="Stok" required>
                         <UInput v-model="state.stock" type="number" icon="i-heroicons-cube" />
                    </UFormGroup>
                </div>

                <UFormGroup label="Kategori" required>
                    <USelect v-model="state.category_id" :options="modalCategoryOptions" />
                </UFormGroup>

                <UFormGroup label="Min. Stok (Peringatan Stok Rendah)">
                    <UInput v-model="state.min_stock" type="number" icon="i-heroicons-bell" />
                </UFormGroup>

                <UFormGroup label="URL Foto Produk">
                    <UInput v-model="state.image_url" placeholder="https://..." />
                </UFormGroup>
            </form>

            <template #footer>
                <div class="flex justify-end gap-3">
                    <UButton color="neutral" variant="ghost" @click="isOpen = false">Batal</UButton>
                    <UButton color="primary" @click="saveProduct">Simpan</UButton>
                </div>
            </template>
        </UCard>
    </UModal>
  </div>
</template>
