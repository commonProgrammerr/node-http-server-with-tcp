import { Socket } from "node:net";
import { IResponse } from "../types";
import { createReadStream, lstatSync } from "fs";
import * as mime from 'mime-types'
import { ReadableByteStreamController, ReadableStream } from "stream/web";

export function _response(socket: Socket): IResponse {
  return {
    headers: {},
    socket,
    setHeader(name: string, value: any) {
      if (value instanceof Array)
        this.headers[name] = value.reduce((p, c) => `${p}; ${c}`, '')
      else
        this.headers[name] = value
    },

    bytes(data: Buffer) {
      this.buffer = data
      this.setHeader('content-length', this.buffer.length)
      return this
    },

    text(data: string) {
      this.body = data
      this.setHeader('content-type', 'text')
      this.setHeader('content-length', this.body.length)
      return this
    },

    json(data: any) {
      this.body = JSON.stringify(data)
      if (this.body) {
        this.setHeader('content-type', 'application/json')
        this.setHeader('content-length', Buffer.byteLength(this.body))
      }
      return this
    },

    send(status = 200) {
      this.setHeader('connection', 'Closed')
      const to_write = this.body || this.buffer
      if (status >= 400 || status < 200)
        console.error(status, new Error().stack)

      if (to_write && !this.headers['content-length'])
        this.setHeader('content-length', Buffer.byteLength(to_write))

      this.socket.write(`HTTP/1.1 ${status}\r\n`)
      Object.keys(this.headers).forEach(key => {
        this.socket.write(`${key}: ${this.headers![key]}\r\n`)
      })
      this.socket.write('\r\n')

      if (this.file_path) {
        try {
          const stream = createReadStream(String(this.file_path), { highWaterMark: 64 * 1024 })
          stream.pipe(socket)
        } catch (error) {
          console.error(error)
          socket.destroy(error)
        }
      } else if (to_write) {
        this.socket.write(Buffer.from(to_write)) && this.socket.end()
      } else
        this.socket.end()
    },

    file(path: string, type?: string) {

      const file = lstatSync(path)
      const mime_type = type || mime.lookup(path)
      this.setHeader('content-length', file.size)
      this.setHeader('content-type', mime_type || 'text/plain')
      this.file_path = path

      return this
    },
  }
}
