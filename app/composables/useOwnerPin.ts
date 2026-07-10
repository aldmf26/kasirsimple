const OWNER_UNLOCK_PREFIX = 'kasirok_owner_unlocked_'
const OWNER_IDLE_LIMIT_MS = 2 * 60 * 60 * 1000

const bytesToHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')

const randomSalt = () => {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

const hashPin = async (pin: string, salt: string) => {
  const encoded = new TextEncoder().encode(`${salt}:${pin}`)
  return bytesToHex(await crypto.subtle.digest('SHA-256', encoded))
}

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
  const hasOwnerPin = computed(() => Boolean(storeData.value.owner_pin_hash))
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

  const setOwnerPin = async (pin: string) => {
    if (!store.value?.id) throw new Error('Toko belum siap')
    assertPinFormat(pin)

    loading.value = true
    try {
      const salt = randomSalt()
      const owner_pin_hash = await hashPin(pin, salt)
      await updateStore(store.value.id, {
        owner_pin_hash,
        owner_pin_salt: salt,
        owner_pin_enabled: true
      })
      touchOwnerSession()
    } finally {
      loading.value = false
    }
  }

  const verifyOwnerPin = async (pin: string) => {
    if (!store.value?.id) throw new Error('Toko belum siap')
    assertPinFormat(pin)

    const salt = storeData.value.owner_pin_salt
    const savedHash = storeData.value.owner_pin_hash
    if (typeof salt !== 'string' || typeof savedHash !== 'string') {
      throw new Error('PIN Owner belum dibuat')
    }
    if (!salt || !savedHash) throw new Error('PIN Owner belum dibuat')

    loading.value = true
    try {
      const currentHash = await hashPin(pin, salt)
      if (currentHash !== savedHash) throw new Error('PIN salah')
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
      await fetchStore()
      touchOwnerSession()
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
