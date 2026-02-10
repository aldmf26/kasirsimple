<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const email = ref('')
const loading = ref(false)
const sent = ref(false)
const error = ref<string | null>(null)
const successTitle = ref('Email Terkirim')
const successDesc = ref('Silakan cek kotak masuk email Anda untuk instruksi selanjutnya.')

const supabase = useSupabaseClient()

const handleReset = async () => {
  if (!email.value) return
  loading.value = true
  error.value = null
  
  try {
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })
    if (err) throw err
    sent.value = true
  } catch (e: any) {
    error.value = e.message || 'Gagal mengirim email reset password'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-md mx-auto">
    <!-- Header -->
    <div class="text-center mb-8">
      <div class="flex justify-center mb-4">
        <div class="w-12 h-12 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
          <UIcon name="i-heroicons-key" class="w-7 h-7 text-white" />
        </div>
      </div>
      <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Lupa Password?</h1>
      <p class="text-gray-500 mt-2 text-sm">Jangan khawatir, kami akan membantu Anda</p>
    </div>

    <!-- Card -->
    <div class="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
      <!-- Success State -->
      <div v-if="sent" class="p-8 text-center animate-in zoom-in-95 duration-300">
        <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <UIcon name="i-heroicons-check" class="w-8 h-8" />
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-2">{{ successTitle }}</h3>
        <p class="text-gray-600 mb-6 text-sm leading-relaxed">{{ successDesc }}</p>
        
        <NuxtLink to="/auth/login" class="block w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">
          Kembali ke Login
        </NuxtLink>
      </div>

      <!-- Form State -->
      <div v-else class="p-8">
        <form @submit.prevent="handleReset" class="space-y-5">
           <!-- Error Alert -->
          <div v-if="error" class="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium flex gap-3 items-center animate-in slide-in-from-top-2">
            <UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5 shrink-0" />
            {{ error }}
          </div>

          <p class="text-sm text-gray-600 mb-4 leading-relaxed">
            Masukkan alamat email yang terdaftar. Kami akan mengirimkan tautan untuk mengatur ulang password Anda.
          </p>

          <!-- Email -->
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-gray-700 ml-1">Email</label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <UIcon name="i-heroicons-envelope" class="w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
              </div>
              <input 
                v-model="email"
                type="email" 
                class="block w-full pl-11 pr-4 py-3 bg-gray-50 border-gray-200 text-gray-900 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none text-sm font-medium" 
                placeholder="nama@email.com"
                required
                autofocus
              />
            </div>
          </div>

          <button 
            type="submit" 
            :disabled="loading"
            class="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-200 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            <UIcon v-if="loading" name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
            {{ loading ? 'Mengirim...' : 'Kirim Link Reset' }}
          </button>
        </form>
      </div>
      
      <!-- Footer -->
       <div v-if="!sent" class="bg-gray-50 p-6 text-center border-t border-gray-100">
        <NuxtLink to="/auth/login" class="text-sm font-bold text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2">
          <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
          Kembali ke Login
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
