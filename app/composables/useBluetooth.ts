import { ref } from 'vue'

export const useBluetooth = () => {
    const isScanning = ref(false)
    const devices = ref<any[]>([])
    const connectedDevice = ref<any | null>(null)
    const error = ref<string | null>(null)

    const scanDevices = async () => {
        if (!process.client) return

        if (!navigator.bluetooth) {
            error.value = 'Bluetooth tidak didukung di browser ini. Gunakan Chrome atau Edge melalui HTTPS.'
            return null
        }

        isScanning.value = true
        error.value = null

        try {
            // Kita mencari device yang memiliki service printer umum
            // Banyak printer thermal menggunakan 18f0 atau generic access
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [
                    '000018f0-0000-1000-8000-00805f9b34fb', // Generic
                    '49535343-fe7d-411e-8b1a-053084052511', // ISSC
                    'e7810a71-73ae-499d-8c15-faa9aef0c3f2'  // POS
                ]
            })

            const deviceInfo = {
                id: device.id,
                name: device.name || 'Unknown Device',
                device: device
            }

            if (!devices.value.find(d => d.id === device.id)) {
                devices.value.push(deviceInfo)
            }

            return deviceInfo
        } catch (e: any) {
            console.error('Bluetooth error:', e)
            if (e.name !== 'NotFoundError') {
                error.value = 'Gagal memindai perangkat: ' + e.message
            }
            return null
        } finally {
            isScanning.value = false
        }
    }

    const connectToDevice = async (deviceInfo: any) => {
        try {
            const device = deviceInfo.device
            if (!device) throw new Error('Perangkat tidak valid')

            const server = await device.gatt.connect()
            connectedDevice.value = deviceInfo
            return server
        } catch (e: any) {
            console.error('Connection error:', e)
            error.value = 'Gagal menyambung: ' + e.message
            return null
        }
    }

    const print = async (data: string | Uint8Array) => {
        if (!process.client) return false

        try {
            if (!connectedDevice.value?.device) {
                // Try to reconnect if we have an address
                const { printerSettings } = useStore()
                if (printerSettings.value?.bluetooth_device_address) {
                    // This is complex because requestDevice is needed first time
                    // but some browsers allow reconnecting to already paired devices
                    error.value = 'Perangkat tidak tersambung. Harap scan ulang.'
                    return false
                }
                error.value = 'Printer belum tersambung'
                return false
            }

            const device = connectedDevice.value.device
            if (!device.gatt.connected) {
                await device.gatt.connect()
            }

            const service = await device.gatt.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb')
            const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb')

            const encoder = new TextEncoder()
            const bytes = typeof data === 'string' ? encoder.encode(data) : data

            // ESC/POS usually needs chunks for large receipts
            const chunkSize = 20
            for (let i = 0; i < bytes.length; i += chunkSize) {
                await characteristic.writeValue(bytes.slice(i, i + chunkSize))
            }

            return true
        } catch (e: any) {
            console.error('Print error:', e)
            error.value = 'Gagal mencetak: ' + e.message
            return false
        }
    }

    return {
        isScanning,
        devices,
        connectedDevice,
        error,
        scanDevices,
        connectToDevice,
        print
    }
}
