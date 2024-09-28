import 'mocha'
import { describe } from 'mocha'
import { assert } from 'chai'

import { Command, CommandType } from './Command'

describe('Command', () => {
  interface Fixture {
    readonly name: string
    readonly type: CommandType
    readonly payload: Uint8Array
    readonly expected: Uint8Array
  }

  const fixtures: readonly Fixture[] = [
    {
      name: 'read status command',
      type: CommandType.Status,
      payload: Uint8Array.of(),
      expected: Uint8Array.of(0x00, 0x00, 0x00),
    },
    {
      name: 'emit led command (off)',
      type: CommandType.EmitLED,
      payload: Uint8Array.of(),
      expected: Uint8Array.of(0x01, 0x00, 0x00),
    },
    {
      name: 'emit led command (red)',
      type: CommandType.EmitLED,
      payload: Uint8Array.of(0xff, 0x00, 0x00),
      expected: Uint8Array.of(0x01, 0x03, 0x00, 0xff, 0x00, 0x00),
    },
    {
      name: 'claim command',
      type: CommandType.Claim,
      payload: Uint8Array.of(0x45, 0x53, 0x54, 0x4b, 0x6d, 0x65), // b'ESTKme'
      expected: Uint8Array.of(0x02, 0x06, 0x00, 0x45, 0x53, 0x54, 0x4b, 0x6d, 0x65),
    },
    {
      name: 'release command',
      type: CommandType.Claim,
      payload: Uint8Array.of(),
      expected: Uint8Array.of(0x02, 0x00, 0x00),
    },
    {
      name: 'power on command, no use pps',
      type: CommandType.Power,
      payload: Uint8Array.of(0x01, 0x00),
      expected: Uint8Array.of(0x03, 0x02, 0x00, 0x01, 0x00),
    },
    {
      name: 'power on command, use pps',
      type: CommandType.Power,
      payload: Uint8Array.of(0x01, 0x01),
      expected: Uint8Array.of(0x03, 0x02, 0x00, 0x01, 0x01),
    },
    {
      name: 'power off command',
      type: CommandType.Power,
      payload: Uint8Array.of(),
      expected: Uint8Array.of(0x03, 0x00, 0x00),
    },
    {
      name: 'transmit command',
      type: CommandType.Transmit,
      payload: Uint8Array.of(0x00, 0xb0, 0x00, 0x00, 0x02),
      expected: Uint8Array.of(0x04, 0x05, 0x00, 0x00, 0xb0, 0x00, 0x00, 0x02),
    },
    {
      name: 'entering eSTK.me recovery command',
      type: CommandType.eSTKmeRecovery,
      payload: Uint8Array.of(),
      expected: Uint8Array.of(0xf0, 0x00, 0x00),
    },
    {
      name: 'echo command',
      type: CommandType.Echo,
      payload: Uint8Array.of(0x01, 0x02, 0x03),
      expected: Uint8Array.of(0xff, 0x03, 0x00, 0x01, 0x02, 0x03),
    },
  ]

  for (const fixture of fixtures) {
    it(fixture.name, () => {
      const command = new Command(fixture.type, fixture.payload)
      assert.deepEqual(command.type, fixture.type)
      assert.deepEqual(command.payload, fixture.payload)
      assert.deepEqual(command.valueOf(), fixture.expected)
      assert.deepEqual(command[Symbol.toStringTag], 'Command')
      assert.deepEqual(command, Command.from(fixture.expected))
    })
  }
})
