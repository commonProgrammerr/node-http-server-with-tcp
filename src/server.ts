import * as net from 'net';
import { router } from './lib/router'
import { IParserdRequest } from './types';
import * as path from 'path';
import { existsSync, lstatSync, readFileSync, readdirSync, rmSync, rmdirSync, writeFileSync } from 'fs';

const port = Number(process.env.PORT) || 8080;
const host = process.env.ADDRESS || '127.0.0.1';
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

router.post('/files', (req, res) => {

  if (!req.params.path)
    return router._400(req, res)

  const dest_path = path.resolve(root_dir, String(req.params.path))

  if (existsSync(dest_path))
    return router._500(req, res)

  writeFileSync(dest_path, req.body)
  const sucess = existsSync(dest_path)
  res.json({ sucess })
  res.send(sucess ? 201 : 500)

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
