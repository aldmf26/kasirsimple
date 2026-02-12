<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

import type { Database } from '~/types/database'

const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const toast = useToast()

const name = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

// Redirect if already logged in
watchEffect(() => {
  if (user.value) {
    navigateTo('/dashboard')
  }
})

const handleRegister = async () => {
  if (!email.value || !password.value || !name.value) {
    error.value = "Semua kolom harus diisi";
    return;
  }
  
  loading.value = true
  error.value = null

  try {
    // 1. Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        data: {
          full_name: name.value
        }
      }
    })

    if (authError) throw authError

    if (authData.user) {
      toast.add({
        title: 'Registrasi Berhasil',
        description: 'Akun Anda telah dibuat. Silakan login dan lengkapi profil toko.',
        color: 'success',
      })
      
      // Navigate to login or let auto-login handle it (if configured)
      // Usually supabase auto-logs in. We'll let the user object watcher handle redirect.
    }
  } catch (err: any) {
    error.value = err.message || "Terjadi kesalahan saat registrasi";
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-md mx-auto">
    <!-- Brand Header -->
    <div class="text-center mb-8">
      <div class="flex justify-center mb-4">
        <!-- Logo Icon -->
        <img src="/images/logo-kasirok.png" alt="Logo" class="w-20 h-20" />
      </div>
      <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Buat Akun Baru</h1>
      <p class="text-gray-500 mt-2 text-sm">Mulai kelola bisnis Anda sekarang</p>
    </div>

    <!-- Register Card -->
    <div class="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
      <div class="p-8">
        <form @submit.prevent="handleRegister" class="space-y-4">
          <!-- Error Alert -->
          <div v-if="error" class="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium flex gap-3 items-center animate-in slide-in-from-top-2">
            <UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5 shrink-0" />
            {{ error }}
          </div>

          <!-- Nama Lengkap -->
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-gray-700 ml-1">Nama Lengkap</label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <UIcon name="i-heroicons-user" class="w-5 h-5 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
              </div>
              <input 
                v-model="name"
                type="text" 
                class="block w-full pl-11 pr-4 py-3 bg-gray-50 border-gray-200 text-gray-900 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all outline-none text-sm font-medium" 
                placeholder="Nama Anda"
                required
              />
            </div>
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
                placeholder="nama@email.com"
                required
              />
            </div>
          </div>

          <!-- Password -->
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-gray-700 ml-1">Password</label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <UIcon name="i-heroicons-lock-closed" class="w-5 h-5 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
              </div>
              <input 
                v-model="password"
                type="password" 
                class="block w-full pl-11 pr-4 py-3 bg-gray-50 border-gray-200 text-gray-900 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all outline-none text-sm font-medium" 
                placeholder="minimal 6 karakter"
                minlength="6"
                required
              />
            </div>
          </div>

          <div class="pt-2">
            <button 
              type="submit" 
              :disabled="loading"
              class="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-violet-200 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              <UIcon v-if="loading" name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
              {{ loading ? 'Mendaftarkan...' : 'Daftar Sekarang' }}
            </button>
          </div>
        </form>
      </div>
      
      <!-- Footer -->
      <div class="bg-gray-50 p-6 text-center border-t border-gray-100">
        <p class="text-sm text-gray-600">
          Sudah punya akun? 
          <NuxtLink to="/auth/login" class="font-bold text-violet-600 hover:text-violet-700">Masuk disini</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
