import * as net from 'net';
import { parseRequest } from './lib/parser';
import { router } from './lib/router'

const port = 8080;
const host = '127.0.0.1';

const server = net.createServer();

server.listen(port, '127.0.0.1', () => {
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

  socket.on('data', function (data) {
    const request = parseRequest(data.toString())
    if (request)
      server.emit('request', socket, request)
    else
      console.log('invalid request')
  });
});

router.get('/teste', (request, socket) => {
  console.log(request)
  const body = JSON.stringify(request)
  socket.write('HTTP/1.1 200 OK\r\n')
  socket.write(`Conntent-Length: ${body.length}\r\n`)
  socket.write(`Content-Type: application/json\r\n`)
  socket.write(`Connection: Closed\r\n\r\n`)
  //const buffer = new Buffer(body)
})