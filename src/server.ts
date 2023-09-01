import * as net from 'net';
import { parseRequest } from './lib/parser';
import { router } from './lib/router'
import { _response } from './lib/response';
import { IParserdRequest } from './types';

const port = Number(process.env.PORT) || 8080;
const host = process.env.ADDRESS || '127.0.0.1';

const server = net.createServer();

server.listen(port, host, () => {
  console.log('Server is running on port ' + port + '.');
});

router.startRouter(server).on('connection', (socket) => {
  console.log(`New client Connected at ${socket.remoteAddress}:${socket.remotePort}`)


  socket.on('data', async (data) => {
    try {
      const request = parseRequest(data.toString())
      if (request)
        server.emit('request', socket, request)
      else {
        const response = _response(socket)
        response.json({ err_message: 'Invalid request' })
        response.send(400)
      }

    } catch (error) {
      console.error(error)
      _response(socket).send(500)
    } finally {
      socket.destroy()
    }
  });
});

let cache: any[] = []

function validateReques(req: IParserdRequest) {
  try {
    if (req.headers?.['content-type'] !== 'application/json')
      return { status: 400, err_message: 'Invalid content-type' }
    else if (!JSON.parse(req.body ?? ""))
      return { status: 400, err_message: 'Invalid request body' }
    else if (req.headers['content-length'] !== req.body?.length)
      return { status: 400, err_message: 'Invalid body length' }

  } catch (err) {
    return { status: 400, err_message: 'Invalid JSON format' }
  }
}

router.post('/', (req, res) => {
  const isInvalid = validateReques(req)
  if (isInvalid) {
    res.json(isInvalid)
    res.send(isInvalid.status)
  } else {
    cache.push(JSON.parse(req.body ?? ""))
    res.send(201)
  }
})

router.put('/', (req, res) => {

  const isInvalid = validateReques(req)
  if (isInvalid) {
    res.json(isInvalid)
    res.send(isInvalid.status)
  } else {
    const { id } = req.params || {}
    if (cache[id]) {
      cache[id] = JSON.parse(req.body ?? "")
      res.send(200)
    } else {
      res.json({ err_message: "Item not found!" })
      res.send(404)
    }
    return

  }
  res.send(400)
})

router.delete('/', (req, res) => {
  try {
    const { id } = req.params ?? {}

    if (cache[id]) {
      delete cache[id]
      res.send(200)
    }
    else {
      res.json({ err_message: "Item not found!" })
      res.send(404)
    }

  } catch (err) {
    console.error(err)
    res.json({ err_message: 'Internal erro' })
    res.send(500)
  }
})

router.get('/', (req, res) => {
  try {
    const { id } = req.params ?? {}

    if (!id)
      res.json(cache)
    else if (cache[id])
      res.json(cache[id])

    else {
      res.json({ err_message: "Item not found!" })
      return res.send(404)
    }
    res.send(200)
  } catch (err) {
    console.error(err)
    res.json({ err_message: (err as Error).message })
    res.send(500)
  }
})