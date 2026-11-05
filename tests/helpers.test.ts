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
