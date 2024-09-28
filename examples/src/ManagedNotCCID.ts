import { Backend, NotCCID, NotCCIDStatus } from '@estkme-group/notccid'
import { useMemo, useState } from 'react'

export interface ManagedNotCCID {
  get connected(): boolean
  get claimed(): boolean
  get cardInserted(): boolean
  get powered(): boolean
  get atr(): Uint8Array | undefined
  getStatus(): Promise<NotCCIDStatus>
  claim(): Promise<void>
  release(): Promise<void>
  powerOnCard(options?: NotCCID.PowerOnCardOptions): Promise<Uint8Array>
  powerOffCard(): Promise<void>
  echo(data?: Uint8Array): Promise<void>
  emitLED(rgb?: NotCCID.RGB): Promise<void>
  transmit(request: Uint8Array): Promise<Uint8Array>
  enterRecoveryMode(): Promise<void>
}

export function useManagedNotCCID(backend: Backend | undefined): ManagedNotCCID | undefined {
  const notccid = useMemo(() => backend && new NotCCID(backend), [backend])
  const [atr, setATR] = useState<Uint8Array>()
  const [cardInserted, setCardInserted] = useState(false)
  const [claimed, setClaimed] = useState(false)
  if (notccid === undefined) return undefined
  return {
    get connected() {
      return notccid !== undefined
    },
    get claimed() {
      return claimed
    },
    get cardInserted() {
      return cardInserted
    },
    get powered() {
      return atr !== undefined
    },
    get atr() {
      if (!notccid) return undefined
      if (!atr) return undefined
      return Uint8Array.from(atr)
    },
    async getStatus() {
      if (!notccid) throw new Error('Not connected')
      const status = await notccid.getStatus()
      setCardInserted(status.cardInserted)
      setClaimed(status.claimed)
      return status
    },
    async claim() {
      if (!notccid) throw new Error('Not connected')
      await notccid.claim()
      setClaimed(true)
    },
    async release() {
      if (!notccid) throw new Error('Not connected')
      await notccid.release()
      setClaimed(false)
    },
    async powerOnCard(options?: NotCCID.PowerOnCardOptions) {
      if (!notccid) throw new Error('Not connected')
      const atr = await notccid.powerOnCard(options)
      setATR(atr)
      return atr
    },
    async powerOffCard() {
      if (!notccid) throw new Error('Not connected')
      await notccid.powerOffCard()
      setATR(undefined)
    },
    async echo(data: Uint8Array = new Uint8Array(0)) {
      if (!notccid) throw new Error('Not connected')
      await notccid.echo(data)
    },
    async emitLED(rgb?: NotCCID.RGB) {
      if (!notccid) throw new Error('Not connected')
      await notccid.emitLED(rgb)
    },
    async transmit(request: Uint8Array) {
      if (!notccid) throw new Error('Not connected')
      if (!cardInserted) throw new Error('Card not inserted')
      if (!claimed) throw new Error('Not claimed')
      if (atr === undefined) throw new Error('Card not powered')
      if (request.length < 5) throw new Error('Invalid APDU')
      return await notccid.transmit(request)
    },
    async enterRecoveryMode() {
      if (!notccid) throw new Error('Not connected')
      if (!claimed) throw new Error('Not claimed')
      if (atr === undefined) throw new Error('Card not powered')
      await notccid.enterRecoveryMode()
    },
  }
}
