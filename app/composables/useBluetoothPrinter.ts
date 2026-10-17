// Cetak langsung ke printer thermal Bluetooth (ESC/POS mentah).
// Format 100% identik dengan preview ThermalPrinterReceipt.vue
// Dilengkapi ESC/POS bold (tebal), center alignment hardware, dan penataan kolom rapi.
import { formatCurrency, formatDateTime } from '~/utils/helpers'

const LS_KEY = 'kasirok_bt_device'

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

// Helper pembuat ESC/POS byte array
class EscPosBuilder {
  private buffer: number[] = []

  init() {
    this.buffer.push(0x1b, 0x40) // ESC @ (Inisialisasi)
    this.buffer.push(0x1b, 0x45, 0x01) // ESC E 1 (Bold / Emphasized ON agar tebal & pekat)
    return this
  }

  alignCenter() {
    this.buffer.push(0x1b, 0x61, 0x01) // ESC a 1 (Tengah)
    return this
  }

  alignLeft() {
    this.buffer.push(0x1b, 0x61, 0x00) // ESC a 0 (Kiri)
    return this
  }

  alignRight() {
    this.buffer.push(0x1b, 0x61, 0x02) // ESC a 2 (Kanan)
    return this
  }

  bold(on = true) {
    this.buffer.push(0x1b, 0x45, on ? 0x01 : 0x00) // ESC E n
    return this
  }

  doubleHeight(on = true) {
    this.buffer.push(0x1d, 0x21, on ? 0x01 : 0x00) // GS ! 1 (Tinggi 2x)
    return this
  }

  text(str: string) {
    // Bersihkan karakter non-ASCII agar printer tidak mencetak karakter aneh
    const clean = str.replace(/[^\x20-\x7E\n]/g, ' ')
    const enc = new TextEncoder().encode(clean)
    for (let i = 0; i < enc.length; i++) {
      this.buffer.push(enc[i])
    }
    return this
  }

  line(str = '') {
    this.text(str + '\n')
    return this
  }

  feed(lines = 3) {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0a)
    }
    return this
  }

  cut() {
    this.buffer.push(0x1d, 0x56, 0x00) // GS V 0 (Cut)
    return this
  }

  toBytes(): Uint8Array {
    return new Uint8Array(this.buffer)
  }
}

// Format baris dua kolom (Kiri dan Kanan)
const makeRow = (left: string, right: string, width = 32): string => {
  const l = (left || '').trim()
  const r = (right || '').trim()
  const maxLeft = width - r.length - 1

  if (maxLeft <= 0) {
    return `${l}\n${' '.repeat(Math.max(0, width - r.length))}${r}`
  }

  if (l.length > maxLeft) {
    return `${l.slice(0, maxLeft)} ${r}`
  }

  const spaces = Math.max(1, width - l.length - r.length)
  return `${l}${' '.repeat(spaces)}${r}`
}

