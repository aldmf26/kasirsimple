// Cetak langsung ke printer thermal Bluetooth (ESC/POS mentah).
// Teks bersih tanpa perintah biner aneh agar aman di semua printer thermal (Panda, Xprinter, RPP02N, dll).
// Device & writeChar disimpan di module-level agar tidak hilang saat pindah halaman.

const LS_KEY = 'kasirok_bt_device'

// Format rata tengah dengan spasi string murni
const center = (text: string, width: number) => {
  const t = (text || '').trim().slice(0, width)
  const pad = Math.max(0, Math.floor((width - t.length) / 2))
  return ' '.repeat(pad) + t
}

// Format dua kolom (rata kiri dan kanan sempurna)
const row = (left: string, right: string, width: number) => {
  const l = (left || '').trim()
  const r = (right || '').trim()
  const maxLeft = width - r.length - 1
  if (l.length > maxLeft) {
    return l.slice(0, maxLeft) + ' ' + r
  }
  const spaces = Math.max(1, width - l.length - r.length)
  return l + ' '.repeat(spaces) + r
}

const rupiah = (n: number) => `Rp${Math.round(n || 0).toLocaleString('id-ID')}`

// Format tanggal bersih
const formatDateSimple = (d: any) => {
  try {
    const date = new Date(d || Date.now())
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ', ' + date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return String(d || '')
  }
}

// Module-level: device & writeChar bertahan selama tab terbuka
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

  // Format teks struk - rapi, presisi, 100% konsisten dengan preview
  const formatReceiptText = (trx: any, store: any, settings: any = {}) => {
    const paperWidth = Number(settings?.paper_width || settings?.paperWidth || (typeof settings === 'number' ? settings : 58))
    const W = paperWidth === 80 ? 48 : 32
    const divider = '-'.repeat(W)
    const L: string[] = []

    // 1. NAMA TOKO (CENTER)
    L.push(center((store?.name || 'Kasir Simple').toUpperCase(), W))

    // Info toko (alamat & telp) jika diizinkan
    const showStoreInfo = settings?.include_store_info !== undefined
      ? Boolean(settings.include_store_info)
      : (settings?.includeStoreInfo !== undefined ? Boolean(settings.includeStoreInfo) : true)

    if (showStoreInfo) {
      if (store?.address) L.push(center(String(store.address).slice(0, W), W))
      if (store?.phone) L.push(center(String(store.phone).slice(0, W), W))
    }

    // 2. TANGGAL & NO TRANSAKSI (Masing-masing baris tersendiri di tengah)
    const dateStr = formatDateSimple(trx?.created_at)
    L.push(center(dateStr, W))

    const trxNo = `No: ${trx?.transaction_number || trx?.id || '-'}`
    L.push(center(trxNo, W))

    if (trx?.customer_name) {
      L.push(center(`Customer: ${trx.customer_name}`, W))
    }

    L.push(divider)

    // 3. DAFTAR PRODUK (Dua baris per item agar harga satuan & subtotal jelas)
    const items = trx?.items || []
    for (const it of items) {
      const qty = Number(it.quantity || 1)
      const name = String(it.product_name || it.name || 'Produk').trim()
      const price = Number(it.product_price ?? it.price ?? 0)
      const subtotal = Number(it.subtotal ?? (price * qty))

      // Baris 1: "[qty]x [Nama Produk]" di kiri, "[Subtotal]" di kanan
      L.push(row(`${qty}x ${name}`, rupiah(subtotal), W))
      // Baris 2: "[qty] pcs x [Harga]" (indent 2 spasi)
      L.push(`  ${qty} pcs x ${rupiah(price)}`.slice(0, W))
    }

    L.push(divider)

    // 4. SUMMARY (Subtotal, Diskon, Pajak, Total, Bayar, Kembali)
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

    L.push(divider)

    // Total
    const totalNum = Number(trx?.total || 0)
    L.push(row('TOTAL', rupiah(totalNum), W))

    // Bayar (QRIS/Tunai/Transfer tidak akan Rp0)
    const m = (trx?.payment_method || '').toLowerCase()
    const methodLabel = m === 'cash' ? 'Tunai' : m === 'qris' ? 'QRIS' : m === 'card' ? 'Kartu' : m === 'transfer' ? 'Transfer' : (trx?.payment_method || 'Tunai')
    const paidAmount = Number(trx?.paid_amount || trx?.paid || totalNum)
    L.push(row(`BAYAR (${methodLabel})`, rupiah(paidAmount), W))

    // Kembali
    const changeAmount = Math.max(0, paidAmount - totalNum)
    L.push(row('KEMBALI', rupiah(changeAmount), W))

    // 5. FOOTER
    L.push('')
    const footer = settings?.footer_text || settings?.footerText || ''
    if (footer) {
      const lines = String(footer).split('\n')
      for (const line of lines) {
        if (line.trim()) L.push(center(line.trim(), W))
      }
    } else {
      L.push(center('Terima kasih', W))
      L.push(center('Silahkan datang kembali', W))
    }

    // 6. FEED KERTAS (3 baris kosong agar struk keluar dari pemotong)
    L.push('\n\n\n')

    return L.join('\n')
  }

  // Konversi teks ke byte ESC/POS:
  // HANYA ESC @ (Inisialisasi) + Teks ASCII murni.
  // TANPA perintah Cut (0x1D 0x56) yang membuat printer 58mm berputar tanpa henti!
  const buildEscPosBytes = (text: string) => {
    const clean = text.replace(/[^\x20-\x7E\nRp.,\-:()/%]/g, ' ')
    const enc = new TextEncoder().encode(clean)
    const out = new Uint8Array(2 + enc.length)
    out[0] = 0x1b
    out[1] = 0x40 // ESC @ (Reset/Init)
    out.set(enc, 2)
    return out
  }

  const findWritableChar = async (dev: any) => {
    if (!dev?.gatt) throw new Error('GATT tidak tersedia pada perangkat')
    const server = dev.gatt.connected ? dev.gatt : await dev.gatt.connect()
    const services = await server?.getPrimaryServices()
    for (const svc of services || []) {
      try {
        const chars = await svc.getCharacteristics()
        for (const ch of chars) {
          if (ch.properties?.writeWithoutResponse || ch.properties?.write) return ch
        }
      } catch { /* abaikan error per service */ }
    }
    throw new Error('Karakteristik tulis printer tidak ketemu')
  }

  const connect = async (): Promise<boolean> => {
    lastError.value = null
    if (!process.client) return false
    refreshSupport()
    if (!isSupported.value) {
      lastError.value = 'Browser belum mendukung Web Bluetooth. Gunakan Chrome di Android atau Windows.'
      return false
    }
    connecting.value = true
    try {
      _device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [0xffe0, 0x18f0, 0xff00, 0x1800, 0x1801, '0000ffe0-0000-1000-8000-00805f9b34fb', '000018f0-0000-1000-8000-00805f9b34fb']
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
        /* gagal reconnect device existing */
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
            try { localStorage.setItem(LS_KEY, deviceName.value) } catch {}
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

  const sendBytes = async (bytes: Uint8Array) => {
    const CHUNK = 100
    for (let i = 0; i < bytes.length; i += CHUNK) {
      const part = bytes.slice(i, i + CHUNK)
      if (_writeChar?.writeValueWithoutResponse) {
        await _writeChar.writeValueWithoutResponse(part)
      } else if (_writeChar?.writeValue) {
        await _writeChar.writeValue(part)
      }
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
    const text = formatReceiptText(trx, store, settings)
    return printText(text)
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
