export class NotCCIDError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    Object.freeze(this)
  }

  get name() {
    return 'NotCCIDError'
  }

  get [Symbol.toStringTag]() {
    return 'NotCCIDError'
  }
}
