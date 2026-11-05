import {
  chunkArray,
  fetchAllRows,
  groupDebtsByCustomer,
  moneyReceived,
  type CustomerDebt,
  type DebtTransaction,
} from '~/utils/helpers'

export interface DebtPayment {
  id: string
  transaction_id: string
  amount: number
  payment_method: string
  note: string | null
  created_at: string
}

const PAYMENT_COLUMNS = 'id, transaction_id, amount, payment_method, note, created_at'

// Customer debts (kasbon): unpaid sales grouped per customer, and installments
// recorded through the pay_debts database function (migration 025).
export const useDebts = () => {
  const supabase = useSupabaseClient()
  const { store } = useStore()

  const debts = ref<CustomerDebt[]>([])
  const loading = ref(false)
  const totalRemaining = computed(() => debts.value.reduce((sum, d) => sum + d.remaining, 0))

  const fetchDebts = async () => {
    if (!store.value?.id) return []
    loading.value = true
    try {
      const storeId = store.value.id
      const rows = await fetchAllRows<DebtTransaction>((from, to) =>
        (supabase.from('transactions') as any)
          .select('id, transaction_number, created_at, total, paid, customer_id, customer_name, customer_phone')
          .eq('store_id', storeId)
          .eq('status', 'completed')
          .gt('debt_remaining', 0)
          .order('id')
          .range(from, to),
      )
      debts.value = groupDebtsByCustomer(rows)
      return debts.value
    } finally {
      loading.value = false
    }
  }

  // Installments for these sales, newest first.
  const fetchPayments = async (transactionIds: string[]): Promise<DebtPayment[]> => {
    const payments: DebtPayment[] = []
    for (const part of chunkArray(transactionIds, 150)) {
      const { data, error } = await (supabase.from('debt_payments') as any)
        .select(PAYMENT_COLUMNS)
        .in('transaction_id', part)
      if (error) throw error
      payments.push(...(data || []))
    }
    return payments.sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  // Pay `amount` towards the given sales, oldest first. Returns what each got.
  const payDebts = async (
    transactionIds: string[],
    amount: number,
    paymentMethod: string,
    note?: string,
  ): Promise<{ transaction_id: string, amount_applied: number, remaining: number }[]> => {
    const now = new Date()
    const paidOffLabel = `${now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
    const { data, error } = await (supabase as any).rpc('pay_debts', {
      p_transaction_ids: transactionIds,
      p_amount: amount,
      p_payment_method: paymentMethod,
      p_note: note?.trim() || null,
      p_paid_off_label: paidOffLabel,
    })
    if (error) throw new Error(error.message || 'Gagal menyimpan pembayaran')
    return data || []
  }

  // Cash / non-cash actually received between two instants: what the given
  // sales took at the till plus every installment received in that window.
  const receivedBetween = async (
    sales: { id: string, total: number | string | null, paid: number | string | null, payment_method: string }[],
    startISO: string,
    endISO: string,
  ) => {
    if (!store.value?.id) return { cash: 0, nonCash: 0 }
    const storeId = store.value.id
    const [laterForSales, installments] = await Promise.all([
      sales.length ? fetchPayments(sales.map(s => s.id)) : Promise.resolve([]),
      fetchAllRows<DebtPayment>((from, to) =>
        (supabase.from('debt_payments') as any)
          .select(PAYMENT_COLUMNS)
          .eq('store_id', storeId)
          .gte('created_at', startISO)
          .lte('created_at', endISO)
          .order('id')
          .range(from, to),
      ),
    ])
    const laterBySale = new Map<string, number>()
    for (const p of laterForSales) {
      laterBySale.set(p.transaction_id, (laterBySale.get(p.transaction_id) || 0) + Number(p.amount))
    }
    return moneyReceived(sales, laterBySale, installments)
  }

  return { debts, totalRemaining, loading, fetchDebts, fetchPayments, payDebts, receivedBetween }
}
