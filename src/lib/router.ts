import { Methods, IRouter, IRequest, IParserdRequest, IResponse } from '../types';
import { _response } from "./response";
import { parseRequest } from './parser';
import { existsSync, lstatSync, readdirSync } from 'fs';
import * as path from "path";
import { Socket } from 'net';

/**
 * Generates HTML for listing directory contents.
 * @param base - The base directory path.
 * @param childs - Array of file/directory names in the directory.
 * @returns HTML content for listing directory.
 */
function getDirHtml(base: string, childs: string[]): string {
  return `<!DOCTYPE html><html><head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>listing directory /</title></head><body class="directory vsc-initialized">
<div id="wrapper"><ul id="files" class="view-tiles">${childs.reduce((p, c) => p + `<li><a href="${path.join(base, c)}" title="${c}"><span class="name">${c}</span></a></li>`, '')}
</ul></div></body></html>`;
}

/**
 * Handles a 500 Internal Server Error response.
 * @param req - The HTTP request object.
 * @param res - The HTTP response object.
 */
function _500(req: IRequest, res: IResponse) {
  res.file(path.resolve('static/500.html'));
  res.send(500);
}

/**
 * Handles a 404 Not Found response.
 * @param request - The HTTP request object.
 * @param response - The HTTP response object.
 */
function _404(request: IRequest, response: IResponse) {
  response.file(path.resolve('static/404.html'));
  response.send(404);
}

/**
 * Handles a 400 Bad Request response.
 * @param req - The HTTP request object.
 * @param res - The HTTP response object.
 */
function _400(req: IRequest, res: IResponse) {
  res.file(path.resolve('static/400.html'));
  res.send(400);
}

/**
 * Router implementation for handling HTTP requests and responses.
 */
export const router: IRouter = {
  routes: {},
  staticsAccess: {},
  server: undefined,

  _500,
  _404,
  _400,

  /**
   * Adds a static file access path.
   * @param accessPath - The access path for static files.
   * @param dirPath - The directory path for static files.
   */
  static(accessPath, dirPath) {
    this.staticsAccess[accessPath] = path.resolve(dirPath);
  },

  /**
   * Handles an incoming HTTP request.
   * @param request - The HTTP request object.
   */
  async requestHandle(request: IRequest) {
    const response = _response(request.socket);
    try {
      console.log(`new ${request.method} request on ${request.path}`);

      if (!this.routes)
        this.routes = {};

      const callback = this.routes[request.method]?.[request.path];
      if (callback) {
        const p = callback(request, response);
        if (p instanceof Promise)
          await p;
      } else if (await this.staticHandle(request, response)) {
        console.log('path not found');
        _404(request, response);
      }
    } catch (error) {
      console.error(error);
      _500(request, response);
    }
  },

  /**
   * Handles static file requests.
   * @param request - The HTTP request object.
   * @param response - The HTTP response object.
   * @returns True if the request path is not found, otherwise false.
   */
  async staticHandle(request: IRequest, response: IResponse): Promise<boolean> {
    if (request.method !== Methods.get)
      return true;

    const accessPath = Object.keys(this.staticsAccess).find(ac => request.path.startsWith(ac));
    const filePath = accessPath && path.join(this.staticsAccess[accessPath], request.path.replace(accessPath, ''));

    console.log('search file on', filePath);

    if (filePath && !existsSync(filePath))
      return true;

    console.log('search path', filePath);

    if (lstatSync(filePath).isDirectory()) {
      const indexPath = path.join(filePath, 'index.html');
      response.setHeader('content-type', 'text/html');
      if (!existsSync(indexPath))
        response.text(getDirHtml(request.path, readdirSync(filePath)));
      else {
        response.file(indexPath);
      }
    } else
      response.file(filePath);

    response.send(200);
    return false;
  },

  /**
   * Defines a custom route for a specific HTTP method and path.
   * @param method - The HTTP method (e.g., GET, POST).
   * @param path - The URL path for the route.
   * @param cb - The callback function to handle the request.
   */
  route(method: Methods, path: string, cb: (req: IRequest, res: IResponse) => void) {
    if (!this.routes[method])
      this.routes[method] = {};

    this.routes[method][path] = cb;
  },

  /**
   * Defines a custom route for all HTTP methods.
   * @param path - The URL path for the route.
   * @param cb - The callback function to handle the request.
   */
  all(path: string, cb: (req: IRequest, res: IResponse) => void) {
    this.route(Methods.all, path, cb);
    this.route(Methods.get, path, cb);
    this.route(Methods.post, path, cb);
    this.route(Methods.put, path, cb);
    this.route(Methods.delete, path, cb);
    this.route(Methods.patch, path, cb);
    this.route(Methods.options, path, cb);
    this.route(Methods.head, path, cb);
  },

  /**
   * Defines a custom route for the HTTP GET method.
   * @param path - The URL path for the route.
   * @param cb - The callback function to handle the request.
   */
  get(path: string, cb: (req: IRequest, res: IResponse) => void) { this.route(Methods.get, path, cb); },

  /**
   * Defines a custom route for the HTTP POST method.
   * @param path - The URL path for the route.
   * @param cb - The callback function to handle the request.
   */
  post(path: string, cb: (req: IRequest, res: IResponse) => void) { this.route(Methods.post, path, cb); },

  /**
   * Defines a custom route for the HTTP PUT method.
   * @param path - The URL path for the route.
   * @param cb - The callback function to handle the request.
   */
  put(path: string, cb: (req: IRequest, res: IResponse) => void) { this.route(Methods.put, path, cb); },

  /**
   * Defines a custom route for the HTTP DELETE method.
   * @param path - The URL path for the route.
   * @param cb - The callback function to handle the request.
   */
  delete(path: string, cb: (req: IRequest, res: IResponse) => void) { this.route(Methods.delete, path, cb); },

  /**
   * Defines a custom route for the HTTP PATCH method.
   * @param path - The URL path for the route.
   * @param cb - The callback function to handle the request.
   */
  patch(path: string, cb: (req: IRequest, res: IResponse) => void) { this.route(Methods.patch, path, cb); },

  /**
   * Defines a custom route for the HTTP OPTIONS method.
   * @param path - The URL path for the route.
   * @param cb - The callback function to handle the request.
   */
  options(path: string, cb: (req: IRequest, res: IResponse) => void) { this.route(Methods.options, path, cb); },

  /**
   * Defines a custom route for the HTTP HEAD method.
   * @param path - The URL path for the route.
   * @param cb - The callback function to handle the request.
   */
  head(path: string, cb: (req: IRequest, res: IResponse) => void) { this.route(Methods.head, path, cb); },

  /**
   * Starts the router on the provided server.
   * @param server - The HTTP server to attach the router to.
   * @returns The server instance.
   */
  startRouter(server: any) {
    this.server = server;
    server.on('connection', (socket: { request: IParserdRequest } & Socket) => {

      console.log(`New client Connected at ${socket.remoteAddress}:${socket.remotePort}`);

      socket.on('data', async (data) => {

        try {
          const request = parseRequest(data);
          if (request) {
            this.requestHandle({ ...request, socket });
            socket.request = request;
          }
          else if (socket.request) {
            if (
              socket.request.headers['poli-file'] === 'chunked'
              // socket.request.headers['content-type'] === 'application/octet-stream'
            ) {
              socket.emit('chunk', data);
            }
            else
              socket.request.body.add(data);
          }
          else {
            console.error(request);
            _response(socket).send(400);
          }

        } catch (error) {
          console.error(error);
          _response(socket).send(500);
        }
      });
    });

    return server;
  }
};
