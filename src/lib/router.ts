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
      async (socket: Socket, request: IParserdRequest) => {

        console.log('new request on:', request.path, request.method)
        const response = _response(socket)
        try {
          const callback = this.routes[request.method][request.path]
          if (callback) {
            callback(request, response)
          }
          else {
            const file = await fs.readFile(path.resolve('./src/pages/404.html'))
            response.addHeader('contetn-type', 'text/html')
            response.bytes(file)
            response.send(404)
          }
        }
        catch (error) {
          console.error(error)
          const file = await fs.readFile(path.resolve('./src/pages/500.html'))
          response.addHeader('contetn-type', 'text/html')
          response.bytes(file)
          response.send(500)
        } finally {
          socket.destroy()
        }

      })
    return server
  }
}
