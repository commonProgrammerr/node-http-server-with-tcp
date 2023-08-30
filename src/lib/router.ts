import { Socket } from "node:net";
import { Methods, IParserdRequest, IRouter } from '../types'
import { _response } from "./response";
import fs from "node:fs/promises";
import path from "node:path";


export const router: IRouter = {
  routes: {},
  route(method, path, cb) {
    if (!this.routes[method])
      this.routes[method] = {}

    this.routes[method][path] = cb
  },
  all(path, cb) { this.route(Methods.all, path, cb) },
  get(path, cb) { this.route(Methods.get, path, cb) },
  post(path, cb) { this.route(Methods.post, path, cb) },
  put(path, cb) { this.route(Methods.put, path, cb) },
  delete(path, cb) { this.route(Methods.delete, path, cb) },
  patch(path, cb) { this.route(Methods.patch, path, cb) },
  options(path, cb) { this.route(Methods.options, path, cb) },
  head(path, cb) { this.route(Methods.head, path, cb) },

  startRouter(server) {
    server.addListener('request',
      (socket: Socket, request: IParserdRequest) => {

        console.log('new request on:', request.path, request.method)
        const callback = this.routes[request.method][request.path]
        if (callback) {
          try {
            callback(request, _response(socket), socket)
          } catch (error) {
            console.error(error)
            fs.readFile(path.resolve('./src/pages/500.html')).then(file => {
              socket.write('HTTP/1.1 500\r\n')
              socket.write('content-type: text/html\r\n')
              socket.write(`content-length: ${file.length}\r\n`)
              socket.write(`Connection: Closed\r\n\r\n`)
              socket.write(file)
            }).catch(err => console.error(err)).finally(() => {
              socket.destroy()
            })
          }
        }
        else {
          fs.readFile(path.resolve('./src/pages/404.html')).then(file => {
            socket.write('HTTP/1.1 404\r\n')
            socket.write('content-type: text/html\r\n')
            socket.write(`content-length: ${file.length}\r\n`)
            socket.write(`Connection: Closed\r\n\r\n`)
            socket.write(file)
          }).catch(err => console.error(err)).finally(() => {
            socket.destroy()
          })

        }
      })
    return server
  }
}
