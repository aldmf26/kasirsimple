const OWNER_UNLOCK_PREFIX = 'kasirok_owner_unlocked_'
const OWNER_IDLE_LIMIT_MS = 2 * 60 * 60 * 1000

// PIN hash lives in store_owner_pins (migration 023) and is only checked by
// SECURITY DEFINER functions, so the browser never sees a hash it could brute-force.

export const useOwnerPin = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const { store, updateStore, fetchStore } = useStore()

  const unlockedStoreId = useState<string | null>('owner_unlocked_store_id', () => null)
  const lastActivityAt = useState('owner_last_activity_at', () => Date.now())
  const now = useState('owner_pin_now', () => Date.now())
  const loading = useState('owner_pin_loading', () => false)

  const storeData = computed<Record<string, unknown>>(() => store.value || {})
  const isOwnerPinEnabled = computed(() => storeData.value.owner_pin_enabled === true)
  const hasOwnerPin = computed(() => storeData.value.owner_pin_set === true)
  const needsOwnerPin = computed(() => isOwnerPinEnabled.value)

  const unlockKey = computed(() =>
    store.value?.id ? `${OWNER_UNLOCK_PREFIX}${store.value.id}` : ''
  )

  const isOwnerUnlocked = computed(() => {
    if (!store.value?.id) return false
    if (!needsOwnerPin.value) return false
    if (!hasOwnerPin.value) return false
    if (unlockedStoreId.value !== store.value.id) return false
    return now.value - lastActivityAt.value <= OWNER_IDLE_LIMIT_MS
  })

  const isOwnerAccessAllowed = computed(() => {
    if (!store.value?.id) return false
    if (!needsOwnerPin.value) return true
    return isOwnerUnlocked.value
  })

  const touchOwnerSession = () => {
    if (!store.value?.id) return
    lastActivityAt.value = Date.now()
    unlockedStoreId.value = store.value.id
    if (import.meta.client && unlockKey.value) {
      sessionStorage.setItem(unlockKey.value, String(lastActivityAt.value))
    }
  }

  const restoreOwnerSession = () => {
    if (!import.meta.client || !store.value?.id || !unlockKey.value) return
    const raw = sessionStorage.getItem(unlockKey.value)
    const timestamp = raw ? Number(raw) : 0
    if (timestamp && Date.now() - timestamp <= OWNER_IDLE_LIMIT_MS) {
      unlockedStoreId.value = store.value.id
      lastActivityAt.value = timestamp
    }
  }

  const lockOwnerAccess = () => {
    if (import.meta.client && unlockKey.value) {
      sessionStorage.removeItem(unlockKey.value)
    }
    unlockedStoreId.value = null
  }

  const assertPinFormat = (pin: string) => {
    if (!/^\d{4,6}$/.test(pin)) {
      throw new Error('PIN harus 4-6 angka')
    }
  }

  // Changing an existing PIN needs currentPin, or a password login in the last
  // 10 minutes (checked server-side), which resetOwnerPinWithPassword provides.
  const setOwnerPin = async (pin: string, currentPin?: string) => {
    if (!store.value?.id) throw new Error('Toko belum siap')
    assertPinFormat(pin)

    loading.value = true
    try {
      const { error } = await (supabase as any).rpc('set_owner_pin', {
        p_new_pin: pin,
        p_current_pin: currentPin ?? null
      })
      if (error) throw new Error(error.message || 'Gagal menyimpan PIN')
      await fetchStore()
      touchOwnerSession()
    } finally {
      loading.value = false
    }
  }

  const verifyOwnerPin = async (pin: string) => {
    if (!store.value?.id) throw new Error('Toko belum siap')
    assertPinFormat(pin)

    if (!hasOwnerPin.value) throw new Error('PIN Owner belum dibuat')

    loading.value = true
    try {
      const { data: ok, error } = await (supabase as any).rpc('verify_owner_pin', { p_pin: pin })
      if (error) throw new Error(error.message || 'Gagal memeriksa PIN')
      if (ok !== true) throw new Error('PIN salah')
      touchOwnerSession()
    } finally {
      loading.value = false
    }
  }

  const resetOwnerPinWithPassword = async (password: string, newPin: string) => {
    if (!user.value?.email) throw new Error('Email akun tidak ditemukan')
    if (!password) throw new Error('Password akun wajib diisi')

    loading.value = true
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.value.email,
        password
      })
      if (error) throw new Error('Password akun salah')
      await setOwnerPin(newPin)
    } finally {
      loading.value = false
    }
  }

  const setOwnerPinEnabled = async (enabled: boolean) => {
    if (!store.value?.id) throw new Error('Toko belum siap')
    
    // Guard: Prevent disabling PIN if it is currently enabled and locked
    if (!enabled && isOwnerPinEnabled.value && !isOwnerUnlocked.value) {
      throw new Error('PIN Owner harus dibuka terlebih dahulu')
    }

    loading.value = true
    try {
      await updateStore(store.value.id, {
        owner_pin_enabled: enabled
      })
      if (!enabled) lockOwnerAccess()
    } finally {
      loading.value = false
    }
  }

  watch(
    () => store.value?.id,
    () => restoreOwnerSession(),
    { immediate: true }
  )

  if (import.meta.client) {
    const markActive = () => {
      if (isOwnerUnlocked.value) touchOwnerSession()
    }
    let timer: ReturnType<typeof setInterval> | null = null
    onMounted(() => {
      timer = setInterval(() => {
        now.value = Date.now()
      }, 60 * 1000)
      window.addEventListener('click', markActive)
      window.addEventListener('keydown', markActive)
    })
    onBeforeUnmount(() => {
      if (timer) clearInterval(timer)
      window.removeEventListener('click', markActive)
      window.removeEventListener('keydown', markActive)
    })
  }

  return {
    hasOwnerPin,
    isOwnerPinEnabled,
    needsOwnerPin,
    isOwnerUnlocked,
    isOwnerAccessAllowed,
    loading,
    setOwnerPin,
    setOwnerPinEnabled,
    verifyOwnerPin,
    resetOwnerPinWithPassword,
    lockOwnerAccess,
    restoreOwnerSession
  }
}
