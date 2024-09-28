import { Backend } from '@estkme-group/notccid'
import { Mutex } from 'async-mutex'

export class MutexBackend implements Backend {
  private readonly mutex = new Mutex()

  constructor(private readonly parent: Backend) {}

  get connected(): boolean {
    return this.parent.connected
  }

  async invoke(request: Uint8Array): Promise<Uint8Array> {
    const release = await this.mutex.acquire()
    try {
      return await this.parent.invoke(request)
    } finally {
      release()
    }
  }

  close(options?: Backend.CloseOptions): Promise<void> {
    return this.close(options)
  }

  toString() {
    return this.parent.toString()
  }

  get [Symbol.toStringTag]() {
    return 'MutexBackend'
  }

  [Symbol.asyncDispose](): PromiseLike<void> {
    return this[Symbol.asyncDispose]()
  }
}
