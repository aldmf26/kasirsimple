<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const password = ref('')
const loading = ref(false)
const toast = useToast()
const supabase = useSupabaseClient()

const handleUpdate = async () => {
  if (!password.value) return
  loading.value = true
  
  try {
    const { error } = await supabase.auth.updateUser({
      password: password.value
    })
    if (error) throw error
    
    toast.add({
      title: 'Berhasil',
      description: 'Password anda telah diperbarui.',
      color: 'success'
    })
    navigateTo('/dashboard')
  } catch (error: any) {
    toast.add({
      title: 'Gagal',
      description: error.message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard class="bg-white shadow-xl rounded-2xl ring-1 ring-gray-200">
    <div class="space-y-6">
      <div>
        <h2 class="text-xl font-bold text-gray-900 border-l-4 border-primary-600 pl-3">
          Update Password
        </h2>
        <p class="mt-2 text-sm text-gray-500">
          Masukkan password baru anda
        </p>
      </div>

      <form @submit.prevent="handleUpdate" class="space-y-6">
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">Password Baru</label>
          <UInput
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            icon="i-heroicons-lock-closed"
            size="lg"
            class="mt-1"
            required
            autofocus
          />
        </div>

        <UButton
          type="submit"
          block
          size="lg"
          color="primary"
          :loading="loading"
          class="font-bold"
        >
          Perbarui Password
        </UButton>
      </form>
    </div>
  </UCard>
</template>
