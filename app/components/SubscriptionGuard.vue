<script setup lang="ts">
const { store, isSubscriptionExpired } = useStore();

const waLink = computed(() => {
  const storeName = store.value?.name || "";
  const message = `Halo Admin, saya ingin konfirmasi pembayaran langganan untuk toko: ${storeName}`;
  return `https://wa.me/62895413111053?text=${encodeURIComponent(message)}`;
});
</script>

<template>
  <div
    v-if="isSubscriptionExpired"
    class="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/90 backdrop-blur-md p-4 overflow-hidden"
  >
    <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative border border-gray-100 animate-[fade-in-up_0.5s_ease-out]">
      <!-- Background Decor -->
      <div class="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 opacity-50 blur-2xl"></div>
      <div class="absolute bottom-0 left-0 w-24 h-24 bg-blue-50 rounded-full -ml-12 -mb-12 opacity-50 blur-2xl"></div>

      <div class="p-8 text-center relative z-10">
        <!-- Icon Section -->
        <div class="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3 shadow-lg shadow-red-100">
          <UIcon name="i-heroicons-lock-closed-solid" class="w-10 h-10" />
        </div>

        <h2 class="text-2xl font-black text-gray-900 mb-3 tracking-tight">
          Akses Terkunci! 🔒
        </h2>
        
        <div class="space-y-4 mb-8">
          <p class="text-gray-600 leading-relaxed font-medium">
            Maaf, masa langganan untuk <span class="text-gray-900 font-bold">"{{ store?.name }}"</span> telah berakhir.
          </p>
          <div class="bg-blue-50 p-4 rounded-2xl border border-blue-100">
             <p class="text-xs text-blue-800 font-bold uppercase tracking-wider mb-1">Kenapa ini terjadi?</p>
             <p class="text-sm text-blue-700">Setiap akun memerlukan langganan aktif untuk dapat menggunakan modul Penjualan, Produk, dan Laporan.</p>
          </div>
        </div>

        <div class="space-y-3">
          <a
            :href="waLink"
            target="_blank"
            class="flex items-center justify-center gap-3 w-full py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95"
          >
            <UIcon name="i-heroicons-chat-bubble-left-right-20-solid" class="w-5 h-5" />
            HUBUNGI ADMIN (WA)
          </a>
          
          <NuxtLink
            to="/auth/login"
            class="flex items-center justify-center w-full py-3 text-gray-500 font-bold text-sm hover:text-gray-700 transition-colors"
            @click="useSupabaseClient().auth.signOut()"
          >
            Keluar Akun
          </NuxtLink>
        </div>
      </div>

      <!-- Footer Branding -->
      <div class="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
         <p class="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Kasir Simple Membership System</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
