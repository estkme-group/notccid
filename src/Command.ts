import { getUint16 } from './utils'

export const enum CommandType {
  Status = 0x00,
  EmitLED = 0x01,
  Claim = 0x02,
  Power = 0x03,
  Transmit = 0x04,
  eSTKmeRecovery = 0xf0,
  Echo = 0xff,
}

const commandTypes = [
  CommandType.Status,
  CommandType.EmitLED,
  CommandType.Claim,
  CommandType.Power,
  CommandType.Transmit,
  CommandType.eSTKmeRecovery,
  CommandType.Echo,
]

export class Command {
  type: CommandType
  payload: Uint8Array

  static from(packet: Uint8Array) {
    const length = getUint16(packet, 1)
    return new Command(packet[0], packet.slice(3, 3 + length))
  }

  constructor(type: CommandType, payload: Uint8Array) {
    this.type = type
    this.payload = payload
    assert(this)
  }

  valueOf() {
    assert(this)
    const length = this.payload.byteLength
    const header = Uint8Array.of(this.type, length, length >> 8)
    const command = new Uint8Array(header.byteLength + length)
    command.set(header, 0)
    command.set(this.payload, header.byteLength)
    return command
  }

  get [Symbol.toStringTag]() {
    return 'Command'
  }
}

function assert(command: Command) {
  if (!commandTypes.includes(command.type)) {
    throw new Error('Invalid command type.')
  }
  if (command.payload.length > 0xffff) {
    throw new Error('Payload size exceeds the maximum allowed length of 65535 bytes.')
  }
}
