import { describe, expect, it } from 'vitest'
import {
  chunkArray,
  clampNumber,
  fetchAllRows,
  isReturnedTransaction,
  localDateKey,
  localDayEndISO,
  localDayStartISO,
  allocateDebtPayment,
  buildSalesTrend,
  groupDebtsByCustomer,
  moneyReceived,
  percentChange,
  previousPeriod,
} from '../app/utils/helpers'

describe('localDateKey', () => {
  it('uses the store timezone calendar day, not the UTC one', () => {
    const instant = '2026-11-04T16:30:00Z' // 00:30 WITA on 5 Nov, 23:30 WIB on 4 Nov
    expect(localDateKey(instant, 'Asia/Makassar')).toBe('2026-11-05')
    expect(localDateKey(instant, 'Asia/Jakarta')).toBe('2026-11-04')
  })

  it('day bounds follow the store timezone', () => {
    expect(localDayStartISO('2026-11-05', 'Asia/Makassar')).toBe('2026-11-04T16:00:00.000Z')
    expect(localDayEndISO('2026-11-05', 'Asia/Jakarta')).toBe('2026-11-05T16:59:59.999Z')
  })

  it('day bounds round-trip to the same local day', () => {
    expect(localDateKey(new Date(localDayStartISO('2026-11-05')))).toBe('2026-11-05')
    expect(localDateKey(new Date(localDayEndISO('2026-11-05')))).toBe('2026-11-05')
  })
})

describe('isReturnedTransaction', () => {
  it('prefers the status column', () => {
    expect(isReturnedTransaction({ status: 'returned', notes: null })).toBe(true)
    expect(isReturnedTransaction({ status: 'completed', notes: 'pelanggan bilang [RETUR] nanti' })).toBe(false)
  })

  it('falls back to the notes prefix for rows without status', () => {
    expect(isReturnedTransaction({ notes: '[RETUR] salah barang' })).toBe(true)
    expect(isReturnedTransaction({ notes: 'catatan [RETUR]' })).toBe(false)
  })
})

describe('clampNumber', () => {
  it('clamps and handles empty input', () => {
    expect(clampNumber(150, 0, 100)).toBe(100)
    expect(clampNumber(-5, 0, 100)).toBe(0)
    expect(clampNumber('', 0, 100)).toBe(0)
    expect(clampNumber('abc', 0, 100)).toBe(0)
  })
})

describe('fetchAllRows / chunkArray', () => {
  it('pages until a short page', async () => {
    const all = Array.from({ length: 2500 }, (_, i) => i)
    const calls: number[] = []
    const rows = await fetchAllRows(async (from, to) => {
      calls.push(from)
      return { data: all.slice(from, to + 1), error: null }
    })
    expect(rows).toHaveLength(2500)
    expect(calls).toEqual([0, 1000, 2000])
  })

  it('splits arrays', () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })
})

describe('buildSalesTrend', () => {
  const pad = (n: number) => String(n).padStart(2, '0')
  // Instants in WITA, the default store timezone when no store is loaded (as in tests).
  const at = (y: number, m: number, d: number, h = 10) =>
    new Date(`${y}-${pad(m)}-${pad(d)}T${pad(h)}:00:00+08:00`).toISOString()

  it('orders days chronologically and fills days without sales', () => {
    const { unit, rows } = buildSalesTrend(
      [
        { created_at: at(2026, 10, 26), total: 3000 },
        { created_at: at(2026, 10, 24), total: 1000 },
        { created_at: at(2026, 10, 24), total: 500 },
      ],
      '2026-10-24',
      '2026-10-26',
    )
    expect(unit).toBe('day')
    expect(rows.map(r => [r.key, r.label, r.sales])).toEqual([
      ['2026-10-24', '24/10', 1500],
      ['2026-10-25', '25/10', 0],
      ['2026-10-26', '26/10', 3000],
    ])
  })

  it('groups long ranges by month, including Indonesian month names like Okt/Mei', () => {
    const { unit, rows } = buildSalesTrend(
      [
        { created_at: at(2026, 10, 17), total: 2000 },
        { created_at: at(2026, 5, 3), total: 1000 },
      ],
      '2026-01-01',
      '2026-11-05',
    )
    expect(unit).toBe('month')
    expect(rows).toHaveLength(11)
    expect(rows[4]).toMatchObject({ key: '2026-05', sales: 1000 })
    expect(rows[9]).toMatchObject({ key: '2026-10', sales: 2000 })
    expect(rows[0]!.sales).toBe(0)
  })

  it('counts a sale just after local midnight on that local day', () => {
    const { rows } = buildSalesTrend([{ created_at: at(2026, 11, 5, 0), total: 700 }], '2026-11-04', '2026-11-05')
    expect(rows.map(r => r.sales)).toEqual([0, 700])
  })
})

