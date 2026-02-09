<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
    <div class="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
      <h1 class="text-3xl font-extrabold text-blue-600 tracking-tight">
        Kasir Simple
      </h1>
      <p class="mt-2 text-sm text-gray-600">
        Solusi Kasir Modern untuk Usaha Anda
      </p>
    </div>

    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <slot />
    </div>

    <!-- Toast Notifications -->
    <UNotifications />
  </div>
</template>
