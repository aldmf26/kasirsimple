// Cetak langsung ke printer thermal Bluetooth (ESC/POS mentah).
// Teks saja tanpa logo agar cepat di Panda/Xprinter.
// Termasuk mode simulasi: tanpa printer pun bisa lihat hasil byte.

const LS_KEY = 'kasirok_bt_device'

const center = (text: string, width: number) => {
  const t = text.slice(0, width)
  const pad = Math.max(0, Math.floor((width - t.length) / 2))
  return ' '.repeat(pad) + t
}

const row = (left: string, right: string, width: number) => {
  const r = right.slice(-width)
  const l = left.slice(0, Math.max(0, width - r.length - 1))
  return (l + ' '.repeat(Math.max(1, width - l.length - r.length)) + r).slice(0, width)
}

const rupiah = (n: number) => `Rp${Math.round(n || 0).toLocaleString('id-ID')}`

export const useBluetoothPrinter = () => {
  const isSupported = useState('bt_supported', () => false)
  const isConnected = useState('bt_connected', () => false)
  const deviceName = useState<string>('bt_device_name', () => '')
  const connecting = useState('bt_connecting', () => false)
  const printing = useState('bt_printing', () => false)
  const lastError = useState<string | null>('bt_error', () => null)
  // Simulasi: teks + info byte terakhir, bisa dites tanpa printer
  const lastText = useState<string>('bt_last_text', () => '')
  const lastBytes = useState<number>('bt_last_bytes', () => 0)

  let device: any = null
  let writeChar: any = null

  const refreshSupport = () => {
    if (process.client) {
      isSupported.value = typeof (navigator as any)?.bluetooth?.requestDevice === 'function'
      if (!deviceName.value) {
        try {
          deviceName.value = localStorage.getItem(LS_KEY) || ''
        } catch { /* abaikan */ }
      }
    }
  }

  const formatReceiptText = (trx: any, store: any, paperWidth = 58) => {
    const W = paperWidth === 80 ? 48 : 32
    const L: string[] = []
    L.push(center((store?.name || 'KASIR').toUpperCase(), W))
    if (store?.address) L.push(center(String(store.address).slice(0, W), W))
    if (store?.phone) L.push(center(String(store.phone).slice(0, W), W))
    L.push('-'.repeat(W))
    L.push(row(`No:${trx?.transaction_number || trx?.id || '-'}`, new Date(trx?.created_at || Date.now()).toLocaleString('id-ID'), W))
    if (trx?.customer_name) L.push(row('Cust:', String(trx.customer_name).slice(0, W - 6), W))
    L.push('-'.repeat(W))
    for (const it of trx?.items || []) {
      const name = `${it.quantity}x ${it.product_name || it.productName || 'Item'}`
      L.push(name.slice(0, W))
      L.push(row(` ${it.quantity} x ${rupiah(it.product_price ?? it.price ?? 0)}`, rupiah((it.product_price ?? it.price ?? 0) * (it.quantity || 1)), W))
    }
    L.push('-'.repeat(W))
    L.push(row('SUBTOTAL', rupiah(trx?.subtotal ?? trx?.total ?? 0), W))
    if ((trx?.discount || 0) > 0) L.push(row('DISKON', `-${rupiah(trx.discount)}`, W))
    if ((trx?.discount_from_settings || 0) > 0) L.push(row('DISKON SISTEM', `-${rupiah(trx.discount_from_settings)}`, W))
    if ((trx?.tax || 0) > 0) L.push(row('PAJAK', `+${rupiah(trx.tax)}`, W))
    if ((trx?.ppn || 0) > 0) L.push(row('PPN', `+${rupiah(trx.ppn)}`, W))
    L.push(row('TOTAL', rupiah(trx?.total || 0), W))
    L.push(row(`BAYAR (${trx?.payment_method || 'cash'})`, rupiah(trx?.paid_amount ?? trx?.paid ?? trx?.total ?? 0), W))
    L.push(row('KEMBALI', rupiah((trx?.paid_amount ?? trx?.paid ?? trx?.total ?? 0) - (trx?.total || 0)), W))
    L.push('')
    L.push(center('Terima kasih', W))
    L.push(center('Silahkan datang kembali', W))
    L.push('\n\n\n')
    return L.join('\n')
  }

  const buildEscPosBytes = (text: string) => {
    // INIT + teks ASCII + CUT. Logo sengaja tidak dikirim (cepat).
    const clean = text.replace(/[^\x20-\x7E\nRp.,\-:()/%]/g, '')
    const enc = new TextEncoder().encode(clean)
    const out = new Uint8Array(3 + enc.length + 4)
    out[0] = 0x1b; out[1] = 0x40; out[2] = 0x0a
    out.set(enc, 3)
    out[out.length - 4] = 0x0a; out[out.length - 3] = 0x1d
    out[out.length - 2] = 0x56; out[out.length - 1] = 0x00
    return out
  }

  const findWritableChar = async (dev: any) => {
    const server = await dev.gatt?.connect()
    const services = await server?.getPrimaryServices()
    for (const svc of services || []) {
      const chars = await svc.getCharacteristics()
      for (const ch of chars) {
        if (ch.properties?.write || ch.properties?.writeWithoutResponse) return ch
      }
    }
    throw new Error('Karakteristik tulis printer tidak ketemu')
  }

  const connect = async () => {
    lastError.value = null
    if (!process.client) return false
    refreshSupport()
    if (!isSupported.value) {
      lastError.value = 'HP/browser tidak dukung Bluetooth. Pakai Chrome Android + HTTPS.'
      return false
    }
    connecting.value = true
    try {
      device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [0xffe0, 0x18f0, '0000ffe0-0000-1000-8000-00805f9b34fb', '000018f0-0000-1000-8000-00805f9b34fb']
      })
      writeChar = await findWritableChar(device)
      deviceName.value = device?.name || 'Printer Thermal'
      isConnected.value = true
      try { localStorage.setItem(LS_KEY, deviceName.value) } catch { /* abaikan */ }
      device?.addEventListener?.('gattserverdisconnected', () => { isConnected.value = false })
      return true
    } catch (e: any) {
      lastError.value = e?.message || 'Gagal sambung Bluetooth'
      isConnected.value = false
      return false
    } finally {
      connecting.value = false
    }
  }

  const sendBytes = async (bytes: Uint8Array) => {
    // Kirim per 100 byte tanpa jeda agar nyembur, bukan step-by-step.
    const CHUNK = 100
    for (let i = 0; i < bytes.length; i += CHUNK) {
      const part = bytes.slice(i, i + CHUNK)
      if (writeChar?.writeValueWithoutResponse) await writeChar.writeValueWithoutResponse(part)
      else await writeChar?.writeValue(part)
    }
  }

  const printText = async (text: string) => {
    const bytes = buildEscPosBytes(text)
    lastText.value = text
    lastBytes.value = bytes.length
    if (!isConnected.value || !writeChar) return { sent: false as const, bytes: bytes.length, text }
    printing.value = true
    try {
      await sendBytes(bytes)
      return { sent: true as const, bytes: bytes.length, text }
    } finally {
      printing.value = false
    }
  }

  const printReceipt = async (trx: any, store: any, paperWidth = 58) => {
    return printText(formatReceiptText(trx, store, paperWidth))
  }

  const printTest = async (store: any) => {
    return printText(formatReceiptText({
      transaction_number: 'TEST-001',
      created_at: new Date().toISOString(),
      items: [{ product_name: 'Tes Cetak', product_price: 10000, quantity: 1 }],
      subtotal: 10000, total: 10000, paid_amount: 10000, payment_method: 'cash'
    }, store || { name: 'Tes Printer' }, 58))
  }

  const disconnect = () => {
    try { device?.gatt?.disconnect?.() } catch { /* abaikan */ }
    isConnected.value = false
    writeChar = null
  }

  if (process.client) refreshSupport()

  return {
    isSupported, isConnected, deviceName, connecting, printing,
    lastError, lastText, lastBytes,
    connect, disconnect, printReceipt, printTest, printText,
    formatReceiptText, buildEscPosBytes, refreshSupport
  }
}
