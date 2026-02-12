<template>
  <div class="font-sans antialiased text-gray-900 bg-white min-h-screen flex flex-col">
    <!-- Navbar -->
    <header class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div class="container mx-auto px-6 h-20 flex items-center justify-between">
        <div class="flex items-center gap-3">
             <img src="/images/logo-kasirok.png" alt="Logo" class="w-10 h-10" />
          <span class="text-xl font-bold tracking-tight text-gray-900">KasirOK</span>
        </div>
        <nav class="hidden md:flex items-center gap-8">
          <a href="#features" class="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Fitur</a>
          <a href="#pricing" class="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Harga</a>
          <a href="#testimonials" class="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Testimoni</a>
        </nav>
        <div class="flex items-center gap-4">
          <NuxtLink to="/auth/login" class="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">Masuk</NuxtLink>
          <NuxtLink to="/auth/register" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5">
            Daftar Gratis
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-gray-50 border-t border-gray-200 py-12">
  <div class="container mx-auto px-6">
    <div class="flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
      
      <!-- Logo -->
      <div class="flex items-center gap-2">
        <img src="/images/logo-kasirok.png" alt="Logo" class="w-10 h-10" />
        <span class="font-bold text-gray-900">KasirOK</span>
      </div>

      <!-- Social -->
      <div class="flex items-center gap-6">
        <a 
          href="https://instagram.com/kasir.ok" 
          target="_blank" 
          class="flex items-center gap-2 text-gray-500 hover:text-pink-600 transition-colors group"
        >
          <div class="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center group-hover:border-pink-200 group-hover:bg-pink-50 transition-all">
            <UIcon name="i-simple-icons-instagram" class="w-5 h-5" />
          </div>
          <span class="text-sm font-medium">@kasir.ok</span>
        </a>
      </div>

      <!-- Copyright -->
      <p class="text-gray-500 text-sm">
        © {{ new Date().getFullYear() }} KasirOK. All rights reserved.
      </p>

    </div>
  </div>
</footer>


    <!-- Toast Notifications -->
    <UNotifications />
  </div>
</template>
