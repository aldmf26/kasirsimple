<script setup lang="ts">
definePageMeta({
  layout: 'landing'
})
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="relative pt-20 pb-32 overflow-hidden bg-gradient-to-b from-white to-gray-50">
      <div class="container mx-auto px-6 relative z-10">
        <div class="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div class="lg:w-1/2 space-y-8">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold uppercase tracking-wide">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Solusi Kasir #1 di Indonesia
            </div>
            <h1 class="text-5xl lg:text-7xl font-black text-gray-900 leading-[1.1] tracking-tight">
              Kelola Bisnis <br>
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Tanpa Ribet</span>
            </h1>
            <p class="text-lg text-gray-600 max-w-xl leading-relaxed">
              Aplikasi kasir pintar yang membantu membukukan penjualan, kelola stok, dan pantau laba rugi secara otomatis. Praktis, modern, dan mudah digunakan.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 pt-4">
              <NuxtLink to="/auth/register" class="inline-flex justify-center items-center px-8 py-4 text-base font-bold text-white bg-blue-600 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-1 active:scale-95 group">
                Coba Gratis Sekarang
                <UIcon name="i-heroicons-arrow-right-20-solid" class="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </NuxtLink>
              <NuxtLink to="/dashboard" class="inline-flex justify-center items-center px-8 py-4 text-base font-bold text-gray-700 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95">
                Lihat Demo Live
              </NuxtLink>
            </div>
            
             <div class="flex items-center gap-4 pt-6 text-sm text-gray-500 font-medium border-t border-gray-100 mt-8">
               <div class="flex -space-x-2">
                  <div class="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-600">A</div>
                  <div class="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-600">B</div>
                  <div class="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-600">+</div>
               </div>
               <p>Bergabung dengan <span class="text-gray-900 font-bold">10.000+</span> Pengusaha</p>
            </div>
          </div>
          
          <div class="lg:w-1/2 relative">
             <div class="absolute -inset-4 bg-gradient-to-tr from-blue-200/50 to-purple-200/50 rounded-full blur-3xl opacity-70 animate-pulse"></div>
             <!-- Using the generated image path -->
             <img src="/images/hero_pos.png" alt="Kasir Simple Illustration" class="relative z-10 w-full rounded-2xl shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-700 hover:scale-[1.02] border border-white/50 backdrop-blur-sm">
             
             <!-- Floating Badge -->
             <div class="absolute -bottom-6 -left-6 z-20 bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex items-center gap-3 animate-bounce" style="animation-duration: 3s;">
                 <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                     <UIcon name="i-heroicons-check-circle-20-solid" class="w-6 h-6" />
                 </div>
                 <div>
                     <p class="text-xs text-gray-500 font-semibold uppercase">Status</p>
                     <p class="text-sm font-bold text-gray-900">Online & Siap Jual</p>
                 </div>
             </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-24 bg-white relative overflow-hidden">
      <!-- Decor -->
      <div class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
      
      <div class="container mx-auto px-6 relative z-10">
        <div class="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">Fitur Lengkap untuk Bisnis Anda</h2>
          <p class="text-gray-600 text-lg">Semua yang Anda butuhkan untuk mengembangkan bisnis, ada di dalam satu aplikasi kasir yang simpel.</p>
        </div>
        
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <!-- Feature 1 -->
            <div class="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div class="w-14 h-14 rounded-2xl bg-white shadow-sm text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:scale-110 group-hover:rotate-3">
                    <UIcon name="i-heroicons-cube-20-solid" class="w-7 h-7" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-3">Manajemen Stok</h3>
                <p class="text-gray-500 leading-relaxed">Pantau ketersediaan barang secara otomatis. Dapatkan notifikasi saat stok menipis agar tidak kehabisan barang.</p>
            </div>

            <!-- Feature 2 -->
             <div class="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div class="w-14 h-14 rounded-2xl bg-white shadow-sm text-purple-600 flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-all transform group-hover:scale-110 group-hover:rotate-3">
                    <UIcon name="i-heroicons-chart-bar-20-solid" class="w-7 h-7" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-3">Laporan Keuangan</h3>
                <p class="text-gray-500 leading-relaxed">Analisis performa bisnis Anda dengan laporan grafik yang mudah dipahami. Pantau omset harian hingga bulanan.</p>
            </div>

            <!-- Feature 3 -->
             <div class="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div class="w-14 h-14 rounded-2xl bg-white shadow-sm text-green-600 flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:text-white transition-all transform group-hover:scale-110 group-hover:rotate-3">
                    <UIcon name="i-heroicons-device-phone-mobile-20-solid" class="w-7 h-7" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-3">Multi Platform</h3>
                <p class="text-gray-500 leading-relaxed">Akses data bisnis Anda dari mana saja. Bisa lewat HP, Tablet, atau Laptop tanpa instalasi ribet.</p>
            </div>
            
             <!-- Feature 4 -->
            <div class="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div class="w-14 h-14 rounded-2xl bg-white shadow-sm text-yellow-600 flex items-center justify-center mb-6 group-hover:bg-yellow-600 group-hover:text-white transition-all transform group-hover:scale-110 group-hover:rotate-3">
                    <UIcon name="i-heroicons-printer-20-solid" class="w-7 h-7" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-3">Cetak Struk</h3>
                <p class="text-gray-500 leading-relaxed">Hubungkan dengan printer thermal bluetooth dengan mudah untuk mencetak struk belanja pelanggan.</p>
            </div>

             <!-- Feature 5 -->
            <div class="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div class="w-14 h-14 rounded-2xl bg-white shadow-sm text-red-600 flex items-center justify-center mb-6 group-hover:bg-red-600 group-hover:text-white transition-all transform group-hover:scale-110 group-hover:rotate-3">
                    <UIcon name="i-heroicons-wifi-20-solid" class="w-7 h-7" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-3">Mode Offline</h3>
                <p class="text-gray-500 leading-relaxed">Tetap bisa berjualan meski internet mati. Data akan tersinkronisasi otomatis saat online kembali.</p>
            </div>

             <!-- Feature 6 -->
            <div class="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div class="w-14 h-14 rounded-2xl bg-white shadow-sm text-teal-600 flex items-center justify-center mb-6 group-hover:bg-teal-600 group-hover:text-white transition-all transform group-hover:scale-110 group-hover:rotate-3">
                    <UIcon name="i-heroicons-user-group-20-solid" class="w-7 h-7" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-3">Manajemen Karyawan</h3>
                <p class="text-gray-500 leading-relaxed">Atur hak akses karyawan kasir. Pantau kinerja setiap kasir dengan laporan shift yang detail.</p>
            </div>
        </div>
      </div>
    </section>
  </div>
</template>
