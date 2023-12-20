import { Socket } from "node:net";
import { IResponse } from "../types";
import { createReadStream, lstatSync } from "fs";
import * as mime from 'mime-types';

/**
 * Creates an HTTP response object.
 * @param socket - The network socket for writing the response.
 * @returns An HTTP response object.
 */
export function _response(socket: Socket): IResponse {
  return {
    headers: {},
    socket,

    /**
     * Sets an HTTP header.
     * @param name - The name of the header.
     * @param value - The value of the header.
     */
    setHeader(name: string, value: any) {
      if (value instanceof Array)
        this.headers[name] = value.reduce((p, c) => `${p}; ${c}`, '');
      else
        this.headers[name] = value;
    },

    /**
     * Sets the response body with raw bytes.
     * @param data - The raw byte data to be sent.
     * @returns The HTTP response object.
     */
    bytes(data: Buffer) {
      this.buffer = data;
      this.setHeader('content-length', Buffer.byteLength(this.buffer));
      return this;
    },

    /**
     * Sets the response body with text data.
     * @param data - The text data to be sent.
     * @returns The HTTP response object.
     */
    text(data: string) {
      this.body = data;
      this.setHeader('content-type', 'text/plain');
      this.setHeader('content-length', Buffer.byteLength(this.body));
      return this;
    },

    /**
     * Sets the response body with JSON data.
     * @param data - The JSON data to be sent.
     * @returns The HTTP response object.
     */
    json(data: any) {
      this.body = JSON.stringify(data);
      if (this.body) {
        this.setHeader('content-type', 'application/json');
        this.setHeader('content-length', Buffer.byteLength(this.body));
      }
      return this;
    },

    /**
     * Sends the HTTP response.
     * @param status - The HTTP status code (default: 200).
     */
    send(status = 200) {
      this.setHeader('connection', 'Closed');
      const to_write = this.body || this.buffer;

      if (status >= 400 || status < 200)
        console.error(status, new Error().stack);

      if (to_write && !this.headers['content-length'])
        this.setHeader('content-length', Buffer.byteLength(to_write));

      this.socket.write(`HTTP/1.1 ${status}\r\n`);
      Object.keys(this.headers).forEach(key => {
        this.socket.write(`${key}: ${this.headers![key]}\r\n`);
      });
      this.socket.write('\r\n');

      if (this.file_path) {
        try {
          const stream = createReadStream(String(this.file_path), { highWaterMark: 64 * 1024 });
          stream.pipe(socket);
        } catch (error) {
          console.error(error);
          socket.destroy(error);
        }
      } else if (to_write) {
        this.socket.write(Buffer.from(to_write)) && this.socket.end();
      } else {
        this.socket.end();
      }
    },

    /**
     * Sets the response body with the content of a file.
     * @param path - The path to the file.
     * @param type - The MIME type of the file (optional).
     * @returns The HTTP response object.
     */
    file(path: string, type?: string) {
      const file = lstatSync(path);
      const mime_type = type || mime.lookup(path);
      this.setHeader('content-length', file.size);
      this.setHeader('content-type', mime_type || 'text/plain');
      this.file_path = path;

      return this;
    },
  };
}
