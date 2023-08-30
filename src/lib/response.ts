import { Socket } from "node:net";
import { IResponse } from "../types";

export function _response(socket: Socket): IResponse {
  return {
    headers: {},
    socket,
    addHeader(name: string, value: any) { this.headers[name] = value },

    text(data: string) {
      this.body = data
      this.addHeader('content-type', 'text')
      this.addHeader('content-length', this.body.length)
    },

    json(data: any) {
      this.body = JSON.stringify(data)
      this.addHeader('content-type', 'application/json')
      this.addHeader('content-length', this.body.length)
    },

    send(status = 200) {
      if (this.body && !this.headers['content-length'])
        this.addHeader('content-length', this.body.length)

      this.addHeader('connection', 'Closed')

      this.socket.write(`HTTP/1.1 ${status}\r\n`)
      Object.keys(this.headers).forEach(key => {
        this.socket.write(`${key}: ${this.headers![key]}\r\n`)
      })
      this.socket.write('\r\n')

      this.body && this.socket.write(this.body)

      this.socket.end('\r\n')
    }
  }
}