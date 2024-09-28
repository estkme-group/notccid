export class NotCCIDStatus {
  readonly cardInserted: boolean
  readonly claimed: boolean

  constructor(status: Uint8Array) {
    this.cardInserted = status[0] === 1
    this.claimed = status[1] === 1
    Object.freeze(this)
  }

  toJSON(): object {
    return {
      cardInserted: this.cardInserted,
      claimed: this.claimed,
    }
  }

  get [Symbol.toStringTag]() {
    return 'NotCCIDStatus'
  }
}
