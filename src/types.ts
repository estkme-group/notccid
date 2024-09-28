export type RGB = string | number | [red: number, green: number, blue: number]

export interface Backend extends AsyncDisposable {
  get connected(): boolean

  invoke(request: Uint8Array): Promise<Uint8Array>
  close(options?: Backend.CloseOptions): Promise<void>
  toString(): string

  get [Symbol.toStringTag](): string
}

export namespace Backend {
  export interface CloseOptions {
    readonly forget?: boolean
  }
}
