import { Socket } from "node:net";
import { Methods, IParserdRequest, IRouter } from '../types'
import { _response } from "./response";


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

        if (!(this.routes))
          this.routes = {}
        const callback = this.routes[request.method][request.path]

        if (callback) {
          const p = callback(request, response)
          if (p instanceof Promise)
            await p;
        }
        else {
          response.json({
            err_message: 'Invalid path!',
            avaliable_paths: Object.keys(this.routes).map(key => {
              return Object.keys(this.routes[key]).map(path => `${key} - ${path}`)
            }).flat()
          })
          response.send(404)
        }
      })
    return server
  }
}
