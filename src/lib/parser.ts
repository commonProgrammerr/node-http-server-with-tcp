import { IParserdRequest, IHeaders, IParsedResponse, BodyBuffer } from '../types';

const top_header_rgx = /(CONNEC|DELETE|GET|HEAD|OPTIONS|POST|PUT|PATCH|ALL) ([\S]+) (HTTP\/1\.1)/i;

/**
 * Parses an HTTP request payload.
 * @param payload - The raw HTTP request payload as a Buffer.
 * @returns Parsed request information or undefined if the payload is invalid.
 */
export function parseRequest(payload: Buffer): IParserdRequest | undefined {
  try {
    const hasBody = payload.includes(Buffer.from('\r\n\r\n'));
    const body_break = hasBody && payload.indexOf(Buffer.from('\r\n\r\n'));

    const raw_headers = hasBody ? payload.subarray(0, body_break).toString() : payload.toString();
    const isValidRequest = top_header_rgx.test(raw_headers.split('\r\n')[0]);

    if (isValidRequest) {
      const raw_body = body_break && payload.subarray(body_break + 4);
      const [top_header, ...raw_header] = raw_headers.split('\r\n');
      const request_line = top_header.split(' ');
      const method = request_line[0];
      const url = request_line[1].split('?');
      const path = url[0];

      const raw_params = url[1] ? new URLSearchParams(url[1]) : undefined;
      let headers: IHeaders = {};
      let params: IHeaders = {};
      raw_header.forEach((line) => {
        let header = line.split(':');
        let key = header[0].toLowerCase();
        let value: any = header.slice(1).join(':').trimStart();
        value = Number(value) || value;

        headers[key] = value;
      });

      raw_params?.forEach((value, key) => (params[key] = value));

      let body: BodyBuffer = undefined;
      if (hasBody) {
        if (headers['poli-file'] === 'chunked') {
          body = new BodyBuffer(raw_body);
        } else if (Number.isInteger(headers['content-length'])) {
          body = new BodyBuffer(headers['content-length'] as number);
          body.add(raw_body);
        }
      }

      return {
        method,
        path,
        headers,
        params,
        body,
      };
    } else {
      throw new Error('Invalid HTTP request format.');
    }
  } catch (error) {
    console.error('Error parsing request:', error);
    throw error
    return undefined;
  }
}

/**
 * Parses an HTTP response payload.
 * @param payload - The raw HTTP response payload as a string.
 * @returns Parsed response information or undefined if the payload is invalid.
 */
export function parseResponse(payload: string): Omit<IParsedResponse, 'socket'> | undefined {
  try {
    if (payload.includes('\n\n') || payload.includes('\r\n\r\n')) {
      const raw_response = payload.includes('\n\n') ? payload.split('\n\n') : payload.split('\r\n\r\n');
      const raw_header = raw_response[0].includes('\r\n') ? raw_response[0].split('\r\n') : raw_response[0].split('\n');
      const raw_body = raw_response[1];

      const request_line = raw_header.shift()!.split(' ');
      const status = Number(request_line[1]) || undefined;

      let headers: IHeaders = {};
      raw_header.forEach((line) => {
        let header = line.split(':');
        let key = header[0].toLowerCase();
        let value: any = header.slice(1).join(':').trimStart();
        value = Number(value) || value;

        headers[key] = value;
      });

      let body: any = undefined;

      if (Number.isInteger(headers['content-length'])) {
        body = raw_body.substring(0, headers['content-length'] as number);
      }

      return {
        status,
        headers,
        body,
      };
    }
  } catch (error) {
    console.error('Error parsing response:', error);
    throw error
  }

  return undefined;
}
