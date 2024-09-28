import { Command, CommandType } from './Command'
import { NotCCIDError } from './NotCCIDError'
import { NotCCIDStatus } from './NotCCIDStatus'
import type { Backend, RGB, RGB as RGBType } from './types'
import { equals, toRGB } from './utils'

/* b'ESTKme' */
const CLAIM_MAGIC_DATA = Uint8Array.of(0x45, 0x53, 0x54, 0x4b, 0x6d, 0x65)

export class NotCCID {
  private readonly backend: Backend

  constructor(backend: Backend) {
    this.backend = backend
  }

  /**
   * Invoke Command
   *
   * @param {CommandType} type Command Type
   * @param {Uint8Array} payload Payload
   * @returns {Uint8Array} Response
   */
  protected async invoke(type: CommandType, payload: Uint8Array = new Uint8Array(0)): Promise<Uint8Array> {
    const request = new Command(type, payload)
    const response = Command.from(await this.backend.invoke(request.valueOf()))
    if (request.type !== response.type) throw new NotCCIDError(`Unexpected response type: ${response.type}`)
    return response.payload
  }

  /**
   * Get Status
   *
   * @returns {NotCCIDStatus} Status
   **/
  async getStatus(): Promise<NotCCIDStatus> {
    return new NotCCIDStatus(await this.invoke(CommandType.Status))
  }

  /**
   * Emit RGB LED Indicator
   *
   * @param rgb RGB Color (if unset, turn off)
   */
  async emitLED(rgb?: RGB) {
    await this.invoke(CommandType.EmitLED, rgb ? toRGB(rgb) : undefined)
  }

  /**
   * Claim Interface
   **/
  async claim() {
    await this.invoke(CommandType.Claim, CLAIM_MAGIC_DATA)
  }

  /**
   * Release Interface
   **/
  async release() {
    await this.invoke(CommandType.Claim)
  }

  /**
   * Power On Card
   *
   * @param [options={ negotiation: true }] Options
   * @param [options.negotiation=true] Negotiation
   * @returns Answer To Reset
   *
   * @throws {NotCCIDError} If the card is not responding
   */
  async powerOnCard(options: NotCCID.PowerOnCardOptions = { negotiation: true }) {
    const response = await this.invoke(CommandType.Power, Uint8Array.of(0x01, options.negotiation ? 0x01 : 0x00))
    if (equals(response, Uint8Array.of(0xff))) {
      throw new NotCCIDError('The card is not responding')
    }
    return response
  }

  /**
   * Power Off Card
   **/
  async powerOffCard() {
    await this.invoke(CommandType.Power)
  }

  /**
   * Transmit APDU
   *
   * @param request Request APDU
   * @returns Response APDU
   *
   * @throws {NotCCIDError} If the card is not responding
   **/
  async transmit(request: Uint8Array | Iterable<number>): Promise<Uint8Array> {
    const response = await this.invoke(CommandType.Transmit, Uint8Array.from(request))
    if (equals(response, Uint8Array.of(0xff))) {
      throw new NotCCIDError('The card is not responding')
    }
    return response
  }

  /**
   * Echo Test
   *
   * @param {Uint8Array} payload Payload
   * @returns {Uint8Array} Payload
   */
  async echo(payload: Uint8Array = new Uint8Array(0)): Promise<Uint8Array> {
    return await this.invoke(CommandType.Echo, payload)
  }

  /**
   * Enter eSTK.me Recovery Mode
   **/
  async enterRecoveryMode() {
    return await this.invoke(CommandType.eSTKmeRecovery)
  }

  /** Close */
  async close(options?: Backend.CloseOptions) {
    return await this.backend.close(options)
  }

  get [Symbol.toStringTag]() {
    return 'NotCCID'
  }

  toString() {
    return `NotCCID(${this.backend})`
  }
}

export namespace NotCCID {
  export type RGB = RGBType

  export interface PowerOnCardOptions {
    readonly negotiation?: boolean
  }
}
