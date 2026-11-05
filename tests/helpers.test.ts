import { describe, expect, it } from 'vitest'
import {
  chunkArray,
  clampNumber,
  fetchAllRows,
  isReturnedTransaction,
  localDateKey,
  localDayEndISO,
  localDayStartISO,
  nextTransactionNumber,
  buildSalesTrend,
  percentChange,
  previousPeriod,
} from '../app/utils/helpers'

describe('localDateKey', () => {
  it('uses the local calendar day, not the UTC one', () => {
    const lateNight = new Date(2026, 10, 5, 0, 30) // 00:30 local
    expect(localDateKey(lateNight)).toBe('2026-11-05')
  })

  it('day bounds round-trip to the same local day', () => {
    expect(localDateKey(new Date(localDayStartISO('2026-11-05')))).toBe('2026-11-05')
    expect(localDateKey(new Date(localDayEndISO('2026-11-05')))).toBe('2026-11-05')
  })
})

describe('nextTransactionNumber', () => {
  it('starts at 001', () => {
    expect(nextTransactionNumber('2026-11-05', [])).toBe('TRX-20261105-001')
  })

  it('continues after the highest number even with gaps from deleted rows', () => {
    const existing = ['TRX-20261105-001', 'TRX-20261105-007', 'TRX-20261105-003']
    expect(nextTransactionNumber('2026-11-05', existing)).toBe('TRX-20261105-008')
  })

  it('ignores other days', () => {
    expect(nextTransactionNumber('2026-11-05', ['TRX-20261104-050'])).toBe('TRX-20261105-001')
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
  const at = (y: number, m: number, d: number, h = 10) => new Date(y, m - 1, d, h).toISOString()

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
    expect(rows.map(r => [r.label, r.sales])).toEqual([['24/10', 1500], ['25/10', 0], ['26/10', 3000]])
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
