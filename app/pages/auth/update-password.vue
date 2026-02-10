<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const toast = useToast()
const supabase = useSupabaseClient()

const handleUpdate = async () => {
  if (!password.value) return
  if (password.value.length < 6) {
    error.value = "Password minimal 6 karakter"
    return
  }

  loading.value = true
  error.value = null
  
  try {
    const { error: err } = await supabase.auth.updateUser({
      password: password.value
    })
    
    if (err) throw err
    
    toast.add({
      title: 'Password Diperbarui',
      description: 'Silakan login dengan password baru Anda.',
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })
    
    navigateTo('/dashboard')
  } catch (e: any) {
    error.value = e.message || "Gagal memperbarui password"
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
        <div class="w-12 h-12 bg-gradient-to-tr from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
          <UIcon name="i-heroicons-lock-closed" class="w-7 h-7 text-white" />
        </div>
      </div>
      <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Buat Password Baru</h1>
      <p class="text-gray-500 mt-2 text-sm">Amankan akun Anda dengan password baru</p>
    </div>

    <!-- Card -->
    <div class="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
      <div class="p-8">
        <form @submit.prevent="handleUpdate" class="space-y-6">
          <!-- Error Alert -->
          <div v-if="error" class="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium flex gap-3 items-center animate-in slide-in-from-top-2">
            <UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5 shrink-0" />
            {{ error }}
          </div>
          
          <!-- Password Input -->
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-gray-700 ml-1">Password Baru</label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <UIcon name="i-heroicons-key" class="w-5 h-5 text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
              </div>
              <input 
                v-model="password"
                type="password" 
                class="block w-full pl-11 pr-4 py-3 bg-gray-50 border-gray-200 text-gray-900 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none text-sm font-medium" 
                placeholder="Minimal 6 karakter"
                minlength="6"
                required
                autofocus
              />
            </div>
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            :disabled="loading"
            class="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            <UIcon v-if="loading" name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
            {{ loading ? 'Menyimpan...' : 'Simpan Password Baru' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
