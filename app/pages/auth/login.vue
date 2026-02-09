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

// Validation errors
const emailError = ref("");
const passwordError = ref("");
const loginError = ref("");

// Redirect if already logged in
watchEffect(() => {
  if (user.value) {
    navigateTo("/dashboard");
  }
});

// Email validation
const validateEmail = () => {
  emailError.value = "";
  loginError.value = "";
  
  if (!email.value) {
    emailError.value = "Email harus diisi";
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    emailError.value = "Format email tidak valid";
    return false;
  }
  
  return true;
};

// Password validation
const validatePassword = () => {
  passwordError.value = "";
  loginError.value = "";
  
  if (!password.value) {
    passwordError.value = "Password harus diisi";
    return false;
  }
  
  if (password.value.length < 6) {
    passwordError.value = "Password minimal 6 karakter";
    return false;
  }
  
  return true;
};

// Clear errors when typing
watch(email, () => {
  if (emailError.value) emailError.value = "";
  if (loginError.value) loginError.value = "";
});

watch(password, () => {
  if (passwordError.value) passwordError.value = "";
  if (loginError.value) loginError.value = "";
});

const handleLogin = async () => {
  // Validate form
  const isEmailValid = validateEmail();
  const isPasswordValid = validatePassword();
  
  if (!isEmailValid || !isPasswordValid) {
    return;
  }

  loading.value = true;
  loginError.value = "";

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });

    if (error) {
      // Handle specific Supabase errors
      if (error.message.includes("Invalid login credentials")) {
        loginError.value = "Email atau password salah. Silakan coba lagi.";
      } else if (error.message.includes("Email not confirmed")) {
        loginError.value = "Email belum diverifikasi. Silakan cek email Anda.";
      } else if (error.message.includes("User not found")) {
        loginError.value = "Akun tidak ditemukan. Silakan daftar terlebih dahulu.";
      } else {
        loginError.value = error.message;
      }
      
      toast.add({
        title: "Login Gagal",
        description: loginError.value,
        color: "error",
        icon: "i-heroicons-x-circle",
      });
      
      throw error;
    }

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
    // Error already handled above
  } finally {
    loading.value = false;
  }
};

// Demo Login Shortcut
const loginDemo = () => {
  email.value = "demo@kasirok.com";
  password.value = "password123";
  emailError.value = "";
  passwordError.value = "";
  loginError.value = "";
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

      <!-- General Login Error Alert -->
      <div
        v-if="loginError"
        class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
      >
        <UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="text-sm font-medium text-red-800">{{ loginError }}</p>
        </div>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <!-- Email Field -->
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
            class="mt-1 w-full"
            :class="{ 'ring-2 ring-red-500': emailError }"
            required
            autofocus
            @blur="validateEmail"
          />
          <p v-if="emailError" class="mt-2 text-sm text-red-600 flex items-center gap-1">
            <UIcon name="i-heroicons-exclamation-circle" class="w-4 h-4" />
            {{ emailError }}
          </p>
        </div>

        <!-- Password Field -->
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
            class="mt-1 w-full"
            :class="{ 'ring-2 ring-red-500': passwordError }"
            required
            @blur="validatePassword"
          />
          <p v-if="passwordError" class="mt-2 text-sm text-red-600 flex items-center gap-1">
            <UIcon name="i-heroicons-exclamation-circle" class="w-4 h-4" />
            {{ passwordError }}
          </p>
        </div>

        <UButton
          type="submit"
          block
          size="lg"
          color="primary"
          :loading="loading"
          :disabled="loading"
          class="font-bold"
        >
          {{ loading ? 'Memproses...' : 'Masuk' }}
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
