/// <reference types="@types/w3c-web-usb" />
import type { Backend } from '../types'
import { anySignals, equals, getUint16, racePromise } from '../utils'

const CHUNK_SIZE = 2 << 13 // 16 KiB

export class WebUSBBackend implements Backend {
  private readonly abortController = new AbortController()

  static async requestDevice(usb = navigator.usb) {
    if (usb === undefined) throw new Error('WebUSB is not available')
    return usb.requestDevice({
      filters: [
        // ESTKme-RED (10/2024)
        { productId: 0x0165, vendorId: 0x0bda, classCode: 0xff },
      ],
    })
  }

  static async getAvailability(usb = navigator.usb) {
    if (usb === undefined || usb === null) return false
    if (typeof usb.requestDevice !== 'function') return false
    return true
  }

  static async open(device: USBDevice, options?: WebUSBBackend.Options): Promise<WebUSBBackend> {
    if (device === undefined) throw new Error('No device selected')
    await device.open()
    await device.claimInterface(options?.interfaceNumber ?? 1)
    return new this(device, options?.chunkSize ?? CHUNK_SIZE)
  }

  private constructor(private readonly device: USBDevice, private readonly chunkSize: number) {
    navigator.usb.addEventListener('disconnect', this)
  }

  get connected(): boolean {
    return this.device.opened
  }

  async handleEvent(event: USBConnectionEvent) {
    if (event.device !== this.device) return
    if (event.type === 'disconnect') {
      this.abortController.abort(new Error('disconnect'))
      navigator.usb.removeEventListener('disconnect', this)
    }
  }

  async invoke(request: Uint8Array, options?: Backend.InvokeOptions): Promise<Uint8Array> {
    const signal = anySignals(this.abortController.signal, options?.signal)
    // transmit request
    await this.write(0x00, request, signal)
    const readback = await this.read(0x01, request.byteLength, signal)
    if (!equals(request, readback)) throw new Error('The request is mismatched')
    // receive response
    const length = getUint16(await this.read(0x02, 2, signal), 0)
    return await this.read(0x03, length, signal)
  }

  async close(options?: Backend.CloseOptions) {
    this.abortController.abort(new Error('close'))
    navigator.usb.removeEventListener('disconnect', this)
    await this.device.releaseInterface(1)
    await this.device.close()
    if (options?.forget) await this.device.forget()
    return
  }

  [Symbol.asyncDispose]() {
    return this.close()
  }

  get [Symbol.toStringTag]() {
    return 'WebUSBBackend'
  }

  toString() {
    return `WebUSB:${this.device.serialNumber}`
  }

  private async read(request: number, length: number, signal: AbortSignal): Promise<Uint8Array> {
    let chunkSize: number
    let result: USBInTransferResult
    const setup: USBControlTransferParameters = {
      requestType: 'vendor',
      recipient: 'interface',
      request,
      value: 0,
      index: 1,
    }
    const payload = new Uint8Array(length)
    while (setup.value < length) {
      chunkSize = Math.min(this.chunkSize, length - setup.value)
      result = await racePromise(this.device.controlTransferIn(setup, chunkSize), signal)
      if (result.status !== 'ok' || !result.data) throw new Error(`Failed to read packet: ${result.status}`)
      payload.set(new Uint8Array(result.data.buffer), setup.value)
      setup.value += result.data.byteLength
    }
    return payload
  }

  private async write(request: number, packet: Uint8Array, signal: AbortSignal) {
    let chunk: Uint8Array
    let result: USBOutTransferResult
    const setup: USBControlTransferParameters = {
      requestType: 'vendor',
      recipient: 'interface',
      request,
      value: 0,
      index: 1,
    }
    while (setup.value < packet.byteLength) {
      chunk = packet.slice(setup.value, setup.value + this.chunkSize)
      result = await racePromise(this.device.controlTransferOut(setup, chunk), signal)
      if (result.status !== 'ok') throw new Error(`Failed to write packet: ${result.status}`)
      setup.value += result.bytesWritten
    }
  }
}

export namespace WebUSBBackend {
  export interface Options {
    readonly interfaceNumber?: number
    readonly chunkSize?: number
  }
}
