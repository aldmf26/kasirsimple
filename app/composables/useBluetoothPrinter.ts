// Cetak langsung ke printer thermal Bluetooth (ESC/POS mentah).
// Dilengkapi chunk transmission aman (40 byte + delay 35ms) untuk mencegah packet loss buffer overflow.
// Device & writeChar disimpan di module-level agar tidak hilang saat pindah halaman.

const LS_KEY = 'kasirok_bt_device'

const center = (text: string, width: number) => {
  const t = (text || '').trim().slice(0, width)
  const pad = Math.max(0, Math.floor((width - t.length) / 2))
  return ' '.repeat(pad) + t
}

const row = (left: string, right: string, width: number) => {
  const r = (right || '').trim()
  const l = (left || '').trim()
  const maxLeft = width - r.length - 1
  if (l.length > maxLeft) {
    return l.slice(0, maxLeft) + ' ' + r
  }
  const spaces = Math.max(1, width - l.length - r.length)
  return l + ' '.repeat(spaces) + r
}

const rupiah = (n: number) => `Rp${Math.round(n || 0).toLocaleString('id-ID')}`

// Format tanggal & waktu
const formatDateTime = (dateVal: any) => {
  try {
    const d = new Date(dateVal || Date.now())
    const dateStr = d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    const timeStr = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    }).replace(':', '.')
    return `${dateStr}, ${timeStr}`
  } catch {
    return String(dateVal || '')
  }
}

// Module-level device & writeChar
let _device: any = null
let _writeChar: any = null

