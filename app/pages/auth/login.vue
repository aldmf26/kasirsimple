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

// Redirect if already logged in
watchEffect(() => {
  if (user.value) {
    navigateTo("/dashboard");
  }
});

const handleLogin = async () => {
  if (!email.value || !password.value) return;

  loading.value = true;

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });

    if (error) throw error;

    // Brief wait untuk ensure session settled on client
    await new Promise((resolve) => setTimeout(resolve, 500));

    toast.add({
      title: "Login Berhasil",
      description: "Selamat datang kembali!",
      color: "success",
      icon: "i-heroicons-check-circle",
    });

    navigateTo("/dashboard");
  } catch (error: any) {
    toast.add({
      title: "Login Gagal",
      description: error.message,
      color: "error",
      icon: "i-heroicons-x-circle",
    });
  } finally {
    loading.value = false;
  }
};

// Demo Login Shortcut
const loginDemo = () => {
  email.value = "demo@kasirsimple.com";
  password.value = "password123";
};
</script>

<template>
  <UCard class="bg-white shadow-xl rounded-2xl ring-1 ring-gray-200">
    <div class="space-y-6">
      <div>
        <h2
          class="text-xl font-bold text-gray-900 border-l-4 border-primary-600 pl-3"
        >
          Masuk ke Akun
        </h2>
        <p class="mt-2 text-sm text-gray-500">
          Silakan masukkan email dan password anda
        </p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700"
            >Email</label
          >
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

        <div>
          <div class="flex items-center justify-between">
            <label
              for="password"
              class="block text-sm font-medium text-gray-700"
              >Password</label
            >
            <NuxtLink
              to="/auth/forgot-password"
              class="text-xs text-primary-600 hover:underline"
              >Lupa password?</NuxtLink
            >
          </div>
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
          Masuk
        </UButton>
      </form>

      <div class="relative">
        <div class="absolute inset-0 flex items-center" aria-hidden="true">
          <div class="w-full border-t border-gray-200"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="bg-white px-2 text-gray-500">Atau</span>
        </div>
      </div>

      <UButton block variant="soft" color="neutral" @click="loginDemo">
        Gunakan Akun Demo
      </UButton>

      <div class="border-t border-gray-200 pt-4 text-center">
        <p class="text-sm text-gray-600">
          Belum punya akun?
          <NuxtLink
            to="/auth/register"
            class="font-medium text-primary-600 hover:text-primary-500 hover:underline"
          >
            Daftar Gratis
          </NuxtLink>
        </p>
      </div>
    </div>
  </UCard>
</template>
