import * as net from 'net';
import { parseRequest } from './lib/parser';
import { router } from './lib/router'
import fs from 'fs/promises';
import { _response } from './lib/response';
import path from 'path';

const port = Number(process.env.PORT) || 8080;
const host = process.env.ADDRESS || '127.0.0.1';

const server = net.createServer();

server.listen(port, host, () => {
  console.log('TCP Server is running on port ' + port + '.');
});





router.startRouter(server).on('connection', (socket) => {
  // const date = new Date().toLocaleString('en', {
  //   timeZoneName: 'short',
  //   day: '2-digit',
  //   month: 'short',
  //   year: 'numeric',
  //   weekday: 'short',
  //   hour: '2-digit',
  //   minute: '2-digit',
  //   second: '2-digit',
  //   hour12: false
  // })

  socket.on('data', async (data) => {
    try {
      const request = parseRequest(data.toString())
      if (request)
        server.emit('request', socket, request)
      else
        throw new Error('Invalid request')
    } catch (error) {
      console.error(error)
      const response = _response(socket)
      response.addHeader('content-type', 'text/html')
      response.bytes(await fs.readFile(path.resolve('./src/pages/400.html')))
      response.send(400)
    } finally {
      socket.destroy()
    }
  });
});

let saves: any[] = []

router.get('/teste', (request, response) => {
  console.log(request)
  response.json(request)
  response.send(200)
})

router.post('/save', (req, res) => {
  if (req.headers?.['content-type'] !== 'application/json') {
    res.json({ err_message: 'Invalid content-type' })
    res.send(400)
  } else if (Number(req.headers['content-length']) <= 1 || !JSON.parse(req.body ?? "")) {
    res.json({ err_message: 'Invalid request body' })
    res.send(400)
  } else {
    saves.push(JSON.parse(req.body ?? ""))
    res.json({
      msg: 'Sucess!'
    })
    res.send(200)
  }
})

router.get('/saves', (req, res) => {
  try {
    res.json(saves)
    res.send(200)
  } catch (err) {
    console.error(err)
    res.json({
      err_message: 'Internal erro'
    })
    res.send(500)
  }
})