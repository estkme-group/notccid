import { Command, CommandType } from '../Command'
import type { Backend } from '../types'

export class ConsoleBackend implements Backend {
  static buildOptions = buildOptions

  constructor(private readonly parent: Backend, private readonly options = buildOptions()) {}

  get connected(): boolean {
    return this.parent.connected
  }

  async invoke(request: Uint8Array): Promise<Uint8Array> {
    this.before(Command.from(request))
    const response = await this.parent.invoke(request)
    this.after(Command.from(response))
    return response
  }

  private before(command: Command) {
    if (this.isIgnore(command.type)) return
    this.options.before(command.type, command.payload)
  }

  private after(command: Command) {
    if (this.isIgnore(command.type)) return
    this.options.after(command.type, command.payload)
  }

  private isIgnore(type: CommandType) {
    if (this.options.ignoreTypes === undefined) return false
    return this.options.ignoreTypes.includes(type)
  }

  close(options?: Backend.CloseOptions): Promise<void> {
    return this.parent.close(options)
  }

  get [Symbol.toStringTag]() {
    return 'ConsoleBackend'
  }

  toString() {
    return this.parent.toString()
  }

  [Symbol.asyncDispose]() {
    return this.close()
  }
}

export namespace ConsoleBackend {
  export interface Options {
    readonly ignoreTypes?: readonly CommandType[]
    before(type: CommandType, payload: Uint8Array): void
    after(type: CommandType, payload: Uint8Array): void
  }
}

function buildOptions(
  print: Function = console.info.bind(console),
  ignoreTypes = [CommandType.Status, CommandType.EmitLED, CommandType.Echo]
): ConsoleBackend.Options {
  const typeNames: Record<CommandType, string> = {
    [CommandType.Status]: 'status',
    [CommandType.EmitLED]: 'emit-led',
    [CommandType.Claim]: 'claim',
    [CommandType.Power]: 'power',
    [CommandType.Transmit]: 'transmit',
    [CommandType.eSTKmeRecovery]: 'enter-recovery-mode',
    [CommandType.Echo]: 'echo',
  }
  return {
    ignoreTypes,
    before: (type, payload) => print(typeNames[type], '->', payload),
    after: (type, payload) => print(typeNames[type], '<-', payload),
  }
}
