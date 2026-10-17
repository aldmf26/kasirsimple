// Cetak langsung ke printer thermal Bluetooth (ESC/POS mentah).
// Teks saja tanpa logo agar cepat di Panda/Xprinter/Goojprt/RPP02N dll.
// Device & writeChar disimpan di module-level agar tidak hilang saat pindah halaman.

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

// Daftar service UUID yang biasa digunakan printer thermal bluetooth
const BT_SERVICES = [
  0xffe0,
  0x18f0,
  0xff00,
  0x1800,
  0x1801,
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '000018f0-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2'
]

// ============================================================
// Module-level: device & writeChar bertahan selama tab terbuka.
// Ini mengatasi masalah koneksi hilang saat pindah halaman Nuxt.
// ============================================================
let _device: any = null
let _writeChar: any = null

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

  const refreshSupport = () => {
    if (process.client) {
      isSupported.value = typeof (navigator as any)?.bluetooth?.requestDevice === 'function'
      if (!deviceName.value) {
        try {
          deviceName.value = localStorage.getItem(LS_KEY) || ''
        } catch { /* abaikan */ }
      }
      // Sync isConnected dengan actual state device
      if (_device && _writeChar && _device.gatt?.connected) {
        isConnected.value = true
      } else if (isConnected.value && (!_device || !_writeChar)) {
        isConnected.value = false
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
    L.push('\n\n\n\n')
    return L.join('\n')
  }

  const buildEscPosBytes = (text: string) => {
    // ESC @ (init) + teks ASCII + feed + GS V 0 (cut)
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
    if (!dev?.gatt) throw new Error('GATT tidak tersedia pada perangkat')
    const server = dev.gatt.connected ? dev.gatt : await dev.gatt.connect()
    let services: any[] = []
    try {
      services = await server?.getPrimaryServices()
    } catch (err) {
      console.warn('Gagal getPrimaryServices():', err)
    }
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
      lastError.value = 'Browser ini belum mendukung Web Bluetooth. Gunakan Chrome di Android atau Desktop.'
      return false
    }
    connecting.value = true
    try {
      _device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: BT_SERVICES
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

  // Coba reconnect ke device yang sudah di-pair sebelumnya (tanpa popup dialog).
  const tryReconnect = async (): Promise<boolean> => {
    if (!process.client) return false

    // 1. Sudah tersambung aktif
    if (_device && _writeChar && _device.gatt?.connected) {
      isConnected.value = true
      return true
    }

    // 2. Ada _device di memori tapi gatt disconnect
    if (_device) {
      try {
        _writeChar = await findWritableChar(_device)
        isConnected.value = true
        return true
      } catch (e) {
        console.warn('Gagal reconnect GATT _device:', e)
      }
    }

    // 3. Cek browser persistent permissions getDevices() (Chrome 85+)
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
            try { localStorage.setItem(LS_KEY, deviceName.value) } catch { /* abaikan */ }
            _device.addEventListener?.('gattserverdisconnected', () => {
              isConnected.value = false
              _writeChar = null
            })
            return true
          }
        }
      }
    } catch (e) {
      console.warn('getDevices reconnect gagal:', e)
    }

    return false
  }

  const sendBytes = async (bytes: Uint8Array) => {
    // Kirim per 100 byte tanpa jeda agar nyembur langsung cepat
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

  const printReceipt = async (trx: any, store: any, paperWidth = 58) => {
    return printText(formatReceiptText(trx, store, paperWidth))
  }

  // Smart print:
  // 1. Coba reconnect otomatis tanpa dialog
  // 2. Jika belum tersambung, buka dialog pilih Bluetooth (karena ada klik user gesture)
  // 3. Setelah tersambung langsung kirim cetak nyembur!
  const smartPrint = async (
    trx: any,
    store: any,
    paperWidth = 58
  ): Promise<{ sent: boolean; bytes: number; text: string; error?: string }> => {
    let connected = await tryReconnect()

    if (!connected && isSupported.value) {
      connected = await connect()
    }

    if (!connected || !_writeChar) {
      const text = formatReceiptText(trx, store, paperWidth)
      return {
        sent: false,
        bytes: 0,
        text,
        error: lastError.value || 'Printer Bluetooth tidak tersambung'
      }
    }

    const res = await printReceipt(trx, store, paperWidth)
    return {
      sent: res.sent,
      bytes: res.bytes,
      text: res.text
    }
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
