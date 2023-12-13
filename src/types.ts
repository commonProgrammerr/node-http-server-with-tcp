import { Server, Socket } from "net"

export type Method = keyof Methods

export enum Methods {
  connect = 'CONNECT',
  delete = 'DELETE',
  get = 'GET',
  head = 'HEAD',
  options = 'OPTIONS',
  post = 'POST',
  put = 'PUT',
  patch = 'PATCH',
  all = 'ALL'
}

export interface IHeaders {
  [key: string]: string | number
}

export interface IBodyBuffer {
  text(): Promise<string>
  json<T = any>(): Promise<T>
  bytes(): Promise<Buffer>
  buffer: Buffer
  done: boolean
}

export class BodyBuffer implements IBodyBuffer {
  buffer: Buffer;
  done: boolean
  totalWrite: number
  private timeout: NodeJS.Timeout

  constructor(buffer: Buffer | number) {
    this.buffer = buffer instanceof Buffer ? buffer : Buffer.alloc(buffer)
    this.totalWrite = buffer instanceof Buffer ? buffer.byteLength : 0
    this.done = buffer instanceof Buffer ? true : false
  }


  async bytes(): Promise<Buffer> {
    while (!this.done);
    if (this.totalWrite !== this.buffer.byteLength)
      throw new Error("Request timeout");

    return this.buffer
  }

  async text(): Promise<string> {
    return (await this.bytes()).toString()
  }

  async json<T = any>(): Promise<T> {
    return JSON.parse(await this.text())
  }


  add(chunk: Buffer) {
    if (this.timeout)
      clearTimeout(this.timeout)

    for (let i = 0; i < chunk.length; i++) {
      this.buffer[this.totalWrite] = chunk[i]
      this.totalWrite++
      this.done = this.buffer.byteLength === this.totalWrite
    }
    this.timeout = setTimeout(() => { this.done = true }, 15000)
  }
}

export interface IParserdRequest {
  path: string
  method: string
  headers?: IHeaders
  params?: IHeaders
  body?: BodyBuffer
}

export interface IRequest extends IParserdRequest {
  socket: Socket
}

export interface IParsedResponse {
  status?: number
  headers: IHeaders
  body?: string
  buffer?: Buffer
}

export interface IResponse extends IParsedResponse {
  socket: Socket
  setHeader(name: string, value: any): void
  json(data: any): void
  text(data: string): void
  bytes(data: Buffer): void
  file(path: string): void
  send(status?: number): void
}

export type RouterCallback = ((request: IRequest, response: IResponse) => any)
export type MidwareCallback = ((request: IRequest, response: IResponse, next?: any) => Promise<any>)


export interface IRoutes {
  [path: string]: RouterCallback
}

export interface IRouter {

  routes: {
    [key: string]: IRoutes
  }
  staticsBasePath?: string
  server?: Server
  _404(request: IRequest, response: IResponse): void;
  _400(request: IRequest, response: IResponse): void;
  _500(request: IRequest, response: IResponse): void;

  route(method: Methods, path: string, cb: RouterCallback): void
  all(path: string, cb: RouterCallback): void
  get(path: string, cb: RouterCallback): void
  post(path: string, cb: RouterCallback): void
  put(path: string, cb: RouterCallback): void
  delete(path: string, cb: RouterCallback): void
  patch(path: string, cb: RouterCallback): void
  options(path: string, cb: RouterCallback): void
  head(path: string, cb: RouterCallback): void

  requestHandle(request: IRequest): void
  staticHandle(request: IRequest, response: IResponse): Promise<void>

  static(path: string): void
  startRouter(server: Server): Server
}