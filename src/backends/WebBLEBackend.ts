/// <reference types="@types/web-bluetooth" />
import type { Backend } from '../types'
import { getUint16 } from '../utils'

const CHUNK_SIZE = 2 << 6 // 128 bytes
const NAME_PREFIX = 'ESTKme-RED'
const SERIAL_SERVICE = 0x4553
const SERIAL_TX_CHARACTERISTIC = 0x6d65
const SERIAL_RX_CHARACTERISTIC = 0x544b

export class WebBLEBackend implements EventListenerObject, Backend {
  private static getRequestOptions(): RequestDeviceOptions {
    if (/Bluefy/i.test(navigator.userAgent)) {
      return {
        filters: [{ namePrefix: NAME_PREFIX, services: [SERIAL_SERVICE] }],
      }
    }
    return {
      filters: [{ namePrefix: NAME_PREFIX }],
      optionalServices: [SERIAL_SERVICE],
    }
  }

  static async requestDevice(bluetooth = navigator.bluetooth) {
    if (!(await this.getAvailability())) throw new Error('WebBLE is not available')
    return bluetooth.requestDevice(this.getRequestOptions())
  }

  static async getAvailability(bluetooth = navigator.bluetooth) {
    if (bluetooth === undefined || bluetooth === null) return false
    if (typeof bluetooth.requestDevice !== 'function') return false
    if (typeof bluetooth.getAvailability !== 'function') return true
    return bluetooth.getAvailability()
  }

  static async open(device: BluetoothDevice, options?: WebBLEBackend.Options): Promise<WebBLEBackend> {
    if (device.gatt === undefined) throw new Error('Bluetooth GATT is not available')
    const gatt = await device.gatt.connect()
    const service = await gatt.getPrimaryService(SERIAL_SERVICE)
    const tx = await service.getCharacteristic(SERIAL_TX_CHARACTERISTIC)
    const rx = await service.getCharacteristic(SERIAL_RX_CHARACTERISTIC)
    await rx.startNotifications()
    return new this(service, tx, rx, options?.chunkSize ?? CHUNK_SIZE)
  }

  private readonly tx: CharacteristicValue
  private readonly rx: CharacteristicValue
  private readonly abortController = new AbortController()

  private constructor(
    private readonly service: BluetoothRemoteGATTService,
    tx: BluetoothRemoteGATTCharacteristic,
    rx: BluetoothRemoteGATTCharacteristic,
    private readonly chunkSize: number
  ) {
    service.device.addEventListener('gattserverdisconnected', this)
    this.tx = new CharacteristicValue(tx, this.abortController.signal)
    this.rx = new CharacteristicValue(rx, this.abortController.signal)
  }

  handleEvent(event: Event): void {
    if (event.type === 'gattserverdisconnected') {
      this.abortController.abort('discoonnect')
    }
  }

  get connected() {
    if (this.gatt) return this.gatt.connected
    return false
  }

  get gatt() {
    return this.device.gatt
  }

  get device() {
    return this.service.device
  }

  async invoke(request: Uint8Array) {
    await this.tx.writeValue(request, this.chunkSize)
    return await this.rx
  }

  async close(options?: Backend.CloseOptions) {
    this.service.device.removeEventListener('gattserverdisconnected', this)
    this.abortController.abort('close')
    await this.tx.close()
    await this.rx.close()
    if (this.gatt?.connected) this.gatt.disconnect()
    if (options?.forget) await this.device.forget()
    return
  }

  [Symbol.asyncDispose]() {
    return this.close()
  }

  get [Symbol.toStringTag]() {
    return 'WebBLEBackend'
  }

  toString() {
    return `WebBLE:${this.device.name}`
  }
}

export namespace WebBLEBackend {
  export interface Options {
    readonly chunkSize?: number
  }
}

class CharacteristicValue implements EventListenerObject {
  private resolve: ((value: Uint8Array) => void) | undefined
  private reject: ((reason: unknown) => void) | undefined
  private packet = new Uint8Array(0)
  private offset = Number.NaN

  constructor(private readonly chara: BluetoothRemoteGATTCharacteristic, private readonly signal: AbortSignal) {
    this.chara.addEventListener('characteristicvaluechanged', this)
    this.signal.addEventListener('abort', this)
  }

  async writeValue(request: Uint8Array, chunkSize: number) {
    for (let offset = 0; offset < request.byteLength; offset += chunkSize) {
      this.signal.throwIfAborted()
      await this.chara.writeValue(request.slice(offset, offset + chunkSize))
    }
  }

  handleEvent(event: Event) {
    if (event.type === 'abort' && this.reject) {
      this.reject(this.signal.reason)
      this.reset()
    }
    if (event.type === 'characteristicvaluechanged' && this.resolve) {
      if (this.signal.aborted) return
      const chunk = new Uint8Array(this.chara.value!.buffer)
      if (Number.isNaN(this.offset)) {
        this.packet = new Uint8Array(3 + getUint16(chunk, 1))
        this.offset = 0
      }
      this.packet.set(chunk, this.offset)
      this.offset += chunk.byteLength
      if (this.offset < this.packet.byteLength) return
      this.resolve(Uint8Array.from(this.packet))
      this.reset()
    }
  }

  then(resolve: typeof this.resolve, reject: typeof this.reject) {
    this.signal.throwIfAborted()
    this.resolve = resolve
    this.reject = reject
    this.offset = Number.NaN
  }

  async close() {
    this.signal.removeEventListener('abort', this)
    this.chara.removeEventListener('characteristicvaluechanged', this)
    await this.chara.stopNotifications()
  }

  private reset() {
    this.resolve = undefined
    this.reject = undefined
    this.offset = Number.NaN
  }
}
