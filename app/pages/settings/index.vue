<script setup lang="ts">
import { businessTypes, paymentMethods } from '~/utils/helpers'

definePageMeta({
  layout: 'default'
})

const toast = useToast()

// Store settings (mock data)
const storeSettings = ref({
  name: 'Toko Demo',
  businessType: 'retail',
  address: 'Jl. Contoh No. 123, Jakarta',
  phone: '08123456789',
  currency: 'Rp'
})

// Printer settings
const printerSettings = ref({
  printerType: 'thermal',
  paperWidth: 58,
  autoPrint: false,
  includeLogo: true,
  includeStoreInfo: true,
  footerText: 'Terima kasih atas kunjungan Anda!'
})

// Active section
const activeSection = ref('store')

const sections = [
  { id: 'store', label: 'Profil Toko', icon: 'i-heroicons-building-storefront' },
  { id: 'printer', label: 'Pengaturan Struk', icon: 'i-heroicons-printer' },
  { id: 'payment', label: 'Metode Pembayaran', icon: 'i-heroicons-credit-card' },
  { id: 'account', label: 'Akun', icon: 'i-heroicons-user-circle' }
]

// Enabled payment methods
const enabledPaymentMethods = ref(['cash', 'transfer', 'qris'])

const togglePaymentMethod = (method: string) => {
  const index = enabledPaymentMethods.value.indexOf(method)
  if (index > -1) {
    if (enabledPaymentMethods.value.length > 1) {
      enabledPaymentMethods.value.splice(index, 1)
    } else {
      toast.add({
        title: 'Tidak dapat menonaktifkan',
        description: 'Minimal satu metode pembayaran harus aktif',
        color: 'warning',
        icon: 'i-heroicons-exclamation-triangle'
      })
    }
  } else {
    enabledPaymentMethods.value.push(method)
  }
}

const saveSettings = () => {
  toast.add({
    title: 'Pengaturan Disimpan',
    description: 'Perubahan berhasil disimpan',
    color: 'success',
    icon: 'i-heroicons-check-circle'
  })
}

const handleLogout = () => {
  const dummyAuth = useCookie('dummy_auth')
  dummyAuth.value = null
  navigateTo('/auth/login')
}
</script>