// Label metode pembayaran (sama seperti ThermalPrinterReceipt.vue)
const getPaymentMethodLabel = (method: string): string => {
  const m = (method || '').toLowerCase()
  if (m === 'cash') return 'Tunai'
  if (m === 'qris') return 'QRIS'
  if (m === 'card') return 'Kartu'
  if (m === 'transfer') return 'Transfer'
  return method ? method.toUpperCase() : 'Tunai'
}

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

  // Buat byte ESC/POS langsung dengan format yang sama persis dengan ThermalPrinterReceipt.vue
  const buildReceiptEscPos = (trx: any, store: any, settings: any = {}): { bytes: Uint8Array; textPreview: string } => {
    const paperWidth = Number(settings?.paper_width || settings?.paperWidth || (typeof settings === 'number' ? settings : 58))
    const W = paperWidth === 80 ? 48 : 32
    const divider = '-'.repeat(W)

    const showStoreInfo = settings?.include_store_info !== undefined
      ? Boolean(settings.include_store_info)
      : (settings?.includeStoreInfo !== undefined ? Boolean(settings.includeStoreInfo) : true)

    const footerText = settings?.footer_text || settings?.footerText || ''

    const builder = new EscPosBuilder().init()
    const textLines: string[] = []

    // 1. HEADER (CENTER)
    builder.alignCenter()
    builder.doubleHeight(true).bold(true)
    const storeTitle = (store?.name || 'Kasir Simple').toUpperCase()
    builder.line(storeTitle)
    textLines.push(storeTitle)
    builder.doubleHeight(false)

    if (showStoreInfo) {
      builder.bold(false)
      if (store?.address) {
        builder.line(String(store.address).slice(0, W))
        textLines.push(String(store.address).slice(0, W))
      }
      if (store?.phone) {
        builder.line(String(store.phone).slice(0, W))
        textLines.push(String(store.phone).slice(0, W))
      }
    }

    // Tanggal & Waktu (Baris tersendiri, center, format sama dengan preview)
    const dateTimeStr = formatDateTime(trx?.created_at || new Date().toISOString())
    builder.bold(false)
    builder.line(dateTimeStr)
    textLines.push(dateTimeStr)

    // Nomor Transaksi (Baris tersendiri, center)
    const trxNo = `No: ${trx?.transaction_number || trx?.id || '-'}`
    builder.line(trxNo)
    textLines.push(trxNo)

    // Customer Name (jika ada)
    if (trx?.customer_name) {
      const custStr = `Customer: ${trx.customer_name}`
      builder.line(custStr)
      textLines.push(custStr)
    }

    // Divider
    builder.line(divider)
    textLines.push(divider)

    // 2. ITEMS (LEFT)
    builder.alignLeft()
    const items = trx?.items || []
    for (const item of items) {
      const qty = Number(item.quantity || 1)
      const name = String(item.product_name || item.name || 'Produk').trim()
      const price = Number(item.product_price ?? item.price ?? 0)
      const subtotal = Number(item.subtotal ?? (price * qty))

      // Baris 1: "[qty]x [Nama Produk]" di kiri, "[Subtotal Item]" di kanan
      const itemTitle = `${qty}x ${name}`
      const itemSubtotalStr = formatCurrency(subtotal)
      const row1 = makeRow(itemTitle, itemSubtotalStr, W)
      builder.bold(true).line(row1)
      textLines.push(row1)

      // Baris 2: Detail harga satuan "[qty] pcs x [Harga]" (indent 2 spasi)
      const row2 = `  ${qty} pcs x ${formatCurrency(price)}`
      builder.bold(false).line(row2.slice(0, W))
      textLines.push(row2.slice(0, W))
    }

    // Divider
    builder.line(divider)
    textLines.push(divider)

    // 3. SUMMARY
    builder.bold(true)

    // Subtotal
    const subtotalRow = makeRow('SUBTOTAL', formatCurrency(Number(trx?.subtotal ?? trx?.total ?? 0)), W)
    builder.line(subtotalRow)
    textLines.push(subtotalRow)

    // Diskon Manual
    if (Number(trx?.discount || 0) > 0) {
      const discRow = makeRow('DISKON MANUAL', `-${formatCurrency(Number(trx.discount))}`, W)
      builder.line(discRow)
      textLines.push(discRow)
    }

    // Diskon Sistem
    if (Number(trx?.discount_from_settings || 0) > 0) {
      const discSysRow = makeRow('DISKON SISTEM', `-${formatCurrency(Number(trx.discount_from_settings))}`, W)
      builder.line(discSysRow)
      textLines.push(discSysRow)
    }

    // Pajak
    if (Number(trx?.tax || 0) > 0) {
      const taxPercent = trx?.tax_percentage ? ` (${trx.tax_percentage}%)` : ''
      const taxRow = makeRow(`PAJAK${taxPercent}`, `+${formatCurrency(Number(trx.tax))}`, W)
      builder.line(taxRow)
      textLines.push(taxRow)
    }

    // PPN
    if (Number(trx?.ppn || 0) > 0) {
      const ppnPercent = trx?.ppn_percentage ? ` (${trx.ppn_percentage}%)` : ''
      const ppnRow = makeRow(`PPN${ppnPercent}`, `+${formatCurrency(Number(trx.ppn))}`, W)
      builder.line(ppnRow)
      textLines.push(ppnRow)
    }

    // TOTAL (Tebal & sedikit lebih besar)
    builder.line('-'.repeat(W))
    const totalRow = makeRow('TOTAL', formatCurrency(Number(trx?.total || 0)), W)
    builder.doubleHeight(true).line(totalRow)
    builder.doubleHeight(false)
    textLines.push(totalRow)

    // BAYAR
    const methodLabel = getPaymentMethodLabel(trx?.payment_method)
    const paidAmount = Number(trx?.paid_amount || trx?.paid || trx?.total || 0)
    const bayarRow = makeRow(`BAYAR (${methodLabel})`, formatCurrency(paidAmount), W)
    builder.line(bayarRow)
    textLines.push(bayarRow)

    // KEMBALI
    const totalNum = Number(trx?.total || 0)
    const changeAmount = Math.max(0, paidAmount - totalNum)
    const kembaliRow = makeRow('KEMBALI', formatCurrency(changeAmount), W)
    builder.line(kembaliRow)
    textLines.push(kembaliRow)

    // 4. FOOTER (CENTER)
    builder.bold(false).alignCenter()
    builder.feed(1)
    if (footerText) {
      const footerLines = String(footerText).split('\n')
      for (const fl of footerLines) {
        if (fl.trim()) {
          builder.line(fl.trim().slice(0, W))
          textLines.push(fl.trim().slice(0, W))
        }
      }
    } else {
      builder.line('Terima Kasih')
      builder.line('Silahkan Datang Kembali')
      textLines.push('Terima Kasih')
      textLines.push('Silahkan Datang Kembali')
    }

    // 5. FEED KERTAS AGAR TIDAK TERPOTONG DI CUTTER
    builder.feed(4)
    if (paperWidth === 80) {
      builder.cut()
    }

    return {
      bytes: builder.toBytes(),
      textPreview: textLines.join('\n')
    }
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
      } catch { /* abaikan */ }
    }
    throw new Error('Karakteristik tulis printer tidak ketemu')
  }

  const connect = async (): Promise<boolean> => {
    lastError.value = null
    if (!process.client) return false
    refreshSupport()
    if (!isSupported.value) {
      lastError.value = 'Browser belum mendukung Web Bluetooth. Gunakan Chrome di Android atau Desktop.'
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

  const printReceipt = async (trx: any, store: any, settings: any = {}) => {
    const { bytes, textPreview } = buildReceiptEscPos(trx, store, settings)
    lastText.value = textPreview
    lastBytes.value = bytes.length

    if (!isConnected.value || !_writeChar) {
      return { sent: false as const, bytes: bytes.length, text: textPreview }
    }

    printing.value = true
    try {
      await sendBytes(bytes)
      return { sent: true as const, bytes: bytes.length, text: textPreview }
    } finally {
      printing.value = false
    }
  }

  // Smart print:
  // 1. Coba reconnect otomatis tanpa dialog
  // 2. Jika belum tersambung, buka dialog pilih Bluetooth (karena ada klik user gesture)
  // 3. Setelah tersambung langsung kirim cetak nyembur!
  const smartPrint = async (
    trx: any,
    store: any,
    settings: any = {}
  ): Promise<{ sent: boolean; bytes: number; text: string; error?: string }> => {
    let connected = await tryReconnect()

    if (!connected && isSupported.value) {
      connected = await connect()
    }

    const { bytes, textPreview } = buildReceiptEscPos(trx, store, settings)
    lastText.value = textPreview
    lastBytes.value = bytes.length

    if (!connected || !_writeChar) {
      return {
        sent: false,
        bytes: 0,
        text: textPreview,
        error: lastError.value || 'Printer Bluetooth tidak tersambung'
      }
    }

    printing.value = true
    try {
      await sendBytes(bytes)
      return {
        sent: true,
        bytes: bytes.length,
        text: textPreview
      }
    } catch (e: any) {
      return {
        sent: false,
        bytes: bytes.length,
        text: textPreview,
        error: e?.message || 'Gagal mengirim data ke printer'
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
    printReceipt, printTest,
    buildReceiptEscPos, refreshSupport
  }
}
