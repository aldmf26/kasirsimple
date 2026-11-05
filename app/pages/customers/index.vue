<template>
  <div class="min-h-screen bg-gray-50 p-4 sm:p-6">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Data Pelanggan</h1>
        <p class="text-gray-600 mt-1">Kelola data pelanggan toko</p>
      </div>

      <!-- Actions -->
      <div class="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <UInput
              v-model="searchQuery"
              icon="i-heroicons-magnifying-glass"
              placeholder="Cari nama atau nomor WA..."
              size="lg"
            />
          </div>
          <UButton
            @click="openModal()"
            icon="i-heroicons-plus"
            size="lg"
            color="success"
          >
            Tambah Pelanggan
          </UButton>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama
                </th>
                <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No. WA
                </th>
                <th class="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alamat / COD
                </th>
                <th class="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="loading">
                <td colspan="5" class="px-3 sm:px-6 py-4 text-center text-gray-500">
                  Memuat...
                </td>
              </tr>
              <tr v-else-if="filteredCustomers.length === 0">
                <td colspan="5" class="px-3 sm:px-6 py-4 text-center text-gray-500">
                  Belum ada pelanggan
                </td>
              </tr>
              <tr v-for="customer in filteredCustomers" :key="customer.id" class="hover:bg-gray-50">
                <td class="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ customer.name }}</div>
                  <div v-if="!customer.is_active" class="sm:hidden text-xs text-gray-500">Nonaktif</div>
                </td>
                <td class="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ customer.phone || '-' }}</div>
                </td>
                <td class="hidden md:table-cell px-3 sm:px-6 py-4">
                  <div class="text-sm text-gray-900 max-w-xs truncate">{{ customer.address || '-' }}</div>
                </td>
                <td class="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                  <span 
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                    :class="customer.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                  >
                    {{ customer.is_active ? 'Aktif' : 'Nonaktif' }}
                  </span>
                </td>
                <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <UButton
                    @click="openModal(customer)"
                    color="neutral"
                    variant="ghost"
                    icon="i-heroicons-pencil"
                    size="xs"
                  />
                  <UButton
                    @click="toggleActive(customer)"
                    color="neutral"
                    variant="ghost"
                    :icon="customer.is_active ? 'i-heroicons-x-circle' : 'i-heroicons-check-circle'"
                    size="xs"
                  />
                  <UButton
                    @click="removeCustomer(customer)"
                    color="error"
                    variant="ghost"
                    icon="i-heroicons-trash"
                    size="xs"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <UModal v-model:open="isModalOpen">
      <template #content>
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">{{ editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan' }}</h3>
        </template>

        <div class="space-y-4">
          <UFormField label="Nama" required>
            <UInput v-model="form.name" placeholder="Nama pelanggan" />
          </UFormField>

          <UFormField label="No. WA">
            <UInput v-model="form.phone" placeholder="08xxxxxxxxxx" />
          </UFormField>

          <UFormField label="Alamat / Keterangan COD">
            <UTextarea v-model="form.address" placeholder="Alamat atau keterangan" :rows="3" />
          </UFormField>

          <UFormField label="Catatan">
            <UTextarea v-model="form.notes" placeholder="Catatan lain" :rows="2" />
          </UFormField>

          <UFormField label="Status">
            <URadioGroup v-model="form.is_active" orientation="horizontal" :items="[
              { label: 'Aktif', value: true },
              { label: 'Nonaktif', value: false }
            ]" />
          </UFormField>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" @click="isModalOpen = false">Batal</UButton>
            <UButton color="success" @click="saveCustomer" :loading="loading">Simpan</UButton>
          </div>
        </template>
      </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCustomers } from '~/composables/useCustomers'
import { useStore } from '~/composables/useStore'

definePageMeta({
  layout: 'default'
})

const { customers, loading, fetchCustomers, createCustomer, updateCustomer, deleteCustomer } = useCustomers()
const { store } = useStore()

const searchQuery = ref('')
const isModalOpen = ref(false)
const editingCustomer = ref<any>(null)

const form = ref({
  name: '',
  phone: '',
  address: '',
  notes: '',
  is_active: true
})

const filteredCustomers = computed(() => {
  if (!searchQuery.value) return customers.value
  const q = searchQuery.value.toLowerCase()
  return customers.value.filter(c => 
    c.name.toLowerCase().includes(q) || 
    (c.phone && c.phone.toLowerCase().includes(q))
  )
})

const openModal = (customer: any = null) => {
  if (customer) {
    editingCustomer.value = customer
    form.value = {
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      notes: customer.notes || '',
      is_active: customer.is_active
    }
  } else {
    editingCustomer.value = null
    form.value = {
      name: '',
      phone: '',
      address: '',
      notes: '',
      is_active: true
    }
  }
  isModalOpen.value = true
}

const saveCustomer = async () => {
  if (!form.value.name) {
    alert('Nama harus diisi')
    return
  }
  
  try {
    if (editingCustomer.value) {
      await updateCustomer(editingCustomer.value.id, form.value)
    } else {
      await createCustomer(form.value)
    }
    isModalOpen.value = false
  } catch (error) {
    alert('Gagal menyimpan pelanggan')
  }
}

const toggleActive = async (customer: any) => {
  try {
    await updateCustomer(customer.id, { is_active: !customer.is_active })
  } catch (error) {
    alert('Gagal mengubah status pelanggan')
  }
}

const removeCustomer = async (customer: any) => {
  if (!confirm(`Hapus pelanggan ${customer.name}?`)) return
  try {
    await deleteCustomer(customer.id)
  } catch (error) {
    alert('Gagal menghapus pelanggan')
  }
}

watch(
  () => store.value?.id,
  (storeId) => {
    if (storeId) fetchCustomers(false).catch(() => {})
  },
  { immediate: true },
)
</script>
