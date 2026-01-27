<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const dummyAuth = useCookie('dummy_auth')

// Menu yang disederhanakan bahasanya
const links = [
  {
    label: 'Beranda',
    icon: 'i-heroicons-home',
    to: '/dashboard'
  },
  {
    label: 'Kasir',
    icon: 'i-heroicons-shopping-cart',
    to: '/pos'
  },
  {
    label: 'Barang',
    icon: 'i-heroicons-cube',
    to: '/products'
  },
  {
    label: 'Laporan',
    icon: 'i-heroicons-document-chart-bar',
    to: '/reports'
  }
]

const handleLogout = () => {
  if (confirm('Ibu yakin ingin keluar dari aplikasi?')) {
    dummyAuth.value = null
    router.push('/auth/login')
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
    
    <header class="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 h-16 flex items-center justify-between shadow-sm">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
          <UIcon name="i-heroicons-shopping-bag-20-solid" class="w-5 h-5" />
        </div>
        <span class="font-bold text-lg tracking-tight">KasirSimple</span>
      </div>

      <button 
        @click="handleLogout"
        class="flex items-center gap-1 text-gray-400 hover:text-red-600 transition-colors text-sm font-medium"
      >
        <UIcon name="i-heroicons-arrow-left-on-rectangle" class="w-5 h-5" />
        <span class="hidden sm:inline">Keluar</span>
      </button>
    </header>

    <main class="flex-1 pb-24"> <slot />
    </main>

    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50">
      <div class="max-w-md mx-auto flex justify-around items-center">
        <NuxtLink 
          v-for="link in links" 
          :key="link.to" 
          :to="link.to"
          class="flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 min-w-[64px]"
          :class="route.path === link.to ? 'text-blue-600' : 'text-gray-400'"
        >
          <UIcon 
            :name="link.icon" 
            class="w-7 h-7 mb-1"
            :class="route.path === link.to ? 'text-blue-600' : 'text-gray-400'"
          />
          <span class="text-[11px] font-bold uppercase tracking-wide">
            {{ link.label }}
          </span>

          <div 
            v-if="route.path === link.to" 
            class="w-1 h-1 bg-blue-600 rounded-full mt-1"
          ></div>
        </NuxtLink>
      </div>
    </nav>

  </div>
</template>

<style scoped>
/* Memberikan efek feedback saat tombol menu ditekan */
.router-link-active {
  transform: scale(1.05);
}

/* Memastikan tampilan mobile-first terasa seperti aplikasi asli */
@media (max-width: 640px) {
  nav {
    padding-bottom: env(safe-area-inset-bottom); /* Untuk HP layar penuh seperti iPhone */
  }
}
</style>