export const useBluetoothPrinter = () => {
  const isSupported = useState('bt_supported', () => false)
  const isConnected = useState('bt_connected', () => false)
  const deviceName = useState<string>('bt_device_name', () => '')
  const connecting = useState('bt_connecting', () => false)
  const printing = useState('bt_printing', () => false)
  const lastError = useState<string | null>('bt_error', () => null)
  const lastText = useState<string>('bt_last_text', () => '')
  const lastBytes = useState<number>('bt_last_bytes', () => 0)

  const refreshSupport = () => {
    if (process.client) {
      isSupported.value = typeof (navigator as any)?.bluetooth?.requestDevice === 'function'
      if (!deviceName.value) {
        try {
          deviceName.value = localStorage.getItem(LS_KEY) || ''
        } catch { /* abaikan */ }
      }
      if (_device && _writeChar && _device.gatt?.connected) {
        isConnected.value = true
      } else if (isConnected.value && (!_device || !_writeChar)) {
        isConnected.value = false
      }
    }
  }

  const formatReceiptText = (trx: any, store: any, settings: any = {}) => {
    const paperWidth = Number(settings?.paper_width || settings?.paperWidth || (typeof settings === 'number' ? settings : 58))
    const W = paperWidth === 80 ? 48 : 32
    const divider = '-'.repeat(W)
    const L: string[] = []

    // 1. Header Toko
    L.push(center((store?.name || 'Kasir Simple').toUpperCase(), W))
    if (store?.address) L.push(center(String(store.address).slice(0, W), W))
    if (store?.phone) L.push(center(String(store.phone).slice(0, W), W))
    L.push(divider)

    // 2. Tanggal & No Struk (masing-masing 1 baris di tengah agar utuh)
    L.push(center(formatDateTime(trx?.created_at), W))
    L.push(center(`No: ${trx?.transaction_number || trx?.id || '-'}`, W))
    if (trx?.customer_name) {
      L.push(center(`Cust: ${trx.customer_name}`, W))
    }
    L.push(divider)

    // 3. Daftar Produk (Baris 1: Nama & Subtotal, Baris 2: Qty x Harga Satuan)
    for (const it of trx?.items || []) {
      const qty = Number(it.quantity || 1)
      const rawName = String(it.product_name || it.productName || it.name || 'Item').replace(/\r/g, '').trim()
      const nameParts = rawName.split('\n')
      const primaryName = nameParts[0].trim()
      const price = Number(it.product_price ?? it.price ?? 0)
      const subtotal = Number(it.subtotal ?? (price * qty))

      // Baris 1: Nama dan Subtotal
      L.push(row(`${qty}x ${primaryName}`, rupiah(subtotal), W))

      // Keterangan tambahan jika ada newline di nama
      for (let p = 1; p < nameParts.length; p++) {
        const sub = nameParts[p].trim()
        if (sub) L.push(`  ${sub}`.slice(0, W))
      }

      // Baris 2: Rincian harga satuan
      L.push(`  ${qty} pcs x ${rupiah(price)}`.slice(0, W))
    }
    L.push(divider)

    // 4. Subtotal, Diskon, Pajak
    L.push(row('SUBTOTAL', rupiah(Number(trx?.subtotal ?? trx?.total ?? 0)), W))
    if (Number(trx?.discount || 0) > 0) {
      L.push(row('DISKON MANUAL', `-${rupiah(Number(trx.discount))}`, W))
    }
    if (Number(trx?.discount_from_settings || 0) > 0) {
      L.push(row('DISKON SISTEM', `-${rupiah(Number(trx.discount_from_settings))}`, W))
    }
    if (Number(trx?.tax || 0) > 0) {
      const taxLabel = trx?.tax_percentage ? `PAJAK (${trx.tax_percentage}%)` : 'PAJAK'
      L.push(row(taxLabel, `+${rupiah(Number(trx.tax))}`, W))
    }
    if (Number(trx?.ppn || 0) > 0) {
      const ppnLabel = trx?.ppn_percentage ? `PPN (${trx.ppn_percentage}%)` : 'PPN'
      L.push(row(ppnLabel, `+${rupiah(Number(trx.ppn))}`, W))
    }

    // 5. Total, Bayar, Kembali
    const total = Number(trx?.total || 0)
    L.push(row('TOTAL', rupiah(total), W))

    const method = String(trx?.payment_method || 'cash').toLowerCase()
    const methodLabel = method === 'cash' ? 'Tunai' : method === 'qris' ? 'QRIS' : method === 'card' ? 'Kartu' : method === 'transfer' ? 'Transfer' : method.toUpperCase()
    const paid = Number(trx?.paid_amount || trx?.paid || total)
    L.push(row(`BAYAR (${methodLabel})`, rupiah(paid), W))

    const change = Math.max(0, paid - total)
    L.push(row('KEMBALI', rupiah(change), W))

    // 6. Footer
    L.push('')
    const footer = settings?.footer_text || settings?.footerText || ''
    if (footer) {
      const flines = String(footer).replace(/\r/g, '').split('\n')
      for (const fl of flines) {
        if (fl.trim()) L.push(center(fl.trim(), W))
      }
    } else {
      L.push(center('Terima kasih', W))
      L.push(center('Silahkan datang kembali', W))
    }

    L.push('\n\n\n')
    return L.join('\n')
  }

  // Encoding ESC/POS teks murni
  const buildEscPosBytes = (text: string) => {
    const clean = text.replace(/[^\x20-\x7E\nRp.,\-:()/%]/g, ' ')
    const enc = new TextEncoder().encode(clean)
    const out = new Uint8Array(3 + enc.length + 4)
    out[0] = 0x1b
    out[1] = 0x40 // ESC @ (Reset)
    out[2] = 0x0a // LF
    out.set(enc, 3)
    out[out.length - 4] = 0x0a
    out[out.length - 3] = 0x1d // GS
    out[out.length - 2] = 0x56 // V
    out[out.length - 1] = 0x00 // 0 (Cut / Feed finish)
    return out
  }

  const findWritableChar = async (dev: any) => {
    if (!dev?.gatt) throw new Error('GATT tidak tersedia')
    const server = dev.gatt.connected ? dev.gatt : await dev.gatt.connect()
    const services = await server?.getPrimaryServices()
    for (const svc of services || []) {
      try {
        const chars = await svc.getCharacteristics()
        for (const ch of chars) {
          if (ch.properties?.write || ch.properties?.writeWithoutResponse) return ch
        }
      } catch { /* abaikan error per service */ }
    }
    throw new Error('Karakteristik tulis printer tidak ketemu')
  }

  const connect = async () => {
    lastError.value = null
    if (!process.client) return false
    refreshSupport()
    if (!isSupported.value) {
      lastError.value = 'HP/browser tidak dukung Bluetooth. Pakai Chrome Android.'
      return false
    }
    connecting.value = true
    try {
      _device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [0xffe0, 0x18f0, '0000ffe0-0000-1000-8000-00805f9b34fb', '000018f0-0000-1000-8000-00805f9b34fb']
      })
      _writeChar = await findWritableChar(_device)
      deviceName.value = _device?.name || 'Printer Thermal'
      isConnected.value = true
      try { localStorage.setItem(LS_KEY, deviceName.value) } catch { /* abaikan */ }
      _device?.addEventListener?.('gattserverdisconnected', () => {
        isConnected.value = false
        _writeChar = null
      })
      return true
    } catch (e: any) {
      lastError.value = e?.message || 'Gagal sambung Bluetooth'
      isConnected.value = false
      return false
    } finally {
      connecting.value = false
    }
  }

  const tryReconnect = async (): Promise<boolean> => {
    if (!process.client) return false
    if (_device && _writeChar && _device.gatt?.connected) {
      isConnected.value = true
      return true
    }
    if (_device) {
      try {
        _writeChar = await findWritableChar(_device)
        isConnected.value = true
        return true
      } catch {
        /* coba getDevices */
      }
    }
    try {
      if (typeof (navigator as any)?.bluetooth?.getDevices === 'function') {
        const devices = await (navigator as any).bluetooth.getDevices()
        if (devices && devices.length > 0) {
          const savedName = deviceName.value || localStorage.getItem(LS_KEY)
          const target = (savedName ? devices.find((d: any) => d.name === savedName) : null) || devices[0]
          if (target) {
            _device = target
            _writeChar = await findWritableChar(_device)
            deviceName.value = _device.name || 'Printer Thermal'
            isConnected.value = true
            _device.addEventListener?.('gattserverdisconnected', () => {
              isConnected.value = false
              _writeChar = null
            })
            return true
          }
        }
      }
    } catch {
      /* abaikan */
    }
    return false
  }

  // Pengiriman byte terbagi per 30-40 byte dengan delay 35ms untuk mencegah BLE buffer overrun
  const sendBytes = async (bytes: Uint8Array) => {
    const CHUNK = 40
    for (let i = 0; i < bytes.length; i += CHUNK) {
      const part = bytes.slice(i, i + CHUNK)
      try {
        if (_writeChar?.writeValue) {
          await _writeChar.writeValue(part)
        } else if (_writeChar?.writeValueWithoutResponse) {
          await _writeChar.writeValueWithoutResponse(part)
        }
      } catch {
        if (_writeChar?.writeValueWithoutResponse) {
          await _writeChar.writeValueWithoutResponse(part)
        }
      }
      // Delay 35ms agar printer thermal BLE sempat memproses data tanpa kehilangan karakter
      await new Promise(resolve => setTimeout(resolve, 35))
    }
  }

  const printText = async (text: string) => {
    const bytes = buildEscPosBytes(text)
    lastText.value = text
    lastBytes.value = bytes.length
    if (!isConnected.value || !_writeChar) return { sent: false as const, bytes: bytes.length, text }
    printing.value = true
    try {
      await sendBytes(bytes)
      return { sent: true as const, bytes: bytes.length, text }
    } finally {
      printing.value = false
    }
  }

  const printReceipt = async (trx: any, store: any, settings: any = {}) => {
    return printText(formatReceiptText(trx, store, settings))
  }

  const smartPrint = async (
    trx: any,
    store: any,
    settings: any = {}
  ): Promise<{ sent: boolean; bytes: number; text: string; error?: string }> => {
    let connected = await tryReconnect()

    if (!connected && isSupported.value) {
      connected = await connect()
    }

    const text = formatReceiptText(trx, store, settings)
    const bytes = buildEscPosBytes(text)
    lastText.value = text
    lastBytes.value = bytes.length

    if (!connected || !_writeChar) {
      return {
        sent: false,
        bytes: 0,
        text,
        error: lastError.value || 'Printer Bluetooth tidak tersambung'
      }
    }

    printing.value = true
    try {
      await sendBytes(bytes)
      return {
        sent: true,
        bytes: bytes.length,
        text
      }
    } catch (e: any) {
      return {
        sent: false,
        bytes: bytes.length,
        text,
        error: e?.message || 'Gagal mengirim ke printer'
      }
    } finally {
      printing.value = false
    }
  }

  const printTest = async (store: any, settings: any = {}) => {
    return printReceipt({
      transaction_number: 'TEST-001',
      created_at: new Date().toISOString(),
      items: [
        { product_name: 'Nasi Goreng', product_price: 13000, quantity: 1, subtotal: 13000 },
        { product_name: 'Telur Ceplok', product_price: 15000, quantity: 1, subtotal: 15000 }
      ],
      subtotal: 28000,
      total: 28000,
      paid_amount: 28000,
      payment_method: 'qris'
    }, store || { name: 'Kasir Simple' }, settings)
  }

  const disconnect = () => {
    try { _device?.gatt?.disconnect?.() } catch { /* abaikan */ }
    isConnected.value = false
    _writeChar = null
  }

  if (process.client) refreshSupport()

  return {
    isSupported, isConnected, deviceName, connecting, printing,
    lastError, lastText, lastBytes,
    connect, disconnect, tryReconnect, smartPrint,
    printReceipt, printTest, printText,
    formatReceiptText, buildEscPosBytes, refreshSupport
  }
}
