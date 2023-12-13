import { Methods, IRouter, IRequest, IParserdRequest, IResponse } from '../types'
import { _response } from "./response";
import { parseRequest } from './parser';
import { existsSync, lstatSync, readFileSync, readdirSync, writeFile, writeFileSync } from 'fs'
import * as path from "path";
import { Socket } from 'net';

function getDirHtml(base: string, childs: string[]) {
  return `<!DOCTYPE html><html><head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>listing directory /</title></head>
<body class="directory vsc-initialized">
<div id="wrapper"><ul id="files" class="view-tiles">${childs.reduce((p, c) => p + `<li><a href="${path.join(base, c)}" title="${c}"><span class="name">${c}</span></a></li>`, '')}
</ul></div></body></html>`
}

function _500(req: IRequest, res: IResponse) {
  res.file(path.resolve('src/static/500.html'))
  res.send(500)
}

function _404(request: IRequest, response: IResponse) {
  response.file(path.resolve('src/static/404.html'))
  response.send(404)
}

function _400(req: IRequest, res: IResponse) {
  res.file(path.resolve('src/static/400.html'))
  res.send(400)
}

export const router: IRouter = {
  routes: {},
  staticsBasePath: "",
  server: undefined,

  _500,
  _404,
  _400,

  static(_path) {
    const staticsBasePath = path.resolve(_path)
    this.staticsBasePath = staticsBasePath
    console.log('Static server on ', staticsBasePath)
  },

  async requestHandle(request) {
    const response = _response(request.socket)
    try {
      console.log(`new ${request.method} request on ${request.path}`)

      if (!(this.routes))
        this.routes = {}

      const callback = this.routes[request.method]?.[request.path]
      if (callback) {
        const p = callback(request, response)
        if (p instanceof Promise)
          await p;
      } else if (this.staticsBasePath) {
        await this.staticHandle(request, response)
      } else {
        console.log('path not found')
        _404(request, response);
      }
    } catch (error) {
      console.error(error)
      _500(request, response)
    }

  },

  async staticHandle(request, response) {
    const filePath = path.join(this.staticsBasePath!, request.path)
    try {
      if (!existsSync(filePath)) {
        console.log('no avaiable file', filePath)
        return _404(request, response);
      }

      console.log('search path', filePath)
      if (request.method == Methods.get) {
        if (lstatSync(filePath).isDirectory()) {
          const index_path = path.join(filePath, 'index.html')
          response.setHeader('content-type', 'text/html')
          if (!existsSync(index_path))
            response.text(getDirHtml(request.path, readdirSync(filePath)))
          else {
            response.file(index_path)
          }
        } else
          response.file(filePath)

        response.send(200)
      } else
        _400(request, response)
    } catch (e) {
      console.error(e)
      _500(request, response)
    }
  },

  route(method, path, cb) {
    if (!this.routes[method])
      this.routes[method] = {}


    this.routes[method][path] = cb

  },

  all(path, cb) {
    this.route(Methods.all, path, cb)
    this.route(Methods.get, path, cb)
    this.route(Methods.post, path, cb)
    this.route(Methods.put, path, cb)
    this.route(Methods.delete, path, cb)
    this.route(Methods.patch, path, cb)
    this.route(Methods.options, path, cb)
    this.route(Methods.head, path, cb)
  },
  get(path, cb) { this.route(Methods.get, path, cb) },
  post(path, cb) { this.route(Methods.post, path, cb) },
  put(path, cb) { this.route(Methods.put, path, cb) },
  delete(path, cb) { this.route(Methods.delete, path, cb) },
  patch(path, cb) { this.route(Methods.patch, path, cb) },
  options(path, cb) { this.route(Methods.options, path, cb) },
  head(path, cb) { this.route(Methods.head, path, cb) },


  startRouter(server) {
    this.server = server
    server.on('connection', (socket: { request: IParserdRequest } & Socket) => {

      console.log(`New client Connected at ${socket.remoteAddress}:${socket.remotePort}`)

      socket.on('data', async (data) => {

        try {
          const request = parseRequest(data)
          if (request) {
            this.requestHandle({ ...request, socket })
            socket.request = request
          }
          else if (socket.request) {
            if (
              socket.request.headers['poli-file'] === 'chunked'

              // socket.request.headers['content-type'] === 'application/octet-stream'
            ) {
              socket.emit('chunk', data)
            }
            else
              socket.request.body.add(data)
          }
          else {
            console.error(request)
            _response(socket).send(400)
          }

        } catch (error) {
          console.error(error)
          _response(socket).send(500)
        }
      });
    })

    return server
  }
}
