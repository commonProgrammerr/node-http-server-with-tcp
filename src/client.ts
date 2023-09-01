import { Socket } from 'node:net'
import * as readline from 'readline/promises'
import { IParserdRequest } from './types'
import colors from 'colors'

const input = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

async function client() {
  const request = {} as IParserdRequest

  const server = await (await input.question("Insert url: ")).trim()
  request.headers = {}
  const url = new URL(server.includes('http://') ? server : `http://${server}`)
  request.headers['Host'] = url.host
  request.headers['Accept'] = '*/*'
  request.headers['User - Agent'] = 'redes1-client'

  request.path =
    request.path = server.replace(`http://${url.host}`, "/").replace("//", "/")
  console.log(request.path)

  request.method = await input.question("Input the method (default=GET): ") || 'GET'
  request.method = request.method.trim().toUpperCase()


  const body = await input.question("Input body content: ")
  if (body) {
    const type = (await input.question("Chose the content type: ")).trim()
    request.headers!['Content-Type'] = type.includes('json') ? 'application/json' : type
    request.headers!['Content-Length'] = body.length
    request.body = body
  }

  if (await input.question("Confirm request (y/n): ") !== 'y')
    return

  const client = new Socket()

  await new Promise((resolve, reject) => {
    console.log('Starting connection...\n'.blue)

    client.on('error', err => {
      console.error(colors.red("ERROR: %s"), err)
      client.destroy()

    })

    client.on('data', data => {
      data.toString().split('\n').forEach(line => {
        console.log(colors.green(`< ${line}`))
      })
    })

    client.on('close', () => {
      console.log(colors.blue('Connection closed'))
      resolve(client)
    })

    client.connect({
      port: Number(url.port),
      host: url.hostname
    }, () => {


      console.log(colors.yellow(`> ${request.method} ${request.path} HTTP/1.1`))
      client.write(`${request.method} ${request.path} HTTP/1.1\r\n`)

      Object.keys(request.headers || {}).forEach(key => {
        console.log(colors.yellow(`> ${key}: ${request.headers?.[key]}`))
        client.write(`${key}: ${request.headers?.[key]}\r\n`)
      })
      console.log()
      client.write('\r\n')

      if (request.body) {
        client.write(Buffer.from(request.body))
        body.split('\n').forEach(line =>
          console.log(colors.magenta(`| ${line}`)))
        console.log()
      }
    })

    setTimeout(() => reject(new Error("Unable to connect. connection timeout!")), 32000)
  })

}

(async () => {
  while (true) {
    try {
      await client();
    } catch (err) {
      console.error(
        colors.red("ERROR: a error ocurred. Msg: %s"), (err as Error).message)
    }
  }
})()

