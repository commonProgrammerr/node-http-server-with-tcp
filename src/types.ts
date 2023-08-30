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
  headers: IHeaders
  body?: string
}

export interface IResponse extends IParsedResponse {
  socket: Socket
  addHeader(name: string, value: any): void
  json(data: any): void
  text(data: string): void
  send(status?: number): void
}

export interface RouterCallback {
  (request: IParserdRequest, response: IResponse, socket: Socket): void
  (request: IParserdRequest, response: IResponse): void
}


export interface IRoutes {
  [path: string]: RouterCallback
}

export interface IRouter {

  routes: {
    [key: string]: IRoutes
  }
  server?: Server
  route(method: Methods, path: string, cb: RouterCallback): void
  all(path: string, cb: RouterCallback): void
  get(path: string, cb: RouterCallback): void
  post(path: string, cb: RouterCallback): void
  put(path: string, cb: RouterCallback): void
  delete(path: string, cb: RouterCallback): void
  patch(path: string, cb: RouterCallback): void
  options(path: string, cb: RouterCallback): void
  head(path: string, cb: RouterCallback): void


  startRouter(server: Server): Server
}