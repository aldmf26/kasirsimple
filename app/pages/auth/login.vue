<script setup lang="ts">
definePageMeta({
  layout: "auth",
});

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const toast = useToast();

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref<string | null>(null);

// Redirect is handled by middleware usually, but just in case
watchEffect(() => {
  if (user.value) {
    navigateTo("/dashboard");
  }
});

const handleLogin = async () => {
  if (!email.value || !password.value) {
    error.value = "Mohon isi email dan password";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });

    if (err) throw err;

    toast.add({
      title: "Berhasil login",
      description: "Mengalihkan ke dashboard...",
      color: "success",
    });

    navigateTo("/dashboard");
  } catch (e: any) {
    error.value = e.message === "Invalid login credentials" 
      ? "Email atau password salah" 
      : e.message;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="w-full max-w-md mx-auto">
    <!-- Brand Header -->
    <div class="text-center mb-8">
      <div class="flex justify-center mb-4">
        <!-- Logo Icon Placeholder -->
        <div class="w-12 h-12 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
          <UIcon name="i-heroicons-shopping-bag" class="w-7 h-7 text-white" />
        </div>
      </div>
      <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Selamat Datang Kembali</h1>
      <p class="text-gray-500 mt-2 text-sm">Kelola bisnismu dengan lebih mudah</p>
    </div>

    <!-- Login Card -->
    <div class="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
      <div class="p-8">
        <form @submit.prevent="handleLogin" class="space-y-5">
          <!-- Error Alert -->
          <div v-if="error" class="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium flex gap-3 items-center animate-in slide-in-from-top-2">
            <UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5 shrink-0" />
            {{ error }}
          </div>

          <!-- Email -->
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-gray-700 ml-1">Email</label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <UIcon name="i-heroicons-envelope" class="w-5 h-5 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
              </div>
              <input 
                v-model="email"
                type="email" 
                class="block w-full pl-11 pr-4 py-3 bg-gray-50 border-gray-200 text-gray-900 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all outline-none text-sm font-medium" 
                placeholder="nama@toko.com"
                required
              />
            </div>
          </div>

          <!-- Password -->
          <div class="space-y-1.5">
            <div class="flex justify-between items-center ml-1">
              <label class="text-sm font-semibold text-gray-700">Password</label>
              <!-- <NuxtLink to="/auth/forgot-password" class="text-xs font-semibold text-violet-600 hover:text-violet-700 hover:underline">
                Lupa password?
              </NuxtLink> -->
            </div>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <UIcon name="i-heroicons-lock-closed" class="w-5 h-5 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
              </div>
              <input 
                v-model="password"
                type="password" 
                class="block w-full pl-11 pr-4 py-3 bg-gray-50 border-gray-200 text-gray-900 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all outline-none text-sm font-medium" 
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <!-- Button -->
          <button 
            type="submit" 
            :disabled="loading"
            class="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-violet-200 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            <UIcon v-if="loading" name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
            {{ loading ? 'Masuk...' : 'Masuk sekarang' }}
          </button>
        </form>
      </div>
      
      <!-- Footer -->
      <div class="bg-gray-50 p-6 text-center border-t border-gray-100">
        <p class="text-sm text-gray-600">
          Belum punya akun? 
          <NuxtLink to="/auth/register" class="font-bold text-violet-600 hover:text-violet-700">Daftar sekarang</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
