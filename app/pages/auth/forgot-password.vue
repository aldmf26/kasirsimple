<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const email = ref('')
const loading = ref(false)
const sent = ref(false)
const toast = useToast()
const supabase = useSupabaseClient()

const handleReset = async () => {
  if (!email.value) return
  loading.value = true
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })
    if (error) throw error
    sent.value = true
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
          Lupa Password
        </h2>
        <p class="mt-2 text-sm text-gray-500">
          Masukkan email anda untuk menerima instruksi reset password
        </p>
      </div>

      <div v-if="sent" class="bg-success-50 p-4 rounded-xl border border-success-100 text-center">
        <UIcon name="i-heroicons-check-circle" class="w-12 h-12 text-success-600 mx-auto mb-2" />
        <p class="text-success-900 font-bold">Email Terkirim!</p>
        <p class="text-sm text-success-600">Silakan cek kotak masuk email anda.</p>
        <UButton to="/auth/login" variant="ghost" color="primary" class="mt-4">Kembali ke Login</UButton>
      </div>

      <form v-else @submit.prevent="handleReset" class="space-y-6">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
          <UInput
            id="email"
            v-model="email"
            type="email"
            placeholder="nama@email.com"
            icon="i-heroicons-envelope"
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
          Kirim Link Reset
        </UButton>
      </form>

      <div class="border-t border-gray-200 pt-4 text-center">
        <NuxtLink to="/auth/login" class="text-sm font-medium text-primary-600 hover:text-primary-500 hover:underline flex items-center justify-center gap-1">
          <UIcon name="i-heroicons-arrow-left" />
          Kembali ke Login
        </NuxtLink>
      </div>
    </div>
  </UCard>
</template>
