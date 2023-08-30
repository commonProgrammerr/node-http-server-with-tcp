import { IParserdRequest, IHeaders } from '../types'

export function parseRequest(payload: string): IParserdRequest | undefined {

  if (payload.includes('\n\n') || payload.includes('\r\n\r\n')) {

    const raw_request = payload.includes('\n\n') ? payload.split('\n\n') : payload.split('\r\n\r\n');
    const raw_header = raw_request[0].includes('\r\n') ? raw_request[0].split('\r\n') : raw_request[0].split('\n')
    const raw_body = raw_request[1]

    const request_line = raw_header.shift()!.split(' ')
    const method = request_line[0]
    const url = request_line[1].split('?')
    const path = url[0]
    //const raw_params = request_line[1].split('?')[1].split('&')
    const raw_params = url[1] ? new URLSearchParams(url[1]) : undefined
    let headers: IHeaders = {}
    let params: IHeaders = {}

    raw_header.forEach(line => {

      let header = line.split(':');
      let key = header[0].toLowerCase()
      let value: any = header.slice(1).join(':').trimStart();
      value = Number(value) || value

      headers[key] = value
    })

    raw_params?.forEach((value, key) => params[key] = value)

    let body: any = undefined

    if (Number.isInteger(headers['content-length'])) {
      body = raw_body.substring(0, headers['content-length'] as number)
    }
    return {
      method,
      path,
      headers,
      params,
      body
    }
  }
}