<template>
  <div class="h-full flex bg-gray-50 overflow-hidden">
    <!-- Sidebar -->
    <div class="w-64 bg-white border-r border-gray-200 shrink-0">
      <div class="p-6 border-b border-gray-100">
        <h1 class="text-xl font-bold text-gray-900">Pengaturan</h1>
        <p class="text-sm text-gray-500">Kelola toko Anda</p>
      </div>
      
      <nav class="p-4 space-y-1">
        <button
          v-for="section in sections"
          :key="section.id"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
          :class="activeSection === section.id 
            ? 'bg-blue-50 text-blue-600 font-semibold' 
            : 'text-gray-600 hover:bg-gray-50'"
          @click="activeSection = section.id"
        >
          <UIcon :name="section.icon" class="w-5 h-5" />
          {{ section.label }}
        </button>
      </nav>
    </div>
    
    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-8">
      <!-- Store Profile -->
      <div v-if="activeSection === 'store'" class="max-w-2xl space-y-6">
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 class="text-lg font-bold text-gray-900 mb-6">Profil Toko</h2>
          
          <div class="space-y-6">
            <!-- Logo -->
            <div class="flex items-center gap-6">
              <div class="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                <UIcon name="i-heroicons-photo" class="w-10 h-10" />
              </div>
              <div>
                <UButton variant="soft" color="primary" size="sm">
                  <UIcon name="i-heroicons-arrow-up-tray" class="w-4 h-4 mr-2" />
                  Upload Logo
                </UButton>
                <p class="text-xs text-gray-400 mt-2">JPG, PNG max 2MB</p>
              </div>
            </div>
            
            <!-- Store Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nama Toko</label>
              <UInput v-model="storeSettings.name" size="lg" placeholder="Nama toko Anda" />
            </div>
            
            <!-- Business Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Jenis Usaha</label>
              <div class="grid grid-cols-3 gap-3">
                <button
                  v-for="type in businessTypes"
                  :key="type.value"
                  class="p-4 rounded-xl border-2 transition-all text-center"
                  :class="storeSettings.businessType === type.value 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'"
                  @click="storeSettings.businessType = type.value"
                >
                  <span class="text-2xl block mb-2">{{ type.icon }}</span>
                  <span class="font-medium text-sm text-gray-900">{{ type.label }}</span>
                </button>
              </div>
            </div>
            
            <!-- Address -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
              <UTextarea v-model="storeSettings.address" :rows="2" placeholder="Alamat lengkap toko" />
            </div>
            
            <!-- Phone -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">No. Telepon</label>
              <UInput v-model="storeSettings.phone" placeholder="08xxxxxxxxxx" />
            </div>
          </div>
        </div>
        
        <UButton color="primary" size="lg" @click="saveSettings">
          <UIcon name="i-heroicons-check" class="w-5 h-5 mr-2" />
          Simpan Perubahan
        </UButton>
      </div>
      
      <!-- Printer Settings -->
      <div v-if="activeSection === 'printer'" class="max-w-2xl space-y-6">
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 class="text-lg font-bold text-gray-900 mb-6">Pengaturan Struk</h2>
          
          <div class="space-y-6">
            <!-- Printer Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Jenis Printer</label>
              <div class="grid grid-cols-2 gap-3">
                <button
                  class="p-4 rounded-xl border-2 transition-all"
                  :class="printerSettings.printerType === 'thermal' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'"
                  @click="printerSettings.printerType = 'thermal'"
                >
                  <UIcon name="i-heroicons-printer" class="w-6 h-6 mb-2 text-blue-600" />
                  <span class="font-medium text-sm text-gray-900 block">Thermal Printer</span>
                  <span class="text-xs text-gray-400">58mm / 80mm</span>
                </button>
                <button
                  class="p-4 rounded-xl border-2 transition-all"
                  :class="printerSettings.printerType === 'none' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'"
                  @click="printerSettings.printerType = 'none'"
                >
                  <UIcon name="i-heroicons-x-circle" class="w-6 h-6 mb-2 text-gray-400" />
                  <span class="font-medium text-sm text-gray-900 block">Tanpa Printer</span>
                  <span class="text-xs text-gray-400">Digital only</span>
                </button>
              </div>
            </div>
            
            <!-- Paper Width -->
            <div v-if="printerSettings.printerType === 'thermal'">
              <label class="block text-sm font-medium text-gray-700 mb-2">Lebar Kertas</label>
              <div class="flex gap-3">
                <button
                  class="flex-1 p-3 rounded-xl border-2 transition-all"
                  :class="printerSettings.paperWidth === 58 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'"
                  @click="printerSettings.paperWidth = 58"
                >
                  58mm
                </button>
                <button
                  class="flex-1 p-3 rounded-xl border-2 transition-all"
                  :class="printerSettings.paperWidth === 80 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'"
                  @click="printerSettings.paperWidth = 80"
                >
                  80mm
                </button>
              </div>
            </div>
            
            <!-- Toggle Options -->
            <div class="space-y-4">
              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p class="font-medium text-gray-900">Auto Print</p>
                  <p class="text-sm text-gray-500">Print struk otomatis setelah transaksi</p>
                </div>
                <UToggle v-model="printerSettings.autoPrint" />
              </div>
              
              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p class="font-medium text-gray-900">Tampilkan Logo</p>
                  <p class="text-sm text-gray-500">Logo toko di struk</p>
                </div>
                <UToggle v-model="printerSettings.includeLogo" />
              </div>
              
              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p class="font-medium text-gray-900">Info Toko</p>
                  <p class="text-sm text-gray-500">Alamat & telepon di struk</p>
                </div>
                <UToggle v-model="printerSettings.includeStoreInfo" />
              </div>
            </div>
            
            <!-- Footer Text -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Teks Footer</label>
              <UInput v-model="printerSettings.footerText" placeholder="Terima kasih..." />
            </div>
          </div>
        </div>
        
        <UButton color="primary" size="lg" @click="saveSettings">
          <UIcon name="i-heroicons-check" class="w-5 h-5 mr-2" />
          Simpan Perubahan
        </UButton>
      </div>
      
      <!-- Payment Methods -->
      <div v-if="activeSection === 'payment'" class="max-w-2xl space-y-6">
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 class="text-lg font-bold text-gray-900 mb-2">Metode Pembayaran</h2>
          <p class="text-sm text-gray-500 mb-6">Aktifkan metode pembayaran yang diterima di toko Anda</p>
          
          <div class="space-y-3">
            <div
              v-for="method in paymentMethods"
              :key="method.value"
              class="flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer"
              :class="enabledPaymentMethods.includes(method.value) 
                ? 'border-blue-200 bg-blue-50' 
                : 'border-gray-200 bg-gray-50'"
              @click="togglePaymentMethod(method.value)"
            >
              <div class="flex items-center gap-4">
                <div 
                  class="w-12 h-12 rounded-xl flex items-center justify-center"
                  :class="enabledPaymentMethods.includes(method.value) 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-200 text-gray-400'"
                >
                  <UIcon :name="method.icon" class="w-6 h-6" />
                </div>
                <span class="font-medium text-gray-900">{{ method.label }}</span>
              </div>
              <UIcon 
                :name="enabledPaymentMethods.includes(method.value) 
                  ? 'i-heroicons-check-circle-solid' 
                  : 'i-heroicons-x-circle'" 
                class="w-6 h-6"
                :class="enabledPaymentMethods.includes(method.value) 
                  ? 'text-blue-600' 
                  : 'text-gray-300'"
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Account -->
      <div v-if="activeSection === 'account'" class="max-w-2xl space-y-6">
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 class="text-lg font-bold text-gray-900 mb-6">Akun Anda</h2>
          
          <div class="flex items-center gap-6 mb-8">
            <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <UIcon name="i-heroicons-user" class="w-10 h-10" />
            </div>
            <div>
              <p class="font-bold text-lg text-gray-900">User Demo</p>
              <p class="text-gray-500">demo@example.com</p>
            </div>
          </div>
          
          <div class="space-y-4">
            <UButton variant="soft" color="neutral" block size="lg">
              <UIcon name="i-heroicons-key" class="w-5 h-5 mr-2" />
              Ubah Password
            </UButton>
            
            <UButton variant="soft" color="error" block size="lg" @click="handleLogout">
              <UIcon name="i-heroicons-arrow-left-on-rectangle" class="w-5 h-5 mr-2" />
              Logout
            </UButton>
          </div>
        </div>
        
        <!-- Danger Zone -->
        <div class="bg-red-50 rounded-2xl border border-red-200 p-6">
          <h3 class="text-lg font-bold text-red-600 mb-2">Zona Berbahaya</h3>
          <p class="text-sm text-red-500 mb-4">Tindakan ini tidak dapat dikembalikan</p>
          <UButton variant="soft" color="error" size="sm">
            <UIcon name="i-heroicons-trash" class="w-4 h-4 mr-2" />
            Hapus Akun
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
