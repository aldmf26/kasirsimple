<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    compact?: boolean
  }>(),
  {
    title: 'Akses Admin Terkunci',
    description: 'Masukkan PIN Owner untuk membuka menu sensitif.',
    compact: false
  }
)

const emit = defineEmits<{
  unlocked: []
}>()

const {
  hasOwnerPin,
  loading,
  setOwnerPin,
  verifyOwnerPin,
  resetOwnerPinWithPassword
} = useOwnerPin()

const pin = ref('')
const confirmPin = ref('')
const password = ref('')
const resetPin = ref('')
const mode = ref<'unlock' | 'setup' | 'reset'>('unlock')
const error = ref('')

watch(
  hasOwnerPin,
  (value) => {
    mode.value = value ? 'unlock' : 'setup'
  },
  { immediate: true }
)

const clearSecretFields = () => {
  pin.value = ''
  confirmPin.value = ''
  password.value = ''
  resetPin.value = ''
}

const submit = async () => {
  error.value = ''
  try {
    if (mode.value === 'setup') {
      if (pin.value !== confirmPin.value) throw new Error('Konfirmasi PIN tidak cocok')
      await setOwnerPin(pin.value)
    } else if (mode.value === 'reset') {
      await resetOwnerPinWithPassword(password.value, resetPin.value)
    } else {
      await verifyOwnerPin(pin.value)
    }
    clearSecretFields()
    emit('unlocked')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'PIN tidak bisa diproses'
  }
}
</script>

<template>
  <div
    class="mx-auto flex w-full max-w-md items-center justify-center p-4"
    :class="compact ? 'min-h-0' : 'min-h-[60vh]'"
  >
    <div class="w-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div class="mb-5 flex items-start gap-3">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <UIcon
            name="i-heroicons-lock-closed"
            class="h-6 w-6"
          />
        </div>
        <div>
          <h2 class="text-lg font-black text-gray-900">
            {{ mode === "setup" ? "Buat PIN Owner" : mode === "reset" ? "Reset PIN Owner" : props.title }}
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            {{
              mode === "setup"
                ? "PIN dipakai untuk membuka Barang, Backup, Import, dan Zona Bahaya."
                : mode === "reset"
                  ? "Masukkan password akun utama, lalu buat PIN baru."
                  : props.description
            }}
          </p>
        </div>
      </div>

      <form
        class="space-y-4"
        @submit.prevent="submit"
      >
        <template v-if="mode === 'reset'">
          <div>
            <label class="mb-1 block text-xs font-black uppercase text-gray-500">Password Akun</label>
            <input
              v-model="password"
              type="password"
              class="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Password login owner"
            >
          </div>
          <div>
            <label class="mb-1 block text-xs font-black uppercase text-gray-500">PIN Baru</label>
            <input
              v-model="resetPin"
              inputmode="numeric"
              maxlength="6"
              type="password"
              class="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-xl font-black tracking-[0.35em] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="0000"
            >
          </div>
        </template>

        <template v-else>
          <div>
            <label class="mb-1 block text-xs font-black uppercase text-gray-500">
              {{ mode === "setup" ? "PIN Owner" : "PIN" }}
            </label>
            <input
              v-model="pin"
              inputmode="numeric"
              maxlength="6"
              type="password"
              class="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-xl font-black tracking-[0.35em] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="0000"
            >
          </div>
          <div v-if="mode === 'setup'">
            <label class="mb-1 block text-xs font-black uppercase text-gray-500">Ulangi PIN</label>
            <input
              v-model="confirmPin"
              inputmode="numeric"
              maxlength="6"
              type="password"
              class="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-xl font-black tracking-[0.35em] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="0000"
            >
          </div>
        </template>

        <p
          v-if="error"
          class="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700"
        >
          {{ error }}
        </p>

        <button
          type="submit"
          :disabled="loading"
          class="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          <UIcon
            :name="loading ? 'i-heroicons-arrow-path' : 'i-heroicons-shield-check'"
            class="h-5 w-5"
            :class="{ 'animate-spin': loading }"
          />
          {{ loading ? "Memproses..." : mode === "setup" ? "Simpan PIN" : mode === "reset" ? "Reset PIN" : "Buka Admin" }}
        </button>
      </form>

      <div
        v-if="hasOwnerPin"
        class="mt-4 text-center"
      >
        <button
          class="text-sm font-bold text-gray-500 hover:text-emerald-700"
          @click="
            error = '';
            clearSecretFields();
            mode = mode === 'reset' ? 'unlock' : 'reset';
          "
        >
          {{ mode === "reset" ? "Kembali ke input PIN" : "Lupa PIN?" }}
        </button>
      </div>
    </div>
  </div>
</template>
