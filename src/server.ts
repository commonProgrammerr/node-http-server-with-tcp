import * as net from 'net';
import { router } from './lib/router'
import * as path from 'path';
import { createWriteStream, existsSync, lstatSync, mkdirSync, readdirSync, rmSync, rmdirSync, writeFileSync } from 'fs';

const port = Number(process.env.PORT) || 8080;
const host = process.env.ADDRESS || '0.0.0.0';
const root_dir = process.env.ROOT || __dirname

const server = net.createServer();

server.listen(port, host, () => {
  console.log('Server is running on port ' + port + '.');
});

router.startRouter(server);


router.static(path.resolve(root_dir))

router.get('/files', (req, res) => {
  if (!req.params.path) {
    const root = path.resolve(root_dir)
    res.json(readdirSync(root).map(child => {
      const _ = path.join(root, child)
      const stat = lstatSync(_)
      return {
        type: stat.isDirectory() ? 'folder' : 'file',
        path: child
      }
    }))
    return res.send(200)
  }

  const dest_path = path.resolve(root_dir, String(req.params.path))

  if (!existsSync(path.resolve(dest_path)))
    return router._404(req, res)

  const stat = lstatSync(dest_path)

  if (stat.isDirectory()) {
    res.json(readdirSync(dest_path).map(child => {
      const _ = path.join(dest_path, child)
      const stat = lstatSync(_)
      return {
        type: stat.isDirectory() ? 'folder' : 'file',
        path: path.join(String(req.params.path), child)
      }
    }))
    return res.send(200)
  } else {
    router._400(req, res)
  }
})

router.post('/folder', (req, res) => {

  if (!req.params.path)
    return router._400(req, res)

  const dest_path = path.join(root_dir, String(req.params.path))

  if (existsSync(dest_path))
    return router._500(req, res)

  mkdirSync(dest_path)
  const sucess = existsSync(dest_path)
  res.json({ sucess })
  res.send(sucess ? 201 : 500)
})

// [0x0D, 0x0A, 0x30, 0x0D, 0x0A, 0x0D, 0x0A]
// const end_chunk = Buffer.from('DQowDQoNCg==', 'base64')

router.all('/upload', async (req, res) => {
  try {
    if (!req.params.path)
      return router._400(req, res)
    const dest_path = path.join(root_dir, String(req.params.path))

    if (existsSync(dest_path))
      return router._500(req, res)

    const file = createWriteStream(dest_path)
    req.body && file.write(req.body.buffer)
    // req.socket.pipe(file)
    if (req.body.totalWrite === req.headers['content-length'])
      res.send(201)
    else
      req.socket.addListener('chunk', (data: Buffer) => {
        // if (data.toString().endsWith(end_chunk.toString())) {
        if (data.byteLength < 64 * 1024) {
          file.write(data)
          res.send(201)
        }
        else
          file.write(data)
      })

  } catch (err) {
    console.error(err)
    router._500(req, res)
  }
})

router.delete('/files', (req, res) => {

  if (!req.params.path)
    return router._400(req, res)

  const dest_path = path.resolve(root_dir, String(req.params.path))

  if (!existsSync(dest_path))
    return router._404(req, res)

  const stat = lstatSync(dest_path)
  if (stat.isDirectory())
    rmdirSync(dest_path)
  else
    rmSync(dest_path)

  const sucess = !existsSync(dest_path)
  res.json({ sucess })
  res.send(sucess ? 204 : 500)

})
