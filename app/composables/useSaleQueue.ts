// Sales made while offline wait here (localStorage, survives closing the app)
// and are sent with create_sale() once the connection is back. create_sale is
// idempotent on the sale id, so re-sending after a half-finished sync is safe.

export interface QueuedSale {
  sale: Record<string, any> // create_sale payload, includes id and final transaction_number
  dateKey: string
  queuedAt: string
  error?: string // last non-network failure, shown to the cashier
}

const STORAGE_KEY = 'sale_queue' // via offlineCache: survives closing the app

export const useSaleQueue = () => {
  const supabase = useSupabaseClient()
  const queue = useState<QueuedSale[]>('sale_queue', () => [])
  const syncing = useState('sale_queue_syncing', () => false)
  // SSR renders an empty queue; read the device's copy once in the browser.
  const loaded = useState('sale_queue_loaded', () => false)
  if (import.meta.client && !loaded.value) {
    loaded.value = true
    queue.value = loadOffline<QueuedSale[]>(STORAGE_KEY) || []
  }

  // If storage is full the sale still stays in memory until it is synced.
  const persist = () => saveOffline(STORAGE_KEY, queue.value)

  const enqueue = (sale: Record<string, any>, dateKey: string) => {
    queue.value = [...queue.value, { sale, dateKey, queuedAt: new Date().toISOString() }]
    persist()
  }

  // Send queued sales oldest first. Stops at the first network failure (still
  // offline); any other failure is kept on the sale and the rest continue.
  const flush = async (): Promise<{ sent: number, failed: number }> => {
    if (syncing.value || !queue.value.length) return { sent: 0, failed: 0 }
    if (import.meta.client && !navigator.onLine) return { sent: 0, failed: 0 }
    syncing.value = true
    let sent = 0
    let failed = 0
    try {
      for (const item of [...queue.value]) {
        const { error } = await (supabase as any).rpc('create_sale', {
          p_sale: item.sale,
          p_date_key: item.dateKey,
        })
        if (error && isNetworkError(error)) break
        if (error) {
          failed++
          queue.value = queue.value.map(q => (q.sale.id === item.sale.id ? { ...q, error: error.message } : q))
        } else {
          sent++
          queue.value = queue.value.filter(q => q.sale.id !== item.sale.id)
        }
        persist()
      }
    } finally {
      syncing.value = false
    }
    return { sent, failed }
  }

  return { queue, syncing, enqueue, flush }
}
