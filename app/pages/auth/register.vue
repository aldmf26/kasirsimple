<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

import type { Database } from '~/types/database'

const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const toast = useToast()

const name = ref('')
const email = ref('')
const password = ref('')
const storeName = ref('')
const loading = ref(false)

// Redirect if already logged in
watchEffect(() => {
  if (user.value) {
    navigateTo('/dashboard')
  }
})

const handleRegister = async () => {
  if (!email.value || !password.value || !name.value || !storeName.value) return
  
  loading.value = true
  
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
      // 2. Create store for the new user
      // @ts-ignore - Supabase type mismatch in current environment
      const { error: storeError } = await supabase
        .from('stores')
        .insert({
          user_id: authData.user.id,
          name: storeName.value,
          business_type: 'retail',
          is_active: true
        })

      if (storeError) throw storeError

      toast.add({
        title: 'Registrasi Berhasil',
        description: 'Akun dan toko Anda telah dibuat. Silakan cek email untuk verifikasi (jika diaktifkan).',
        color: 'success',
        icon: 'i-heroicons-check-circle'
      })
      
      navigateTo('/dashboard')
    }
  } catch (error: any) {
    toast.add({
      title: 'Registrasi Gagal',
      description: error.message,
      color: 'error',
      icon: 'i-heroicons-x-circle'
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
          Daftar Akun Baru
        </h2>
        <p class="mt-2 text-sm text-gray-500">
          Mulai kelola bisnis Anda sekarang secara gratis
        </p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-5">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700">Nama Lengkap</label>
          <UInput
            id="name"
            v-model="name"
            type="text"
            placeholder="Nama Anda"
            icon="i-heroicons-user"
            size="lg"
            class="mt-1"
            required
          />
        </div>

        <div>
          <label for="storeName" class="block text-sm font-medium text-gray-700">Nama Toko / Bisnis</label>
          <UInput
            id="storeName"
            v-model="storeName"
            type="text"
            placeholder="Nama Toko Anda"
            icon="i-heroicons-building-storefront"
            size="lg"
            class="mt-1"
            required
          />
        </div>

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
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
          <UInput
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            icon="i-heroicons-lock-closed"
            size="lg"
            class="mt-1"
            required
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
          Daftar Sekarang
        </UButton>
      </form>

      <div class="border-t border-gray-200 pt-4 text-center">
        <p class="text-sm text-gray-600">
          Sudah punya akun?
          <NuxtLink to="/auth/login" class="font-medium text-primary-600 hover:text-primary-500 hover:underline">
            Masuk Disini
          </NuxtLink>
        </p>
      </div>
    </div>
  </UCard>
</template>
