import { PathLike } from "node:fs"
import { Server, Socket } from "node:net"

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

export interface IParserdRequest {
  path: string
  method: string
  headers?: IHeaders
  params?: IHeaders
  body?: string
}

export interface IParsedResponse {
  status?: number
  headers: IHeaders
  body?: string
  buffer?: Buffer
}

export interface IResponse extends IParsedResponse {
  socket: Socket
  addHeader(name: string, value: any): void
  json(data: any): void
  text(data: string): void
  bytes(data: Buffer): void
  send(status?: number): void
}

export type RouterCallback = ((request: IParserdRequest, response: IResponse) => any)
export type MidwareCallback = ((request: IParserdRequest, response: IResponse, next?: any) => Promise<any>)


export interface IRoutes {
  [path: string]: RouterCallback
}

export interface IRouter {

  routes: {
    [key: string]: IRoutes
  }
  staticsBasePath?: string
  server?: Server
  _404: RouterCallback;
  _400: RouterCallback;
  _500: RouterCallback;

  route(method: Methods, path: string, cb: RouterCallback): void
  all(path: string, cb: RouterCallback): void
  get(path: string, cb: RouterCallback): void
  post(path: string, cb: RouterCallback): void
  put(path: string, cb: RouterCallback): void
  delete(path: string, cb: RouterCallback): void
  patch(path: string, cb: RouterCallback): void
  options(path: string, cb: RouterCallback): void
  head(path: string, cb: RouterCallback): void

  requestHandle(request: IParserdRequest, response: IResponse): void
  staticHandle(request: IParserdRequest, response: IResponse): Promise<void>

  static(path: string): void
  startRouter(server: Server): Server
}