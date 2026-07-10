<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const toast = useToast();

// Load store when layout mounted
const { store, fetchStore } = useStore();
const isSuperAdmin = computed(() => (store.value as any)?.is_admin === true);
const storeName = computed(() => store.value?.name || "KasirOK");
const accountName = computed(
  () =>
    (user.value?.user_metadata?.full_name as string | undefined) ||
    user.value?.email ||
    "Pengguna",
);

onMounted(async () => {
  // Store fetch akan di-trigger oleh initStoreAutoFetch di composable
});

// Menu yang disederhanakan bahasanya
const links = [
  {
    label: "Beranda",
    icon: "i-heroicons-home",
    to: "/dashboard",
  },
  {
    label: "Kasir",
    icon: "i-heroicons-shopping-cart",
    to: "/pos",
  },
  {
    label: "Laporan",
    icon: "i-heroicons-document-chart-bar",
    to: "/reports",
  },
  {
    label: "Barang",
    icon: "i-heroicons-cube",
    to: "/products",
  },
  {
    label: "Pengaturan",
    icon: "i-heroicons-cog-6-tooth",
    to: "/settings",
  },
];

const isActiveRoute = (path: string) =>
  route.path === path || route.path.startsWith(`${path}/`);

// Logout dengan Supabase
const handleLogout = async () => {
  if (confirm("Ibu yakin ingin keluar dari aplikasi?")) {
    try {
      console.log("🔓 Logging out...");
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      console.log("✅ Logout successful");
      toast.add({
        title: "Logout Berhasil",
        color: "success",
        icon: "i-heroicons-check-circle",
      });

      await router.push("/auth/login");
    } catch (error: any) {
      console.error("❌ Logout error:", error);
      toast.add({
        title: "Error Logout",
        description: error.message,
        color: "error",
        icon: "i-heroicons-x-circle",
      });
    }
  }
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 md:pl-20">
    <header
      class="bg-white/95 backdrop-blur border-b border-gray-200 sticky top-0 z-40 px-4 md:px-6 h-16 flex items-center justify-between shadow-sm"
    >
      <div class="flex items-center gap-3 min-w-0">
        <img
          src="/images/logo-kasirok.png"
          alt="Logo"
          class="w-10 h-10 shrink-0"
        />
        <div class="min-w-0">
          <p class="font-black text-base md:text-lg tracking-tight text-gray-900 truncate">
            {{ storeName }}
          </p>
          <p class="text-xs font-semibold text-gray-500 truncate">
            {{ accountName }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <NuxtLink
          v-if="isSuperAdmin"
          to="/admin"
          class="flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition-all hover:bg-black hover:shadow-md active:scale-95"
          title="Admin Dashboard"
        >
          <UIcon name="i-heroicons-shield-check" class="w-5 h-5" />
          <span class="hidden sm:inline">Admin</span>
        </NuxtLink>

        <button
          @click="handleLogout"
          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all text-sm font-semibold hover:shadow-md active:scale-95"
          title="Keluar dari aplikasi"
        >
          <UIcon name="i-heroicons-arrow-left-on-rectangle" class="w-5 h-5" />
          <span class="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>

    <aside
      class="hidden md:flex fixed inset-y-0 left-0 z-50 w-20 bg-white border-r border-gray-200 shadow-sm flex-col items-center py-4"
    >
      <img src="/images/logo-kasirok.png" alt="Logo" class="w-10 h-10 mb-6" />
      <nav class="flex flex-1 flex-col items-center gap-2">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="group flex h-14 w-14 flex-col items-center justify-center rounded-2xl transition-all duration-200"
          :class="
            isActiveRoute(link.to)
              ? 'bg-blue-50 text-blue-600 shadow-sm'
              : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
          "
          :title="link.label"
        >
          <UIcon :name="link.icon" class="w-6 h-6" />
          <span class="mt-1 text-[10px] font-bold leading-none">
            {{ link.label }}
          </span>
        </NuxtLink>
      </nav>
    </aside>

    <main class="flex-1 pb-24 md:pb-0"><slot /></main>

    <!-- Global Subscription Guard -->
    <SubscriptionGuard />

    <nav
      class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 px-2 py-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50 md:hidden"
    >
      <div class="max-w-md mx-auto flex justify-around items-center">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="flex flex-col items-center justify-center py-2 px-2 rounded-2xl transition-all duration-200 min-w-[62px]"
          :class="
            isActiveRoute(link.to)
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-400 active:bg-gray-50'
          "
        >
          <UIcon
            :name="link.icon"
            class="w-6 h-6 mb-1"
            :class="isActiveRoute(link.to) ? 'text-blue-600' : 'text-gray-400'"
          />
          <span class="text-[10px] font-bold leading-none">
            {{ link.label }}
          </span>
        </NuxtLink>
      </div>
    </nav>

  </div>
</template>

<style scoped>
/* Memastikan tampilan mobile-first terasa seperti aplikasi asli */
@media (max-width: 640px) {
  nav {
    padding-bottom: env(
      safe-area-inset-bottom
    ); /* Untuk HP layar penuh seperti iPhone */
  }
}
</style>