describe('previousPeriod', () => {
  it('today compares with yesterday', () => {
    expect(previousPeriod('2026-11-05', '2026-11-05', 'today')).toEqual({ start: '2026-11-04', end: '2026-11-04', label: 'kemarin' })
  })

  it('7 days compares with the 7 days before', () => {
    expect(previousPeriod('2026-10-30', '2026-11-05', 'week')).toEqual({ start: '2026-10-23', end: '2026-10-29', label: '7 hari sebelumnya' })
  })

  it('this month compares with the same days last month, clamped to month end', () => {
    expect(previousPeriod('2026-11-01', '2026-11-05', 'month')).toMatchObject({ start: '2026-10-01', end: '2026-10-05', label: 'bulan lalu' })
    expect(previousPeriod('2026-03-01', '2026-03-31', 'month')).toMatchObject({ start: '2026-02-01', end: '2026-02-28' })
  })

  it('this year compares with the same dates last year', () => {
    expect(previousPeriod('2026-01-01', '2026-11-05', 'year')).toMatchObject({ start: '2025-01-01', end: '2025-11-05', label: 'tahun lalu' })
  })
})

describe('percentChange', () => {
  it('rounds and handles an empty previous period', () => {
    expect(percentChange(112, 100)).toBe(12)
    expect(percentChange(80, 100)).toBe(-20)
    expect(percentChange(50, 0)).toBeNull()
  })
})

describe('groupDebtsByCustomer', () => {
  const tx = (id: string, created_at: string, total: number, paid: number, extra: Record<string, any> = {}) =>
    ({ id, transaction_number: id, created_at, total, paid, ...extra })

  it('groups by customer id, else by normalized name, biggest debt first', () => {
    const groups = groupDebtsByCustomer([
      tx('a', '2026-10-02', 10000, 4000, { customer_name: 'Bu Ani' }),
      tx('b', '2026-10-01', 5000, 0, { customer_name: ' bu  ani ' }),
      tx('c', '2026-10-03', 30000, 0, { customer_id: 'c1', customer_name: 'Pak Budi', customer_phone: '0812' }),
      tx('d', '2026-10-04', 8000, 8000, { customer_name: 'Lunas' }),
    ])
    expect(groups.map(g => [g.name, g.remaining, g.transactions.map(t => t.id)])).toEqual([
      ['Pak Budi', 30000, ['c']],
      ['bu  ani', 11000, ['b', 'a']],
    ])
    expect(groups[0]!.phone).toBe('0812')
    expect(groups[1]!.oldestAt).toBe('2026-10-01')
  })
})

describe('allocateDebtPayment', () => {
  it('pays the oldest nota first and stops when the money runs out', () => {
    expect(allocateDebtPayment([{ id: 'a', remaining: 5000 }, { id: 'b', remaining: 6000 }], 7000)).toEqual([
      { id: 'a', applied: 5000, remaining: 0 },
      { id: 'b', applied: 2000, remaining: 4000 },
    ])
  })
})

describe('moneyReceived', () => {
  it('counts installments when received and never twice', () => {
    // Sale today: total 10k, 4k at the till, later +6k installment (paid is now 10k).
    const sales = [{ id: 's1', total: 10000, paid: 10000, payment_method: 'cash' }]
    const later = new Map([['s1', 6000]])
    const installmentsToday = [
      { amount: 6000, payment_method: 'transfer' }, // the one above, paid by transfer today
      { amount: 2000, payment_method: 'cash' },     // for an older sale
    ]
    expect(moneyReceived(sales, later, installmentsToday)).toEqual({ cash: 6000, nonCash: 6000 })
  })
})
