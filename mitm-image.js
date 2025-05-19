import { Proxy } from 'http-mitm-proxy'
import fs from 'fs'
import path from 'path'

const proxy = new Proxy()

proxy.onError(function (ctx, err) {
  console.error('proxy error:', err)
})

proxy.onRequest(function (ctx, callback) {
  return callback()
})

proxy.onResponse(function (ctx, callback) {
  const contentType = ctx.serverToProxyResponse.headers['content-type'] || ''
  if (contentType.startsWith('image/')) {
    const chunks = []
    ctx.onResponseData(function (ctx, chunk, cb) {
      chunks.push(chunk)
      return cb(null, chunk)
    })
    ctx.onResponseEnd(function (ctx, cb) {
      const buffer = Buffer.concat(chunks)
      const urlPath = ctx.clientToProxyRequest.url.split('?')[0]
      const ext = contentType.split('/')[1].split(';')[0]
      const filename = path.basename(urlPath) || `image_${Date.now()}.${ext}`
      const savePath = path.join('images', filename)
      fs.mkdirSync('images', { recursive: true })
      fs.writeFile(savePath, buffer, (err) => {
        if (err) {
          console.error('Error saving image:', err)
        } else {
          console.log('Image saved:', savePath)
        }
      })
      return cb()
    })
  }
  return callback()
})

console.log('begin listening on 8081')
proxy.listen({ port: 8081 })
